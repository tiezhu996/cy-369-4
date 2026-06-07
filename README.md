# 露营基地预约管理系统

面向露营地/房车营地，提供营位可视化预约、装备租赁和活动管理的综合运营平台。

## Docker Compose 快速启动

首次启动前复制环境变量文件：

```bash
cp .env.example .env
docker compose up -d
```

访问地址：

- 前端：http://localhost:28509
- 后端健康检查：http://localhost:29509/health
- API 示例：http://localhost:28509/api/overview

## 项目主要功能

- 营位GIS地图可视化：以营地平面图展示各营位位置，区分帐篷区、房车区、木屋区，点击营位查看面积、设施（电源/水源/篝火位）和实景照片。
- 营位类型与预约：选择日期和入住天数，在地图上点选空闲营位，系统自动计算费用（含营位费+人数附加费），支持连续多日预约。
- 装备租赁管理：管理可租赁装备（帐篷/睡袋/炊具/桌椅），记录库存和租赁状态，用户预约营位时可同步选择装备租赁套餐，离营时归还检查。
- 篝火晚会活动报名：营地定期举办篝火晚会、星空观测、户外电影等活动，用户可在线报名，查看活动详情（时间/地点/人数限制/费用）。
- 营位占用日历与设施管理：以日历视图展示各营位的占用情况，管理员可标记设施维修状态，维修期间该营位不可预约。

## 本地开发方式

前端：

```bash
cd frontend
npm install
npm run dev
```

后端：

```bash
cd backend
npm install
npm run dev
```

## 技术栈

| 分层 | 技术 |
| --- | --- |
| 前端 | React 18 + TypeScript、Ant Design、Vite |
| 后端 | NestJS + TypeScript |
| 数据库 | MySQL 8.0 |
| 认证 | JWT |
| 依赖 | TypeORM、class-validator |

## 项目目录结构

```text
.
├── backend/              # 后端服务
├── database/             # 数据库脚本
├── frontend/             # 前端应用
├── docker-compose.yml    # 一键部署编排
├── .env.example          # 环境变量示例
└── README.md
```

## 环境变量说明

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| COMPOSE_PROJECT_NAME | Compose 项目名，避免中文目录名导致项目名为空 | ldcampingbase |
| DB_NAME | 数据库名称 | app |
| DB_USER | 数据库用户 | app |
| DB_PASSWORD | 数据库密码 | app_pwd |
| DB_ROOT_PASSWORD | 数据库 root 密码 | root_pwd |
| JWT_SECRET | JWT 签名密钥 | change_me_to_a_long_random_string |
| FRONTEND_PORT | 前端宿主机端口 | 28509 |
| BACKEND_PORT | 后端宿主机端口 | 29509 |
| DB_PORT | 数据库宿主机端口 | 3306 |

## Docker 部署说明

- 使用 `docker compose up -d` 启动，不需要额外传入 `-p`。
- `docker-compose.yml` 顶层已声明 `name: ldcampingbase`，并且 `.env` 包含 `COMPOSE_PROJECT_NAME=ldcampingbase`，可在中文目录名下启动。
- 数据库数据保存在命名卷 `db_data` 中，不依赖当前目录名。
- 前端容器由 Nginx 托管静态资源，并把 `/api/` 反向代理到 `backend:29509`。
- 若本地端口冲突，可修改 `.env` 中的 `FRONTEND_PORT`、`BACKEND_PORT`、`DB_PORT`。

常用命令：

```bash
docker compose config --quiet
docker compose ps
docker compose down
```

## License

MIT
