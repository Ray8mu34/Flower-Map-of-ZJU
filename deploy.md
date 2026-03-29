# 部署指南

## 一、上传源码到GitHub

### 1. 初始化并提交代码（本地执行）

```bash
# 进入项目目录
cd MAP

# 初始化git仓库（如未初始化）
git init

# 添加所有文件（数据目录已被.gitignore排除）
git add .

# 提交代码
git commit -m "Initial commit"
```

### 2. 推送到GitHub

```bash
# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/your-username/flower-map.git

# 推送到main分支
git push -u origin main
```

## 二、服务器部署步骤

### 1. 登录服务器并拉取代码

```bash
# 登录服务器
ssh user@your-server

# 切换用户（如需要）
su - ubuntu

# 创建应用目录
mkdir -p /var/apps/flower-map
cd /var/apps/flower-map

# 克隆代码（替换为你的仓库地址）
git clone https://github.com/your-username/flower-map.git .

# 或使用SSH方式（需配置密钥）
# git clone git@github.com:your-username/flower-map.git .
```

### 2. 创建数据目录

```bash
# 创建数据存储目录（与源码分离）
mkdir -p /var/data/flower-map/data
mkdir -p /var/data/flower-map/uploads

# 设置权限
chmod 755 /var/data/flower-map
chmod 755 /var/data/flower-map/data
chmod 755 /var/data/flower-map/uploads
```

### 3. 创建环境配置文件

在源码目录创建 `.env` 文件：

```bash
cd /var/apps/flower-map

# 创建.env文件
cat > .env << 'EOF'
# 数据库配置
DATABASE_URL="file:./data/database.db"

# 服务端口（避免与现有服务冲突）
PORT=3001

# 管理员配置
ADMIN_USERNAME=RAY193
ADMIN_PASSWORD=flowerflower
SESSION_SECRET=ev556X32L4gLN5KYGcECzLrGe7Nyn86VBzQq3dgsaF8=

# 上传目录配置
UPLOAD_DIR="./uploads"
EOF

# 设置权限（保护敏感信息）
chmod 600 .env
```

### 4. 安装依赖并生成Prisma客户端

```bash
# 安装依赖
npm install --production

# 生成Prisma客户端
npx prisma generate

# 执行数据库迁移（创建表结构）
npx prisma migrate deploy
```

### 5. 启动服务

```bash
# 使用PM2启动（推荐）
pm2 start server.js --name flower-map

# 查看服务状态
pm2 status
pm2 logs flower-map

# 或直接用node启动
# node server.js
```

### 6. 配置DNS解析

在域名管理面板添加子域名解析：

**记录类型**：A记录  
**主机记录**：flower  
**记录值**：服务器IP地址（如49.235.184.100）  
**TTL**：600（10分钟）

### 7. 配置Nginx（独立站点）

创建花卉地图的独立Nginx配置文件：

```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/flower-site
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name flower.zjuaaa.cn;

    client_max_body_size 64M;

    # 上传文件直接服务
    location /uploads/ {
        alias /var/data/flower-map/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        autoindex off;
    }

    # 代理到Node.js应用
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

启用配置：

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/flower-site /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载Nginx
sudo systemctl reload nginx
```

**访问地址**：`http://flower.zjuaaa.cn`

## 三、后续更新步骤

### 1. 备份数据

```bash
# 备份数据库和上传文件
cp /var/data/flower-map/data/database.db /var/data/flower-map/data/database.db.bak
cp -r /var/data/flower-map/uploads /var/data/flower-map/uploads.bak
```

### 2. 更新源码

```bash
cd /var/apps/flower-map

# 拉取最新代码
git pull origin main

# 安装新依赖（如有）
npm install --production
```

### 3. 执行数据库迁移（如有需要）

```bash
# 重新生成Prisma客户端
npx prisma generate

# 执行新的数据库迁移
npx prisma migrate deploy
```

### 4. 重启服务

```bash
# PM2重启
pm2 restart flower-map

# 或查看状态
pm2 status
pm2 logs flower-map
```

## 四、目录结构说明

```
服务器目录结构：

/var/apps/flower-map/          # 源码目录
├── models/
│   └── index.js             # Prisma客户端配置
├── prisma/
│   └── schema.prisma        # 数据库模型定义
├── public/
├── server.js
├── package.json
└── ...

/var/data/flower-map/         # 数据目录（持久化存储）
├── data/
│   └── database.db          # SQLite数据库文件
└── uploads/                  # 上传的图片文件
```

## 五、技术栈说明

本项目使用以下技术栈：

- **后端框架**：Express.js
- **数据库ORM**：Prisma
- **数据库**：SQLite
- **会话管理**：express-session
- **文件上传**：multer
- **进程管理**：PM2
- **Web服务器**：Nginx
- **环境变量**：dotenv

## 六、注意事项

1. **数据备份**：定期备份 `/var/data/flower-map/` 目录
2. **权限设置**：确保数据目录有正确的读写权限
3. **环境变量**：生产环境务必设置强密码和随机SESSION_SECRET
4. **防火墙**：开放80/443端口，如需直接访问3001端口也需开放
5. **Prisma迁移**：每次更新代码后记得运行 `npx prisma migrate deploy`
6. **数据库路径**：确保 `.env` 中的 `DATABASE_URL` 指向正确的数据库文件路径
