const db = require('../database.js');

class Category {
  static async findAll() {
    const sql = `SELECT category_id as id, name, description 
                 FROM categories 
                 ORDER BY name`;
    
    return new Promise((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(id) {
    const sql = `SELECT category_id as id, name, description 
                 FROM categories 
                 WHERE category_id = ?`;
    
    return new Promise((resolve, reject) => {
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async create(categoryData) {
    const { name, description } = categoryData;
    const sql = `INSERT INTO categories (name, description) 
                 VALUES (?, ?)`;
    
    return new Promise((resolve, reject) => {
      db.run(sql, [name, description], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  static async update(id, categoryData) {
    const { name, description } = categoryData;
    const sql = `UPDATE categories SET name = ?, description = ? 
                 WHERE category_id = ?`;
    
    return new Promise((resolve, reject) => {
      db.run(sql, [name, description, id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  static async delete(id) {
    const sql = `DELETE FROM categories WHERE category_id = ?`;
    
    return new Promise((resolve, reject) => {
      db.run(sql, [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  static async getEventCategories(eventId) {
    const sql = `SELECT c.category_id as id, c.name, c.description 
                 FROM categories c
                 JOIN event_categories ec ON c.category_id = ec.category_id
                 WHERE ec.event_id = ?`;
    
    return new Promise((resolve, reject) => {
      db.all(sql, [eventId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async linkEventToCategories(eventId, categoryIds) {
    return new Promise((resolve, reject) => {
      if (!categoryIds || categoryIds.length === 0) {
        resolve();
        return;
      }
      
      // 先删除旧的关联
      const deleteSql = 'DELETE FROM event_categories WHERE event_id = ?';
      db.run(deleteSql, [eventId], (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // 插入新的关联
        const stmt = db.prepare(
          'INSERT OR IGNORE INTO event_categories (event_id, category_id) VALUES (?, ?)'
        );
        
        let completed = 0;
        let hasError = false;
        
        categoryIds.forEach(categoryId => {
          stmt.run([eventId, categoryId], (err) => {
            if (err && !hasError) {
              hasError = true;
              reject(err);
              return;
            }
            
            completed++;
            if (completed === categoryIds.length && !hasError) {
              stmt.finalize((err) => {
                if (err) reject(err);
                else resolve();
              });
            }
          });
        });
      });
    });
  }
}

module.exports = Category;