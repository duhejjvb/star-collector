# 星星收集社

一款輕鬆可愛的繁體中文點擊收集小遊戲。開啟 [`outputs/index.html`](outputs/index.html) 就能遊玩。

## 遊玩方式

在 30 秒內點擊飄浮的星星收集分數；金色星星可得雙倍分數。遊戲支援滑鼠與觸控，最佳紀錄保存在目前瀏覽器。

## 線上遊玩

GitHub Pages：<https://duhejjvb.github.io/star-collector/>

## GitHub Pages 發布

每次推送到 `main` 後，GitHub Actions 會自動將 `outputs/` 發布到 GitHub Pages。workflow 設定位於 `.github/workflows/pages.yml`。若複製到新 repository，請先在 **Settings → Pages → Build and deployment** 將來源設成 **GitHub Actions**。

遊戲原始檔位於 `outputs/index.html`；規劃文件位於 `knowledge/plan.md`，可重用的實作經驗位於 `knowledge/experience.md`。
