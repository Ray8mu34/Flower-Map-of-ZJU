require('dotenv').config();
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const sharp = require("sharp");

// 导入数据库模型
const { prisma } = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;

const publicDir = path.join(__dirname, "public");
// 调整上传目录，优先从环境变量读取，默认放在项目根目录
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
const dataDir = path.join(__dirname, "data");

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-this-password";
const SESSION_SECRET = process.env.SESSION_SECRET || "campus-flower-map-session-secret";

const EDIT_MODES = {
  public: "public",
  publicAddOnly: "public_add_only",
  adminOnly: "admin_only"
};

const DEFAULT_SETTINGS = {
  editMode: EDIT_MODES.publicAddOnly
};

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

const thumbnailDir = path.join(uploadDir, 'thumbnails');
fs.mkdirSync(thumbnailDir, { recursive: true });

// 初始化默认设置
async function initSettings() {
  try {
    const existingSetting = await prisma.setting.findFirst({
      where: { id: 1 }
    });
    
    if (!existingSetting) {
      await prisma.setting.create({
        data: {
          permissionMode: DEFAULT_SETTINGS.editMode
        }
      });
    }
  } catch (error) {
    console.error('初始化设置失败:', error);
  }
}

initSettings();

const text = {
  invalidFile: "只允许上传常见图片格式。",
  missingFields: "请完整填写所有必填字段。",
  invalidCoordinates: "坐标格式无效。",
  createNeedImage: "新增记录时至少上传一张图片。",
  notFoundEdit: "未找到要编辑的记录。",
  noImageLeft: "记录至少需要保留一张图片。",
  notFoundDelete: "未找到要删除的记录。",
  saveSuccess: "花卉记录保存成功。",
  updateSuccess: "花卉记录更新成功。",
  deleteSuccess: "花卉记录已删除。",
  saveFail: "服务器保存数据时发生错误。",
  updateFail: "服务器更新数据时发生错误。",
  deleteFail: "服务器删除数据时发生错误。",
  requestFail: "请求处理失败。",
  loginFail: "管理员账号或密码错误。",
  loginSuccess: "管理员登录成功。",
  logoutSuccess: "已退出管理员账号。",
  unauthorized: "请先以管理员身份登录。",
  createDenied: "当前模式不允许游客新增记录，请先登录管理员。",
  modifyDenied: "当前模式下只有管理员可以编辑或删除记录。",
  invalidEditMode: "无效的编辑模式。"
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/[^\w.\u4e00-\u9fa5-]/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    const isImage = /^image\/(jpeg|png|gif|webp|bmp|svg\+xml)$/i.test(file.mimetype);
    if (!isImage) {
      cb(new Error(text.invalidFile));
      return;
    }
    cb(null, true);
  }
});

app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax"
    }
  })
);
app.use(express.static(publicDir));
// 添加uploads目录的静态路由
app.use('/uploads', express.static(uploadDir));

function normalizeText(value = "") {
  return String(value).trim().toLowerCase();
}

function isAdminConfigured() {
  return Boolean(
    typeof ADMIN_PASSWORD === "string" &&
      ADMIN_PASSWORD.trim() &&
      ADMIN_PASSWORD !== "change-this-password"
  );
}

function isAdmin(req) {
  return Boolean(req.session?.isAdmin);
}

async function readRecords() {
  try {
    return await prisma.record.findMany();
  } catch (error) {
    console.error('读取记录失败:', error);
    return [];
  }
}

function saveRecords(records) {
  // 这个函数不再需要，因为我们会使用prisma.record.create和prisma.record.update
}

