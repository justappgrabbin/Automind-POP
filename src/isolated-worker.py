"""Run exactly one candidate through the original AutoMind interpreter."""

import base64
import json
import os
import stat
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

from interpreter import Interpreter

MAX_SUBMISSION = 64 * 1024


def submission_bytes(directory):
    # Open the directory and file without following candidate-controlled symlinks.
    try:
        folder = os.open(directory / "submission", os.O_DIRECTORY | os.O_NOFOLLOW)
    except OSError:
        return None
    try:
        fd = os.open("submission.csv", os.O_RDONLY | os.O_NONBLOCK | os.O_NOFOLLOW, dir_fd=folder)
        try:
            if not stat.S_ISREG(os.fstat(fd).st_mode):
                return None
            with os.fdopen(fd, "rb", closefd=False) as stream:
                content = stream.read(MAX_SUBMISSION + 1)
            return base64.b64encode(content).decode("ascii") if len(content) <= MAX_SUBMISSION else None
        finally:
            os.close(fd)
    except OSError:
        return None
    finally:
        os.close(folder)


def main():
    request = json.load(sys.stdin)
    with TemporaryDirectory(prefix="candidate-") as temp:
        directory = Path(temp)
        (directory / "input").mkdir()
        (directory / "input" / "coordinates.json").write_text(json.dumps(request["coordinates"]))
        (directory / "submission").mkdir()
        interpreter = Interpreter(directory, timeout=10)
        try:
            result = interpreter.run(request["code"])
        finally:
            interpreter.cleanup_session()
        print(json.dumps({
            "execution": {
                "term_out": ["".join(result.term_out)[-8192:]],
                "exec_time": result.exec_time,
                "exc_type": result.exc_type,
            },
            "submission": submission_bytes(directory) if result.exc_type is None else None,
        }), flush=True)


if __name__ == "__main__":
    main()
