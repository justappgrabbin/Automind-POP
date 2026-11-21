"""Operate a local, opt-in ARLM encounter ledger."""

import argparse
import json
import sqlite3
import sys
from contextlib import closing
from pathlib import Path

from arlm_contact import approve, export_rows, initialize, public_view, record
from arlm_state import ARLMState, encode, sha


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ledger", type=Path)
    commands = parser.add_subparsers(dest="action", required=True)
    init = commands.add_parser("init")
    init.add_argument("foundry", type=Path)
    init.add_argument("pop_state", type=Path)
    commands.add_parser("record").add_argument("request", type=Path)
    approval = commands.add_parser("approve")
    approval.add_argument("encounter")
    approval.add_argument("approver")
    commands.add_parser("rollback").add_argument("revision", type=int)
    view = commands.add_parser("show")
    view.add_argument("revision", type=int, nargs="?")
    view.add_argument("--public", action="store_true")
    commands.add_parser("history")
    commands.add_parser("export")
    args = parser.parse_args()

    try:
        store = ARLMState(args.ledger)
        with closing(store.db), store.transaction():
            if args.action == "init":
                result = initialize(store, args.foundry, args.pop_state)
            elif args.action == "record":
                result = record(store, json.loads(args.request.read_text()))
            elif args.action == "approve":
                result = approve(store, args.encounter, args.approver)
            elif args.action == "rollback":
                result = store.activate(args.revision)
            elif args.action == "show":
                result = store.active() if args.revision is None else store.revision(args.revision)
                if not result:
                    raise ValueError("Initialize ARLM first")
                if args.public:
                    result = public_view(result)
                elif args.revision is None:
                    store.validate(result)
            elif args.action == "history":
                result = store.history()
            else:
                rows = list(export_rows(store))
                result = b"".join(encode(row) + b"\n" for row in rows)
        if args.action == "export":
            print(result.decode(), end="")
            print(f"sha256={sha(result)} rows={len(rows)}", file=sys.stderr)
        else:
            print(json.dumps(result, ensure_ascii=False, allow_nan=False))
    except (OSError, TypeError, ValueError, KeyError, RuntimeError, sqlite3.Error) as error:
        parser.exit(1, f"{error}\n")


if __name__ == "__main__":
    main()
