const db = require('../libs/database');

class User {
  static async create(userData) {
    const { firstName, lastName, email, password } = userData;
    const name = `${firstName} ${lastName}`;
    const sql = `INSERT INTO users (name, first_name, last_name, email, password, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`;
    
    return new Promise((resolve, reject) => {
      db.run(sql, [name, firstName, lastName, email, password], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  static async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = ?`;
    
    return new Promise((resolve, reject) => {
      db.get(sql, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async findById(id) {
    const sql = `SELECT id, name, first_name, last_name, email, created_at FROM users WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async findAll() {
    const sql = `SELECT id, name, first_name, last_name, email, created_at FROM users ORDER BY created_at DESC`;
    
    return new Promise((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async update(id, userData) {
    const { firstName, lastName, email } = userData;
    const name = `${firstName} ${lastName}`;
    const sql = `UPDATE users SET name = ?, first_name = ?, last_name = ?, email = ? WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      db.run(sql, [name, firstName, lastName, email, id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  static correctPassword(password, hashedPassword) {
    // 简单的密码验证 - 实际项目中应该使用bcrypt
    return password === hashedPassword;
  }
}

module.exports = User;