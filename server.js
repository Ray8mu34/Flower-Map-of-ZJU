const express = require("express");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
const PORT = 3000;

const publicDir = path.join(__dirname, "public");
const uploadDir = path.join(publicDir, "uploads");
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "data.json");
const settingsFile = path.join(dataDir, "settings.json");

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

if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, "[]", "utf8");
}

if (!fs.existsSync(settingsFile)) {
  fs.writeFileSync(settingsFile, JSON.stringify(DEFAULT_SETTINGS, null, 2), "utf8");
}

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

function normalizeRecords(records) {
  const locationIdMap = new Map();
  let changed = false;

  const nextRecords = records.map((record) => {
    const normalizedLocation = normalizeText(record.location);
    let locationId = record.locationId;

    if (!locationId) {
      if (locationIdMap.has(normalizedLocation)) {
        locationId = locationIdMap.get(normalizedLocation);
      } else {
        locationId = randomUUID();
        locationIdMap.set(normalizedLocation, locationId);
      }
      changed = true;
    } else if (!locationIdMap.has(normalizedLocation)) {
      locationIdMap.set(normalizedLocation, locationId);
    }

    return {
      ...record,
      locationId
    };
  });

  return { records: nextRecords, changed };
}

function readJsonFile(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function readRawRecords() {
  const parsed = readJsonFile(dataFile, []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveRecords(records) {
  writeJsonFile(dataFile, records);
}

function readRecords() {
  const rawRecords = readRawRecords();
  const normalized = normalizeRecords(rawRecords);

  if (normalized.changed) {
    saveRecords(normalized.records);
  }

  return normalized.records;
}

function normalizeSettings(settings = {}) {
  const editMode = Object.values(EDIT_MODES).includes(settings.editMode)
    ? settings.editMode
    : DEFAULT_SETTINGS.editMode;

  return {
    editMode
  };
}

function readSettings() {
  const parsed = readJsonFile(settingsFile, DEFAULT_SETTINGS);
  const normalized = normalizeSettings(parsed);

  if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
    writeJsonFile(settingsFile, normalized);
  }

  return normalized;
}

function saveSettings(settings) {
  writeJsonFile(settingsFile, normalizeSettings(settings));
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
    const filePath = path.join(publicDir, relativePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
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

function buildSiteConfigPayload() {
  const settings = readSettings();
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

function requireCreatePermission(req, res, next) {
  const { editMode } = readSettings();

  if (editMode === EDIT_MODES.adminOnly && !isAdmin(req)) {
    res.status(403).json({ success: false, message: text.createDenied });
    return;
  }

  next();
}

function requireModifyPermission(req, res, next) {
  const { editMode } = readSettings();

  if (editMode === EDIT_MODES.public) {
    next();
    return;
  }

  if (isAdmin(req)) {
    next();
    return;
  }

  res.status(403).json({ success: false, message: text.modifyDenied });
}

app.get("/api/admin/session", (req, res) => {
  res.json({
    success: true,
    isAuthenticated: isAdmin(req),
    username: req.session?.username || null,
    config: buildAdminPayload(),
    siteConfig: buildSiteConfigPayload()
  });
});

app.post("/api/admin/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "").trim();

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: text.loginFail });
  }

  req.session.isAdmin = true;
  req.session.username = ADMIN_USERNAME;

  res.json({
    success: true,
    message: text.loginSuccess,
    username: ADMIN_USERNAME,
    siteConfig: buildSiteConfigPayload()
  });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: text.logoutSuccess });
  });
});

app.get("/api/site-config", (req, res) => {
  res.json({
    success: true,
    siteConfig: buildSiteConfigPayload()
  });
});

app.put("/api/admin/site-config", requireAdmin, (req, res) => {
  const nextMode = String(req.body.editMode || "").trim();

  if (!Object.values(EDIT_MODES).includes(nextMode)) {
    return res.status(400).json({ success: false, message: text.invalidEditMode });
  }

  const nextSettings = {
    ...readSettings(),
    editMode: nextMode
  };

  saveSettings(nextSettings);

  res.json({
    success: true,
    siteConfig: buildSiteConfigPayload()
  });
});

