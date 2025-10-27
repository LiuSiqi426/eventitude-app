import db from '../../database.js';

// 获取所有分类
export const getCategories = (req, res) => {
    const query = 'SELECT * FROM categories ORDER BY name';
    
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to fetch categories' 
            });
        }
        
        res.json({
            success: true,
            data: rows
        });
    });
};

// 创建新分类（可选）
export const createCategory = (req, res) => {
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ 
            success: false,
            error: 'Category name is required' 
        });
    }
    
    const query = 'INSERT INTO categories (name, description) VALUES (?, ?)';
    
    db.run(query, [name, description], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Category name already exists' 
                });
            }
            console.error('Error creating category:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Failed to create category' 
            });
        }
        
        res.json({
            success: true,
            message: 'Category created successfully',
            data: { 
                category_id: this.lastID, 
                name, 
                description 
            }
        });
    });
};