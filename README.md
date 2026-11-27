# 研途 · 保研知识分享平台

包含面向保研同学的 C 端官网，以及面向运营团队的管理后台。围绕产品、活动、内容、邀请和账号，提供完整的展示与运营能力。

## 功能总览

| 模块       | 页面                                                                              | 主要功能                                                       |
| ---------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| C 端官网   | `/`、`/products`、`/products/[id]`、`/activities`、`/activities/[id]`、`/rewards` | 品牌首页、产品列表与详情、活动列表与详情、邀请奖励、中文错误页 |
| 数据看板   | `/`                                                                               | 运营指标、累计总佣金、活动参加趋势、佣金明细                   |
| 活动管理   | `/activities`                                                                     | 活动增删改查、活动概要 AI 生成、活动回顾、报名人数、活动海报   |
| 内容推送   | `/content-push`                                                                   | 推送增删改查、富文本编辑、AI 初稿、立即发布/定时/草稿          |
| 产品列表   | `/products`                                                                       | 产品增删改查、缩略图、详情介绍                                 |
| 佣金结算   | `/commissions`                                                                    | 按邀请人汇总一级邀请人数，邀请 0 人的用户不展示                |
| 用户管理   | `/users`                                                                          | 管理员账号、邀请注册、启用/停用                                |
| 公开报名页 | `/join`                                                                           | 活动详情、报名、报名成功、专属邀请海报                         |

## C 端官网

**页面清单**

| 页面     | 路由               | 主要内容                                         |
| -------- | ------------------ | ------------------------------------------------ |
| 首页     | `/`                | 品牌主视觉、保研准备阶段、主推产品、最新活动回顾 |
| 产品列表 | `/products`        | 产品卡片、缩略图、简介、分页和活动入口           |
| 产品详情 | `/products/[id]`   | 产品封面、简介、完整富文本介绍和活动入口         |
| 活动列表 | `/activities`      | 已结束活动、封面、日期、分享人、报名人数和分页   |
| 活动详情 | `/activities/[id]` | 活动封面、日期、分享人、报名人数和活动回顾正文   |
| 邀请奖励 | `/rewards`         | 邀请人、脱敏手机号、邀请人数和获得佣金           |
| 404      | 任意无效路由       | 中文未找到页，提供回首页和查看产品入口           |
| 500      | 页面运行时错误     | 中文错误页，提供重新加载和回首页入口             |

顶部导航包含“首页 / 产品 / 活动 / 邀请奖励”，页脚包含“产品 / 活动 / 邀请奖励”三个入口。移动端顶部导航折叠为菜单按钮，点击后从右侧展开导航抽屉。页面数据和元数据统一由 `apps/website/src/lib/content.ts` 与 `apps/website/src/app` 下的路由文件维护。

**首页**

- 以品牌主视觉展示“把保研做得更清楚”的核心主张。
- 展示定位、材料、面试三个准备阶段。
- 最多推荐四件研途产品，并突出展示主推产品。
- 最多展示四条已结束活动，直接进入活动回顾；没有已结束活动时展示整理中提示。

**产品展示**

- 产品列表以卡片形式展示缩略图、名称和简介，并提供分页。
- 主推产品使用大尺寸卡片展示。
- 点击产品进入详情页，展示产品简介和完整富文本介绍。

**活动展示**

- C 端只请求已结束活动。管理员填写活动回顾后，活动自动变为已结束并出现在官网；未开始的活动不会露出。
- 活动列表按“历史活动”展示并提供分页；即使活动日期在未来，只要已填写回顾也归入历史活动。
- 每个活动展示封面、日期、分享人、报名人数、活动标题和概要。
- 活动封面优先使用后台上传的缩略图，其次取活动 Markdown 中的第一张图片，最后使用统一占位图；产品没有缩略图时同样使用占位图。
- 活动卡片统一显示“已结束”状态。
- 点击活动进入详情页，展示活动日期、分享人、报名人数和活动内容。

**邀请奖励**

