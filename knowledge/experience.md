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

## 一次性互動避免重複觸發

### 做法

對點擊後會短暫保留在 DOM 的按鈕，第一次處理事件時立即設為 `disabled`，並在 handler 開頭檢查遊戲狀態和 disabled 狀態。CSS 的 `pointer-events: none` 只阻止滑鼠／觸控，不會阻止鍵盤對仍聚焦按鈕再次送出 Enter 或 Space。

### 本次驗收與適用範圍

Node smoke test 對同一顆星星連續呼叫兩次 click handler，只增加一次分數。這適用於抽獎、收集、提交或消耗型操作等所有「一次啟動只能處理一次」的按鈕；如需可重複按的控制，不應套用 disabled 鎖定。

## 動態目標移除時保留鍵盤焦點

### 做法

- 會在動畫後移除的按鈕若由鍵盤啟動，移除前安排焦點到另一個仍可操作的目標，避免焦點回落到頁面本體。
- 對空的動態區域加 `tabindex="-1"`，讓它能作為沒有可用目標時的程式化焦點落點；為該狀態提供可見的 `:focus-visible` 外框。
- 用 click event 的 `detail === 0` 識別鍵盤合成啟動，只對鍵盤收集恢復焦點，避免滑鼠或觸控點擊後焦點被強制移走。
- 若收集動畫結束前回合已結束，將焦點移到已出現的再玩按鈕。

### 本次驗收與適用範圍

正式站鍵盤測試發現星星被收集並移除後焦點回到頁面；已實作下一目標／遊戲區／再玩按鈕焦點恢復，並以 Node smoke test 驗證下一個目標會取得焦點。此經驗適用於遊戲目標、通知關閉鈕或動畫後移除的動態清單項目。新版正式站操作仍待部署後重驗。

## 觸控命中區與圖像大小分離

### 做法與適用範圍

小型圖示或星星本身可能窄於舒適的觸控尺寸。用 CSS `min-width` / `min-height` 擴大原生按鈕命中區，讓視覺內容仍可維持原尺寸；適用於高密度互動的遊戲目標、工具列圖示和小型操作按鈕。修改後仍要在實際觸控裝置確認目標不互相遮擋、邊界位置可點中。

本專案把每顆星星的最小按鈕尺寸設為 44 CSS px，並保留原本 emoji 字級。程式碼只能證明尺寸規則存在，觸控手感仍待手機實測。

## 無依賴的內嵌遊戲回歸測試

### 做法

Node.js 內建 `vm` 可執行內嵌遊戲腳本並提供最小 DOM、計時器、音訊與儲存 mock，不需要 jsdom 或 npm 安裝。測試需明確標出模擬環境的邊界，不能將它當成版面或真機互動驗收。

在 GitHub Actions 中先以 `actions/setup-node` 固定 Node 主版本，再執行 smoke test，讓失敗在部署前終止。這個專案使用 Node 24 與 `tests/game-smoke.cjs`，測試普通星星與金星分數、單次命中、倒數截止、visibilitychange、最佳紀錄的載入與不倒退、新局重置、儲存例外和音效開關。以可控的隨機數序列分別覆蓋普通與特殊目標，避免測試只碰到其中一條隨機分支。

### 適用範圍

適用於依賴少、核心邏輯可與 DOM 分開驗證的單檔互動頁面；以可控輸入覆蓋不同隨機分支，也可檢查隨機遊戲中常被漏掉的普通路徑。若遊戲邏輯變複雜或高度依賴瀏覽器 API，應改用更完整的單元或瀏覽器測試工具，但保留手動視覺／觸控驗收。

## 瀏覽器 viewport 驗收與實機驗收界線

### 做法

- 以瀏覽器自動化在明確的 CSS viewport 尺寸跑一次主要流程，讀取可見文字與 DOM 狀態，並量測 `getBoundingClientRect()`、`scrollWidth`、`scrollHeight`，可快速抓出桌面／窄螢幕的版面溢出及回合流程錯誤。
- 紀錄使用的 viewport 寬高、分數與結算狀態。不同尺寸的 viewport 模擬能驗證瀏覽器排版，不等於真手機、真觸控、實際音訊或實體鍵盤驗收。
- 將已驗證和未驗證項目分開勾選；不要因為按鈕有 `aria-pressed` 就宣稱已確認音訊可聽見，也不要從少量分數推斷遊戲節奏要調整。

### 本次驗收

正式站在 1024×768 CSS viewport 下 app 為 470px 寬、遊戲區約 435×424px，文件尺寸與 viewport 相同；實際操作普通星星 +1、等待回合結束、查看最佳紀錄及重新開始。390×844 viewport 的結算卡完整顯示。音效按鈕 `aria-pressed` 可 true→false→true。實體手機觸控、音效聽感、鍵盤完整路徑與跨重新載入儲存仍未驗收。

### 適用範圍

適用於靜態網站、小型 HTML 遊戲及響應式互動頁面做快速瀏覽器驗收；在測試報告或計畫中，應把瀏覽器模擬結果與需要實體設備／感官體驗的待驗項目分開記錄。
