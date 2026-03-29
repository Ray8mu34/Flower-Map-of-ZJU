require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// 数据库文件路径，优先从环境变量读取，默认放在项目根目录的data文件夹中
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');

// 创建数据库连接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath
});

// 测试连接
sequelize.authenticate()
  .then(() => {
    console.log('数据库连接成功');
  })
  .catch((error) => {
    console.error('数据库连接失败:', error);
  });

// 定义Record模型
const Record = sequelize.define('Record', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  locationId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  species: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shotDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  coordinates: {
    type: DataTypes.JSON,
    allowNull: false
  },
  images: {
    type: DataTypes.JSON,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

// 定义Setting模型
const Setting = sequelize.define('Setting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// 同步数据库
sequelize.sync()
  .then(() => {
    console.log('数据库同步成功');
  })
  .catch((error) => {
    console.error('数据库同步失败:', error);
  });

module.exports = {
  sequelize,
  Record,
  Setting
};
