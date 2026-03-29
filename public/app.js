const MAP_IMAGE_WIDTH = 8997;
const MAP_IMAGE_HEIGHT = 6719;
const FILTER_ALL = "全部";

const EDIT_MODES = {
  public: "public",
  publicAddOnly: "public_add_only",
  adminOnly: "admin_only"
};

const editModeMeta = {
  [EDIT_MODES.public]: {
    label: "开放共建",
    hint: "所有人都可以新增、编辑和删除记录，适合项目早期快速共建。"
  },
  [EDIT_MODES.publicAddOnly]: {
    label: "仅开放新增",
    hint: "所有人都可以新增记录，但编辑和删除需要管理员，适合稳妥扩充数据。"
  },
  [EDIT_MODES.adminOnly]: {
    label: "仅管理员编辑",
    hint: "只有管理员可以新增、编辑和删除记录，适合项目成熟后锁定权限。"
  }
};

const uiText = {
  addRecord: "添加花卉记录",
  pickLocation: "点击地图选择位置",
  pickerHint: "请在地图上点击一个新地点，创建新的地点记录。",
  coordinatePrefix: "已选坐标：",
  existingImageAlt: "已保存图片",
  removeImage: "移除",
  editKicker: "编辑花卉记录",
  editTitle: "修改记录信息",
  editSubmit: "保存修改",
  editHelp: "可补充图片，也可移除旧图；最终至少保留一张图片。",
  createKicker: "新建地点记录",
  createTitle: "填写花卉信息",
  createSubmit: "提交",
  createHelp: "新增记录时至少上传一张图片。",
  appendKicker: "新增地点子记录",
  appendTitle: "为当前地点补充新记录",
  appendSubmit: "保存新记录",
  appendHelp: "这条记录会归档到当前地点下，不会新增地图标记。",
  fixedLocationHint: "当前为地点追加模式，地点和坐标已固定。",
  noImage: "当前记录还没有图片。",
  species: "品种：",
  author: "记录人：",
  shotDate: "拍摄时间：",
  location: "地点：",
  edit: "编辑",
  delete: "删除",
  viewDetail: "查看地点详情",
  addAtThisLocation: "在此地点新增记录",
  locationRecords: "条记录",
  loadFail: "加载已有记录失败，请检查后端是否启动。",
  deleteConfirmPrefix: "确定要删除“",
  deleteConfirmSuffix: "”这条记录吗？删除后无法恢复。",
  deleteSuccess: "花卉记录已删除。",
  relocateHint: "请重新点击地图中的位置。",
  relocateSuccess: "位置已更新，请继续保存修改。",
  needLocation: "请先在地图上选择位置。",
  saving: "提交中...",
  updating: "保存中...",
  updateSuccess: "花卉记录已更新。",
  saveSuccess: "花卉记录已成功保存。",
  imageAltSuffix: "图片",
  uploadedAt: "上传时间：",
  detailSummaryPrefix: "这里目前共有",
  detailSummarySuffix: "条上传记录，可以滚动查看全部图片和描述。",
  duplicateLocation: "这个地点已经存在，请点击地图上的该地点标记，再在详情里新增记录。",
  latestUpload: "最新一条：",
  adminLogin: "管理员登录",
  adminLogout: "退出登录",
  adminMode: "管理员模式",
  guestMode: "游客模式",
  loginRequired: "请先登录管理员后再执行此操作。",
  loginHint: "当前为游客模式，可以浏览记录；是否能新增、编辑或删除，取决于当前共建模式。",
  adminConfigWarning: "未检测到管理员账号配置，请先在服务端设置 ADMIN_USERNAME 和 ADMIN_PASSWORD。",
  loginSuccess: "管理员已登录。",
  logoutSuccess: "已退出管理员账号。",
  modeUpdateSuccess: "共建模式已更新。",
  createDeniedAdminOnly: "当前为“仅管理员编辑”，请先登录管理员后再新增记录。",
  modifyDeniedPublicAddOnly: "当前为“仅开放新增”，编辑和删除需要管理员。",
  modifyDeniedAdminOnly: "当前为“仅管理员编辑”，请先登录管理员后再修改记录。"
};

const imageBounds = [
  [0, 0],
  [MAP_IMAGE_HEIGHT, MAP_IMAGE_WIDTH]
];

const map = L.map("map", {
  crs: L.CRS.Simple,
  minZoom: -2,
  maxZoom: 1,
  zoomSnap: 0.2,
  attributionControl: false,
  maxBounds: imageBounds,
  maxBoundsViscosity: 1
});

L.imageOverlay("/assets/map.jpg", imageBounds).addTo(map);
map.fitBounds(imageBounds, { padding: [40, 40] });

