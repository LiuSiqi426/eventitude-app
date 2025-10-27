import db from '../../database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';

const JWT_SECRET = 'your_jwt_secret_key';

export const register = function(req, res) {
    const { username, email, password, firstName, lastName } = req.body;

    console.log('Registration attempt - Received data:', { username, email, firstName, lastName });

    // 检查必需字段 - 根据现有表结构调整
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
            status: 'error',
            message: 'Email, password, first name and last name are required'
        });
    }

    // Check if user already exists - 使用现有的email列
    const checkSql = 'SELECT * FROM users WHERE email = ?';
    db.get(checkSql, [email], (err, row) => {
        if (err) {
            console.error('Database error in check:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error: ' + err.message
            });
        }

        if (row) {
            return res.status(409).json({
                status: 'error',
                message: 'User already exists with this email'
            });
        }

        // Hash password and create user - 使用现有的列名
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error hashing password'
                });
            }

            // 使用现有的表结构列名 - 注意：现有表没有username字段
            const insertSql = `INSERT INTO users (first_name, last_name, email, password, salt, created_date) 
                             VALUES (?, ?, ?, ?, ?, datetime('now'))`;
            
            // 为salt生成一个随机值
            const salt = bcrypt.genSaltSync(10);
            
            db.run(insertSql, [firstName, lastName, email, hashedPassword, salt], function(err) {
                if (err) {
                    console.error('Error creating user:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Error creating user: ' + err.message
                    });
                }

                const userId = this.lastID;
                console.log('User created successfully with ID:', userId);

                // 自动创建组织者记录
                createOrganizerForUser(userId, firstName, lastName, email, res);
            });
        });
    });
};

// 为新建用户自动创建组织者记录
function createOrganizerForUser(userId, firstName, lastName, email, res) {
    const organizerName = `${firstName} ${lastName}`;
    
    // 首先检查organizers表是否存在
    const checkTableSql = "SELECT name FROM sqlite_master WHERE type='table' AND name='organizers'";
    db.get(checkTableSql, [], (err, table) => {
        if (err) {
            console.error('Error checking organizers table:', err);
            return sendUserResponse(userId, firstName, lastName, email, res);
        }

        if (!table) {
            console.log('Organizers table does not exist, skipping organizer creation');
            return sendUserResponse(userId, firstName, lastName, email, res);
        }

        // 检查organizers表结构
        const checkColumnsSql = "PRAGMA table_info(organizers)";
        db.all(checkColumnsSql, [], (err, columns) => {
            if (err) {
                console.error('Error checking organizers table structure:', err);
                return sendUserResponse(userId, firstName, lastName, email, res);
            }

            // 构建插入organizer的SQL
            const columnNames = columns.map(col => col.name);
            const placeholders = columnNames.map(() => '?').join(', ');
            const values = [];

            // 根据表结构设置值
            if (columnNames.includes('name')) values.push(organizerName);
            if (columnNames.includes('email')) values.push(email);
            if (columnNames.includes('user_id')) values.push(userId);
            if (columnNames.includes('created_date')) values.push(new Date().toISOString());
            if (columnNames.includes('description')) values.push(`Organizer for ${organizerName}`);
            if (columnNames.includes('contact_info')) values.push(email);

            const insertOrganizerSql = `INSERT INTO organizers (${columnNames.join(', ')}) VALUES (${placeholders})`;
            
            db.run(insertOrganizerSql, values, function(err) {
                if (err) {
                    console.error('Error creating organizer:', err);
                    console.log('Organizer SQL:', insertOrganizerSql);
                    console.log('Organizer values:', values);
                    // 即使创建组织者失败，也返回用户创建成功
                    return sendUserResponse(userId, firstName, lastName, email, res);
                }

                const organizerId = this.lastID;
                console.log('Organizer created successfully with ID:', organizerId);

                // 更新用户的organizer_id（如果users表有organizer_id列）
                updateUserOrganizerId(userId, organizerId, firstName, lastName, email, res);
            });
        });
    });
}

// 更新用户的organizer_id
function updateUserOrganizerId(userId, organizerId, firstName, lastName, email, res) {
    // 检查users表是否有organizer_id列
    const checkColumnSql = "PRAGMA table_info(users)";
    db.all(checkColumnSql, [], (err, columns) => {
        if (err) {
            console.error('Error checking users table structure:', err);
            return sendUserResponse(userId, firstName, lastName, email, res, organizerId);
        }

        const hasOrganizerId = columns.some(col => col.name === 'organizer_id');
        
        if (hasOrganizerId) {
            const updateSql = 'UPDATE users SET organizer_id = ? WHERE user_id = ?';
            db.run(updateSql, [organizerId, userId], function(err) {
                if (err) {
                    console.error('Error updating user organizer_id:', err);
                    // 即使更新失败，也返回成功响应
                }
                sendUserResponse(userId, firstName, lastName, email, res, organizerId);
            });
        } else {
            sendUserResponse(userId, firstName, lastName, email, res, organizerId);
        }
    });
}