async function readSettings() {
  try {
    const setting = await prisma.setting.findFirst({
      where: { id: 1 }
    });
    if (setting) {
      return { editMode: setting.permissionMode };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('读取设置失败:', error);
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings) {
  try {
    await prisma.setting.update({
      where: { id: 1 },
      data: { permissionMode: settings.editMode }
    });
  } catch (error) {
    console.error('保存设置失败:', error);
  }
}

function parseOptionalJson(value, fallback = []) {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function validateRequiredFields(body) {
  const requiredKeys = ["title", "species", "author", "shotDate", "location", "description", "x", "y"];
  return requiredKeys.every((key) => {
    const value = body[key];
    return value !== undefined && value !== null && String(value).trim() !== "";
  });
}

function deleteUploadedFiles(imagePaths = []) {
  imagePaths.forEach((imagePath) => {
    const relativePath = imagePath.replace(/^\//, "");
    const filePath = path.join(uploadDir, relativePath.replace(/^uploads\//, ""));
    const thumbnailPath = path.join(thumbnailDir, relativePath.replace(/^uploads\//, ""));
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }
  });
}

async function generateThumbnail(filePath, thumbnailPath) {
  try {
    await sharp(filePath)
      .resize(300, null, { withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath);
    return true;
  } catch (error) {
    console.error('生成缩略图失败:', error);
    return false;
  }
}

async function processUploadedImages(files) {
  const images = [];
  
  for (const file of files) {
    const originalPath = path.join(uploadDir, file.filename);
    const thumbnailPath = path.join(thumbnailDir, file.filename);
    
    await generateThumbnail(originalPath, thumbnailPath);
    
    images.push({
      original: `/uploads/${file.filename}`,
      thumbnail: `/uploads/thumbnails/${file.filename}`
    });
  }
  
  return images;
}

function resolveLocationId(body, currentRecord = null) {
  if (body.locationId && String(body.locationId).trim()) {
    return String(body.locationId).trim();
  }

  if (currentRecord?.locationId) {
    return currentRecord.locationId;
  }

  return randomUUID();
}

function buildAdminPayload() {
  return {
    isAdmin: isAdminConfigured(),
    username: ADMIN_USERNAME
  };
}

async function buildSiteConfigPayload() {
  const settings = await readSettings();
  return {
    editMode: settings.editMode
  };
}

function requireAdmin(req, res, next) {
  if (isAdmin(req)) {
    next();
    return;
  }

  res.status(401).json({ success: false, message: text.unauthorized });
}

async function requireCreatePermission(req, res, next) {
  try {
    const { editMode } = await readSettings();
    if (editMode === EDIT_MODES.adminOnly && !isAdmin(req)) {
      res.status(403).json({ success: false, message: text.createDenied });
      return;
    }
    next();
  } catch (error) {
    next();
  }
}

async function requireModifyPermission(req, res, next) {
  try {
    const { editMode } = await readSettings();
    if (editMode === EDIT_MODES.public) {
      next();
      return;
    }

    if (isAdmin(req)) {
      next();
      return;
    }

    res.status(403).json({ success: false, message: text.modifyDenied });
  } catch (error) {
    res.status(403).json({ success: false, message: text.modifyDenied });
  }
}

app.get("/api/admin/session", async (req, res) => {
  try {
    const siteConfig = await buildSiteConfigPayload();
    res.json({
      success: true,
      isAuthenticated: isAdmin(req),
      username: req.session?.username || null,
      config: buildAdminPayload(),
      siteConfig
    });
  } catch (error) {
    res.json({
      success: true,
      isAuthenticated: isAdmin(req),
      username: req.session?.username || null,
      config: buildAdminPayload(),
      siteConfig: { editMode: DEFAULT_SETTINGS.editMode }
    });
  }
});

app.post("/api/admin/login", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "").trim();

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: text.loginFail });
  }

  req.session.isAdmin = true;
  req.session.username = ADMIN_USERNAME;

  try {
    const siteConfig = await buildSiteConfigPayload();
    res.json({
      success: true,
      message: text.loginSuccess,
      username: ADMIN_USERNAME,
      siteConfig
    });
  } catch (error) {
    res.json({
      success: true,
      message: text.loginSuccess,
      username: ADMIN_USERNAME,
      siteConfig: { editMode: DEFAULT_SETTINGS.editMode }
    });
  }
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: text.logoutSuccess });
  });
});

app.get("/api/site-config", async (req, res) => {
  try {
    const siteConfig = await buildSiteConfigPayload();
    res.json({
      success: true,
      siteConfig
    });
  } catch (error) {
    res.json({
      success: true,
      siteConfig: { editMode: DEFAULT_SETTINGS.editMode }
    });
  }
});

app.put("/api/admin/site-config", requireAdmin, async (req, res) => {
  const nextMode = String(req.body.editMode || "").trim();

  if (!Object.values(EDIT_MODES).includes(nextMode)) {
    return res.status(400).json({ success: false, message: text.invalidEditMode });
  }

  const nextSettings = {
    editMode: nextMode
  };

  try {
    await saveSettings(nextSettings);
    const siteConfig = await buildSiteConfigPayload();
    res.json({
      success: true,
      siteConfig
    });
  } catch (error) {
    res.json({
      success: true,
      siteConfig: { editMode: nextMode }
    });
  }
});

