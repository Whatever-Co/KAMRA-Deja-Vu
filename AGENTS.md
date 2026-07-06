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
- **webcam モードが黒画面**（`Uncaught TypeError: Failed to execute 'createObjectURL' on 'URL'`）: 2015 年の `video.src = URL.createObjectURL(stream)` は Chrome から削除済み。`video.srcObject = stream` に修正済み（`user-plane-base` 系は `user-webcam-plane.js` 参照）。カメラ許可や getUserMedia 自体は 2026 年の Chrome でも動く。
- **dev 環境の `/api/save` は本番に書き込む**。dev-server が本番へ proxy しているので、再生完走 → share/Retry すると **kamra.invisi-dir.com に本物の share ページが作られる**（実際に作られた例: /8m99dezi/）。Retry ボタンは本番の share URL に遷移するので localhost に戻ること。
- **顔認識テスト**: clmtrackr は顔の周囲に余白が必要。`textures/faces/slice_face_*.jpg`（顔がフレームいっぱい）をそのまま渡すと "Not able to recognize a face" になる。1280x720 のキャンバスに顔を高さ 400px 程度で中央配置すると通る。自動テストでは canvas で余白付き画像を作り `new File` → `DataTransfer` → `input.image-file` に代入して `change` イベント dispatch で photo フローを無人駆動できる（MCP の upload_file は workspace 外パスを拒否する）。
- **Chrome のデフォルトカメラは OBS Virtual Camera** になっていることがある（webcam テストで OBS ロゴが映る）。アドレスバーのカメラアイコンから実カメラに切替 → リロード。

## ユニットテスト

Node 8 コンテナ内で babel-node（babel-cli@6）で実行する：

```sh
container exec kamra-dev sh -c 'node_modules/.bin/babel-node test/subdivision-operator.test.js'
container exec kamra-dev sh -c 'node_modules/.bin/babel-node test/subdivided-face-geometry.test.js'
```

THREE はグローバル前提のコードなので、テストは `test/three-stub.js` を最初に import してスタブを入れる（import は巻き上げられるため、代入をテストファイル内に書くと間に合わない）。

## 顔メッシュの subdivision（2026-07 追加）

380 頂点のケージ（face 342 + eyemouth 38）はそのまま、Loop subdivision を疎な線形写像として前計算し、描画用の派生メッシュだけ高解像度化してある（level 2 で 5,276 頂点）。設計と踏んだ地雷の全記録は `docs/superpowers/specs/2026-07-06-smooth-face-mesh-design.md`。要点：

- `main`/`alts` = level 2（モバイル含む全環境。旧 `LOW_SPEC` 分岐は 2026-07 に廃止）、FaceLibrary（子顔 20 + lula）= level 1 + 遅延生成。**全ライブラリ顔を level 2 で先に作るとヒープ膨張 → GC 停止が clmtrackr を周期的に飛ばして webcam outro の顔位置がジャンプする**（フレームレートは落ちないので気づきにくい）。ケージ UV を直接書き換える消費者は `refreshUVs()` を呼ぶ契約
- `face1`/`face2`（mosaic）と user-plane の顔はケージのまま。FaceParticle / FaceBlender が `geometry.index` をケージトポロジー前提で消費するため
- facade（`subdivided-face-geometry.js`）の `positionAttribute`/`uvAttribute` はケージの属性を返す。既存消費者（mouth 共有、smalls の UV コピー、particled-logo 等）はこれ前提
- `levels: 0` は意図的 pass-through（ケージをそのまま描画、operator 構築なし）。低スペック端末への逃げ道として facade に残してある — `Config.FACE_SUBDIVISION` を 0 にするだけで全 call site がケージ解像度に落ちる

## スマホ対応（2026-07 追加）

2015 年の UA 追い返し（→ `sp/` の YouTube ページ）を廃止し、モバイルでも本編が動く。`Config.IS_MOBILE`（UA + iPadOS の touch-points 判定）が唯一の分岐点。実装の要点と踏んだ地雷：

