- `src/data/face.blend` からパーツ別にかきだす
  - 顔モデルは JSON (Three.js exporter) で `face.json`
  - 特徴点は Wavefront (OBJ)（ラインしかないモデルが JSON で書き出せない..）で `fp.json`
  - 眼と鼻は JSON で `eyemouth.json`

- `main.js` の `ExportApp` で `face2.json` できる。