const addRecordButton = document.getElementById("addRecordButton");
const adminStatus = document.getElementById("adminStatus");
const adminActionButton = document.getElementById("adminActionButton");
const editModeBadge = document.getElementById("editModeBadge");
const editModeHint = document.getElementById("editModeHint");
const adminModeControls = document.getElementById("adminModeControls");
const editModeSelect = document.getElementById("editModeSelect");
const saveEditModeButton = document.getElementById("saveEditModeButton");
const adminModalOverlay = document.getElementById("adminModalOverlay");
const closeAdminModalButton = document.getElementById("closeAdminModalButton");
const cancelAdminButton = document.getElementById("cancelAdminButton");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminUsername = document.getElementById("adminUsername");
const adminPassword = document.getElementById("adminPassword");
const submitAdminButton = document.getElementById("submitAdminButton");
const panelToggleButton = document.getElementById("panelToggleButton");
const panelBody = document.getElementById("panelBody");
const searchInput = document.getElementById("searchInput");
const locationFilterInput = document.getElementById("locationFilterInput");
const clearFiltersButton = document.getElementById("clearFiltersButton");
const speciesList = document.getElementById("speciesList");
const recordCount = document.getElementById("recordCount");
const speciesSuggestions = document.getElementById("speciesSuggestions");
const statusMessage = document.getElementById("statusMessage");
const modalOverlay = document.getElementById("modalOverlay");
const modalKicker = document.getElementById("modalKicker");
const modalTitle = document.getElementById("modalTitle");
const closeModalButton = document.getElementById("closeModalButton");
const cancelButton = document.getElementById("cancelButton");
const relocateButton = document.getElementById("relocateButton");
const recordForm = document.getElementById("recordForm");
const submitButton = document.getElementById("submitButton");
const locationIdInput = document.getElementById("locationId");
const coordinateX = document.getElementById("coordinateX");
const coordinateY = document.getElementById("coordinateY");
const coordinateNote = document.getElementById("coordinateNote");
const imageHelpText = document.getElementById("imageHelpText");
const existingImagesSection = document.getElementById("existingImagesSection");
const existingImagesList = document.getElementById("existingImagesList");
const detailOverlay = document.getElementById("detailOverlay");
const detailLocationTitle = document.getElementById("detailLocationTitle");
const detailSummary = document.getElementById("detailSummary");
const detailBody = document.getElementById("detailBody");
const closeDetailButton = document.getElementById("closeDetailButton");

let records = [];
let selectedSpecies = FILTER_ALL;
let searchKeyword = "";
let locationKeyword = "";
let tempMarker = null;
let selectedLatLng = null;
let addMode = false;
let modalMode = "create";
let editingRecordId = null;
let editingImages = [];
let waitingRelocate = false;
let appendLocationGroup = null;
let currentDetailLocationId = null;
let adminSession = {
  isAuthenticated: false,
  username: null,
  config: {
    isAdmin: false,
    username: "admin"
  }
};
let siteConfig = {
  editMode: EDIT_MODES.publicAddOnly
};

const markerStore = new Map();

function createMarkerIcon(type = "default", extraClass = "") {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<span class="flower-marker ${type} ${extraClass}"></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -24]
  });
}

function escapeHtml(text = "") {
  return String(text).replace(/[&<>"']/g, (char) => {
    const mapTable = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return mapTable[char] || char;
  });
}

function normalizeText(value = "") {
  return String(value).trim().toLowerCase();
}

function getLocationKey(recordOrLocation) {
  if (recordOrLocation && typeof recordOrLocation === "object") {
    return recordOrLocation.locationId || normalizeText(recordOrLocation.location);
  }
  return normalizeText(recordOrLocation);
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getEditModeMeta(mode = siteConfig.editMode) {
  return editModeMeta[mode] || editModeMeta[EDIT_MODES.publicAddOnly];
}

function isAdminAuthenticated() {
  return Boolean(adminSession.isAuthenticated);
}

function isAdminConfigured() {
  return Boolean(adminSession.config?.isAdmin);
}

function canCreateRecord() {
  return siteConfig.editMode !== EDIT_MODES.adminOnly || isAdminAuthenticated();
}

function canModifyRecord() {
  if (siteConfig.editMode === EDIT_MODES.public) {
    return true;
  }

  return isAdminAuthenticated();
}

function getCreateDeniedMessage() {
  return siteConfig.editMode === EDIT_MODES.adminOnly ? uiText.createDeniedAdminOnly : uiText.loginRequired;
}

function getModifyDeniedMessage() {
  if (siteConfig.editMode === EDIT_MODES.publicAddOnly) {
    return uiText.modifyDeniedPublicAddOnly;
  }

  if (siteConfig.editMode === EDIT_MODES.adminOnly) {
    return uiText.modifyDeniedAdminOnly;
  }

  return uiText.modifyDeniedAdminOnly;
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.background = isError ? "rgba(156, 43, 58, 0.92)" : "rgba(44, 35, 27, 0.88)";
  statusMessage.classList.add("show");
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    statusMessage.classList.remove("show");
  }, 2600);
}

