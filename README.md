# 浙江大学紫金港校区花卉地图

这是一个基于 `HTML + CSS + 原生 JavaScript + Leaflet + Node.js + Express + Prisma` 的校园花卉地图网站。

## 当前功能

- 使用本地图片作为校区地图底图
- 地图平移范围限制在校区实际范围内
- 支持上传花卉标题、品种、记录人、拍摄时间、地点、描述和多张图片
- 所有记录保存在 SQLite 数据库中
- 网站配置保存在数据库中
- 上传图片保存在 `data/uploads/` 目录，缩略图保存在 `data/uploads/thumbnails/`
- 同一地点多条记录会归档到同一个地点详情中
- 支持关键词搜索、地点筛选、品种筛选
- 支持管理员登录
- 支持三档权限模式切换
- **图片缩略图功能**：自动生成缩略图，点击可查看原图
- **图片查看器**：支持缩略图预览和原图查看

## 新增字段说明

项目现在为每条记录增加了两个字段：

- `记录人`
- `拍摄时间`

### 为什么拍摄时间使用日历选择

拍摄时间使用 `input type="date"`，也就是浏览器自带的日期选择器。

这样做的好处是：

- 输入格式统一
- 不容易填错
- 后续如果你想按花期、月份或时间排序，会更方便

相比纯文本输入，这种方式更适合上线后的长期维护。

## 三档权限模式

### 1. 开放共建

- 所有人都可以新增
- 所有人都可以编辑
- 所有人都可以删除

### 2. 仅开放新增

- 所有人都可以新增
- 只有管理员可以编辑
- 只有管理员可以删除

### 3. 仅管理员编辑

- 只有管理员可以新增
- 只有管理员可以编辑
- 只有管理员可以删除

管理员登录后，可以在左上角直接切换模式。

## 技术栈

本项目使用以下技术栈：

### 前端
- **HTML5**：页面结构
- **CSS3**：样式设计
- **原生 JavaScript**：前端逻辑
- **Leaflet**：地图交互库

### 后端
- **Node.js**：运行环境
- **Express.js**：Web 框架
- **Prisma**：数据库 ORM
- **SQLite**：轻量级数据库
- **express-session**：会话管理
- **multer**：文件上传处理
- **sharp**：图片处理（生成缩略图）
- **dotenv**：环境变量管理

### 部署
- **PM2**：进程管理
- **Nginx**：Web 服务器

## 管理员系统

推荐在启动前设置环境变量：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

Windows PowerShell 示例：

```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="请改成你自己的密码"
$env:SESSION_SECRET="请改成随机长字符串"
node server.js
```

## 数据存储说明

当前版本使用：

- **SQLite 数据库**：保存花卉记录和网站配置
- **data/uploads/ 目录**：保存图片文件
- **data/uploads/thumbnails/ 目录**：保存缩略图

使用 Prisma ORM 进行数据库操作，提供以下优势：

- 类型安全的数据访问
- 自动生成数据库迁移
- 支持复杂查询
- 易于维护和扩展

### 图片存储格式

图片数据以 JSON 格式存储，包含原图和缩略图路径：
```json
[
  {
    "original": "/uploads/xxx.jpg",
    "thumbnail": "/uploads/thumbnails/xxx.jpg"
  }
]
```

## 地点归档机制

项目为每个地点生成独立的 `locationId`。

这意味着：

- 同一地点只显示一个地图标记
- 同一地点可以容纳多条上传记录
- 从地点详情里新增记录时，会自动归档到该地点
- 不会因为重复点击同一地点而在地图上产生多个重叠标记

## 项目结构

```text
MAP/
├─ prisma/
│  └─ schema.prisma        # 数据库模型定义
├─ models/
│  └─ index.js             # Prisma 客户端配置
├─ public/
│  ├─ assets/
│  │  └─ map.jpg
│  ├─ app.js
│  ├─ index.html
│  └─ style.css
├─ data/                  # 数据目录（数据库和图片）
│  ├─ database.db         # SQLite 数据库
│  └─ uploads/            # 上传的图片文件
│     └─ thumbnails/      # 缩略图
├─ .env                   # 环境变量配置
├─ .gitignore
├─ package.json
├─ package-lock.json
├─ README.md
└─ server.js
```

## 启动方法

1. 安装 [Node.js](https://nodejs.org/)
2. 打开项目目录

```bash
cd C:\Users\30674\Desktop\MAP
```

3. 安装依赖

```bash
npm install
```

4. 生成 Prisma 客户端

```bash
npx prisma generate
```

5. 执行数据库迁移

```bash
npx prisma migrate dev --name init
```

6. 确认地图图片存在

```text
public/assets/map.jpg
```

7. 推荐设置管理员环境变量并启动

```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="请改成你自己的密码"
$env:SESSION_SECRET="请改成随机长字符串"
node server.js
```

8. 浏览器访问

[http://localhost:3001](http://localhost:3001)

## 使用流程

### 新建新地点

- 点击"添加花卉记录"
- 在地图上点击新地点
- 填写标题、品种、记录人、拍摄时间、地点、描述
- 上传图片并提交

### 给已有地点追加记录

- 点击已有地点标记
- 打开地点详情
- 点击"在此地点新增记录"
- 新记录会归档到当前地点，不会生成新的地图标记

### 编辑和删除

- 是否允许编辑和删除，取决于当前权限模式
- 在"仅开放新增"和"仅管理员编辑"模式下，编辑和删除需要管理员

## 接口说明

### 公开接口

- `GET /api/records`
- `GET /api/admin/session`
- `GET /api/site-config`

### 管理员接口

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `PUT /api/admin/site-config`

### 记录接口权限

`POST /api/records`

- 在 `开放共建` 和 `仅开放新增` 模式下，所有人都能新增
- 在 `仅管理员编辑` 模式下，只有管理员能新增

`PUT /api/records/:id`

- 只有在 `开放共建` 模式下，所有人都能编辑
- 其余两种模式下，只有管理员能编辑

`DELETE /api/records/:id`

- 只有在 `开放共建` 模式下，所有人都能删除
- 其余两种模式下，只有管理员能删除

## 部署说明

这个项目已经可以部署，但前提是部署环境要支持：

- 运行 Node.js
- 持久保存 `data/` 目录
- 持久保存 `uploads/` 目录

详细的部署步骤请参考 [deploy.md](deploy.md)

## 上传 GitHub

项目已经提供 `.gitignore`，默认会忽略：

- `node_modules/`
- `uploads/`
- `data/`
- `.env`
- 日志文件

## 环境变量说明

项目支持通过 `.env` 文件配置以下环境变量：

```env
# 数据库配置
DATABASE_URL="file:./data/database.db"

# 服务端口
PORT=3001

# 管理员配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
SESSION_SECRET=your-random-secret

# 上传目录（生产环境建议使用绝对路径）
UPLOAD_DIR="./data/uploads"
```

## 数据库模型

### Record 模型

```prisma
model Record {
  id          String   @id @default(cuid())
  locationId  String
  title       String
  species     String
  author      String
  shotDate    String
  location    String
  description String
  images      String       # JSON格式：[{"original": "/uploads/xxx.jpg", "thumbnail": "/uploads/thumbnails/xxx.jpg"}]
  coordinates String       # JSON格式：{"x": 123.45, "y": 67.89}
  createdAt   String
  updatedAt   String

  @@map("records")
}
```

### Setting 模型

```prisma
model Setting {
  id            Int     @id @default(autoincrement())
  permissionMode String  @default("open")

  @@map("settings")
}
```
