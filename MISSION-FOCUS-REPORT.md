# Mission Control / Focus Chamber 更新报告

预览：http://127.0.0.1:8765/#mission 与 http://127.0.0.1:8765/#focus 。请保持原端口，以继续使用原浏览器数据。

## 删除与保留
- 删除 Outlook 专属 UI、Graph 读取、OAuth 登录回调、token/session 处理、mail-to-task、邮件测试以及 @azure/msal-node 依赖；相关目录为 dist/components/mail、server/microsoft、server/graph，原 server/api.mjs 已移除。
- 保留通用本地服务、RSS、安全响应头、APP_ORIGIN/PORT 配置，提取为 server/config.mjs。真实 .env 没有重写。Microsoft 配置已从 .env.example 与接入说明移除。
- Literature Mode、文学笔记编辑入口、文学翻译入口、Speaking/Soon、Speaking Lab 已从学习区删除。
- 保留 legacy-literature.js 的旧原文映射，仅供旧翻译记录还原原文；已保存文学笔记和旧草稿不清理，避免损坏历史数据。
- Training 四个剩余页签、新闻 RSS、词汇、翻译协议与历史继续使用原实现。

## 新功能
Mission Control：任务新增、编辑、完成、恢复、删除；Today/Upcoming/Someday/Done；六类筛选；日期月历筛选；主线与关联子任务进度；本周完成数；最近完成任务。首页任务与任务中心共用同一数组，通过兼容字段映射，不建立第二套任务存储。

Focus Chamber：完全停用番茄钟、休息倒计时与暂停恢复，改为手动专注日志；六类项目、1–1440 分钟与每日总量校验、+15/+30/+45/+60、关联未完成任务、日期和备注；新增/修改/删除；日周月年统计、真实日志驱动的月度热力图、历史记录。记录专注不会完成任务或奖励 EXP。

两页共享日期时间、原天气数据状态与可复用等级条；无天气数据时显示 WEATHER OFFLINE。

## EXP 与数据迁移
playerProgress 保存 level/currentExp/totalExp/awardedTaskIds；expEvents 保存 id/taskId/amount/source/createdAt。Daily/Normal +10、Side +20、Main +50，仅首次完成奖励。taskId 与 ledger 双重检查，重开再完成不能重复获奖；删除任务不抹掉历史成长。每级门槛 100+(level-1)*50，可连续升级。

沿用 bibaboo-v02 localStorage 与原 IndexedDB。首次兼容迁移先保存 bibaboo-v02-before-mission 备份，补充任务与专注字段；旧 text/cat/done/minutes 等字段兼容保留。旧完成任务进入排除名单，不补造 EXP；旧计时状态留作 retiredTimer，不自动结算。其他用户集合不清空。

正式 8765 预览可见原有 4 条任务；迁移测试验证翻译、词汇、研究与生活对象不被修改。测试任务和日志只创建于独立 8768 测试端口，已删除；测试 EXP 不进入正式端口。

## 原图和布局
使用用户原图 mission-focus-original.png，独立 img 层，object-fit: contain、object-position: center center，无 transform、无 cover、无背景滤镜。两份图片 SHA256 均为：
3e83dc25c03eb2e8c40868d1e0eb3e3c6436a8b373c688dbbaf666633e0697ce

已检查 16:9、16:10、3:2 比例以及手机布局；工具实际视口按比例缩小，分别约 1221×687、1221×763、1172×781，手机约 297×644。无横向页面溢出；较小高度可纵向滚动。背景保持完整比例与深色留边。不是逐像素复刻承诺。

## 检查结果
- lint：通过
- typecheck：通过
- test：15/15 通过
- production build：通过
- 浏览器：创建/完成/重开再完成/刷新，EXP 始终只奖励一次；未来任务与月历筛选通过；专注新增、修改、刷新、删除及范围统计通过，删除后热力图和总时长归零。
- 正式服务：Outlook start/callback/mail status 均 404；/api/news 为 200；RTP 来源正常，RR 的 403 单独展示，不影响其他源。
- 学习区只剩四个页签，History 可正常打开。正式浏览器运行检查未发现控制台错误。

## 主要变更文件
新增：dist/lib/progress/model.js、dist/components/mission/shared.js、dist/components/mission/mission.js、dist/styles/mission.css、dist/assets/mission-focus-original.png、server/config.mjs、tests/mission.test.mjs、tests/server.test.mjs。
更新：dist/app.js、dist/components/focus/focus.js、dist/components/training/training.js、dist/lib/training/translation.js、存储/初始数据/导航/像素图标相关文件、dist/types/models.d.ts、server.mjs、package.json、pnpm-lock.yaml、.env.example、README.md 与构建资源检查；build 是重新生成的发布副本。

EXISTING USER DATA PRESERVED: YES
BACKGROUND REGENERATED: NO
BACKGROUND CROPPED OR ZOOMED: NO
PAID APIs ADDED: NONE
OPENAI API ADDED: NO
OTHER MODULES REDESIGNED: NO