function setMapCursor(isPicking) {
  map.getContainer().style.cursor = isPicking ? "crosshair" : "grab";
}

function updateModeUi() {
  const meta = getEditModeMeta();
  editModeBadge.textContent = meta.label;
  editModeHint.textContent = meta.hint;
  editModeSelect.value = siteConfig.editMode;
  adminModeControls.classList.toggle("hidden", !isAdminAuthenticated());
  addRecordButton.disabled = !canCreateRecord();
}

function resetToolbarState() {
  addMode = false;
  waitingRelocate = false;
  addRecordButton.textContent = uiText.addRecord;
  setMapCursor(false);
}

function clearFilters() {
  searchKeyword = "";
  locationKeyword = "";
  selectedSpecies = FILTER_ALL;
  searchInput.value = "";
  locationFilterInput.value = "";
  applyFiltersAndRender();
}

function createTemporaryMarker(latlng) {
  if (tempMarker) {
    map.removeLayer(tempMarker);
  }

  tempMarker = L.marker(latlng, {
    icon: createMarkerIcon("temporary")
  }).addTo(map);
}

function clearTemporaryMarker() {
  if (tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
}

function updateCoordinateFields(latlng) {
  selectedLatLng = latlng;
  coordinateX.value = latlng.lng.toFixed(2);
  coordinateY.value = latlng.lat.toFixed(2);
  coordinateNote.textContent = `${uiText.coordinatePrefix} X ${coordinateX.value} / Y ${coordinateY.value}`;
}

function updateExistingImagesView() {
  existingImagesList.innerHTML = "";
  existingImagesSection.classList.toggle("hidden", editingImages.length === 0);

  editingImages.forEach((imageObj) => {
    const imagePath = typeof imageObj === 'string' ? imageObj : (imageObj.thumbnail || imageObj.original);
    const originalPath = typeof imageObj === 'string' ? imageObj : (imageObj.original || imageObj.thumbnail);
    
    const item = document.createElement("div");
    item.className = "existing-image-item";
    item.innerHTML = `
      <img src="${imagePath}" alt="${uiText.existingImageAlt}" />
      <button type="button" class="remove-image-button" data-image="${originalPath}">${uiText.removeImage}</button>
    `;
    existingImagesList.appendChild(item);
  });
}

function setModalMode(mode, record = null) {
  modalMode = mode;
  editingRecordId = record ? record.id : null;

  if (mode === "edit" && record) {
    modalKicker.textContent = uiText.editKicker;
    modalTitle.textContent = uiText.editTitle;
    submitButton.textContent = uiText.editSubmit;
    imageHelpText.textContent = uiText.editHelp;
    relocateButton.classList.remove("hidden");
    try {
      editingImages = typeof record.images === 'string' ? JSON.parse(record.images) : (record.images || []);
    } catch (e) {
      editingImages = [];
    }
    appendLocationGroup = null;
    locationIdInput.value = record.locationId || "";
  } else if (mode === "append" && appendLocationGroup) {
    modalKicker.textContent = uiText.appendKicker;
    modalTitle.textContent = uiText.appendTitle;
    submitButton.textContent = uiText.appendSubmit;
    imageHelpText.textContent = `${uiText.appendHelp} ${uiText.fixedLocationHint}`;
    relocateButton.classList.add("hidden");
    editingImages = [];
    locationIdInput.value = appendLocationGroup.locationId;
  } else {
    modalKicker.textContent = uiText.createKicker;
    modalTitle.textContent = uiText.createTitle;
    submitButton.textContent = uiText.createSubmit;
    imageHelpText.textContent = uiText.createHelp;
    relocateButton.classList.add("hidden");
    editingImages = [];
    appendLocationGroup = null;
    locationIdInput.value = "";
  }

  updateExistingImagesView();
}

function fillFormFromRecord(record) {
  recordForm.reset();
  document.getElementById("title").value = record.title;
  document.getElementById("species").value = record.species;
  document.getElementById("author").value = record.author || "";
  document.getElementById("shotDate").value = record.shotDate || "";
  document.getElementById("location").value = record.location;
  document.getElementById("description").value = record.description;

  const latlng = L.latLng(record.coordinates.y, record.coordinates.x);
  updateCoordinateFields(latlng);
  createTemporaryMarker(latlng);
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  recordForm.reset();
  document.getElementById("location").readOnly = false;
  locationIdInput.value = "";
  editingRecordId = null;
  editingImages = [];
  selectedLatLng = null;
  waitingRelocate = false;
  appendLocationGroup = null;
  updateExistingImagesView();
  clearTemporaryMarker();
}

function handleCancel() {
  closeModal();
  resetToolbarState();
}

function closeAdminModal() {
  adminModalOverlay.classList.add("hidden");
  adminLoginForm.reset();
}

function openAdminModal() {
  if (!isAdminConfigured()) {
    showStatus(uiText.adminConfigWarning, true);
    return;
  }

  adminModalOverlay.classList.remove("hidden");
  adminUsername.focus();
}

function updateAdminUi() {
  const adminName = adminSession.username || adminSession.config.username || "admin";

  if (isAdminAuthenticated()) {
    adminStatus.textContent = `${uiText.adminMode} | ${adminName}`;
    adminActionButton.textContent = uiText.adminLogout;
  } else {
    adminStatus.textContent = uiText.guestMode;
    adminActionButton.textContent = uiText.adminLogin;
  }

  updateModeUi();
}

async function refreshAdminSession(showHint = false) {
  try {
    const response = await fetch("/api/admin/session");
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error("Admin session load failed.");
    }

    adminSession = {
      isAuthenticated: result.isAuthenticated,
      username: result.username,
      config: result.config
    };
    if (result.siteConfig) {
      siteConfig = result.siteConfig;
    }

    updateAdminUi();

    if (showHint && !result.isAuthenticated) {
      showStatus(uiText.loginHint);
    }
  } catch (error) {
    console.error(error);
  }
}

