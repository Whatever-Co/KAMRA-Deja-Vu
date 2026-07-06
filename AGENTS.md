# KAMRA - "Deja vu" — Agent Notes

2015 年制作のインタラクティブ MV（three.js r73 + clmtrackr 顔認識）。ビルドスタックは gulp 3 + webpack 1 + Babel 6 で、現代の Node（10+）では動かない。開発は **Node 8 コンテナ**（Apple Container）で行う。

## 開発環境（Apple Container + Node 8）

```sh
# 初回のみ
container system start
container run -d --name kamra-dev \
  -v "$PWD/main:/app" -w /app \
  -p 3000:3000 -p 3001:3001 -p 4000:4000 \
  node:8 tail -f /dev/null
container exec kamra-dev npm install

# dev サーバー起動（webpack watch + jade + stylus + browser-sync）
container exec kamra-dev sh -c 'npm run dev'
```

- http://localhost:3000 … browser-sync（開発用、livereload あり）
- http://localhost:4000 … dev-server.js（express、`/api/*` と共有顔画像を本番 https://kamra.invisi-dir.com に proxy — 本番はまだ稼働中）

コンテナ再起動後は `container start kamra-dev` → `container exec kamra-dev sh -c 'npm run dev'`。

## ハマりどころ（2026-07 に踏んだもの）

- **`i18next-jquery@0.0.2` は npm から unpublish 済み**（2015-12、ENOVERSIONS で install が死ぬ）。`main/web_modules/i18next-jquery.js` に同 API の shim を置いてある（webpack 1 は `web_modules/` を自動 resolve）。package.json からは削除済み。
- **`browser-sync` は 2.18.13 に固定**。`^2.10.0` だと最新 2.x が入り、依存の `ws` が optional catch binding（Node 10+ 構文）を使っていて Node 8 で SyntaxError になる。
- **コンテナの bind mount 越しでは fs イベントが飛ばない**（virtiofs）。gulpfile で webpack `watchOptions.poll` と gulp.watch `{mode: 'poll'}` を設定済み。ホスト側でファイルを編集すると 1〜7 秒でリビルドされる。
- **`public/data/keyframes.bin` は `.gz` しか repo にない**。connect-gzip-static が `Accept-Encoding: gzip` 付きリクエストに透過配信する。curl で叩くときは `-H 'Accept-Encoding: gzip'` を忘れない（忘れると 404 に見える）。
- **`public/data/_/riri-{in,out}-1280.mp4` は repo 未収録**。本番からダウンロードして配置済み（dev-server の proxy 対象パスでもないため、ローカルに置くしかない）。
- **`jquery` は 2.1.4 に固定**。`^2.1.4` だと 2.2.4 が入り、Sizzle が厳格化していて `#credit a[href=#femm]`（引用符なし属性セレクタ）が Syntax error を投げ、ローディング後に PageManager が起動できず画面が進まなくなる。
- **`textures/faces/lula.{json,jpg}` も repo 未収録だった**。本番からダウンロードして配置済み。なお dev-server.js の proxy regex `\/[a-z0-9]{8}\/` はアンカーなしのため `/textures/`（8 文字）にも偶然マッチし、ローカルに無いファイルが本番に proxy されて「動いているように見える」が、express-http-proxy@0.6 は gzip レスポンスの content-length を壊すので browser-sync 経由だとリクエストがハングする。ローカルにファイルを置くのが正解。
- **node_modules のパッケージを入れ替えたら webpack watch の再起動が必要**（in-memory cache が古いモジュールを保持する）。src の touch では反映されない。
- **顔認識テスト**: clmtrackr は顔の周囲に余白が必要。`textures/faces/slice_face_*.jpg`（顔がフレームいっぱい）をそのまま渡すと "Not able to recognize a face" になる。1280x720 のキャンバスに顔を高さ 400px 程度で中央配置すると通る。

## コミット時の注意

- `npm run dev` は `main/public/` のバンドル（app.js / bootstrap.js / 0.worker.js / sp/main.js、index.html、index.css）を **開発ビルドで上書きする**（committed なのは本番ビルド）。コミット前に `container exec kamra-dev sh -c 'npm run build'` で本番ビルドに戻すか、public/ の変更を除外すること。
