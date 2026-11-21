"""Exercise the original interpreter with trusted code and a real output file."""

import sys
from pathlib import Path
from tempfile import TemporaryDirectory

# The package initializer imports the full ML stack. This component test exercises
# the interpreter module directly with the same import name in its spawned child.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "vendor/automind/automind"))
from interpreter import Interpreter


def main():
    with TemporaryDirectory(prefix="pop-automind-") as directory:
        interpreter = Interpreter(directory, timeout=5)
        result_file = Path(directory) / "result.txt"
        try:
            failure = interpreter.run("print(12 // 0)")
            assert failure.exc_type == "ZeroDivisionError", failure
            assert not result_file.exists()
            recovered = interpreter.run(
                "from pathlib import Path\nPath('result.txt').write_text(str(12 // 3))"
            )
            assert recovered.exc_type is None, recovered
            assert result_file.read_text() == "4"
        finally:
            interpreter.cleanup_session()
    print("Original AutoMind interpreter detected a failure and ran the corrected code.")


if __name__ == "__main__":
    main()
