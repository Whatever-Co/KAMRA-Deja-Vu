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

## 踏んだ地雷

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

## スマホ対応

2015 年の UA 追い返し（→ `sp/` の YouTube ページ）を廃止し、モバイルでも本編が動く。`Config.IS_MOBILE`（UA + iPadOS の touch-points 判定）が唯一の分岐点。実装の要点と踏んだ地雷：

- **音源とクロックは `textures/bg_movie_prizm.mp4`（52MB、video+audio）**。composite-pass1 が再生し `Ticker.setClock` で全ショーの同期クロックになる。これが再生できない = 顔が出たまま止まる
- **autoplay 制限**: 無音テクスチャ動画 4 本（curl_bg / slitscan / riri-in,out / webcam stream）は `muted` + `playsinline` で無条件再生可。音入りの prizm は `media-unlock.js` に登録し、開始ボタンのジェスチャ内で `startGesture()`（page-manager）が unlock。**unlock の pause は同期で行う** — play() promise を待って pause すると、遅い回線で promise 解決がショー開始後になり、遅延 pause がクロックを止める（実機で踏んだ）。**`startGesture()` は show へ遷移する全 click handler に必要**（`.with-webcam` / `.with-photo` / `.without-webcam` / `#credit a[href=#femm]` / webcam-step2 skip / upload-step3 ok / play-shared button — 追加する時は忘れやすい）
- **BGM**（intro.mp3/ogg、audio 要素）: play() rejection を catch して最初の click/touchend でリトライ（bgm-manager.js）。retry 対象は `attemptedPlayer` に固定する（A↔B ping-pong で `this.player` が入れ替わった後に retry gesture が発火するとバグる）
- **getUserMedia**: `Modernizr.getusermedia` は旧 prefix API 検出で iOS Safari では常に false（Chrome には残骸があるため desktop では偶然動く）。webcam-manager.js は `navigator.mediaDevices.getUserMedia`（promise、`facingMode: 'user'`）に書き換え済み。**HTTPS 必須**。error は `onError(error)` で caller に渡す（`NotAllowedError` / `NotFoundError` / `NotReadableError` の分岐 UI 可能に）
- **iOS Safari は HTTP Range（206）非対応サーバーから mp4 を再生しない**。Chrome は 200 全量返しでも再生するので、デスクトップやエミュレーションでは絶対に気づけない。ローカル配信サーバーには Range 対応必須
- **iPhone の Safari には要素 Fullscreen API が無い**（iOS 26 実機で確認）。Android は `requestFullscreen` が動く。iPhone のフルスクリーンは「ホーム画面に追加」経由のみ — `manifest.webmanifest`（display: fullscreen）+ `apple-mobile-web-app-capable` meta + `apple-touch-icon.png`（ogimage.jpg から生成）を設置済み
- **横画面専用**: `html.mobile` クラス（bootstrap.js が付与）+ 縦持ちで純 CSS の回転案内オーバーレイ（`#rotate-device`、index.styl の `@media (orientation: portrait)`）。`MIN_WINDOW_WIDTH` はモバイルで 0（1100px クランプを外して cover-scale を正しく）
- **UI レイアウトの mobile design stage**: `#page`（全 HTML 画面の親）を `html.mobile` 時に **1280×720 の固定 design stage** 化し、`bootstrap.js` の `applyMobileStageScale()` が `min(vw/1280, vh/720)` の contain-scale を JS で適用。**video canvas 側の cover-scale とは別レイヤ**（触らない）。1920×1080 stage だと scale が 0.36 になって body 12px が 4.3px に潰れる（実機で確認）ため 1280×720 に落とした。iPhone SE(667×375)=0.52 / iPhone 13(844×390)=0.54 / iPad(1180×820)=0.92 が実測値
- **実機テスト手順**: `tailscale serve --bg 4001` で正規 HTTPS（https://studio.tail9c582e.ts.net/）→ iPhone からアクセス。ローカル配信は scratchpad の `kamra-server.mjs`（Range / gzip / POST 遮断 / リクエストログ対応）。終わったら `tailscale serve --https=443 off`

