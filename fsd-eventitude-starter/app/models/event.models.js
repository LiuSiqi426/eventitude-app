const db = require('../libs/database');

class Event {
  static async create(eventData) {
    const { title, description, date, location, capacity, category, organizer_id } = eventData;
    const sql = `INSERT INTO events (title, description, date, location, capacity, category, created_by, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`;
    
    return new Promise((resolve, reject) => {
      db.run(sql, [title, description, date, location, capacity, category, organizer_id], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  static async findAll() {
    const sql = `SELECT e.*, u.name as organizer_name, u.first_name, u.last_name, u.email as organizer_email
                 FROM events e 
                 LEFT JOIN users u ON e.created_by = u.id 
                 ORDER BY e.created_at DESC`;
    
    return new Promise((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(id) {
    const sql = `SELECT e.*, u.name as organizer_name, u.first_name, u.last_name, u.email as organizer_email
                 FROM events e 
                 LEFT JOIN users u ON e.created_by = u.id 
                 WHERE e.id = ?`;
    
    return new Promise((resolve, reject) => {
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async findByOrganizer(organizerId) {
    const sql = `SELECT e.*, u.name as organizer_name, u.first_name, u.last_name, u.email as organizer_email
                 FROM events e 
                 LEFT JOIN users u ON e.created_by = u.id 
                 WHERE e.created_by = ? 
                 ORDER BY e.created_at DESC`;
    
    return new Promise((resolve, reject) => {
      db.all(sql, [organizerId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async update(id, eventData) {
    const { title, description, date, location, capacity, category } = eventData;
    const sql = `UPDATE events SET title = ?, description = ?, date = ?, location = ?, capacity = ?, category = ? 
                 WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      db.run(sql, [title, description, date, location, capacity, category, id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  static async delete(id) {
    const sql = `DELETE FROM events WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      db.run(sql, [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  static async search(query) {
    const sql = `SELECT e.*, u.name as organizer_name, u.first_name, u.last_name, u.email as organizer_email
                 FROM events e 
                 LEFT JOIN users u ON e.created_by = u.id 
                 WHERE e.title LIKE ? OR e.description LIKE ? 
                 ORDER BY e.created_at DESC`;
    
    return new Promise((resolve, reject) => {
      db.all(sql, [`%${query}%`, `%${query}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async getCategories() {
    const sql = `SELECT DISTINCT category FROM events WHERE category IS NOT NULL ORDER BY category`;
    
    return new Promise((resolve, reject) => {
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.category));
      });
    });
  }
}

module.exports = Event;