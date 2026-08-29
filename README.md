# 鱼蛋家庭总看板（yudan-home）

家庭只读数据总览看板，将「鱼蛋小账本」「成长与疫苗记录」「宝宝消耗品库存」三个上游数据源聚合成一屏家庭仪表板。

> 全站**只读**：前端只调用聚合接口 `/api/home`，聚合层只调用上游 GET 接口，任何情况下都不会修改或写入数据。

生产地址：<https://yudan-home.ykn.cm>

---

## 功能特性

- **四板块看板**
  - **今天（TODAY）**：下次疫苗、下次儿保、当前体重变化、本月开销、补货提醒，一眼掌握今天需要知道的事。
  - **成长健康（GROWTH & CARE）**：体重趋势图 + 疫苗/儿保计划时间线。
  - **家庭账本（FAMILY LEDGER）**：近 6 个月收支曲线与月度账目详情、支出分类、最近交易明细。
  - **用品库存（BABY PANTRY）**：库存概览（总数/偏低/缺货/临期/过期）、补货清单、常用清单与全部商品。
- **只读聚合网关**：`api/home.js` 作为 Vercel Serverless Function 聚合多个上游数据源，前端只对接这一个接口。
- **单源失败自动降级**：某个数据源不可用时，其余板块照常显示，并明确提示「部分数据源暂未连接」。
- **API Key 仅存服务端**：上游鉴权密钥只保存在 Vercel 环境变量中，绝不下发到浏览器。
- **响应式布局**：手机与桌面自适应，顶部 Tab + 底部移动导航。
- **PWA 支持**：生产环境自动注册 Service Worker，可离线访问已缓存页面。
- **缓存优化**：聚合接口使用 `Cache-Control: s-maxage=120, stale-while-revalidate=600`，CDN 边缘缓存 2 分钟、后台异步刷新 10 分钟。
- **安全基线**：`/api/*` 响应携带 `X-Content-Type-Options: nosniff`；接口错误仅返回脱敏提示，内部细节只在服务端日志记录。

---

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端框架 | React 19 + Vite 8 |
| 样式 | Tailwind CSS 4（`@tailwindcss/vite`）+ 自定义 CSS 变量主题 |
| 图标 | lucide-react |
| 工具类 | class-variance-authority、clsx、tailwind-merge、tw-animate-css |
| 服务端 | Vercel Serverless Functions（Node.js，聚合上游 API） |
| 构建校验 | 自定义 React SSR smoke-render 脚本 + `vite build` |
| 包管理 | pnpm（`pnpm-lock.yaml`） |

> ⚠️ **Node 版本要求**：Vite 8 需要 `^20.19.0` 或 `>=22.12.0`（`package.json` 的 `engines` 已声明）。低于该版本构建会提示并建议升级。

---

## 项目结构

```
yudan-home/
├── api/
│   └── home.js                # 聚合网关（Vercel Serverless Function）
├── public/
│   ├── manifest.webmanifest   # PWA 清单
│   ├── sw.js                  # Service Worker
│   ├── brand/                 # 品牌图标
│   └── icons/
├── scripts/
│   └── smoke-render.mjs       # SSR 冒烟渲染校验（构建前置检查）
├── src/
│   ├── main.jsx               # 入口：数据拉取、板块分发、错误边界
│   ├── styles.css             # 全局样式（Tailwind + 主题变量）
│   ├── lib/
│   │   ├── data.js            # 空数据模型、板块元数据
│   │   └── utils.js           # 日期计算等工具
│   ├── hooks/
│   │   └── useMediaQuery.js   # 响应式断点监听
│   └── components/
│       ├── TopBar.jsx         # 顶部导航 + 同步状态
│       ├── MobileNav.jsx      # 底部移动导航
│       ├── SourceStatus.jsx   # 数据源连接状态
│       ├── LoadingView.jsx    # 加载视图
│       ├── today/             # 今天板块
│       ├── growth/            # 成长健康板块
│       ├── ledger/            # 家庭账本板块
│       └── pantry/            # 用品库存板块
├── vite.config.js             # Vite + 本地开发 API 代理
├── vercel.json                # Vercel 部署配置
├── .env.example               # 环境变量示例
├── jsconfig.json
├── components.json
└── package.json
```

---

## 快速开始

### 1. 环境要求

- Node.js `^20.19.0 || >=22.12.0`
- pnpm（推荐；无 pnpm 时可用 npm 代替，但以 `pnpm-lock.yaml` 为准的 CI 仍需启用 corepack）

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

复制 `.env.example` 为本地环境变量文件：

```bash
cp .env.example .env.local    # 本地开发
# 或
cp .env.example .env          # 本地开发（Vite 会加载）
```

在 Vercel 中则配置到 **Project → Settings → Environment Variables**。

### 4. 本地开发

```bash
pnpm dev
```

Vite 开发服务器启动后，`/api/home` 由 `vite.config.js` 中的 `dev-api-home` 插件转发到真实的 `api/home.js` handler，与生产行为一致。

- **未配置 API Key**：公开接口正常聚合，需鉴权的接口（成长/儿保/库存关注批次）返回未连接状态，页面会显示「部分数据源暂未连接」。
- **完整模式**：配置以下全部环境变量后即为完整数据模式。

### 5. 构建与校验