- 页面 `/rewards` 展示邀请人、脱敏手机号、邀请人数和获得佣金。
- 数据来自公开接口，按佣金和邀请人数倒序排列。
- 不展示被邀请人明细、金额基数或发放状态。

**通用体验**

- 桌面端、平板和移动端均有独立布局。
- 移动端顶部导航折叠为菜单按钮，点击后从右侧展开抽屉；支持点击遮罩、关闭按钮和 ESC 收起，收起后焦点回到菜单按钮。
- 手机端产品详情和活动详情会压缩封面高度，活动详情封面为 16:6，产品详情封面为 16:8.5，减少首屏占用。
- 支持滚动进入动画、悬停反馈和无障碍减少动态效果设置。
- 页面包含标题、描述、关键词和分享信息等搜索引擎元数据。
- 无效产品和活动地址展示中文 404 页面；页面运行时错误展示中文 500 页面，并支持重新加载。

## 账号与权限

- 使用用户名和密码登录，登录后进入运营后台。
- 支持通过邀请链接注册新管理员，邀请链接有有效期且只能使用一次。
- 管理员分为超级管理员和普通管理员。
- 只有超级管理员可以进入用户管理，查看账号、生成邀请链接、启用或停用账号。
- 账号被停用后无法继续登录；重新启用后可以恢复使用。
- 左下角展示当前登录用户，点击后打开用户菜单。
- 退出登录在同一浮层内二次确认，不会直接退出。

## 数据看板

- 展示四个核心运营指标：
  - 活动次数
  - 报名人数
  - 内容推送次数
  - 总佣金（全部邀请记录的累计佣金）
- 支持按统计周期筛选：
  - 本周
  - 上周
  - 自定义日期范围
- 支持按单个活动筛选，或查看全部活动。
- 展示按日统计的“活动参加人数”趋势柱状图。
- 展示佣金明细表格：邀请人、一级被邀请人、活动、邀请时间、金额、佣金和发放状态。
- 数据加载中、加载失败、暂无数据、日期范围不合法时都有对应提示和重试入口。

## 活动管理

**列表**

- 支持按活动标题、分享人、活动日期筛选。
- 展示活动标题、分享人、活动日期、状态、活动报名人数和操作。
- 状态由是否填写活动回顾自动决定：填写回顾为“已结束”，清空回顾回到“未开始”。
- 点击活动标题可以查看活动详情。
- 列表分页展示，并显示总条数。
- 无数据、筛选无结果、加载失败时分别展示对应状态。

**新增与编辑**

- 新增和编辑共用弹窗。
- 可填写：
  - 活动缩略图（16:9，可不上传）
  - 活动标题
  - 分享人
  - 活动日期
  - 活动概要
- 活动概要为必填，最多 100 字。
- 编辑时会自动回填已有内容。
- 保存成功后刷新列表，并提示“活动已添加/已更新”。

**AI 生成活动概要**

- 在编辑弹窗中点击“AI 生成摘要”打开生成浮层。
- 只使用活动标题和当前已填写的活动概要，生成 50–100 字的活动概要。
- 活动概要为空时，仅根据活动标题生成。
- 生成过程中实时显示正在生成的活动概要。
- 生成完成后自动填入活动概要，仍可继续手动修改。

**活动回顾**

- 每场活动可单独录入活动回顾，列表操作为“写回顾 / 编辑回顾”。
- 回顾正文就是该活动的富文本内容，不单独维护素材与正文两套数据。
- 支持浏览器语音输入，识别结果直接进入富文本，可继续手动修改。
- AI 可将当前正文整理成包含段落、小标题、要点和金句的结构化回顾，并覆盖到富文本中。
- 保存后随活动内容一起存储，下次打开自动回填，并展示在活动详情和官网活动详情中。
- 回顾非空时活动状态自动置为“已结束”，官网随即可见；清空回顾会回到“未开始”，官网不再展示。
- 同一份内容会同时生成 Markdown 派生字段，供导出、检索和外部接口使用；官网活动详情直接按 Markdown 渲染。

**活动操作**

