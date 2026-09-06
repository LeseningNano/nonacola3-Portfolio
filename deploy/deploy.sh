#!/usr/bin/env bash
# 服务器端更新脚本 — 拉取最新代码、重建并重启服务
# 用法：在服务器上进入仓库目录后执行  bash deploy/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> git pull"
git pull --ff-only

echo "==> 安装依赖"
npm ci

echo "==> 构建（包含 prisma migrate deploy，确认 .env 的 DATABASE_URL 指向正确）"
npm run build

echo "==> 重启服务"
sudo systemctl restart nonacola3
sleep 2
systemctl --no-pager --lines=5 status nonacola3 || true
