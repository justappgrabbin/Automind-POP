"""Atomic ARLM manifests over pinned artifacts and append-only contact history."""

import hashlib
import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from model_registry import ModelRegistry

AUTHORITIES = {
    "Θ": "trident-model-registry", "G": "biverse-semantic-graph",
    "A": "pop-address-state", "P": "pop-perspective-state",
    "H": "arlm-journal", "O": "biverse-contact-source", "K": "pop-receipts-and-model-registry",
}
COMPONENTS = AUTHORITIES.keys()
ATTACHMENTS = {"tridentInput": "arlm-trident-input", "tridentComputation": "arlm-trident-computation"}
VERSIONED_EVENTS = {"arlm-evidence", "arlm-interpretation"}
CONTACT_SOURCE = Path(__file__).resolve().parents[1] / "vendor/biverse/human_design/language_contact.py"


def encode(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, allow_nan=False).encode()


def sha(value):
    return hashlib.sha256(value).hexdigest()


class ARLMState:
    def __init__(self, path):
        path = Path(path)
        path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        fd = os.open(path, os.O_CREAT | os.O_RDWR, 0o600)
        os.close(fd)
        self.db = sqlite3.connect(path)
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS artifacts (digest TEXT PRIMARY KEY, content BLOB NOT NULL);
            CREATE TABLE IF NOT EXISTS revisions (
                id INTEGER PRIMARY KEY, parent INTEGER REFERENCES revisions(id),
                manifest BLOB NOT NULL, event_key TEXT UNIQUE NOT NULL, event BLOB NOT NULL
            );
            CREATE TABLE IF NOT EXISTS activation (
                id INTEGER PRIMARY KEY, revision INTEGER NOT NULL REFERENCES revisions(id),
                at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
            );
        """)

    @contextmanager
    def transaction(self):
        self.db.execute("BEGIN IMMEDIATE")
        with self.db:
            yield

    def artifact(self, data, authority):
        content = data if isinstance(data, bytes) else encode(data)
        digest = sha(content)
        self.db.execute("INSERT OR IGNORE INTO artifacts VALUES (?,?)", (digest, content))
        return {"authority": authority, "sha256": digest}

    def read(self, reference):
        digest = reference["sha256"]
        row = self.db.execute("SELECT content FROM artifacts WHERE digest=?", (digest,)).fetchone()
        if row is None or sha(row[0]) != digest:
            raise ValueError("ARLM artifact missing or digest mismatch")
        return row[0]

    def revision(self, revision):
        row = self.db.execute("SELECT id,parent,manifest,event FROM revisions WHERE id=?", (revision,)).fetchone()
        if row is None:
            raise ValueError("Unknown ARLM revision")
        return {"revision": row[0], "parent": row[1],
                "manifest": json.loads(row[2]), "event": json.loads(row[3])}

    def active(self):
        row = self.db.execute("SELECT revision FROM activation ORDER BY id DESC LIMIT 1").fetchone()
        return self.revision(row[0]) if row else None

    def validate(self, revision):
        manifest = revision["manifest"]
        refs = manifest["components"]
        if (manifest["version"] != 1 or set(refs) != COMPONENTS
                or refs["H"] != {"authority": "arlm-journal", "revision": revision["revision"]}):
            raise ValueError("Incompatible ARLM manifest")
        for name, authority in AUTHORITIES.items():
            if refs[name]["authority"] != authority:
                raise ValueError(f"Incompatible ARLM authority for {name}")
            if name != "H":
                self.read(refs[name])
        event = revision["event"]
        if event["type"] in VERSIONED_EVENTS or "eventSha256" in manifest:
            if event.get("schema") != 1 or manifest.get("eventSha256") != sha(encode(event)):
                raise ValueError("ARLM event digest or schema mismatch")
            links = manifest.get("attachments", {})
            expected = ATTACHMENTS if event["type"] == "arlm-interpretation" else {}
            if set(links) != set(expected):
                raise ValueError("Incompatible ARLM attachments")
            for key, authority in expected.items():
                if links[key]["authority"] != authority:
                    raise ValueError("Incompatible ARLM attachment authority")
            if expected:
                source = json.loads(self.read(links["tridentInput"]))
                computation = json.loads(self.read(links["tridentComputation"]))
                evidence = self.revision(event["evidenceRevision"])
                if (source["schema"] != 1 or computation["schema"] != 1
                        or source["encounterRevision"] != event["encounterRevision"]
                        or source["evidenceRevision"] != evidence["revision"]
                        or evidence["event"]["type"] != "arlm-evidence"
                        or evidence["manifest"]["eventSha256"] != sha(encode(evidence["event"]))
                        or source["graph"] != evidence["manifest"]["components"]["G"]
                        or source["perspective"] != refs["P"]
                        or source["address"] != event["semanticAddress"]
                        or (source["address"] is not None and source["address"] != refs["A"])
                        or computation["model"] != refs["Θ"]
                        or computation["implementation"] != source["encoder"]):
                    raise ValueError("ARLM interpretation provenance mismatch")
                self.read(source["graph"])
        operators = json.loads(self.read(refs["O"]))
        if operators["sourceSha256"] != sha(CONTACT_SOURCE.read_bytes()):
            raise ValueError("Biverse contact operator source has changed")
        model = json.loads(self.read(refs["Θ"]))
        registry = ModelRegistry(model["registry"])
        with registry.locked() as state:
            if not state or state["modelId"] != model["modelId"]:
                raise ValueError("ARLM model registry identity mismatch")
            record = state["revisions"].get(model["revision"])
            if not record or record["digests"] != model["digests"]:
                raise ValueError("ARLM checkpoint registration changed")
            registry.verified_checkpoint(state, model["revision"], model["head"])

    def publish(self, parent, refs, key, event, *, attachments=None):
        next_id = self.db.execute("SELECT COALESCE(MAX(id),0)+1 FROM revisions").fetchone()[0]
        manifest = {"version": 1, "components": {
            **refs, "H": {"authority": "arlm-journal", "revision": next_id},
        }}
        if event["type"] in VERSIONED_EVENTS:
            manifest["eventSha256"] = sha(encode(event))
        if attachments is not None:
            manifest["attachments"] = attachments
        self.db.execute("INSERT INTO revisions VALUES (?,?,?,?,?)",
                        (next_id, parent, encode(manifest), key, encode(event)))
        return self.activate(next_id)

    def activate(self, revision):
        target = self.revision(revision)
        self.validate(target)
        if not self.active() or self.active()["revision"] != revision:
            self.db.execute("INSERT INTO activation(revision) VALUES (?)", (revision,))
        return target

    def by_key(self, key):
        row = self.db.execute("SELECT id FROM revisions WHERE event_key=?", (key,)).fetchone()
        return self.revision(row[0]) if row else None

    def lineage(self):
        current = self.active()
        chain = []
        while current:
            chain.append(current)
            current = self.revision(current["parent"]) if current["parent"] is not None else None
        return list(reversed(chain))

    def events(self):
        return [self.revision(row[0]) for row in self.db.execute("SELECT id FROM revisions ORDER BY id")]

    def history(self):
        activations = self.db.execute("SELECT id, revision, at FROM activation ORDER BY id")
        return {"revisions": self.events(), "activations": [
            {"sequence": sequence, "revision": revision, "at": at}
            for sequence, revision, at in activations
        ]}
