# 實作經驗

## 靜態網站以 GitHub Actions 發布到 GitHub Pages

### 做法

- 把網站檔案放在清楚且固定的資料夾，例如此專案的 `outputs/`。
- workflow 使用 `actions/checkout`、`actions/configure-pages`、`actions/upload-pages-artifact` 和 `actions/deploy-pages`，並授予 `contents: read`、`pages: write`、`id-token: write`。
- 上傳 artifact 的路徑要指向網站根目錄；該目錄內必須有最上層 `index.html`。
- workflow 可監聽預設分支的 push，並加上 `workflow_dispatch` 方便手動重跑。
- 建立 workflow 檔案不代表 Pages 已啟用；GitHub Pages 的發布來源要設成 GitHub Actions。新站可用 Pages REST API 的 `build_type: workflow` 設定，或從 repository Settings → Pages 設定。
- 預期 URL 格式為 `https://<owner>.github.io/<repository>/`。子路徑部署時，HTML 的資源連結應採相對路徑，避免絕對 `/asset.js` 指向網域根目錄。

### 驗收方式

1. 確認 repository 的 Pages 發布來源為 GitHub Actions。
2. 確認最新 `main` push 出現 workflow run，且部署 job 成功。
3. 對 workflow 回報的 page URL 發出 HTTP 請求，預期狀態為 200，並檢查頁面標題或主要內容。
4. HTTP 404 代表尚未發布或 URL/設定不符；不要只因 workflow 檔案存在就把部署標示為完成。

### 本次觀察

本專案的 workflow 檔案與程式碼已在 repository，但預期 Pages URL 起初回應 404，且 Actions run 查詢沒有結果。建立 Pages 網站並設定 `build_type: workflow` 後，GitHub 回傳正式網站 URL；仍要再 push 並確認 Actions 與網站回應，才能算完成發布。這次狀況只證明「檔案存在」不足以驗收部署，不能推論所有透過 API 建立的 commit 都不會觸發 Actions。

### 適用範圍

適用於小型靜態網站、純 HTML/CSS/JavaScript 專案，以及由子資料夾提供靜態輸出的專案。若使用 SPA 前端路由、建置工具、私有依賴或自訂網域，需額外處理 fallback、build 步驟、部署憑證或 DNS/HTTPS 設定。
