const fs = require('fs');
const path = require('path');
const { Record, Setting } = require('./models');

// 数据文件路径
const dataFile = path.join(__dirname, 'data', 'data.json');
const settingsFile = path.join(__dirname, 'data', 'settings.json');

// 读取JSON数据
function readJsonFile(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

// 迁移数据
async function migrateData() {
  try {
    console.log('开始数据迁移...');
    
    // 迁移设置数据
    const settingsData = readJsonFile(settingsFile, { editMode: 'public_add_only' });
    await Setting.findOrCreate({
      where: { key: 'editMode' },
      defaults: { value: settingsData.editMode }
    });
    console.log('设置数据迁移完成');
    
    // 迁移花卉记录数据
    const recordsData = readJsonFile(dataFile, []);
    if (recordsData.length > 0) {
      let successCount = 0;
      let errorCount = 0;
      
      for (const record of recordsData) {
        // 检查记录是否已存在
        const existingRecord = await Record.findByPk(record.id);
        if (!existingRecord) {
          try {
            // 为缺少的字段提供默认值
            const recordToCreate = {
              ...record,
              locationId: record.locationId || require('crypto').randomUUID(),
              author: record.author || '未知',
              shotDate: record.shotDate || new Date().toISOString().split('T')[0],
              createdAt: record.createdAt || new Date().toISOString(),
              updatedAt: record.updatedAt || new Date().toISOString()
            };
            
            await Record.create(recordToCreate);
            successCount++;
          } catch (error) {
            console.error(`迁移记录失败 (ID: ${record.id}):`, error.message);
            errorCount++;
          }
        }
      }
      
      console.log(`花卉记录迁移完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`);
    } else {
      console.log('没有花卉记录需要迁移');
    }
    
    console.log('数据迁移完成！');
  } catch (error) {
    console.error('数据迁移失败:', error);
  }
}

// 执行迁移
migrateData();
