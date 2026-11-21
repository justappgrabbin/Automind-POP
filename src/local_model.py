"""In-process GGUF inference for AutoMind's existing backend contract."""

import hashlib
import json
import re
import time
from importlib.metadata import version
from pathlib import Path

from jsonschema import Draft7Validator

from automind.backend.utils import opt_messages_to_list


def structured_output(content, schema):
    """Reject truncated, ambiguous, or schema-invalid model output."""
    def unique_object(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"Duplicate JSON field {key!r}")
            result[key] = value
        return result

    def invalid_number(value):
        raise ValueError(f"Non-finite JSON number {value}")

    try:
        output = json.loads(content, object_pairs_hook=unique_object, parse_constant=invalid_number)
    except ValueError as error:
        raise ValueError(f"Return one complete JSON object: {error}") from error
    if not isinstance(output, dict):
        raise ValueError("Return a JSON object")
    error = next(Draft7Validator(schema).iter_errors(output), None)
    if error:
        path = ".".join(map(str, error.absolute_path)) or "object"
        raise ValueError(f"Fix field {path}: {error.message[:300]}")
    return output


class LocalModel:
    def __init__(self, model, path, expected_digest, *, context=8192, threads=3, seed=42):
        if not re.fullmatch(r"[0-9a-fA-F]{64}", expected_digest or ""):
            raise ValueError("Set POP_GGUF_SHA256 to the expected 64-character SHA-256 digest")
        if not 1024 <= context <= 32768 or not 1 <= threads <= 32:
            raise ValueError("Local context must be 1024–32768 and threads 1–32")
        self.path = Path(path).expanduser().resolve(strict=True)
        if not self.path.is_file():
            raise ValueError("POP_GGUF must be a regular model file")
        with self.path.open("rb") as stream:
            digest = hashlib.file_digest(stream, "sha256").hexdigest()
        if digest != expected_digest.lower():
            raise ValueError("Local GGUF SHA-256 does not match POP_GGUF_SHA256")
        self.identity = {
            "backend": "local", "model": model, "sha256": digest,
            "runtime": f"llama-cpp-python/{version('llama-cpp-python')}",
            "context": context, "threads": threads, "seed": seed,
            "gpuLayers": 0, "maxOutputTokens": 1024,
        }
        self.engine = None
        self.load_seconds = None
        self.observations = []

    def query(self, *, system_message, user_message, func_spec, model, temperature, max_tokens, guidance=None, **kwargs):
        if model != self.identity["model"]:
            raise ValueError("Requested model does not match the loaded GGUF identity")
        if kwargs:
            raise ValueError(f"Unsupported local inference parameters: {', '.join(sorted(kwargs))}")
        if self.engine is None:
            from llama_cpp import Llama
            loading = time.monotonic()
            self.engine = Llama(
                model_path=str(self.path), n_ctx=self.identity["context"],
                n_threads=self.identity["threads"], seed=self.identity["seed"],
                n_gpu_layers=0, verbose=False,
            )
            self.load_seconds = round(time.monotonic() - loading, 3)

        messages = opt_messages_to_list(system_message, user_message or guidance)
        kwargs = {"temperature": 0.3 if temperature is None else temperature,
                  "max_tokens": min(max_tokens or self.identity["maxOutputTokens"],
                                    self.identity["maxOutputTokens"])}
        if func_spec:
            messages[-1]["content"] += (
                f"\nReturn only the JSON arguments for {func_spec.name}. {func_spec.description}\n"
                f"Schema: {json.dumps(func_spec.json_schema, ensure_ascii=False)}"
            )
            kwargs["response_format"] = {"type": "json_object", "schema": func_spec.json_schema}

        for _ in range(3 if func_spec else 1):
            start = time.monotonic()
            response = self.engine.create_chat_completion(messages=messages, **kwargs)
            choice = response["choices"][0]
            content = choice["message"].get("content") or ""
            usage = response["usage"]
            elapsed = time.monotonic() - start
            observation = {
                "function": func_spec.name if func_spec else None,
                "promptTokens": usage["prompt_tokens"], "completionTokens": usage["completion_tokens"],
                "seconds": round(elapsed, 3), "finishReason": choice["finish_reason"],
                "input": [dict(message) for message in messages],
                "output": content,
            }
            self.observations.append(observation)
            if not func_spec:
                if not content.strip() or choice["finish_reason"] == "length":
                    raise ValueError("Local text completion was empty or hit its output budget")
                return content, elapsed, usage["prompt_tokens"], usage["completion_tokens"], {}
            try:
                if choice["finish_reason"] == "length":
                    raise ValueError("Structured response hit its output budget")
                output = structured_output(content, func_spec.json_schema)
            except ValueError as error:
                observation["rejected"] = str(error)
                messages[-1]["content"] += f"\nYour previous response was rejected. {error}"
            else:
                return output, elapsed, usage["prompt_tokens"], usage["completion_tokens"], {}
        raise ValueError(f"Local model could not satisfy {func_spec.name}: {observation['rejected']}")
