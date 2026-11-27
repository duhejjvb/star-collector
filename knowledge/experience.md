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

### 適用範圍

適用於小型靜態網站、純 HTML/CSS/JavaScript 專案，以及由子資料夾提供靜態輸出的專案。若使用 SPA 前端路由、建置工具、私有依賴或自訂網域，需額外處理 fallback、build 步驟、部署憑證或 DNS/HTTPS 設定。