```bash
pnpm check    # = SSR 冒烟渲染 + 生产构建
pnpm build    # 仅生产构建
pnpm preview  # 本地预览构建产物
```

`pnpm check` 会先执行 `scripts/smoke-render.mjs`，用 Vite SSR 渲染 `<App>` 并断言输出包含 `shell` 标识，确保应用能无头渲染通过后再执行正式构建。

---

## 环境变量

| 变量 | 必填 | 说明 | 默认值 |
| --- | --- | --- | --- |
| `YUDAN_LOG_BASE_URL` | 否 | 鱼蛋小账本服务基地址 | `https://cost.ykn.cm` |
| `YUDAN_LOG_API_KEY` | 否* | 账本成长/儿保接口鉴权 Key（Bearer Token） | 空（不携带） |
| `YUDAN_PANTRY_BASE_URL` | 否 | 宝宝用品库存服务基地址 | `https://wupin.ykn.cm` |
| `YUDAN_PANTRY_API_KEY` | 否* | 库存关注批次接口鉴权 Key | 空（不携带） |

> \* 为可获得完整数据需要配置；未配置时对应数据源标记为 `requiresKey` 降级，页面正常显示但不包含该源数据。

⚠️ 这些变量**只允许存在于服务端**（Vercel 环境变量、`.env`），前端通过 `import.meta.env` 暴露它们将泄露密钥。前端请勿引用任何 `YUDAN_*` 变量。

---

## 上游接口聚合

`api/home.js` 并行请求以下上游接口并做字段归一化：

| 上游服务 | 接口 | 用途 |
| --- | --- | --- |
| 鱼蛋小账本 | `/api/monthly?year=&month=`（近 6 个月并发） | 月度收支、分类占比 |
| 鱼蛋小账本 | `/api/list?limit=8` | 最近交易明细 |
| 鱼蛋小账本 | `/api/yudan`（需 Key） | 体重记录 |
| 鱼蛋小账本 | `/api/yudan/vaccines`（需 Key） | 疫苗计划 |
| 鱼蛋小账本 | `/api/yudan/care`（需 Key） | 儿保里程碑/生日 |
| 宝宝消耗品 | `/api/dashboard` | 库存统计概览 |
| 宝宝消耗品 | `/api/products?active=1` | 全部在售商品 |
| 宝宝消耗品 | `/api/batches?filter=attention`（需 Key） | 临期/关注批次 |

**聚合行为**

- 所有上游请求带 8 秒超时（`AbortSignal.timeout(8000)`），超时或失败仅影响对应数据源。
- 响应统一为 `{ meta, ledger, growth, vaccines, care, pantry }` 结构。
- `meta.mode`：`live`（全部在线）/ `partial`（部分降级）。
- `meta.sources`：每个数据源的 `ok`/`partial`/`requiresKey` 状态，前端据此渲染状态栏与提示。
- 上游字段命名差异（snake_case / camelCase、嵌套结构等）统一在 `transactionsOf`、`weightsOf`、`vaccinesOf`、`careOf`、`pantryOf` 中归一化。

---

## 降级策略

| 场景 | 行为 |
| --- | --- |
| 单个数据源失败 | 仅该板块显示为空/部分数据，其余板块正常，顶部提示「部分数据源暂未连接」 |
| 全部数据源失败 | 页面提示同步失败，**不会**用演示数据冒充真实记录 |
| 上游超时 | 8 秒超时截断，视为该源不可用 |
| 首次加载 | `meta.mode = loading`，显示加载视图 |
| 接口异常 | 返回 `{ ok: false }` 脱敏信息，详情只写入服务端日志 |

---

## 部署（Vercel）

仓库已包含 `vercel.json`：

```json
{
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "functions": { "api/home.js": { "maxDuration": 10 } },
  "headers": [
    { "source": "/api/(.*)", "headers": [{ "key": "X-Content-Type-Options", "value": "nosniff" }] }
  ]
}
```

- **构建**：`pnpm build`（框架自动识别 Vite，产物输出到 `dist`）。
- **Serverless 函数**：`api/home.js` 上限执行时长 10 秒（并行聚合多个上游）。
- **安全头**：所有 `/api/*` 响应自动附加 `nosniff`。
- **环境变量**：在 Vercel 控制台按上表配置。

本地开发时 `vite.config.js` 通过 `dev-api-home` 插件复用同一个 `api/home.js` handler，保证开发/生产行为一致。

---

## 常见问题

**Q1：页面显示「部分数据源暂未连接」？**
说明至少一个上游数据源不可用或缺少对应 API Key。可点击顶部刷新按钮重试，或在「数据源状态」栏查看具体是哪个源未连接。

**Q2：构建提示 Node.js 版本过低？**
Vite 8 要求 Node `^20.19.0 || >=22.12.0`。请升级 Node.js，或使用 nvm/Volta/n 指定满足要求的版本。

**Q3：为什么用 npm 安装也能跑？**
可以，但 `pnpm-lock.yaml` 的锁文件只会由 pnpm 使用。CI/部署请保持使用 pnpm，避免混装导致目录结构与锁文件不一致。

**Q4：API Key 会不会泄露到浏览器？**
不会。`YUDAN_*` 变量仅存在于服务端环境，`api/home.js` 在 Vercel 服务端读取并携带请求头，浏览器端拿不到任何密钥。

---

## License

Private · 私有项目