- 每场活动可生成活动海报。
- 海报包含活动标题、分享人、日期、活动概要和报名二维码。
- 海报弹窗内可查看和修改活动概要。
- 支持编辑活动。
- 支持删除活动，删除前需要二次确认。

## 内容推送

**列表**

- 支持按关键词、状态、发送日期筛选。
- 状态包括：
  - 草稿
  - 定时发送
  - 已发送
  - 发送失败
- 展示推送标题、摘要、发送时间、状态和操作。
- 每页展示 5 条，使用分页组件切换页码。
- 桌面端为表格，移动端为卡片列表。

**新建与编辑**

- 新建和编辑共用同一个弹窗。
- 可填写：
  - 标题
  - 摘要
  - 富文本正文
  - 发送时间
- 标题必填，正文不能为空。
- 摘要为空时，自动截取正文前 86 字作为摘要。
- 正文支持标题、段落、列表、引用、加粗、斜体、下划线、删除线、链接、撤销和重做。
- 正文同时保存 JSON 块结构和派生 Markdown，供富文本回填、导出和检索使用。
- 编辑器有最大高度，内容超出后在编辑器内部滚动。
- 发送时间留空表示立即发布；选择未来时间则进入定时状态。
- 支持保存为草稿、保存并发布、保存并定时、保存修改。

**AI 生成初稿**

- 编辑弹窗内提供“AI 生成初稿”入口。
- AI 生成弹窗支持填写：
  - 标题
  - 内容标签
  - 提示词
- AI 弹窗中的标题与主表单实时同步。
- 标题已填写时保留原标题；标题为空时由 AI 自动拟题。
- 生成过程中展示已接收的字符数。
- 生成完成后自动填入标题、摘要和富文本正文。
- 生成结果仍可继续手动修改。

**推送操作**

- 支持编辑正文。
- 发送失败的记录支持“重新发送”。
- 支持删除推送，删除前需要二次确认。
- 定时任务到点后自动把记录切换为“已发送”，并记录实际发送时间。
- 当前版本的外部渠道投递不在功能范围内。

## 产品列表

**产品管理**

- 以卡片形式展示产品列表。
- 每个产品包含：
  - 产品名称
  - 缩略图
  - 富文本详情介绍
- 支持新增产品。
- 产品详情同时保存 BlockNote JSON（`document`）与派生 Markdown（`content_markdown`）：编辑回填用 JSON，官网与接口用 Markdown。
- 支持编辑产品，编辑时回填名称、缩略图和详情。
- 支持删除产品，删除前需要二次确认。
- 未上传缩略图时，卡片和详情会自动使用统一占位图。

## 图片上传

- 管理端活动、产品缩略图统一先调用 `POST /uploads/image` 上传，再保存返回的图片地址。
- 接口使用 `multipart/form-data`，字段名为 `file`，只支持 JPG、PNG、WebP，单文件不超过 8MB。
- 上传文件存放在 `apps/backend/uploads/YYYY/MM/`，通过 `/uploads/*` 公开访问；接口返回相对路径。
- 管理端 Vite 和 C 端 Next 都已代理 `/uploads`，数据库只保存相对路径，换域名或部署环境不需要改历史数据。
- 后端通过 `ImageStorage` 抽象选择存储：默认 `IMAGE_STORAGE=local`；切到华为云 OBS 时设置 `IMAGE_STORAGE=obs`，并补充 `OBS_ENDPOINT`、`OBS_BUCKET`、`OBS_ACCESS_KEY_ID`、`OBS_SECRET_ACCESS_KEY`。
- OBS 模式需先安装 `esdk-obs-nodejs`；bucket 允许公共读，或配置 `OBS_PUBLIC_BASE_URL` 指向 CDN。上传文件 Key 统一为 `uploads/YYYY/MM/uuid.ext`。
- 富文本编辑器支持直接粘贴图片、拖入图片或点击工具栏“插入图片”，都会走同一个上传接口。

## 首页佣金明细

