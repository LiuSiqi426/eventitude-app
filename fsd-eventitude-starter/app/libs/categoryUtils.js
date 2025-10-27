// 分类相关的工具函数

class CategoryUtils {
  // 验证分类ID数组
  static validateCategoryIds(categoryIds) {
    if (!Array.isArray(categoryIds)) {
      return false;
    }
    
    return categoryIds.every(id => {
      return Number.isInteger(id) && id > 0;
    });
  }

  // 格式化分类数据用于前端显示
  static formatCategoriesForDisplay(categories) {
    if (!Array.isArray(categories)) {
      return [];
    }
    
    return categories.map(cat => ({
      id: cat.id || cat.category_id,
      name: cat.name,
      description: cat.description
    }));
  }

  // 检查分类是否存在
  static async checkCategoriesExist(categoryIds) {
    if (!categoryIds || categoryIds.length === 0) {
      return true;
    }

    const db = require('../database.js');
    const placeholders = categoryIds.map(() => '?').join(',');
    const sql = `SELECT COUNT(*) as count FROM categories WHERE category_id IN (${placeholders})`;
    
    return new Promise((resolve, reject) => {
      db.get(sql, categoryIds, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count === categoryIds.length);
        }
      });
    });
  }
}

module.exports = CategoryUtils;