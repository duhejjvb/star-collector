# 星星收集社

一款輕鬆可愛的繁體中文點擊收集小遊戲。開啟 [`outputs/index.html`](outputs/index.html) 就能遊玩。

## 遊玩方式

在 30 秒內點擊飄浮的星星收集分數；金色星星可得雙倍分數。遊戲支援滑鼠、觸控與鍵盤操作，並尊重減少動態效果偏好，也保留瀏覽器縮放與短螢幕捲動。最佳紀錄保存在目前瀏覽器；若瀏覽器限制本機儲存，仍可正常遊玩。

## 線上遊玩

GitHub Pages：<https://duhejjvb.github.io/star-collector/>

## GitHub Pages 發布

每次推送到 `main` 後，GitHub Actions 會自動將 `outputs/` 發布到 GitHub Pages。workflow 設定位於 `.github/workflows/pages.yml`。若複製到新 repository，請先在 **Settings → Pages → Build and deployment** 將來源設成 **GitHub Actions**。

遊戲原始檔位於 `outputs/index.html`；規劃文件位於 `knowledge/plan.md`，可重用的實作經驗位於 `knowledge/experience.md`。

## 本機 smoke test

安裝 Node.js 24 後執行：

```sh
node tests/game-smoke.cjs
```

測試不需安裝 npm 套件。它驗證遊戲邏輯與儲存容錯，不取代桌面或手機的實際視覺／觸控驗收。
