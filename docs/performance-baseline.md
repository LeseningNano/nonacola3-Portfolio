# 性能测量基线

本文件记录性能优化前的初始观察值，以及可重复执行的只读测量方法。它不代表正式性能预算，也不触发任何缓存、媒体或数据库配置变更。

## 初始单次观察值

测量目标为生产站点 `https://www.nonacola3.com`。以下均为单次样本，受网络路径、CDN 命中、运行时冷启动与测量地点影响，不能用于判断趋势或回归。

| 测量项 | 初始值 |
| --- | ---: |
| 首页 TTFB | 543 ms |
| 一篇 News 详情 TTFB | 1,022 ms |
| `/api/hero` TTFB | 3,726 ms |
| Hero 文件大小 | 8,462,314 bytes（约 8.07 MiB） |
| Hero 文件 HEAD 响应时间 | 412 ms |
| Neon 首次连续三次 `count` | 1,920 ms |
| Neon 后续连续三次 `count` | 108–109 ms |

数据库数值是应用侧只读查询总耗时，不是浏览器资源计时含义下的 TTFB。首页的 543 ms 也表明该次访问可能已经命中应用缓存，因此不能据此断言每次首页都被 Neon 查询阻塞。

## 可重复测量

使用 Node 的内置 `fetch` 运行脚本；不需要安装依赖，也不会写入生产环境。News 详情路径必须明确指向一篇已发布文章，避免把 404 当作页面表现。

```powershell
node scripts/measure-performance-baseline.mjs --news-path /news/<published-post-id> --samples 7
```

脚本会对首页、指定 News 详情和 `/api/hero` 各取多轮样本，输出每轮状态、TTFB、响应大小以及中位数/P95；随后从 Hero API 的公开响应读取视频 URL，以 `HEAD` 请求记录文件大小和响应时间。输出不包含文章内容、Hero URL、凭据或数据库结果。

默认站点可通过 `--base-url` 或 `PERF_BASE_URL` 覆盖。`--samples` 允许范围为 1–20，推荐至少 7 个样本；应将冷路径与紧接着的热路径分开记录，并以中位数和 P95 对比，而非使用单次值。

### 可选数据库只读测量

仅在本机已安全配置 `POSTGRES_URL_NON_POOLING`、`DATABASE_URL_UNPOOLED` 或 `DATABASE_URL` 时执行：

```powershell
node scripts/measure-performance-baseline.mjs --news-path /news/<published-post-id> --database
```

这会执行三次 `Video.count()`，不写入、不迁移、不输出连接字符串、凭据、记录内容或数量。若没有本地环境变量，脚本会停止而不尝试连接。为避免无意影响生产数据库，不要在生产部署环境中运行此选项。

## 2026-09-09 重复测量结果

从当前开发机对生产域名执行 5 轮只读 HTTP 测量：

| 测量项 | 中位数 | P95 | 响应大小 |
| --- | ---: | ---: | ---: |
| 首页 | 402 ms | 720 ms | 11,141 bytes |
| News 详情 | 797 ms | 884 ms | 18,629 bytes |
| `/api/hero` | 804 ms | 937 ms | 173 bytes |

同次测量中，Hero 文件 HEAD 响应为 417 ms，文件大小仍为 8,462,314 bytes。所有 HTTP 样本均返回 200。

数据库只读模式也已单独验证：同一进程内三次 `Video.count()` 分别为 941 ms、109 ms 和 109 ms。这进一步显示首次连接与复用连接之间存在明显差异，但仍不能仅凭少量样本把页面延迟完全归因于数据库。

## 当前结论边界

- Hero 文件体积与 `preload="auto"` 值得后续关注，但本阶段不改变其加载方式。
- `/api/hero` 的初始慢样本可能包含数据库或运行时冷启动；需要多轮冷/热测量后再归因。
- 该脚本测量 HTTP 首字节/完整响应读取的近似值；DNS、连接、DOMContentLoaded、LCP、首段可播放耗时和设备尺寸截图需要浏览器及真实网络环境补充，未在本批次自动化。
