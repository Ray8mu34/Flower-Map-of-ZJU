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

    # 上传文件直接服务（数据目录与源码分离）
    location /uploads/ {
        alias /var/data/flower-map/data/uploads/;
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

## 三、目录结构说明

项目采用**源码和数据分离**的架构：

```
/var/apps/flower-map/          # 源码目录
├── server.js                  # 主程序
├── public/                    # 前端文件
├── prisma/                    # 数据库配置
└── ...

/var/data/flower-map/          # 数据目录（与源码分离）
├── data/
│   ├── database.db            # SQLite数据库
│   └── uploads/               # 上传的图片文件
│       └── thumbnails/        # 缩略图
```

## 四、后续更新步骤

### 1. 备份数据

```bash
# 备份数据库和上传文件
cp /var/data/flower-map/data/database.db /var/data/flower-map/data/database.db.bak
cp -r /var/data/flower-map/data/uploads /var/data/flower-map/data/uploads.bak
```

### 2. 更新源码

```bash
cd /var/apps/flower-map

# 拉取最新代码
git pull origin main
# 网不好就用ssh连接


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

## 七、部署经验心得

### 1. 源码与数据分离的重要性

本项目采用 `/var/apps/flower-map/` 存放源码，`/var/data/flower-map/` 存放数据的架构。这样做的好处：
- 更新代码时不会影响数据
- 数据备份更简单（只需备份数据目录）
- 符合生产环境最佳实践

### 2. 常见部署问题及解决

**问题1：数据库表不存在**
```
The table `main.records` does not exist
```
**解决**：运行 `npx prisma migrate deploy` 创建数据库表

**问题2：权限不足**
```
EACCES: permission denied, open '/var/data/...'
```
**解决**：
```bash
sudo chown -R ubuntu:ubuntu /var/data/flower-map/
sudo chmod -R 755 /var/data/flower-map/
```

**问题3：图片无法显示**
- 检查 Nginx 配置中的 `alias` 路径是否正确
- 确保路径指向 `/var/data/flower-map/data/uploads/`
- 注意路径末尾的斜杠 `/` 不能省略

**问题4：环境变量不生效**
- 检查 `.env` 文件路径是否正确
- 确保文件格式为 UTF-8
- 重启 PM2 服务后生效

### 3. 关键配置检查清单

部署完成后，请检查以下配置：

- [ ] `.env` 中的 `DATABASE_URL` 使用绝对路径
- [ ] `.env` 中的 `UPLOAD_DIR` 使用绝对路径
- [ ] Nginx 配置中的 `alias` 路径正确
- [ ] 数据目录权限设置为 `ubuntu:ubuntu`
- [ ] 数据库迁移已执行
- [ ] PM2 服务正常运行
- [ ] Nginx 已重载配置

### 4. 性能优化建议

- 图片上传后自动生成缩略图，减少带宽消耗
- 使用 Nginx 直接服务静态文件，减轻 Node.js 负担
- 设置浏览器缓存（30天）提高加载速度
- 定期清理旧的缩略图和临时文件

### 5. 安全建议

- 生产环境务必修改默认管理员密码
- 设置复杂的 `SESSION_SECRET`（建议32位以上随机字符串）
- 定期备份数据目录
- 限制服务器 SSH 访问，使用密钥认证
- 考虑启用 HTTPS（配置 SSL 证书）