app.get("/api/records", async (req, res) => {
  try {
    const records = await readRecords();
    res.json({ success: true, records });
  } catch (error) {
    console.error("Get records failed:", error);
    res.status(500).json({ success: false, message: text.saveFail });
  }
});

app.post("/api/records", requireCreatePermission, upload.array("images", 10), async (req, res) => {
  try {
    if (!validateRequiredFields(req.body)) {
      return res.status(400).json({ success: false, message: text.missingFields });
    }

    const x = Number(req.body.x);
    const y = Number(req.body.y);
    if (Number.isNaN(x) || Number.isNaN(y)) {
      return res.status(400).json({ success: false, message: text.invalidCoordinates });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: text.createNeedImage });
    }

    const processedImages = await processUploadedImages(req.files);
    
    const now = new Date().toISOString();
    const newRecord = {
      locationId: resolveLocationId(req.body),
      title: req.body.title.trim(),
      species: req.body.species.trim(),
      author: req.body.author.trim(),
      shotDate: req.body.shotDate.trim(),
      location: req.body.location.trim(),
      description: req.body.description.trim(),
      images: JSON.stringify(processedImages),
      createdAt: now,
      updatedAt: now
    };

    const record = await prisma.record.create({
      data: newRecord
    });
    res.status(201).json({ success: true, message: text.saveSuccess, record });
  } catch (error) {
    console.error("Create record failed:", error);
    res.status(500).json({ success: false, message: text.saveFail });
  }
});

app.put("/api/records/:id", requireModifyPermission, upload.array("images", 10), async (req, res) => {
  try {
    if (!validateRequiredFields(req.body)) {
      return res.status(400).json({ success: false, message: text.missingFields });
    }

    const x = Number(req.body.x);
    const y = Number(req.body.y);
    if (Number.isNaN(x) || Number.isNaN(y)) {
      return res.status(400).json({ success: false, message: text.invalidCoordinates });
    }

    const currentRecord = await prisma.record.findUnique({
      where: { id: req.params.id }
    });
    
    if (!currentRecord) {
      deleteUploadedFiles((req.files || []).map((file) => `/uploads/${file.filename}`));
      return res.status(404).json({ success: false, message: text.notFoundEdit });
    }

    const existingImages = parseOptionalJson(req.body.existingImages, JSON.parse(currentRecord.images || '[]'));
    
    let newProcessedImages = [];
    if (req.files && req.files.length > 0) {
      newProcessedImages = await processUploadedImages(req.files);
    }
    
    const nextImages = [...existingImages, ...newProcessedImages];

    if (nextImages.length === 0) {
      deleteUploadedFiles(newProcessedImages.map(img => img.original));
      return res.status(400).json({ success: false, message: text.noImageLeft });
    }

    const currentImages = JSON.parse(currentRecord.images || '[]');
    const removedImages = currentImages.filter((img) => !existingImages.some(existing => existing.original === img.original));
    deleteUploadedFiles(removedImages.map(img => img.original));

    const updatedRecord = {
      locationId: resolveLocationId(req.body, currentRecord),
      title: req.body.title.trim(),
      species: req.body.species.trim(),
      author: req.body.author.trim(),
      shotDate: req.body.shotDate.trim(),
      location: req.body.location.trim(),
      description: req.body.description.trim(),
      coordinates: { x, y },
      images: JSON.stringify(nextImages),
      updatedAt: new Date().toISOString()
    };

    const updated = await prisma.record.update({
      where: { id: req.params.id },
      data: updatedRecord
    });
    
    res.json({ success: true, message: text.updateSuccess, record: updated });
  } catch (error) {
    console.error("Update record failed:", error);
    res.status(500).json({ success: false, message: text.updateFail });
  }
});

app.delete("/api/records/:id", requireModifyPermission, async (req, res) => {
  try {
    const deletedRecord = await prisma.record.findUnique({
      where: { id: req.params.id }
    });
    
    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: text.notFoundDelete });
    }

    const images = JSON.parse(deletedRecord.images || '[]');
    await prisma.record.delete({
      where: { id: req.params.id }
    });
    
    deleteUploadedFiles(images.map(img => img.original));
    res.json({ success: true, message: text.deleteSuccess });
  } catch (error) {
    console.error("Delete record failed:", error);
    res.status(500).json({ success: false, message: text.deleteFail });
  }
});

app.use((error, req, res, next) => {
  console.error("Request processing failed:", error);
  res.status(400).json({ success: false, message: error.message || text.requestFail });
});

app.listen(PORT, () => {
  console.log(`Campus flower map started: http://localhost:${PORT}`);
});