function ensureCreatePermission() {
  if (canCreateRecord()) {
    return true;
  }

  showStatus(getCreateDeniedMessage(), true);
  if (siteConfig.editMode === EDIT_MODES.adminOnly) {
    openAdminModal();
  }
  return false;
}

function ensureModifyPermission() {
  if (canModifyRecord()) {
    return true;
  }

  showStatus(getModifyDeniedMessage(), true);
  if (siteConfig.editMode !== EDIT_MODES.public) {
    openAdminModal();
  }
  return false;
}

function buildLocationGroups(sourceRecords) {
  const groupMap = new Map();

  sourceRecords.forEach((record) => {
    const key = getLocationKey(record);
    if (!key) {
      return;
    }

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        locationId: record.locationId || key,
        location: record.location,
        coordinates: { ...record.coordinates },
        records: []
      });
    }

    groupMap.get(key).records.push(record);
  });

  return Array.from(groupMap.values()).map((group) => {
    group.records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    group.latestRecord = group.records[0];
    group.locationId = group.latestRecord.locationId || group.locationId;
    group.location = group.latestRecord.location;
    group.coordinates = { ...group.latestRecord.coordinates };
    return group;
  });
}

function getLocationGroup(locationOrId) {
  const key = getLocationKey(locationOrId);
  return buildLocationGroups(records).find((group) => group.key === key) || null;
}

function openCreateFlow() {
  if (!ensureCreatePermission()) {
    return;
  }

  closeLocationDetail();
  recordForm.reset();
  clearTemporaryMarker();
  selectedLatLng = null;
  appendLocationGroup = null;
  locationIdInput.value = "";
  document.getElementById("location").readOnly = false;
  setModalMode("create");
  addMode = true;
  waitingRelocate = false;
  addRecordButton.textContent = uiText.pickLocation;
  setMapCursor(true);
  showStatus(uiText.pickerHint);
}

function openAppendModal(locationId) {
  if (!ensureCreatePermission()) {
    return;
  }

  const group = getLocationGroup(locationId);
  if (!group) {
    return;
  }

  closeLocationDetail();
  recordForm.reset();
  clearTemporaryMarker();
  appendLocationGroup = group;
  locationIdInput.value = group.locationId;
  document.getElementById("location").value = group.location;
  document.getElementById("location").readOnly = true;
  document.getElementById("title").value = "";
  document.getElementById("species").value = "";
  document.getElementById("author").value = "";
  document.getElementById("shotDate").value = "";
  document.getElementById("description").value = "";

  const latlng = L.latLng(group.coordinates.y, group.coordinates.x);
  updateCoordinateFields(latlng);
  createTemporaryMarker(latlng);
  setModalMode("append");
  modalOverlay.classList.remove("hidden");
}