- **音源とクロックは `textures/bg_movie_prizm.mp4`（52MB、video+audio）**。composite-pass1 が再生し `Ticker.setClock` で全ショーの同期クロックになる。これが再生できない = 顔が出たまま止まる
- **autoplay 制限**: 無音テクスチャ動画 4 本（curl_bg / slitscan / riri-in,out / webcam stream）は `muted` + `playsinline` で無条件再生可。音入りの prizm は `media-unlock.js` に登録し、開始ボタンのジェスチャ内で `startGesture()`（page-manager）が unlock。**unlock の pause は同期で行う** — play() promise を待って pause すると、遅い回線で promise 解決がショー開始後になり、遅延 pause がクロックを止める（実機で踏んだ）
- **BGM**（intro.mp3/ogg、audio 要素）: play() rejection を catch して最初の click/touchend でリトライ（bgm-manager.js）
- **getUserMedia**: `Modernizr.getusermedia` は旧 prefix API 検出で iOS Safari では常に false（Chrome には残骸があるため desktop では偶然動く）。webcam-manager.js は `navigator.mediaDevices.getUserMedia`（promise、`facingMode: 'user'`）に書き換え済み。**HTTPS 必須**
- **iOS Safari は HTTP Range（206）非対応サーバーから mp4 を再生しない**。Chrome は 200 全量返しでも再生するので、デスクトップやエミュレーションでは絶対に気づけない。ローカル配信サーバーには Range 対応必須
- **iPhone の Safari には要素 Fullscreen API が無い**（iOS 26 実機で確認）。Android は `requestFullscreen` が動く。iPhone のフルスクリーンは「ホーム画面に追加」経由のみ — `manifest.webmanifest`（display: fullscreen）+ `apple-mobile-web-app-capable` meta + `apple-touch-icon.png`（ogimage.jpg から生成）を設置済み
- **横画面専用**: `html.mobile` クラス（bootstrap.js が付与）+ 縦持ちで純 CSS の回転案内オーバーレイ（`#rotate-device`、index.styl の `@media (orientation: portrait)`）。`MIN_WINDOW_WIDTH` はモバイルで 0（1100px クランプを外して cover-scale を正しく）
- **実機テスト手順**: `tailscale serve --bg 4001` で正規 HTTPS（https://studio.tail9c582e.ts.net/）→ iPhone からアクセス。ローカル配信は scratchpad の `kamra-server.mjs`（Range / gzip / POST 遮断 / リクエストログ対応）。終わったら `tailscale serve --https=443 off`

## 本番インフラ調査（2026-07-06 時点）

本番 https://kamra.invisi-dir.com は**まだ稼働中**。構成の判明分：

- Cloudflare が前段（cf-cache HIT、`server: cloudflare`）。オリジンは **nginx**（etag `565c067c-16cdef0` = nginx 形式 mtime-size、ファイルは 2015-11-30 から未更新）
- オリジンの所在は**未特定**。Saqoosha の AWS アカウント（534787916934、profile `saqoosha`）には無い — ap-northeast-1 / us-east-1 / us-west-2 の EC2 と S3 を確認済み。Whatever の Cloudflare アカウントにも kamra 関連 Worker なし。`invisi-dir.com` の CF zone がどのアカウントにあるかも未確認（dot by dot 時代のアカウントの可能性）
- GitHub: https://github.com/Whatever-Co/KAMRA-Deja-Vu（public）
- 本番更新の選択肢: (a) オリジンサーバーへの SSH 等のアクセス経路を見つける、(b) CF zone にアクセスして DNS からオリジン特定 or 向き先変更、(c) CF Workers 等に丸ごと移行して DNS 切替（一番きれい）

## 残タスク

- `revive-2026` ブランチ（蘇生 + webcam 修正 + Loop subdivision、全テスト・実機検証済み）が **local のみ、未 push**。push / PR / master merge は未指示
- 本番デプロイはオリジンアクセス待ちでブロック中（上記の選択肢からユーザーが決める）

## コミット時の注意

- `npm run dev` は `main/public/` のバンドル（app.js / bootstrap.js / 0.worker.js / sp/main.js、index.html、index.css）を **開発ビルドで上書きする**（committed なのは本番ビルド）。コミット前に `container exec kamra-dev sh -c 'npm run build'` で本番ビルドに戻すか、public/ の変更を除外すること。