- 数据看板以树形表格展示邀请人及其一级被邀请人。
- 展示活动、邀请时间、金额、佣金和发放状态。
- 纯展示，不提供金额输入和发放状态切换；编辑操作统一在“佣金结算”中完成。

## 佣金结算

- 按邀请人手机号汇总所有活动的一级邀请关系。
- 只展示邀请人数大于 0 的用户，邀请 0 人的用户不进入表格。
- 使用树形表格：邀请人为父行，一级被邀请人为子行，可展开或收起。
- 数据库 `rate_bps` 直接保存百分比数值（如 `5.00` 表示 5%），页面按百分数展示。
- 子行展示被邀请人、活动、邀请时间、金额输入框和单笔佣金。
- 被邀请人通过专属二维码报名后，金额默认取活动价格，之后仍可在输入框中手动调整。
- 在每条被邀请人记录上填写金额，佣金由后端按顶部比例计算，不在前端计算。
- 父行汇总该邀请人的金额合计和佣金合计，佣金随子行金额实时更新。
- 父行展示完整手机号和发放状态；点击状态列的 Switch 可切换“已发放 / 未发放”。
- 发放状态按邀请人记录，标记已发放时保存发放时间和当时的佣金比例，关闭后清空时间与比例快照。
- 已发放记录锁定金额和佣金，修改顶部比例只影响未发放记录；已发放后金额输入框禁用。
- 仅一级邀请计入佣金，二级邀请不进入结算。
- 标题右侧提供佣金比例数字输入框，默认 5%，失焦或回车后自动保存。

## 公开报名与海报

**报名页**

- 通过活动邀请链接进入公开报名页。
- 展示活动标题、分享人、活动日期、活动概要和邀请人。
- 报名时填写姓名和手机号。
- 报名成功后展示成功状态，并提示已成功报名。
- 链接无效、报名失败等情况有对应提示。

**专属邀请海报**

- 报名成功后可以生成个人专属海报。
- 海报会带上报名人的姓名。
- 其他人扫描海报二维码后可以继续报名。
- 支持下载海报用于分享。

## 用户管理

- 仅超级管理员可访问。
- 展示管理员账号列表：
  - 用户名
  - 角色
  - 状态
- 支持生成邀请链接，复制后发给新管理员注册。
- 支持启用或停用账号。
- 停用和启用操作后有结果提示。
- 邀请注册成功后，新账号默认为普通管理员。

## 通用交互

- 删除操作统一使用浮层二次确认，避免误删。
- 主要操作结果使用右上角 Toast 提示。
- 列表支持加载中、加载失败、空数据、筛选无结果等状态。
- 表单提交时显示保存中状态，避免重复提交。
- 桌面端使用表格/多列布局；移动端按页面切换为卡片或精简表格。
- 活动、内容推送、产品、佣金结算均支持移动端访问。

## 启动与部署

### 技术栈与服务

| 项目      | 目录           | 技术栈                         | 开发端口 | 生产运行方式                  |
| --------- | -------------- | ------------------------------ | -------- | ----------------------------- |
| 管理后台  | `apps/web`     | Vite + React + TanStack Router | `5173`   | 构建为 `dist`，Nginx 静态托管 |
| C 端官网  | `apps/website` | Next.js                        | `3000`   | `next build` + `next start`   |
| 后端      | `apps/backend` | NestJS + TypeORM + MySQL       | `3001`   | 构建为 `dist`，Node 运行      |
| 数据库    | Docker         | MySQL 8.4                      | `3306`   | Docker                        |
| 缓存/队列 | Docker         | Redis 7.4                      | `6379`   | Docker                        |

运行要求：

- Node.js `>= 22`
- pnpm `10.25.0`
- Docker + Docker Compose
- 生产环境额外需要 PM2、Nginx

### 部署端口约定

当前生产约定：

```text
官网 + 报名页：对外 8888  → Nginx → 127.0.0.1:3000
管理后台：    127.0.0.1:8080 → Nginx 静态读取 apps/web/dist
后端 API：    127.0.0.1:3001
MySQL：       127.0.0.1:3306
Redis：       127.0.0.1:6379
```