function openEditModal(record) {
  if (!ensureModifyPermission()) {
    return;
  }

  resetToolbarState();
  appendLocationGroup = null;
  document.getElementById("location").readOnly = false;
  setModalMode("edit", record);
  fillFormFromRecord(record);
  modalOverlay.classList.remove("hidden");
}

function closeLocationDetail() {
  detailOverlay.classList.add("hidden");
  detailBody.innerHTML = "";
  currentDetailLocationId = null;
}

function openLocationDetail(location) {
  const group = getLocationGroup(location);
  if (!group || group.records.length === 0) {
    closeLocationDetail();
    return;
  }

  const createAllowed = canCreateRecord();
  const modifyAllowed = canModifyRecord();
  const toolbarHtml = createAllowed
    ? `
      <div class="detail-toolbar">
        <button type="button" class="primary-button detail-add-button" data-location-id="${group.locationId}">
          ${uiText.addAtThisLocation}
        </button>
      </div>
    `
    : "";

  detailLocationTitle.textContent = group.location;
  detailSummary.textContent = `${uiText.detailSummaryPrefix}${group.records.length}${uiText.detailSummarySuffix}`;
  currentDetailLocationId = group.locationId;
  detailBody.innerHTML = `
    ${toolbarHtml}
    ${group.records
      .map((record) => {
        let images = [];
        try {
          images = typeof record.images === 'string' ? JSON.parse(record.images) : (record.images || []);
        } catch (e) {
          images = [];
        }
        
        const imageHtml = images.length
          ? images
              .map((imageObj, index) => {
                const thumbnailUrl = imageObj.thumbnail || imageObj;
                const originalUrl = imageObj.original || imageObj;
                return `<img src="${thumbnailUrl}" data-original="${originalUrl}" alt="${escapeHtml(record.title)} ${uiText.imageAltSuffix} ${index + 1}" class="thumbnail-image" onclick="openImageViewer('${originalUrl}', '${thumbnailUrl}')" />`;
              })
              .join("")
          : `<div class="popup-empty">${uiText.noImage}</div>`;

        const actionHtml = modifyAllowed
          ? `
            <div class="detail-record-actions">
              <button type="button" class="secondary-button detail-edit-button" data-record-id="${record.id}">
                ${uiText.edit}
              </button>
              <button type="button" class="secondary-button detail-delete-button" data-record-id="${record.id}">
                ${uiText.delete}
              </button>
            </div>
          `
          : "";

        return `
          <article class="detail-record-card">
            <div class="detail-record-head">
              <div>
                <h3>${escapeHtml(record.title)}</h3>
                <p class="detail-record-meta">
                  <span><strong>${uiText.species}</strong>${escapeHtml(record.species)}</span>
                  <span><strong>${uiText.author}</strong>${escapeHtml(record.author || "未填写")}</span>
                  <span><strong>${uiText.shotDate}</strong>${escapeHtml(record.shotDate || "未填写")}</span>
                  <span><strong>${uiText.uploadedAt}</strong>${escapeHtml(formatDate(record.createdAt))}</span>
                </p>
              </div>
              ${actionHtml}
            </div>
            <p class="detail-record-description">${escapeHtml(record.description)}</p>
            <div class="detail-gallery-scroll">${imageHtml}</div>
          </article>
        `;
      })
      .join("")}
  `;

  detailOverlay.classList.remove("hidden");
}

function createPopupContent(group) {
  const previewImages = group.records.flatMap((record) => record.images).slice(0, 3);
  const galleryHtml = previewImages.length
    ? previewImages
        .map((imagePath, index) => {
          return `<img src="${imagePath}" alt="${escapeHtml(group.latestRecord.title)} ${uiText.imageAltSuffix} ${index + 1}" />`;
        })
        .join("")
    : `<div class="popup-empty">${uiText.noImage}</div>`;

  return `
    <article class="popup-card">
      <div class="popup-topline">
        <span class="popup-count-badge">${group.records.length} ${uiText.locationRecords}</span>
      </div>
      <h3>${escapeHtml(group.location)}</h3>
      <div class="popup-meta">
        <span><strong>${uiText.latestUpload}</strong>${escapeHtml(group.latestRecord.title)}</span>
        <span><strong>${uiText.species}</strong>${escapeHtml(group.latestRecord.species)}</span>
        <span><strong>${uiText.author}</strong>${escapeHtml(group.latestRecord.author || "未填写")}</span>
        <span><strong>${uiText.shotDate}</strong>${escapeHtml(group.latestRecord.shotDate || "未填写")}</span>
      </div>
      <p class="popup-description">${escapeHtml(group.latestRecord.description)}</p>
      <div class="popup-gallery">${galleryHtml}</div>
      <div class="popup-actions">
        <button type="button" class="popup-action-button popup-view-detail-button" data-location-id="${group.locationId}">
          ${uiText.viewDetail}
        </button>
      </div>
    </article>
  `;
}

