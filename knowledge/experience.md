# 實作經驗

## 靜態網站以 GitHub Actions 發布到 GitHub Pages

### 做法

- 把網站檔案放在清楚且固定的資料夾，例如此專案的 `outputs/`。
- workflow 使用 `actions/checkout`、`actions/configure-pages`、`actions/upload-pages-artifact` 和 `actions/deploy-pages`，並授予 `contents: read`、`pages: write`、`id-token: write`。
- 上傳 artifact 的路徑要指向網站根目錄；該目錄內必須有最上層 `index.html`。
- workflow 可監聽預設分支的 push，並加上 `workflow_dispatch` 方便手動重跑。
- workflow 檔案存在不代表 Pages 已啟用。新站需先把 Pages 發布來源設為 GitHub Actions；可從 Settings → Pages 設定，或使用 Pages API 建立 `build_type: workflow` 的 Pages site。
- 預期 URL 格式為 `https://<owner>.github.io/<repository>/`。子路徑部署時，HTML 的資源連結應採相對路徑，避免絕對 `/asset.js` 指向網域根目錄。

### 驗收方式

1. 確認 repository 的 Pages 發布來源為 GitHub Actions。
2. 確認最新 `main` push 出現 workflow run，且部署 job 成功。
3. 對 workflow 回報的 page URL 發出 HTTP 請求，預期狀態為 200，並檢查頁面標題或主要內容。
4. HTTP 404 代表尚未發布或 URL/設定不符；不要只因 workflow 檔案存在就把部署標示為完成。

### 本次觀察與排錯

本專案第一次 workflow run 在 `Configure Pages` 失敗，因為 Pages site 尚未建立。建立 Pages site 並設為 `build_type: workflow` 後，下一次 push 的 `deploy` job 成功，正式網址 `https://duhejjvb.github.io/star-collector/` 回應 HTTP 200，內容包含遊戲標題與 HTML。這說明新 repository 除了 workflow 和檔案以外，也需要先初始化 Pages 發布來源。

首次部署若失敗在 `Configure Pages`，先檢查 Pages site 是否存在、來源是否為 workflow；若失敗在 `Deploy to GitHub Pages`，再檢查 `pages: write`、`id-token: write` 與 workflow environment 權限。不要只依據 workflow run 的總狀態猜測原因，應定位失敗 step。

## 瀏覽器小遊戲的可用性與儲存容錯

### 做法

- 以原生 `<button>` 做可點擊目標，可直接取得鍵盤焦點、Enter 啟動和輔助技術語意；補上清楚的 `aria-label`。
- 為自訂按鈕提供 `:focus-visible` 樣式，讓鍵盤使用者知道目前選到哪裡。
- 以 `prefers-reduced-motion: reduce` 停用漂浮、縮放等裝飾動畫，保留必要的操作回饋。
- `localStorage` 可能因隱私模式、瀏覽器政策或檔案來源限制而讀寫失敗。對讀取和寫入分別使用 `try/catch`，驗證讀回值，再把儲存視為可選功能，避免它阻止主要遊戲啟動。
- 對可選的音效開關同步更新 `aria-pressed` 與狀態標籤，避免只有圖示變化。
- 不要用 `user-scalable=no` 或 `maximum-scale=1` 鎖住縮放；窄螢幕或橫向畫面高度不足時，允許頁面垂直捲動。

### 本次驗收

JavaScript 內嵌程式以 `node --check` 通過語法檢查。一次性 Node smoke test 模擬 `localStorage` 讀寫都丟出例外，仍可開始遊戲、取得金星分數並完成 30 秒回合。`git diff --check` 無格式錯誤。瀏覽器實際鍵盤、縮放與減少動態效果驗收仍待桌機/手機人工操作。

### 適用範圍

適用於小型 HTML 遊戲、互動展示，以及以本機儲存偏好或最佳成績的前端小工具。若資料屬於必須保存的使用者內容，不能只依賴 `localStorage`；應提供明確錯誤處理及更可靠的儲存方案。

## 適用範圍：GitHub Pages 經驗

Pages 部署經驗適用於小型靜態網站、純 HTML/CSS/JavaScript 專案，以及由子資料夾提供靜態輸出的專案。若使用 SPA 前端路由、建置工具、私有依賴或自訂網域，需額外處理 fallback、build 步驟、部署憑證或 DNS/HTTPS 設定。

## 真實裝置驗收與模擬測試的範圍

Node.js 模擬 DOM 可檢查事件流程與錯誤容錯，但不能證明實際版面、字型、觸控命中、音訊或輔助技術表現。需要這些證據時，應在桌面與觸控裝置實際操作，並記錄裝置和瀏覽器版本；再依觀察調整節奏參數。

## 短回合倒數與背景分頁

### 做法

- 不要只用 `time--` 的 `setInterval` 累計秒數；背景分頁會被瀏覽器節流，回合可能比預期長。
- 儲存絕對截止時間（使用 `performance.now()` 單調時鐘），每次更新時以 `ceil((deadline-now)/1000)` 推算剩餘秒數。
- 監聽 `visibilitychange`，切回分頁立即校正；隱藏時移除舊目標，且 `spawn` 不再追加星星。
- 本遊戲採用「回合照常計時」：玩家切回時若時間已到，就立即結算。若產品規則是離開時暫停，應改為保存剩餘時間並在重現時重設截止時間。

### 本次驗收

Node.js smoke test 將模擬時鐘推進 15.5 秒後確認倒數為 15 秒；切到 hidden 後確認不再生成星星；推進超過 30 秒再切回，確認立刻結算。測試同時驗證分數、最佳紀錄寫入與音效按鈕的 `aria-pressed`、標籤更新。

### 適用範圍

適用於有真實經過時間限制的短局遊戲、倒數活動或前端限時互動。若背景期間應暫停遊戲，需明確採用剩餘時間凍結策略，不能直接套用 wall-clock 截止時間。
