# 研途 · 保研知识分享平台

面向保研同学的 C 端官网，以及面向运营团队的管理后台。官网展示产品、活动和邀请奖励，并支持活动报名与专属海报；后台负责产品、活动、内容推送、佣金和账号管理。

## 项目结构

| 目录                 | 说明                         | 技术栈               | 端口           |
| -------------------- | ---------------------------- | -------------------- | -------------- |
| `apps/website`       | 官网、报名页、专属海报       | Next.js 16           | `3000`         |
| `apps/web`           | 运营管理后台                 | Vite + React         | 开发 `5173`    |
| `apps/backend`       | 后端 API、文件上传、定时任务 | NestJS + TypeORM     | `3001`         |
| `docker-compose.yml` | MySQL、Redis                 | MySQL 8.4、Redis 7.4 | `3306`、`6379` |

生产端口：

```
官网 + 报名页：http://服务器IP:8888/
管理后台：http://服务器IP:8889/
后端 API：http://127.0.0.1:3001
```

## 构建命令

| 命令                 | 作用               | 产物                 |
| -------------------- | ------------------ | -------------------- |
| `pnpm build:backend` | 构建 NestJS 后端   | `apps/backend/dist`  |
| `pnpm build:web`     | 构建 Vite 管理后台 | `apps/web/dist`      |
| `pnpm build:website` | 构建 Next.js 官网  | `apps/website/.next` |
| `pnpm build`         | 依次构建三个项目   | 以上全部             |

## 本地部署

需要 Node.js 22、pnpm、Docker。

```
pnpm install

cp apps/backend/.env.example apps/backend/.env
cp apps/website/.env.example apps/website/.env.local
```

`apps/backend/.env` 确认数据库和 Redis 连接：

```
NODE_ENV=development
DATABASE_URL=mysql://chenjiang:chenjiang@127.0.0.1:3306/knowledge_share
REDIS_URL=redis://knowledge-share:chenjiang@127.0.0.1:6379/0
```

MySQL 和 Redis 的账号密码在 `docker-compose.yml` 中维护，修改后后端连接串需要同步。

启动依赖和数据库迁移：

```
docker compose up -d
docker compose ps

pnpm --filter @knowledge-share/backend migration:run
```

启动三端：

```
pnpm dev
```

```
管理后台：http://localhost:5173
官网：http://localhost:3000
后端：http://localhost:3001
健康检查：http://localhost:3001/health
```

本地空库首次启动会创建超级管理员 `admin / admin`。

## 生产部署

以下以 Linux 服务器、项目目录 `/srv/knowledge-share`、通过服务器 IP 访问为例。

### 1. 安装基础环境

```
dnf install -y git nginx

node -v
pnpm -v
pm2 -v
```

没有 Node.js、pnpm、PM2 时先安装，Node.js 使用 22。

### 2. 准备代码

```
cd /srv
git clone <仓库地址> knowledge-share
cd /srv/knowledge-share
pnpm install
```

### 3. 启动 MySQL 和 Redis

账号密码已经写在 `docker-compose.yml`，直接启动：

```
docker compose up -d
docker compose ps
```

Redis 开启了 ACL 认证，未认证访问会返回 `NOAUTH Authentication required.`。

如果 Docker Hub 拉取失败，先配置 `/etc/docker/daemon.json`：

```
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1ms.run",
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ]
}
```

```
systemctl daemon-reload
systemctl restart docker
docker compose up -d
```

### 4. 配置后端环境变量

```
cd /srv/knowledge-share/apps/backend
cp .env.example .env
vim .env
```

```
NODE_ENV=production

DATABASE_URL=mysql://chenjiang:chenjiang@127.0.0.1:3306/knowledge_share
REDIS_URL=redis://knowledge-share:chenjiang@127.0.0.1:6379/0
REDIS_PREFIX=knowledge-share

CORS_ORIGIN=http://服务器IP:8888,http://服务器IP:8889
PUBLIC_WEB_URL=http://服务器IP:8888

AUTH_BOOTSTRAP_PASSWORD=至少12位初始化密码
AUTH_JWT_SECRET=至少32位固定随机字符串
ACTIVITY_LINK_SECRET=至少32位固定随机字符串

AI_API_KEY=你的模型接口密钥
```

生成随机密钥：

```
openssl rand -hex 32
```

`AUTH_BOOTSTRAP_PASSWORD` 只在空库首次启动时用于创建管理员，已有管理员后不会覆盖原密码。

### 5. 配置官网环境变量

```
cd /srv/knowledge-share/apps/website
cp .env.example .env.local
vim .env.local
```

```
WEBSITE_API_BASE_URL=http://127.0.0.1:3001
NEXT_PUBLIC_SITE_URL=http://服务器IP:8888
```

### 6. 构建并执行迁移

```
cd /srv/knowledge-share
pnpm build:backend
pnpm build:web
pnpm build:website
pnpm --filter @knowledge-share/backend migration:run
```

构建产物：

```
apps/backend/dist      后端
apps/web/dist          管理后台静态文件
apps/website/.next     Next.js 官网
```

### 7. 使用 PM2 启动后端和官网

生产环境直接启动 Node 和 Next 进程，不使用 `pnpm` 外壳，避免出现“PM2 显示 online、实际 Node 已退出”的情况。

```bash
pm2 delete ks-backend ks-website 2>/dev/null || true

cd /srv/knowledge-share/apps/backend
pm2 start dist/main.js --name ks-backend

cd /srv/knowledge-share/apps/website
pm2 start node_modules/next/dist/bin/next --name ks-website

pm2 save
pm2 startup
```

在各自目录启动后，PM2 的工作目录就是该目录：后端能读取 `.env`，官网能读取 `.env.local`。

管理后台不需要单独启动进程，Nginx 直接读取 `apps/web/dist`。

### 8. 配置 Nginx

```
cp /srv/knowledge-share/deploy/nginx/knowledge-share.conf \
  /etc/nginx/conf.d/knowledge-share.conf

nginx -t
systemctl enable --now nginx
```

如果 Nginx 报 `bind() to 0.0.0.0:80 failed`，检查并移除其他监听 80 的默认站点：

```
grep -RIn "listen.*80" /etc/nginx/nginx.conf /etc/nginx/conf.d
```

### 9. 访问

阿里云安全组需要放行 `22`、`8888` 和 `8889`。管理后台对公网开放，建议限制 8889 的来源 IP。

```
官网：http://服务器IP:8888/
报名页：http://服务器IP:8888/join?activity=xxx
```

管理后台直接访问：

```text
http://服务器IP:8889/
```

### 10. 验证

```
curl http://127.0.0.1:3001/health
curl -I http://127.0.0.1:8888
curl -I http://127.0.0.1:8889
docker compose ps
pm2 status
```

## 更新部署

```
cd /srv/knowledge-share
git pull
pnpm install
pnpm build:backend
pnpm build:web
pnpm build:website
pnpm --filter @knowledge-share/backend migration:run

pm2 restart ks-backend --update-env
pm2 restart ks-website --update-env
```

只改管理后台时，执行 `pnpm build:web`，重新构建 `apps/web/dist` 后无需重启进程，刷新浏览器即可。修改 Nginx 配置后执行：

```
nginx -t && systemctl reload nginx
```
