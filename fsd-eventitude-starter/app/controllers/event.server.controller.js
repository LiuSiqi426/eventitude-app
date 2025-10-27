import db from '../../database.js';
import profanityFilter from '../libs/profanityFilter.js';

// 辅助函数：获取事件的分类信息
const getEventCategories = (eventId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT c.category_id as id, c.name, c.description 
            FROM categories c
            JOIN event_categories ec ON c.category_id = ec.category_id
            WHERE ec.event_id = ?
        `;
        
        db.all(query, [eventId], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// 辅助函数：关联事件和分类
const linkEventToCategories = (eventId, categoryIds) => {
    return new Promise((resolve, reject) => {
        if (!categoryIds || categoryIds.length === 0) {
            resolve();
            return;
        }
        
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
};

export const getAllEvents = function(req, res) {
    const sql = `SELECT e.*, u.first_name || ' ' || u.last_name as organizer_name,
                GROUP_CONCAT(DISTINCT c.category_id) as category_ids,
                GROUP_CONCAT(DISTINCT c.name) as category_names
                FROM events e 
                JOIN users u ON e.organizer_id = u.user_id 
                LEFT JOIN event_categories ec ON e.event_id = ec.event_id
                LEFT JOIN categories c ON ec.category_id = c.category_id
                GROUP BY e.event_id
                ORDER BY e.created_date DESC`;
    
    db.all(sql, [], async (err, events) => {
        if (err) {
            console.error('Database error in getAllEvents:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error'
            });
        }

        // 格式化事件数据以匹配前端期望的结构
        const formattedEvents = events.map(event => ({
            id: event.event_id,
            title: event.title,
            description: event.description,
            date: event.date,
            location: event.location,
            organizer_id: event.organizer_id,
            organizer_name: event.organizer_name,
            created_at: event.created_date,
            categories: event.category_ids ? event.category_ids.split(',').map((id, index) => ({
                id: parseInt(id),
                name: event.category_names.split(',')[index]
            })) : []
        }));

        res.json({
            status: 'success',
            data: formattedEvents
        });
    });
};

export const getEvent = function(req, res) {
    const eventId = req.params.eventId;

    const sql = `SELECT e.*, u.first_name || ' ' || u.last_name as organizer_name,
                GROUP_CONCAT(DISTINCT c.category_id) as category_ids,
                GROUP_CONCAT(DISTINCT c.name) as category_names
                FROM events e 
                JOIN users u ON e.organizer_id = u.user_id 
                LEFT JOIN event_categories ec ON e.event_id = ec.event_id
                LEFT JOIN categories c ON ec.category_id = c.category_id
                WHERE e.event_id = ?
                GROUP BY e.event_id`;
    
    db.get(sql, [eventId], (err, event) => {
        if (err) {
            console.error('Database error in getEvent:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error'
            });
        }

        if (!event) {
            return res.status(404).json({
                status: 'error',
                message: 'Event not found'
            });
        }

        const formattedEvent = {
            id: event.event_id,
            title: event.title,
            description: event.description,
            date: event.date,
            location: event.location,
            organizer_id: event.organizer_id,
            organizer_name: event.organizer_name,
            created_at: event.created_date,
            categories: event.category_ids ? event.category_ids.split(',').map((id, index) => ({
                id: parseInt(id),
                name: event.category_names.split(',')[index]
            })) : []
        };

        res.json({
            status: 'success',
            data: formattedEvent
        });
    });
};

export const createEvent = function(req, res) {
    const { title, description, date, location, organizer_id, category_ids } = req.body;

    if (!title || !date || !organizer_id) {
        return res.status(400).json({
            status: 'error',
            message: 'Title, date and organizer_id are required'
        });
    }

    if (profanityFilter.containsProfanity(title) || profanityFilter.containsProfanity(description)) {
        return res.status(400).json({
            status: 'error',
            message: 'Content contains inappropriate language'
        });
    }

    const filteredTitle = profanityFilter.filter(title);
    const filteredDescription = description ? profanityFilter.filter(description) : '';

    const sql = `INSERT INTO events (title, description, date, location, organizer_id, created_date) 
                VALUES (?, ?, ?, ?, ?, datetime('now'))`;
    
    db.run(sql, [title, description, date, location, organizer_id], async function(err) {
        if (err) {
            console.error('Error creating event:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Error creating event: ' + err.message
            });
        }

        const eventId = this.lastID;

        try {
            // 关联分类
            await linkEventToCategories(eventId, category_ids);
            
            // 获取完整的事件信息（包含分类）
            const categories = await getEventCategories(eventId);
            
            res.status(201).json({
                status: 'success',
                message: 'Event created successfully',
                eventId: eventId,
                data: {
                    id: eventId,
                    title,
                    description,
                    date,
                    location,
                    organizer_id,
                    categories
                }
            });
            
        } catch (error) {
            console.error('Error linking categories:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Event created but failed to link categories'
            });
        }
    });
};

export const updateEvent = function(req, res) {
    const eventId = req.params.eventId;
    const { title, description, date, location, category_ids } = req.body;

    if (!title || !date) {
        return res.status(400).json({
            status: 'error',
            message: 'Title and date are required'
        });
    }

    if (profanityFilter.containsProfanity(title) || profanityFilter.containsProfanity(description)) {
        return res.status(400).json({
            status: 'error',
            message: 'Content contains inappropriate language'
        });
    }

    const filteredTitle = profanityFilter.filter(title);
    const filteredDescription = description ? profanityFilter.filter(description) : '';

    // 开始事务
    db.serialize(async () => {
        // 更新事件基本信息
        const updateEventSql = `UPDATE events SET title = ?, description = ?, date = ?, location = ? 
                              WHERE event_id = ?`;
        
        db.run(updateEventSql, [title, description, date, location, eventId], async function(err) {
            if (err) {
                console.error('Database error in updateEvent:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Database error: ' + err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Event not found'
                });
            }

            try {
                // 删除旧的分类关联
                db.run('DELETE FROM event_categories WHERE event_id = ?', [eventId]);
                
                // 添加新的分类关联
                await linkEventToCategories(eventId, category_ids);
                
                // 获取更新后的事件信息
                const categories = await getEventCategories(eventId);
                
                res.json({
                    status: 'success',
                    message: 'Event updated successfully',
                    data: {
                        id: parseInt(eventId),
                        title,
                        description,
                        date,
                        location,
                        categories
                    }
                });
                
            } catch (error) {
                console.error('Error updating categories:', error);
                return res.status(500).json({
                    status: 'error',
                    message: 'Event updated but failed to update categories'
                });
            }
        });
    });
};

export const deleteEvent = function(req, res) {
    const eventId = req.params.eventId;

    // 开始事务
    db.serialize(() => {
        // 先删除相关的问题
        const deleteQuestionsSql = 'DELETE FROM questions WHERE event_id = ?';
        db.run(deleteQuestionsSql, [eventId], (err) => {
            if (err) {
                console.error('Error deleting questions:', err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error deleting event questions'
                });
            }

            // 删除分类关联
            const deleteCategoriesSql = 'DELETE FROM event_categories WHERE event_id = ?';
            db.run(deleteCategoriesSql, [eventId], (err) => {
                if (err) {
                    console.error('Error deleting category links:', err);
                    return res.status(500).json({
                        status: 'error',
                        message: 'Error deleting event category links'
                    });
                }

                // 然后删除事件
                const deleteEventSql = 'DELETE FROM events WHERE event_id = ?';
                db.run(deleteEventSql, [eventId], function(err) {
                    if (err) {
                        console.error('Database error in deleteEvent:', err);
                        return res.status(500).json({
                            status: 'error',
                            message: 'Database error: ' + err.message
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            status: 'error',
                            message: 'Event not found'
                        });
                    }

                    res.json({
                        status: 'success',
                        message: 'Event deleted successfully'
                    });
                });
            });
        });
    });
};

export const searchEvents = function(req, res) {
    const query = req.params.query;
    const categoryId = req.query.category_id; // 新增：支持按分类筛选

    if (!query || query.trim() === '') {
        return res.status(400).json({
            status: 'error',
            message: 'Search query is required'
        });
    }

    let sql = `SELECT e.*, u.first_name || ' ' || u.last_name as organizer_name,
              GROUP_CONCAT(DISTINCT c.category_id) as category_ids,
              GROUP_CONCAT(DISTINCT c.name) as category_names
              FROM events e 
              JOIN users u ON e.organizer_id = u.user_id 
              LEFT JOIN event_categories ec ON e.event_id = ec.event_id
              LEFT JOIN categories c ON ec.category_id = c.category_id
              WHERE (e.title LIKE ? OR e.description LIKE ?)`;
    
    const queryParams = [`%${query.trim()}%`, `%${query.trim()}%`];
    
    // 如果提供了分类ID，添加分类筛选
    if (categoryId) {
        sql += ' AND c.category_id = ?';
        queryParams.push(categoryId);
    }
    
    sql += ' GROUP BY e.event_id ORDER BY e.created_date DESC';
    
    db.all(sql, queryParams, (err, events) => {
        if (err) {
            console.error('Database error in searchEvents:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error'
            });
        }

        const formattedEvents = events.map(event => ({
            id: event.event_id,
            title: event.title,
            description: event.description,
            date: event.date,
            location: event.location,
            organizer_id: event.organizer_id,
            organizer_name: event.organizer_name,
            created_at: event.created_date,
            categories: event.category_ids ? event.category_ids.split(',').map((id, index) => ({
                id: parseInt(id),
                name: event.category_names.split(',')[index]
            })) : []
        }));

        res.json({
            status: 'success',
            data: formattedEvents
        });
    });
};

// 新增：获取特定组织者的所有活动
export const getEventsByOrganizer = function(req, res) {
    const organizerId = req.params.organizerId;

    console.log('获取组织者活动，组织者ID:', organizerId);

    const sql = `SELECT e.*, u.first_name || ' ' || u.last_name as organizer_name,
                GROUP_CONCAT(DISTINCT c.category_id) as category_ids,
                GROUP_CONCAT(DISTINCT c.name) as category_names
                FROM events e 
                JOIN users u ON e.organizer_id = u.user_id 
                LEFT JOIN event_categories ec ON e.event_id = ec.event_id
                LEFT JOIN categories c ON ec.category_id = c.category_id
                WHERE e.organizer_id = ?
                GROUP BY e.event_id
                ORDER BY e.created_date DESC`;
    
    db.all(sql, [organizerId], (err, events) => {
        if (err) {
            console.error('Database error in getEventsByOrganizer:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error: ' + err.message
            });
        }

        console.log(`找到 ${events.length} 个活动`);

        // 格式化事件数据
        const formattedEvents = events.map(event => ({
            id: event.event_id,
            title: event.title,
            description: event.description,
            date: event.date,
            location: event.location,
            organizer_id: event.organizer_id,
            organizer_name: event.organizer_name,
            created_at: event.created_date,
            categories: event.category_ids ? event.category_ids.split(',').map((id, index) => ({
                id: parseInt(id),
                name: event.category_names.split(',')[index]
            })) : []
        }));

        res.json({
            status: 'success',
            data: formattedEvents,
            count: formattedEvents.length
        });
    });
};

// 新增：获取所有分类
export const getCategories = function(req, res) {
    const sql = 'SELECT category_id as id, name, description FROM categories ORDER BY name';
    
    db.all(sql, [], (err, categories) => {
        if (err) {
            console.error('Database error in getCategories:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error'
            });
        }

        res.json({
            status: 'success',
            data: categories
        });
    });
};

export default {
    getAllEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    searchEvents,
    getEventsByOrganizer, // 新增导出
    getCategories  // 新增导出
};