const db = require('../libs/database');

class Question {
  static async create(questionData) {
    const { question, asked_by, event_id } = questionData;
    const sql = `INSERT INTO questions (question, asked_by, event_id, created_at) 
                 VALUES (?, ?, ?, datetime('now'))`;
    
    return new Promise((resolve, reject) => {
      db.run(sql, [question, asked_by, event_id], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  static async findByEventId(eventId) {
    const sql = `SELECT q.*, u.name as asker_name 
                 FROM questions q 
                 LEFT JOIN users u ON q.asked_by = u.id 
                 WHERE q.event_id = ? 
                 ORDER BY q.votes DESC, q.created_at DESC`;
    
    return new Promise((resolve, reject) => {
      db.all(sql, [eventId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async findById(id) {
    const sql = `SELECT q.*, u.name as asker_name 
                 FROM questions q 
                 LEFT JOIN users u ON q.asked_by = u.id 
                 WHERE q.id = ?`;
    
    return new Promise((resolve, reject) => {
      db.get(sql, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static async addVote(questionId, userId) {
    // 检查是否已经投过票
    const checkSql = `SELECT * FROM question_votes WHERE question_id = ? AND user_id = ?`;
    const insertSql = `INSERT INTO question_votes (question_id, user_id) VALUES (?, ?)`;
    const updateSql = `UPDATE questions SET votes = votes + 1 WHERE id = ?`;
    
    return new Promise((resolve, reject) => {
      db.get(checkSql, [questionId, userId], (err, row) => {
        if (err) return reject(err);
        if (row) return resolve(0); // 已经投过票
        
        db.serialize(() => {
          db.run(insertSql, [questionId, userId]);
          db.run(updateSql, [questionId], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
          });
        });
      });
    });
  }

  static async removeVote(questionId, userId) {
    const deleteSql = `DELETE FROM question_votes WHERE question_id = ? AND user_id = ?`;
    const updateSql = `UPDATE questions SET votes = votes - 1 WHERE id = ? AND votes > 0`;
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run(deleteSql, [questionId, userId]);
        db.run(updateSql, [questionId], function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        });
      });
    });
  }

  static async hasUserVoted(questionId, userId) {
    const sql = `SELECT 1 FROM question_votes WHERE question_id = ? AND user_id = ?`;
    
    return new Promise((resolve, reject) => {
      db.get(sql, [questionId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });
  }

  static async delete(id, userId) {
    const sql = `DELETE FROM questions WHERE id = ? AND asked_by = ?`;
    
    return new Promise((resolve, reject) => {
      db.run(sql, [id, userId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
}

module.exports = Question;