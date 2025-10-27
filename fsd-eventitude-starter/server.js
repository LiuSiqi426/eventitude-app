import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import './database.js';

const app = express();
const HTTP_PORT = 3333;

// 🔥 修复1：详细CORS配置
app.use(cors({
  origin: true, // 允许所有来源，或者指定 ['http://localhost:8080', 'http://127.0.0.1:8080']
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 🔥 修复2：处理预检请求
app.options('*', cors());

// 中间件必须在路由之前！
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 根端点
app.get('/', (req, res) => {
  res.json({
    'status': 'Alive',
    'message': 'Eventitude Server is running!',
    'timestamp': new Date().toISOString(),
    'endpoints': [
      '/api/health',
      '/api/users/register',
      '/api/users/login', 
      '/api/events',
      '/api/categories'
    ]
  });
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is healthy and connected!',
    timestamp: new Date().toISOString(),
    database: 'SQLite connected'
  });
});

// 导入路由
import userRoutes from './app/routes/user.server.routes.js';
import eventRoutes from './app/routes/event.server.routes.js';
import questionRoutes from './app/routes/question.server.routes.js';
import categoriesRoutes from './app/routes/categories.server.routes.js';

// 使用路由
userRoutes(app);
eventRoutes(app);
questionRoutes(app);
app.use('/api/categories', categoriesRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint ${req.originalUrl} not found`
  });
});

// 启动服务器
app.listen(HTTP_PORT, '0.0.0.0', () => { // 🔥 修复3：监听所有网络接口
  console.log('🚀 =================================');
  console.log('🎯 Eventitude Server Started!');
  console.log(`📡 Port: ${HTTP_PORT}`);
  console.log(`🌐 Local: http://localhost:${HTTP_PORT}`);
  console.log(`🌐 Network: http://127.0.0.1:${HTTP_PORT}`);
  console.log(`🔗 Health: http://localhost:${HTTP_PORT}/api/health`);
  console.log('⏰', new Date().toLocaleString());
  console.log('🚀 =================================');
});

// 添加CORS支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

export default app;