// 发送用户创建成功的响应
function sendUserResponse(userId, firstName, lastName, email, res, organizerId = null) {
    const token = jwt.sign(
        { userId: userId, email: email },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        token: token,
        user: {
            id: userId,
            firstName: firstName,
            lastName: lastName,
            email: email,
            organizer_id: organizerId
        }
    });
}

export const login = function(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Email and password are required'
        });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], (err, user) => {
        if (err) {
            console.error('Database error in login:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error'
            });
        }

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid credentials'
            });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            const token = jwt.sign(
                { userId: user.user_id, email: user.email },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // 获取用户的organizer_id（如果存在）
            let organizerId = null;
            if (user.organizer_id) {
                organizerId = user.organizer_id;
            } else {
                // 如果用户没有organizer_id，尝试从organizers表查找
                const findOrganizerSql = 'SELECT organizer_id FROM organizers WHERE user_id = ?';
                db.get(findOrganizerSql, [user.user_id], (err, organizer) => {
                    if (!err && organizer) {
                        organizerId = organizer.organizer_id;
                    }
                    
                    sendLoginResponse(res, token, user, organizerId);
                });
                return;
            }

            sendLoginResponse(res, token, user, organizerId);
        });
    });
};

function sendLoginResponse(res, token, user, organizerId) {
    res.json({
        status: 'success',
        message: 'Login successful',
        token: token,
        user: {
            id: user.user_id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            organizer_id: organizerId
        }
    });
}

export const logout = function(req, res) {
    res.json({
        status: 'success',
        message: 'Logout successful'
    });
};

export const getProfile = function(req, res) {
    const userId = req.userId || req.params.userId; // 支持从token或参数获取

    const sql = 'SELECT user_id, first_name, last_name, email, organizer_id, created_date FROM users WHERE user_id = ?';
    db.get(sql, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Database error'
            });
        }

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // 如果用户没有organizer_id，尝试从organizers表查找
        let organizerId = user.organizer_id;
        if (!organizerId) {
            const findOrganizerSql = 'SELECT organizer_id FROM organizers WHERE user_id = ?';
            db.get(findOrganizerSql, [userId], (err, organizer) => {
                if (!err && organizer) {
                    organizerId = organizer.organizer_id;
                }
                sendProfileResponse(res, user, organizerId);
            });
            return;
        }

        sendProfileResponse(res, user, organizerId);
    });
};

function sendProfileResponse(res, user, organizerId) {
    res.json({
        status: 'success',
        data: {
            id: user.user_id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            organizer_id: organizerId,
            created_at: user.created_date
        }
    });
}

export const updateProfile = function(req, res) {
    const userId = req.userId || req.params.userId;
    const { firstName, lastName } = req.body;

    const sql = 'UPDATE users SET first_name = ?, last_name = ? WHERE user_id = ?';
    db.run(sql, [firstName, lastName, userId], function(err) {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Database error'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Profile updated successfully'
        });
    });
};

export const getAllUsers = function(req, res) {
    const sql = 'SELECT user_id, first_name, last_name, email, organizer_id, created_date FROM users';
    db.all(sql, [], (err, users) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Database error'
            });
        }

        const formattedUsers = users.map(user => ({
            id: user.user_id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            organizer_id: user.organizer_id,
            created_at: user.created_date
        }));

        res.json({
            status: 'success',
            data: formattedUsers
        });
    });
};

// 新增：获取所有组织者（用于事件表单下拉选择）
export const getOrganizers = function(req, res) {
    // 首先检查organizers表是否存在
    const checkTableSql = "SELECT name FROM sqlite_master WHERE type='table' AND name='organizers'";
    db.get(checkTableSql, [], (err, table) => {
        if (err || !table) {
            // 如果organizers表不存在，返回所有用户作为组织者
            return getAllUsersAsOrganizers(req, res);
        }

        // 获取所有组织者及其关联的用户信息
        const sql = `
            SELECT o.organizer_id, o.name, o.email, o.user_id,
                   u.first_name, u.last_name, u.email as user_email
            FROM organizers o
            LEFT JOIN users u ON o.user_id = u.user_id
        `;
        
        db.all(sql, [], (err, organizers) => {
            if (err) {
                console.error('Error fetching organizers:', err);
                return getAllUsersAsOrganizers(req, res);
            }

            const formattedOrganizers = organizers.map(org => ({
                id: org.organizer_id,
                name: org.name || `${org.first_name} ${org.last_name}`,
                email: org.email || org.user_email,
                user_id: org.user_id
            }));

            res.json({
                status: 'success',
                data: formattedOrganizers
            });
        });
    });
};

// 备用方案：如果organizers表不存在，返回所有用户作为组织者
function getAllUsersAsOrganizers(req, res) {
    const sql = 'SELECT user_id, first_name, last_name, email FROM users';
    db.all(sql, [], (err, users) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Database error'
            });
        }

        const organizers = users.map(user => ({
            id: user.user_id, // 使用user_id作为组织者ID
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            user_id: user.user_id
        }));

        res.json({
            status: 'success',
            data: organizers
        });
    });
}

export default {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    getAllUsers,
    getOrganizers // 新增导出
};