公网安全组只需要放行：

```text
22    SSH，建议限制为自己的固定 IP
8888  官网和报名页
```

管理后台默认不对外暴露，通过 SSH 隧道访问：

```bash
ssh -L 8080:127.0.0.1:8080 root@服务器IP
```

浏览器打开 `http://127.0.0.1:8080`。

### 本地启动

#### 1. 安装依赖

```bash
pnpm install
```

#### 2. 准备环境变量

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/website/.env.example apps/website/.env.local
```

本地默认关键配置：

```bash
# apps/backend/.env
NODE_ENV=development
DATABASE_URL=mysql://chenjiang:chenjiang@127.0.0.1:3306/knowledge_share
REDIS_URL=redis://knowledge-share:chenjiang@127.0.0.1:6379/0
```

MySQL 和 Redis 的容器账号密码直接写在 `docker-compose.yml` 的 `environment` 和 Redis ACL 启动命令里。修改 Redis 密码时，要同步修改 `docker-compose.yml` 和 `apps/backend/.env` 的 `REDIS_URL`，再重建 Redis、重启后端。

```bash
# apps/website/.env.local
WEBSITE_API_BASE_URL=http://127.0.0.1:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

本地首次启动会创建超级管理员 `admin / admin`。

#### 3. 启动 MySQL 和 Redis

```bash
docker compose up -d
docker compose ps
```

#### 4. 执行数据库迁移

```bash
pnpm --filter @knowledge-share/backend migration:run
```

#### 5. 启动三个项目

```bash
pnpm dev
```

启动后：

```text
管理后台：http://localhost:5173
C 端官网：http://localhost:3000
后端：    http://localhost:3001
健康检查：http://localhost:3001/health
```

也可以单独启动：

```bash
pnpm dev:web
pnpm dev:website
pnpm dev:backend
```

### 生产部署（阿里云 Linux）

以下以项目目录 `/srv/knowledge-share`、服务器 IP 访问、暂不使用域名为例。

#### 1. 安装基础环境

```bash
dnf install -y git nginx
```

安装 Node.js 22、pnpm、PM2：

```bash
node -v
pnpm -v
pm2 -v
```

没有时按项目根目录 `package.json` 的 `engines` 与 `packageManager` 版本安装。

#### 2. 准备代码

```bash
cd /srv
git clone <仓库地址> knowledge-share
cd /srv/knowledge-share
```

如果服务器访问 GitHub 不稳定，可以在本地执行：

```bash
git bundle create knowledge-share.bundle --all
scp knowledge-share.bundle root@服务器IP:/srv/
```

服务器上：

```bash
cd /srv
git clone knowledge-share.bundle knowledge-share
```

#### 3. 配置 Docker 镜像加速

国内服务器直接拉取 Docker Hub 容易失败。先配置 `/etc/docker/daemon.json`：

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1ms.run",
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ]
}
```

如果已有 `daemon.json`，只合并 `registry-mirrors`，不要覆盖其他配置。

```bash
systemctl daemon-reload
systemctl restart docker
docker info | grep -A10 "Registry Mirrors"
```

#### 4. 启动 MySQL 和 Redis

生产环境先把 `docker-compose.yml` 的端口限制在本机：

```yaml
ports:
  - '127.0.0.1:3306:3306'
  - '127.0.0.1:6379:6379'
```

然后启动：

```bash
docker compose up -d
docker compose ps
```

Redis 的 ACL 用户名、密码直接写在 `docker-compose.yml` 的 `redis.command` 里，不再读取根目录 `.env`。账号是 `knowledge-share`，密码与后端 `REDIS_URL` 保持一致。

Redis 已开启 ACL 认证：默认用户和业务用户都需要密码，未认证执行 `redis-cli ping` 会返回 `NOAUTH Authentication required.`。

#### 5. 配置后端环境变量

```bash
cd /srv/knowledge-share/apps/backend
cp .env.example .env
vim .env
```

生产最小配置：

```bash
NODE_ENV=production

