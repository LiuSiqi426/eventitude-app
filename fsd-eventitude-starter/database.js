import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'db.sqlite');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        // 启用外键约束
        db.run('PRAGMA foreign_keys = ON');
    }
});

// 创建表
db.serialize(() => {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        salt TEXT NOT NULL,
        session_token TEXT,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            console.log('✅ Users table created/verified');
        }
    });

    // 事件表
    db.run(`CREATE TABLE IF NOT EXISTS events (
        event_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        date DATETIME NOT NULL,
        location TEXT,
        organizer_id INTEGER NOT NULL,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organizer_id) REFERENCES users(user_id)
    )`, (err) => {
        if (err) {
            console.error('Error creating events table:', err);
        } else {
            console.log('✅ Events table created/verified');
        }
    });

    // 问题表
    db.run(`CREATE TABLE IF NOT EXISTS questions (
        question_id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_text TEXT NOT NULL,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        upvotes INTEGER DEFAULT 0,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(event_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    )`, (err) => {
        if (err) {
            console.error('Error creating questions table:', err);
        } else {
            console.log('✅ Questions table created/verified');
        }
    });

    // === 新增：分类表 ===
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        category_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating categories table:', err);
        } else {
            console.log('✅ Categories table created/verified');
            
            // 插入默认分类
            const defaultCategories = [
                { name: 'Technology', description: 'Technology related events' },
                { name: 'Education', description: 'Educational events' },
                { name: 'Social', description: 'Social gatherings' },
                { name: 'Sports', description: 'Sports activities' },
                { name: 'Arts', description: 'Arts and culture events' },
                { name: 'Business', description: 'Business networking events' }
            ];

            defaultCategories.forEach(category => {
                db.run('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)', 
                    [category.name, category.description], (err) => {
                    if (err && !err.message.includes('UNIQUE constraint failed')) {
                        console.error('Error inserting category:', err);
                    }
                });
            });
        }
    });

    // === 新增：事件分类关联表 ===
    db.run(`CREATE TABLE IF NOT EXISTS event_categories (
        event_category_id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE,
        UNIQUE(event_id, category_id)
    )`, (err) => {
        if (err) {
            console.error('Error creating event_categories table:', err);
        } else {
            console.log('✅ Event categories table created/verified');
        }
    });
});

// 错误处理
db.on('error', (err) => {
    console.error('Database error:', err);
});

export default db;