app.get("/api/records", (req, res) => {
  res.json({ success: true, records: readRecords() });
});

app.post("/api/records", requireCreatePermission, upload.array("images", 10), (req, res) => {
  try {
    if (!validateRequiredFields(req.body)) {
      return res.status(400).json({ success: false, message: text.missingFields });
    }

    const x = Number(req.body.x);
    const y = Number(req.body.y);
    if (Number.isNaN(x) || Number.isNaN(y)) {
      return res.status(400).json({ success: false, message: text.invalidCoordinates });
    }

    const imagePaths = (req.files || []).map((file) => `/uploads/${file.filename}`);
    if (imagePaths.length === 0) {
      return res.status(400).json({ success: false, message: text.createNeedImage });
    }

    const records = readRecords();
    const now = new Date().toISOString();
    const newRecord = {
      id: randomUUID(),
      locationId: resolveLocationId(req.body),
      title: req.body.title.trim(),
      species: req.body.species.trim(),
      author: req.body.author.trim(),
      shotDate: req.body.shotDate.trim(),
      location: req.body.location.trim(),
      description: req.body.description.trim(),
      coordinates: { x, y },
      images: imagePaths,
      createdAt: now,
      updatedAt: now
    };

    records.push(newRecord);
    saveRecords(records);
    res.status(201).json({ success: true, message: text.saveSuccess, record: newRecord });
  } catch (error) {
    console.error("Create record failed:", error);
    res.status(500).json({ success: false, message: text.saveFail });
  }
});

app.put("/api/records/:id", requireModifyPermission, upload.array("images", 10), (req, res) => {
  try {
    if (!validateRequiredFields(req.body)) {
      return res.status(400).json({ success: false, message: text.missingFields });
    }

    const x = Number(req.body.x);
    const y = Number(req.body.y);
    if (Number.isNaN(x) || Number.isNaN(y)) {
      return res.status(400).json({ success: false, message: text.invalidCoordinates });
    }

    const records = readRecords();
    const recordIndex = records.findIndex((item) => item.id === req.params.id);
    if (recordIndex === -1) {
      deleteUploadedFiles((req.files || []).map((file) => `/uploads/${file.filename}`));
      return res.status(404).json({ success: false, message: text.notFoundEdit });
    }

    const currentRecord = records[recordIndex];
    const existingImages = parseOptionalJson(req.body.existingImages, currentRecord.images);
    const newImages = (req.files || []).map((file) => `/uploads/${file.filename}`);
    const nextImages = [...existingImages, ...newImages];

    if (nextImages.length === 0) {
      deleteUploadedFiles(newImages);
      return res.status(400).json({ success: false, message: text.noImageLeft });
    }

    const removedImages = currentRecord.images.filter((imagePath) => !existingImages.includes(imagePath));
    deleteUploadedFiles(removedImages);

    const updatedRecord = {
      ...currentRecord,
      locationId: resolveLocationId(req.body, currentRecord),
      title: req.body.title.trim(),
      species: req.body.species.trim(),
      author: req.body.author.trim(),
      shotDate: req.body.shotDate.trim(),
      location: req.body.location.trim(),
      description: req.body.description.trim(),
      coordinates: { x, y },
      images: nextImages,
      updatedAt: new Date().toISOString()
    };

    records[recordIndex] = updatedRecord;
    saveRecords(records);
    res.json({ success: true, message: text.updateSuccess, record: updatedRecord });
  } catch (error) {
    console.error("Update record failed:", error);
    res.status(500).json({ success: false, message: text.updateFail });
  }
});

app.delete("/api/records/:id", requireModifyPermission, (req, res) => {
  try {
    const records = readRecords();
    const recordIndex = records.findIndex((item) => item.id === req.params.id);
    if (recordIndex === -1) {
      return res.status(404).json({ success: false, message: text.notFoundDelete });
    }

    const [deletedRecord] = records.splice(recordIndex, 1);
    deleteUploadedFiles(deletedRecord.images);
    saveRecords(records);
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
