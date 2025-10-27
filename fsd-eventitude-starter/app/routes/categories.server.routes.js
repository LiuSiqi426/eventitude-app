import express from 'express';
import { getCategories, createCategory } from '../controllers/categoriesController.js';

const router = express.Router();

// 获取所有分类
router.get('/', getCategories);

// 创建新分类
router.post('/', createCategory);

export default router;