DATABASE_URL=mysql://chenjiang:chenjiang@127.0.0.1:3306/knowledge_share
REDIS_URL=redis://knowledge-share:chenjiang@127.0.0.1:6379/0
REDIS_PREFIX=knowledge-share

PUBLIC_WEB_URL=http://服务器IP:8888
CORS_ORIGIN=http://服务器IP:8888,http://服务器IP:8080

AUTH_JWT_SECRET=至少32位固定随机字符串
ACTIVITY_LINK_SECRET=至少32位固定随机字符串
AUTH_BOOTSTRAP_PASSWORD=至少12位首次初始化密码

AI_API_KEY=你的模型接口密钥
```

注意：

- 生产空库首次启动时 `AUTH_BOOTSTRAP_PASSWORD` 至少 12 字符，否则后端会启动失败。
- `AUTH_JWT_SECRET` 和 `ACTIVITY_LINK_SECRET` 必须固定，不能每次启动重新生成，否则登录态、报名链接和二维码会失效。
- 当前用 HTTP + IP 访问时，`CORS_ORIGIN` 必须精确包含 `http://服务器IP:8888`。
- `PUBLIC_WEB_URL` 决定海报二维码和邀请链接的域名，必须是用户可访问的官网地址。

#### 6. 配置官网环境变量

```bash
cd /srv/knowledge-share/apps/website
cp .env.example .env.local
vim .env.local
```

```bash
WEBSITE_API_BASE_URL=http://127.0.0.1:3001
NEXT_PUBLIC_SITE_URL=http://服务器IP:8888
```

`WEBSITE_API_BASE_URL` 是官网服务端请求后端的地址，走本机，不要写公网 IP。

#### 7. 安装依赖并构建三端

```bash
cd /srv/knowledge-share
pnpm install
pnpm build
```

构建产物：

```text
apps/backend/dist      后端
apps/web/dist          管理后台静态文件
apps/website/.next     Next.js 官网
```

#### 8. 执行数据库迁移

```bash
pnpm --filter @knowledge-share/backend migration:run
```

#### 9. 启动后端和官网

如果已有旧进程，先删除：

```bash
pm2 delete ks-backend ks-website 2>/dev/null || true
```

启动后端：

```bash
pm2 start pnpm --name ks-backend -- \
  --filter @knowledge-share/backend start:prod
```

启动官网：

```bash
pm2 start pnpm --name ks-website -- \
  --filter @knowledge-share/website start
```

保存进程并设置开机自启：

```bash
pm2 save
pm2 startup
```

`pm2 startup` 会输出一条命令，按提示执行一次即可。

查看状态和日志：

```bash
pm2 status
pm2 logs ks-backend
pm2 logs ks-website
```

管理后台是静态站点，不需要 PM2 进程。

#### 10. 配置 Nginx

仓库中的完整配置：

```text
deploy/nginx/knowledge-share.conf
```

复制到服务器：

```bash
cp /srv/knowledge-share/deploy/nginx/knowledge-share.conf \
  /etc/nginx/conf.d/knowledge-share.conf
```

这份配置约定：

```text
对外 8888  → Next.js 3000
本机 8080  → apps/web/dist
本机 3001  → 后端
```

需要清理 Nginx 自带的 80 默认站点，否则 80 被占用时 Nginx 会启动失败：

```bash
grep -RIn --include='*.conf' -E 'listen[[:space:]]+80|listen[[:space:]]+[^;]*:80' /etc/nginx
```

重点检查：

- `/etc/nginx/nginx.conf` 里默认 `server { listen 80; listen [::]:80; }` 整块
- `/etc/nginx/conf.d/default.conf`

处理掉所有 `listen 80` 后检查：

```bash
nginx -T 2>/dev/null | grep -E 'configuration file|listen'
```

正常只应看到：

```nginx
listen 8888 default_server;
listen 127.0.0.1:8080;
```

启动 Nginx：

```bash
nginx -t
systemctl enable nginx
systemctl start nginx
systemctl status nginx
```

后续只改配置时：

```bash
nginx -t
systemctl reload nginx
```