## 本番インフラ

### CDN 前段（Cloudflare）

- **Zone**: `invisi-dir.com` は Cloudflare `info.invisi@gmail.com` アカウント（account_id `aa8728f04497ca4941d10b0695561e51`、free plan）。**2015 年（11 年前）から**運用（Caching → ブラウザキャッシュ TTL の「最終変更 11 年前」で確認、Saqoosha が失念してた）
- Dashboard: https://dash.cloudflare.com/aa8728f04497ca4941d10b0695561e51/invisi-dir.com/caching/configuration
- Saqoosha 個人 CF アカウントには invisi-dir.com zone は無い（`~/.wrangler/config/default.toml` の OAuth token では zone list 空。切り替える必要）
- **ブラウザキャッシュ TTL = 1 月**（`max-age=2678400` の正体）。origin の nginx はこれを override してない
- **static asset（JS/CSS/画像）は CF edge で 31 日 cache**（Standard cache level）。デプロイ後は **Purge Everything が必須**。放置すると全 edge が旧版を返し続ける

### オリジンサーバー（さくら VPS）

- **SSH**: `ssh -p 2014 hiko@160.16.94.60`（tk2-223-21056.vs.sakura.ne.jp、Tokyo 第 2 データセンター、KVM）
- Ubuntu 16.04（kernel 4.4）、Intel Broadwell × 2 core、**uptime 2540+ 日**（2019 年 2 月頃から無停止、user は再起動を嫌ってる）
- **hiko は `sudo` + `www-data` グループ**、`/home/www/public_html/` 以下は setgid で新ファイルが `hiko:www-data` になり書き込み可（`hige` 所有ファイルは残っててもそのまま。混在許容）
- sudo は tty 必須で SSH non-interactive では password prompt 待ちで死ぬ

### Web / backend 構成

- nginx 1.10.3、`/etc/nginx/sites-enabled/default` の 1 個の server block。`root /home/www/public_html; index index.html;`、静的ファイル → `try_files $uri @gunicorn_server` で存在しなければ `unix:/var/run/kamra.sock`（Python backend）へ proxy
- **`try_files $uri` は directory index を試さない** gotcha あり — `/foo/` に到達した時 `/foo/index.html` へ内部リライトせず backend に流れて 302 redirect される。テスト時は `/foo/index.html` を直指定するか、`try_files $uri $uri/index.html @gunicorn_server` に nginx conf 修正が必要（今のところ触ってない、`/` は自然に動くので不要）
- **backend**: `/home/www/src/` の Python（Django っぽい構成 — `application.py` / `main.py` / `settings/{stg,test}.py` / `api/{views,urls,forms}.py` / `public/{views,urls}.py`）。gunicorn + meinheld（`worker_class = meinheld.gmeinheld.MeinheldWorker`、workers = CPU × 2 = 4）で `/home/www/bin/gunicorn -c gunicorn_config.py --bind unix:/var/run/kamra.sock`。systemd unit `kamra.service`
- **share エンドポイント**: `POST /api/save` が `/home/www/uploads/{8chars}/{cap,dejavu}.jpg` を保存、share URL は `https://kamra.invisi-dir.com/{8chars}/`。share ページは backend が template を返す（この template は本番の `/app.js` `/bootstrap.js` を参照するので、share URL 側は常に**その時点の production bundle** で動く）
- **`/home/www/uploads/` は 15 GB / 11 万件**（release 2015 以来、2017 年 65k / 2018–2024 各年 4k–8k / 2025 5k / 2026 半年で 1.7k）**毎日新規保存されている**。デプロイでは絶対に触らない

### アセット類

- 静的ファイル + build バンドルは `/home/www/public_html/`
- GitHub: https://github.com/Whatever-Co/KAMRA-Deja-Vu（public、`master` = 現本番同期）

## 本番デプロイ手順（blue-green symlink flip）

**必ずしてはならない事**：`kamra.service` 再起動 / nginx 再起動 / VPS 再起動 / `uploads/` を触る。

