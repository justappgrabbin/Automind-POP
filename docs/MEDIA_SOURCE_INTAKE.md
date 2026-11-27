# Media source and weight acquisition

Requested additions: AID Studio and actual pretrained Chitra Tiny and Drishya Tiny models, not the two source ZIPs.

- AID Studio: pinned source submodule at vendor/aid-studio, upstream commit 69b2664d3536d9fe1c167c19e5b58333471c5fc4.
- Chitra browser weights: https://huggingface.co/udgamlabs/Chitra-Tiny-ONNX (Apache-2.0).
- Drishya weights: https://huggingface.co/udgamlabs/Drishya-Tiny (CC BY-NC 4.0).

```sh
git submodule update --init vendor/aid-studio
python -m pip install -r src/media-model-requirements.txt
python src/download_media_models.py --destination /path/to/models --accept-drishya-noncommercial
```

The downloader fetches complete public model snapshots, resolves the revision before download, and checks for model artifact filenames. No inference-service API key is required. Binary weights are not stored in this Git commit; internet is required for initial acquisition. Do not commit downloaded binaries using ordinary Git. Use --model chitra to download only the commercially licensed image model.

No model download, inference, AID Studio runtime, or AutoMind adapter has been executed or verified in this commit. Preserve existing source and runtime. The next integration must connect these actual components to the existing conductor and swarm and expose them in the workspace. Drishya's noncommercial weights cannot be used commercially without appropriate permission.