function getFilteredRecords() {
  return records.filter((record) => {
    const searchText = normalizeText(`${record.title} ${record.species} ${record.location} ${record.description}`);
    const locationText = normalizeText(record.location);

    const matchSearch = !searchKeyword || searchText.includes(searchKeyword);
    const matchLocation = !locationKeyword || locationText.includes(locationKeyword);
    const matchSpecies = selectedSpecies === FILTER_ALL || record.species === selectedSpecies;

    return matchSearch && matchLocation && matchSpecies;
  });
}

function renderSpeciesOptions() {
  const uniqueSpecies = [...new Set(records.map((record) => record.species))].sort((a, b) =>
    a.localeCompare(b, "zh-Hans-CN")
  );

  speciesSuggestions.innerHTML = uniqueSpecies
    .map((species) => `<option value="${escapeHtml(species)}"></option>`)
    .join("");
}

function renderSpeciesPanel(baseRecords) {
  const stats = new Map();

  baseRecords.forEach((record) => {
    stats.set(record.species, (stats.get(record.species) || 0) + 1);
  });

  recordCount.textContent = String(baseRecords.length);
  speciesList.innerHTML = "";

  const items = [
    [FILTER_ALL, baseRecords.length],
    ...Array.from(stats.entries()).sort((a, b) => a[0].localeCompare(b[0], "zh-Hans-CN"))
  ];

  items.forEach(([species, count]) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = `species-button${selectedSpecies === species ? " active" : ""}`;
    button.innerHTML = `<span>${species}</span><span class="species-count">${count}</span>`;
    button.addEventListener("click", () => {
      selectedSpecies = selectedSpecies === species || species === FILTER_ALL ? FILTER_ALL : species;
      applyFiltersAndRender();
    });
    item.appendChild(button);
    speciesList.appendChild(item);
  });
}

function bindPopupEvents(marker, group) {
  marker.on("popupopen", () => {
    const popupElement = marker.getPopup().getElement();
    if (!popupElement) {
      return;
    }

    const detailButton = popupElement.querySelector(".popup-view-detail-button");
    if (detailButton) {
      detailButton.addEventListener("click", () => {
        openLocationDetail(group.locationId);
      });
    }
  });
}

function addLocationMarker(group) {
  const marker = L.marker([group.coordinates.y, group.coordinates.x], {
    icon: createMarkerIcon()
  }).addTo(map);

  marker.bindPopup(createPopupContent(group), {
    maxWidth: 420,
    className: "flower-popup"
  });

  bindPopupEvents(marker, group);
  markerStore.set(group.key, { marker, group });
}

function applyFiltersAndRender() {
  const baseRecords = records.filter((record) => {
    const searchText = normalizeText(`${record.title} ${record.species} ${record.location} ${record.description}`);
    const locationText = normalizeText(record.location);
    const matchSearch = !searchKeyword || searchText.includes(searchKeyword);
    const matchLocation = !locationKeyword || locationText.includes(locationKeyword);
    return matchSearch && matchLocation;
  });

  if (selectedSpecies !== FILTER_ALL && !baseRecords.some((record) => record.species === selectedSpecies)) {
    selectedSpecies = FILTER_ALL;
  }

  const filteredRecords = getFilteredRecords();
  const filteredGroups = buildLocationGroups(filteredRecords);

  markerStore.forEach(({ marker }) => map.removeLayer(marker));
  markerStore.clear();
  filteredGroups.forEach(addLocationMarker);

  renderSpeciesOptions();
  renderSpeciesPanel(baseRecords);
}

async function loadRecords() {
  try {
    const response = await fetch("/api/records");
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Load records failed.");
    }

    records = result.records;
    applyFiltersAndRender();
  } catch (error) {
    console.error(error);
    showStatus(uiText.loadFail, true);
  }
}

