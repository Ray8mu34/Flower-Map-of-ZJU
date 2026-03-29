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

# 创建应用目录
mkdir -p /var/www/flower-map
cd /var/www/flower-map

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
cd /var/www/flower-map

# 创建.env文件
cat > .env << 'EOF'
# 服务端口（避免与现有服务冲突）
PORT=3001

# 管理员配置
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
SESSION_SECRET=your-random-secret

# 数据目录配置（使用绝对路径）
DB_PATH=/var/data/flower-map/data/database.sqlite
UPLOAD_DIR=/var/data/flower-map/uploads
EOF

# 设置权限（保护敏感信息）
chmod 600 .env
```

### 4. 安装依赖并启动

```bash
# 安装依赖（包含dotenv读取.env文件）
npm install --production

# 使用PM2启动（推荐）
npm install -g pm2
pm2 start server.js --name flower-map

# 或直接用node启动
# node server.js
```

### 5. 配置Nginx（子路径部署）

在现有Nginx配置中添加子路径代理（假设主站已配置）：

```nginx
server {
    listen 80;
    server_name zjuaaa.cn;

    # 你的主站配置...

    # 花卉地图子路径
    location /flower/ {
        proxy_pass http://localhost:3001/;  # 注意末尾的斜杠很重要
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket支持（如需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 上传文件直接服务
    location /flower/uploads/ {
        alias /var/data/flower-map/uploads/;
    }
}
```

**访问地址**：`http://zjuaaa.cn/flower/`

## 三、后续更新步骤

### 1. 备份数据

```bash
# 备份数据库和上传文件
cp /var/data/flower-map/data/database.sqlite /var/data/flower-map/data/database.sqlite.bak
cp -r /var/data/flower-map/uploads /var/data/flower-map/uploads.bak
```

### 2. 更新源码

```bash
cd /var/www/flower-map

# 拉取最新代码
git pull origin main

# 安装新依赖（如有）
npm install --production
```

### 3. 执行数据迁移（如有需要）

```bash
# 如果有新的数据迁移脚本
node migrate.js
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

/var/www/flower-map/          # 源码目录
├── models/
├── public/
├── server.js
├── package.json
└── ...

/var/data/flower-map/         # 数据目录（持久化存储）
├── data/
│   └── database.sqlite       # SQLite数据库
└── uploads/                  # 上传的图片文件
```

## 五、注意事项

1. **数据备份**：定期备份 `/var/data/flower-map/` 目录
2. **权限设置**：确保数据目录有正确的读写权限
3. **环境变量**：生产环境务必设置强密码和随机SESSION_SECRET
4. **防火墙**：开放80/443端口，如需直接访问3000端口也需开放
