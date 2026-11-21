FROM python:3.12-slim@sha256:5e2bdb1b0d542d5039cffb8181c65930093949194a65c365dfb1b0fe13a4fa5b

RUN --mount=type=bind,from=wheels,target=/wheels \
    pip install --no-cache-dir --no-index --find-links=/wheels humanize==4.8.0 dataclasses-json==0.6.7 shutup==0.2.0

WORKDIR /app
COPY --chmod=644 vendor/automind/automind/interpreter.py src/isolated-worker.py ./
USER 65532:65532
ENTRYPOINT ["python", "-I", "-B", "-c", "import sys, runpy; sys.path.insert(0, '/app'); runpy.run_path('/app/isolated-worker.py', run_name='__main__')"]