async function deleteRecord(recordId) {
  if (!ensureModifyPermission()) {
    return;
  }

  const targetRecord = records.find((record) => record.id === recordId);
  if (!targetRecord) {
    return;
  }

  const confirmed = window.confirm(`${uiText.deleteConfirmPrefix}${targetRecord.title}${uiText.deleteConfirmSuffix}`);
  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`/api/records/${recordId}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Delete failed.");
    }

    const deletedLocationId = targetRecord.locationId || targetRecord.location;
    records = records.filter((record) => record.id !== recordId);
    applyFiltersAndRender();

    if (!detailOverlay.classList.contains("hidden")) {
      const group = getLocationGroup(deletedLocationId);
      if (group) {
        openLocationDetail(group.locationId);
      } else {
        closeLocationDetail();
      }
    }

    showStatus(uiText.deleteSuccess);
  } catch (error) {
    console.error(error);
    showStatus(error.message || "Delete failed.", true);
  }
}

addRecordButton.addEventListener("click", () => {
  if (addMode) {
    handleCancel();
    return;
  }

  openCreateFlow();
});

adminActionButton.addEventListener("click", async () => {
  if (!isAdminAuthenticated()) {
    openAdminModal();
    return;
  }

  try {
    const response = await fetch("/api/admin/logout", { method: "POST" });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Logout failed.");
    }

    adminSession.isAuthenticated = false;
    adminSession.username = null;
    updateAdminUi();
    closeAdminModal();
    closeModal();
    applyFiltersAndRender();
    if (currentDetailLocationId) {
      openLocationDetail(currentDetailLocationId);
    }
    showStatus(uiText.logoutSuccess);
  } catch (error) {
    console.error(error);
    showStatus(error.message || "Logout failed.", true);
  }
});

saveEditModeButton.addEventListener("click", async () => {
  if (!isAdminAuthenticated()) {
    openAdminModal();
    return;
  }

  saveEditModeButton.disabled = true;

  try {
    const response = await fetch("/api/admin/site-config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        editMode: editModeSelect.value
      })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Update mode failed.");
    }

    siteConfig = result.siteConfig;
    updateModeUi();
    applyFiltersAndRender();
    if (currentDetailLocationId) {
      openLocationDetail(currentDetailLocationId);
    }
    showStatus(uiText.modeUpdateSuccess);
  } catch (error) {
    console.error(error);
    showStatus(error.message || "Update mode failed.", true);
  } finally {
    saveEditModeButton.disabled = false;
  }
});

closeAdminModalButton.addEventListener("click", closeAdminModal);
cancelAdminButton.addEventListener("click", closeAdminModal);

adminModalOverlay.addEventListener("click", (event) => {
  if (event.target === adminModalOverlay) {
    closeAdminModal();
  }
});

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  submitAdminButton.disabled = true;

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: adminUsername.value.trim(),
        password: adminPassword.value.trim()
      })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "Login failed.");
    }

    await refreshAdminSession(false);
    closeAdminModal();
    applyFiltersAndRender();
    if (currentDetailLocationId) {
      openLocationDetail(currentDetailLocationId);
    }
    showStatus(uiText.loginSuccess);
  } catch (error) {
    console.error(error);
    showStatus(error.message || "Login failed.", true);
  } finally {
    submitAdminButton.disabled = false;
  }
});

searchInput.addEventListener("input", () => {
  searchKeyword = normalizeText(searchInput.value);
  applyFiltersAndRender();
});

locationFilterInput.addEventListener("input", () => {
  locationKeyword = normalizeText(locationFilterInput.value);
  applyFiltersAndRender();
});

clearFiltersButton.addEventListener("click", clearFilters);

map.on("click", (event) => {
  if (!addMode && !waitingRelocate) {
    return;
  }

  updateCoordinateFields(event.latlng);
  createTemporaryMarker(event.latlng);

  if (waitingRelocate) {
    waitingRelocate = false;
    addMode = false;
    setMapCursor(false);
    showStatus(uiText.relocateSuccess);
    return;
  }

  modalOverlay.classList.remove("hidden");
  addMode = false;
  setMapCursor(false);
});

closeModalButton.addEventListener("click", handleCancel);
cancelButton.addEventListener("click", handleCancel);

modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    handleCancel();
  }
});

closeDetailButton.addEventListener("click", closeLocationDetail);

detailOverlay.addEventListener("click", (event) => {
  if (event.target === detailOverlay) {
    closeLocationDetail();
  }
});

detailBody.addEventListener("click", (event) => {
  const addButton = event.target.closest(".detail-add-button");
  const editButton = event.target.closest(".detail-edit-button");
  const deleteButton = event.target.closest(".detail-delete-button");

  if (addButton) {
    openAppendModal(addButton.dataset.locationId);
    return;
  }

  if (editButton) {
    const record = records.find((item) => item.id === editButton.dataset.recordId);
    if (record) {
      closeLocationDetail();
      openEditModal(record);
    }
    return;
  }

  if (deleteButton) {
    deleteRecord(deleteButton.dataset.recordId);
  }
});

relocateButton.addEventListener("click", () => {
  if (!ensureModifyPermission()) {
    return;
  }

  waitingRelocate = true;
  addMode = true;
  setMapCursor(true);
  showStatus(uiText.relocateHint);
});

existingImagesList.addEventListener("click", (event) => {
  const button = event.target.closest(".remove-image-button");
  if (!button) {
    return;
  }

  const imagePath = button.dataset.image;
  editingImages = editingImages.filter((item) => item !== imagePath);
  updateExistingImagesView();
});

recordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const needModifyPermission = modalMode === "edit";
  const hasPermission = needModifyPermission ? ensureModifyPermission() : ensureCreatePermission();
  if (!hasPermission) {
    return;
  }

  if (!selectedLatLng) {
    showStatus(uiText.needLocation, true);
    return;
  }

  const locationValue = document.getElementById("location").value.trim();
  const existingGroup = buildLocationGroups(records).find(
    (group) => normalizeText(group.location) === normalizeText(locationValue)
  );
  if (modalMode === "create" && existingGroup) {
    showStatus(uiText.duplicateLocation, true);
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = modalMode === "edit" ? uiText.updating : uiText.saving;

  try {
    const formData = new FormData(recordForm);
    if (modalMode === "edit") {
      formData.append("existingImages", JSON.stringify(editingImages));
    }

    const requestUrl = modalMode === "edit" ? `/api/records/${editingRecordId}` : "/api/records";
    const requestMethod = modalMode === "edit" ? "PUT" : "POST";

    const response = await fetch(requestUrl, {
      method: requestMethod,
      body: formData
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Save failed.");
    }

    let nextDetailLocationId = null;

    if (modalMode === "edit") {
      records = records.map((record) => (record.id === result.record.id ? result.record : record));
      showStatus(uiText.updateSuccess);
      nextDetailLocationId = result.record.locationId;
    } else {
      records.push(result.record);
      showStatus(uiText.saveSuccess);
      nextDetailLocationId = result.record.locationId;
    }

    const shouldReopenDetail = modalMode === "append" || Boolean(currentDetailLocationId);

    applyFiltersAndRender();
    closeModal();
    resetToolbarState();

    if (nextDetailLocationId && shouldReopenDetail) {
      openLocationDetail(nextDetailLocationId);
    }
  } catch (error) {
    console.error(error);
    showStatus(error.message || "Save failed.", true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent =
      modalMode === "edit" ? uiText.editSubmit : modalMode === "append" ? uiText.appendSubmit : uiText.createSubmit;
  }
});

panelToggleButton.addEventListener("click", () => {
  const isExpanded = panelToggleButton.getAttribute("aria-expanded") === "true";
  panelToggleButton.setAttribute("aria-expanded", String(!isExpanded));
  panelBody.classList.toggle("collapsed", isExpanded);
});

Promise.all([refreshAdminSession(true), loadRecords()]).catch((error) => {
  console.error(error);
});

const imageViewerOverlay = document.createElement('div');
imageViewerOverlay.id = 'imageViewerOverlay';
imageViewerOverlay.className = 'image-viewer-overlay hidden';
imageViewerOverlay.innerHTML = `
  <div class="image-viewer-container">
    <button id="closeImageViewerButton" class="icon-button image-viewer-close" type="button" aria-label="关闭图片查看器">
      ×
    </button>
    <div class="image-viewer-content">
      <img id="imageViewerImg" src="" alt="查看图片" />
    </div>
    <div class="image-viewer-actions">
      <button id="viewOriginalButton" class="primary-button" type="button">查看原图</button>
    </div>
  </div>
`;
document.body.appendChild(imageViewerOverlay);

let currentOriginalUrl = '';
let currentThumbnailUrl = '';

function openImageViewer(originalUrl, thumbnailUrl) {
  currentOriginalUrl = originalUrl;
  currentThumbnailUrl = thumbnailUrl;
  
  const viewerImg = document.getElementById('imageViewerImg');
  viewerImg.src = thumbnailUrl;
  
  imageViewerOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeImageViewer() {
  imageViewerOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  
  const viewerImg = document.getElementById('imageViewerImg');
  viewerImg.src = '';
}

function viewOriginalImage() {
  if (currentOriginalUrl) {
    const viewerImg = document.getElementById('imageViewerImg');
    viewerImg.src = currentOriginalUrl;
  }
}

document.getElementById('closeImageViewerButton').addEventListener('click', closeImageViewer);
document.getElementById('viewOriginalButton').addEventListener('click', viewOriginalImage);

imageViewerOverlay.addEventListener('click', (e) => {
  if (e.target === imageViewerOverlay) {
    closeImageViewer();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !imageViewerOverlay.classList.contains('hidden')) {
    closeImageViewer();
  }
});

window.openImageViewer = openImageViewer;