```bash
# 0. ローカルで build（container 内）
container exec kamra-dev sh -c 'npm run build'

# 1. 現本番から hardlink コピー（近似瞬時、実 I/O 0）
ssh -p 2014 hiko@160.16.94.60 '
  cd /home/www
  cp -al public_html public_html_new
  rm -rf public_html_new/v2  # 過去の sandbox があれば消す
  cd public_html_new
  rm -f app.js bootstrap.js 0.worker.js index.css index.html \
        manifest.webmanifest apple-touch-icon.png sp/main.js sp/index.css
'

# 2. 変更ファイルを scp（サイズ = 実際変わったバイトのみ、~1MB）
scp -P 2014 main/public/{app,bootstrap,0.worker}.js main/public/index.{css,html} \
  main/public/manifest.webmanifest main/public/apple-touch-icon.png \
  hiko@160.16.94.60:/home/www/public_html_new/
scp -P 2014 main/public/sp/{main.js,index.css} \
  hiko@160.16.94.60:/home/www/public_html_new/sp/

# 3. 原子的スワップ（`mv` 2 発、blip はサブミリ秒）
ssh -p 2014 hiko@160.16.94.60 '
  cd /home/www
  mv public_html public_html_v1 && mv public_html_new public_html
'

# 4. Cloudflare cache purge（**必須**、忘れると 31 日間 stale）
#    dashboard: caching → Configuration → 「すべてパージ」
#    or MCP から Chrome 経由でクリック
```

**rollback**（旧版に戻す、1 秒）:

```bash
ssh -p 2014 hiko@160.16.94.60 '
  cd /home/www
  mv public_html public_html_broken && mv public_html_v1 public_html
'
# CF は新版 cache 済のはずなので、rollback 後も cache purge 再実行
```

### プリプロダクション試験（`/v2/` サンドボックス）

本番昇格前に別 URL で確認したい時：

- `/home/www/public_html/v2/` に symlink ベースで新版ツリー構築（変更ファイル 9 個だけ実体 copy、他は `../` symlink）
- `v2/index.html` は `<base href="/v2/">` に書換え（相対 URL が全部 `/v2/*` に解決）
- アクセスは `https://kamra.invisi-dir.com/v2/index.html`（`/v2/` は nginx `try_files` gotcha で 302 になるので index.html 直指定）
- クリーンアップは `rm -rf /home/www/public_html/v2/`（symlink は target を消さない、本番無傷）
- share は本番 backend に飛ぶので `/v2/` で share すると本番に share ページが作られる（それ自体は問題ないが把握しとく）

## 残タスク

- **PR #4**（https://github.com/Whatever-Co/KAMRA-Deja-Vu/pull/4、`revive-2026` → `master`）を merge。**本番は既に revive-2026 build を配信中**（`master` はまだ 2015 状態）
- 数日安定運用したら `/home/www/public_html_v1/` を削除（rollback バックアップ）
- `master` merge 後に `revive-2026` branch 削除、local worktree 掃除

## コミット時の注意

- `npm run dev` は `main/public/` のバンドル（app.js / bootstrap.js / 0.worker.js / sp/main.js、index.html、index.css）を **開発ビルドで上書きする**（committed なのは本番ビルド）。コミット前に `container exec kamra-dev sh -c 'npm run build'` で本番ビルドに戻すか、public/ の変更を除外すること
- **`main/public/app.js` の rebuild は毎回微差分が出る**（glslify のシェーダー変数名 `sineOut_2_2` ↔ `sineOut_1_2` `range_3_0` ↔ `range_4_0` 等の mangle が非決定的、機能は同じ）。`main/src/pc/app.js` を触ってないのに public/app.js が変わってたら **`git checkout main/public/app.js` で revert してよい**（commit ノイズになる）
- **空 catch 禁止**（silent failure hunter に何度も指摘される）: `.catch(() => {})` は書かない。少なくとも `console.debug('<caller>: <api> rejected', err && err.name)` で name を残す
