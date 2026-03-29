# 浙江大学紫金港校区花卉地图

这是一个基于 `HTML + CSS + 原生 JavaScript + Leaflet + Node.js + Express` 的校园花卉地图网站。

## 当前功能

- 使用本地图片作为校区地图底图
- 地图平移范围限制在校区实际范围内
- 支持上传花卉标题、品种、记录人、拍摄时间、地点、描述和多张图片
- 所有记录保存在 `data/data.json`
- 网站配置保存在 `data/settings.json`
- 上传图片保存在 `public/uploads/`
- 同一地点多条记录会归档到同一个地点详情中
- 支持关键词搜索、地点筛选、品种筛选
- 支持管理员登录
- 支持三档权限模式切换

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

- `data/data.json` 保存花卉记录
- `data/settings.json` 保存网站权限模式配置
- `public/uploads/` 保存图片文件

这种方式很适合校园项目早期，但如果未来访问量增加、多人频繁同时写入，建议迁移到数据库。

推荐升级方向：

- 轻量方案：`SQLite + Prisma`
- 长期多人使用：`MySQL / PostgreSQL + Prisma`

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
├─ data/
│  ├─ data.json
│  └─ settings.json
├─ public/
│  ├─ assets/
│  │  └─ map.jpg
│  ├─ uploads/
│  ├─ app.js
│  ├─ index.html
│  └─ style.css
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

4. 确认地图图片存在

```text
public/assets/map.jpg
```

5. 推荐设置管理员环境变量并启动

```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="请改成你自己的密码"
$env:SESSION_SECRET="请改成随机长字符串"
node server.js
```

6. 浏览器访问

[http://localhost:3000](http://localhost:3000)

## 使用流程

### 新建新地点

- 点击“添加花卉记录”
- 在地图上点击新地点
- 填写标题、品种、记录人、拍摄时间、地点、描述
- 上传图片并提交

### 给已有地点追加记录

- 点击已有地点标记
- 打开地点详情
- 点击“在此地点新增记录”
- 新记录会归档到当前地点，不会生成新的地图标记

### 编辑和删除

- 是否允许编辑和删除，取决于当前权限模式
- 在“仅开放新增”和“仅管理员编辑”模式下，编辑和删除需要管理员

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
- 持久保存 `public/uploads/` 目录

## 上传 GitHub

项目已经提供 `.gitignore`，默认会忽略：

- `node_modules/`
- `public/uploads/`
- `.env`
- 日志文件
