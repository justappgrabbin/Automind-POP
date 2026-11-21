"""JSON boundary for the original Biverse dimensional engine."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "vendor" / "biverse"))
from human_design.dimensional import PerspectiveEngine


def main():
    request = json.loads(sys.argv[1])
    engine = PerspectiveEngine()
    observed = engine.locate(request["expressions"], request.get("weights"))
    clarity = request.get("clarify")
    clarified = engine.clarify(observed, clarity).to_dict() if clarity is not None else None
    print(json.dumps({"observed": observed.to_dict(), "clarified": clarified}, allow_nan=False))


if __name__ == "__main__":
    try:
        main()
    except (KeyError, TypeError, ValueError) as error:
        sys.exit(str(error))