#### 11. 验证启动结果

```bash
curl http://127.0.0.1:3001/health
curl -I http://127.0.0.1:3000/
curl -I http://127.0.0.1:8888/
curl -I http://127.0.0.1:8080/
```

浏览器访问：

```text
官网：    http://服务器IP:8888/
报名页：  http://服务器IP:8888/join?activity=xxx
管理后台：先建立 SSH 隧道，再访问 http://127.0.0.1:8080
```

### 更新发布流程

```bash
cd /srv/knowledge-share
git pull

pnpm install
pnpm build

pnpm --filter @knowledge-share/backend migration:run

pm2 restart ks-backend --update-env
pm2 restart ks-website --update-env

nginx -t
systemctl reload nginx
```

只改管理后台时：

```bash
pnpm --filter @knowledge-share/web build
```

Nginx 直接读 `apps/web/dist`，刷新页面即可，不需要重启进程。

只改官网时：

```bash
pnpm --filter @knowledge-share/website build
pm2 restart ks-website --update-env
```

只改后端时：

```bash
pnpm --filter @knowledge-share/backend build
pm2 restart ks-backend --update-env
```

### 常见问题

**Nginx 报 `Address already in use`**

说明还有配置在监听被占用的端口。`nginx -t` 只检查语法，不检查端口。

```bash
nginx -T 2>/dev/null | grep -B5 'listen.*80'
ss -lntp | grep ':80 '
```

常见来源：

- `/etc/nginx/nginx.conf` 自带默认 `server` 监听 80
- `/etc/nginx/conf.d/default.conf`
- Apache/httpd 或其他程序占用 80

如果 Nginx 只需要 8888，把 Nginx 自己的 80 配置全部移除即可，不必强行停掉其他占用 80 的程序。

**Docker 拉取镜像失败**

```text
dial tcp ...: connect: connection refused
```

先配置 `registry-mirrors`，再：

```bash
systemctl restart docker
docker pull mysql:8.4
docker pull redis:7.4-alpine
docker compose up -d
```

仍失败时可直接从加速器地址拉取并打本地 tag：

```bash
docker pull docker.m.daocloud.io/library/mysql:8.4
docker tag docker.m.daocloud.io/library/mysql:8.4 mysql:8.4

docker pull docker.m.daocloud.io/library/redis:7.4-alpine
docker tag docker.m.daocloud.io/library/redis:7.4-alpine redis:7.4-alpine

docker compose up -d
```

**Redis 报 `NOAUTH` 或 `WRONGPASS`**

说明后端 `REDIS_URL` 与 `docker-compose.yml` 里的 Redis 账号密码不一致。确认容器内认证可用：

```bash
docker exec knowledge-share-redis sh -c \
  'redis-cli --no-auth-warning --user knowledge-share --pass "chenjiang" ping'
```

返回 `PONG` 说明 Redis 正常。再核对 `apps/backend/.env`：

```bash
REDIS_URL=redis://knowledge-share:密码@127.0.0.1:6379/0
```

修改根目录 `.env` 后要重建 Redis，修改后端 `.env` 后要重启后端：

```bash
docker compose up -d --force-recreate redis
pm2 restart ks-backend --update-env
```

**后端启动提示 `AUTH_BOOTSTRAP_PASSWORD` 长度不足**

生产空库首次启动要求至少 12 字符：

```bash
AUTH_BOOTSTRAP_PASSWORD=至少12位密码
```

修改后重启：

```bash
pm2 restart ks-backend --update-env
```

**管理后台 8080 打不开**

默认配置只监听本机：

```nginx
listen 127.0.0.1:8080;
```

通过 SSH 隧道访问：

```bash
ssh -L 8080:127.0.0.1:8080 root@服务器IP
```

如果确实要公网访问，把监听改成 `listen 8080;`，并在安全组放行 8080。

**官网 `/website` 返回 404**

`/website` 不是官网路由，官网根路径是 `/`。访问 `http://服务器IP:8888/website` 会进入 404 页面，这是正常行为。
