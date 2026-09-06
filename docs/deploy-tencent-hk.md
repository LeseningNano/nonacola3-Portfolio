# 部署 Runbook — 迁移到腾讯云香港（轻量应用服务器）

- 目标：站点脱离 Vercel 托管，在中国大陆可稳定访问，短期重点保证 `https://你的域名/portfolio`。
- 日期：2026-09-07
- 配套文件：本仓库 `deploy/` 目录（nginx 模板、systemd 模板、env 模板、更新脚本）。

## 0. 架构与迁移边界

```
大陆用户 ──DNS(A记录)──> 腾讯云香港轻量服务器
                          ├─ Nginx (:443, TLS) ──> next start (127.0.0.1:3000, systemd)
                          └─ 构建产物由 GitHub public 仓库 clone
数据库：Neon Postgres（新加坡区）—— 不动，香港→新加坡延迟低
素材：Vercel Blob（封面/视频）—— 短期不动，长期迁 COS（见 §7）
```

明确不迁移的：数据库、已有 Blob 素材。短期只把 **Web 服务** 挪到香港。

关键事实（已核实）：
- 仓库为 public，服务器可直接 `git clone`，无需 deploy key。
- Next 16 要求 **Node ≥ 20.9**（用 Node 22 LTS）。
- 环境变量仅 5 个 + next-auth 自托管需要的 2 个（见 `deploy/.env.production.example`）。
- `next start` 自托管：图片优化零配置；App Router 流式响应需 Nginx 关闭缓冲（模板已配）。
- 香港服务器**不需要 ICP 备案**；域名解析 A 记录到香港 IP 即可。

## 1. 需要你操作的前置事项

1. **购买服务器**：腾讯云轻量应用服务器，地域 **中国香港**，镜像 **Ubuntu Server 24.04 LTS**，2核2G 起步即可。购买后在防火墙放行 `22 / 80 / 443`。
2. **域名**：注册一个自有域名（如未注册）。解析一条 `A 记录` → 服务器公网 IP（`@` 和 `www` 按需）。国内注册商也可解析到香港，无需备案。
3. 记下服务器公网 IP 和 SSH 登录方式。

## 2. 服务器初始化（SSH 上去后逐段粘贴）

```bash
# 2.1 基础工具
sudo apt update && sudo apt install -y curl git nginx

# 2.2 加 4G swap（2G 内存跑 Turbopack 构建必须，否则易 OOM）
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 2.3 Node 22 LTS（NodeSource，装到 /usr/bin，systemd 可直接引用）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # 应 >= 22.x
```

## 3. 部署应用

```bash
sudo mkdir -p /opt/nonacola3 && sudo chown $USER /opt/nonacola3
cd /opt/nonacola3
git clone https://github.com/LeseningNano/nonacola3-Portfolio.git .

# 3.1 生产环境变量
cp deploy/.env.production.example .env
nano .env        # 填入真实值；DATABASE_URL 沿用 Neon 生产库
chmod 600 .env

# 3.2 安装 + 构建（build 会执行 prisma migrate deploy → 对 Neon 生产库做幂等校验，正常应为 no-op）
npm ci
npm run build
```

> ⚠️ `npm run build` = `prisma migrate deploy && next build`。务必先确认 `.env` 里 `DATABASE_URL` 指向正确的库再构建，避免对错误数据库执行迁移（codex 交接时也特别强调过这点）。

## 4. systemd 常驻 + Nginx + HTTPS

```bash
# 4.1 服务单元
sudo cp deploy/nonacola3.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now nonacola3
curl -s http://127.0.0.1:3000/portfolio -o /dev/null -w '%{http_code}\n'   # 应 200

# 4.2 Nginx 站点
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/nonacola3
sudo nano /etc/nginx/sites-available/nonacola3   # 把 your-domain.com 全部替换为实际域名
sudo ln -s /etc/nginx/sites-available/nonacola3 /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
# 此时先 curl -H 'Host: 你的域名' http://127.0.0.1/ 验证反代通了

# 4.3 HTTPS（Let's Encrypt；等域名解析生效后再执行）
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名        # 按提示选 redirect
sudo systemctl status certbot.timer    # 自动续期已内置
```

## 5. 验证清单（DNS 生效后）

- [ ] `https://域名/portfolio` 桌面 + 手机浏览器打开，6 个精选作品 + 邮箱按钮正常
- [ ] `https://域名/` 首页正常（hero 视频来自 Vercel Blob，大陆访问慢是已知情况，不影响 portfolio）
- [ ] `/login` 能登录，`/dashboard` 能进、能发布文章（验证 next-auth + `AUTH_TRUST_HOST`）
- [ ] 后台传一张封面图成功（验证 `BLOB_READ_WRITE_TOKEN`）
- [ ] 用大陆手机流量（非 WiFi）实测 portfolio 打开速度
- [ ] `https://域名/news/...` 文章页、`https://域名/works/...` 详情页正常

## 6. 日常更新流程

本地改完照常 `git push`，然后 SSH 到服务器：

```bash
cd /opt/nonacola3 && bash deploy/deploy.sh
```

（脚本内容：`git pull` → `npm ci` → `npm run build` → `systemctl restart`，中断可安全重跑。）

## 7. 后续路线（按 codex 交接整理）

1. **素材迁 COS（建议香港地域）**：逐步把 Vercel Blob 的视频/图片迁到腾讯云 COS，更新后台作品记录里的链接。`/portfolio` 页面不加载任何 Blob 资源，天然不受影响；首页/封面迁完后大陆访问全面提升。
2. **大陆 CDN + ICP 备案**：若需要更稳的大陆访问，再办理 ICP 备案并把站点/CDN 迁到大陆节点。备案要求网站底部有备案号等，到时再调整。
3. 简历里的作品链接改为 `https://域名/portfolio`。

## 8. 常见问题

| 现象 | 原因/处理 |
| --- | --- |
| 登录报 `UntrustedHost` | `.env` 缺 `AUTH_TRUST_HOST=true`（或 Nginx 没传 `X-Forwarded-Proto/Host`，见模板） |
| `next build` 被 OOM kill | swap 未生效：`free -h` 检查 §2.2 |
| 构建时下载字体失败 | `next/font/google` 在构建期访问 Google Fonts；香港节点可直连。若将来在大陆构建失败，需改为本地字体文件 |
| 502 | `systemctl status nonacola3` 看日志；`journalctl -u nonacola3 -n 50` |
| 首次打开慢 | Neon 免费库有冷启动（数百 ms）；属正常，可忽略或后续升级 |
| 想改端口 | `deploy/nonacola3.service` 加 `Environment=PORT=3000`，同步改 nginx `proxy_pass` |

## 9. 安全清单

- [ ] SSH 改用密钥登录、禁密码（腾讯云控制台可一键配置）
- [ ] `sudo ufw allow 22,80,443/tcp && sudo ufw enable`
- [ ] `.env` 权限 600；绝不提交仓库（`.gitignore` 已覆盖）
- [ ] 后台 `/dashboard` 与 `/api/posts` 写操作已有鉴权；保持 `ADMIN_PASSWORD` 强密码
