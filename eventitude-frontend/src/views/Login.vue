<template>
  <div class="login">
    <h2>登录</h2>
    <form @submit.prevent="handleLogin" class="login-form">
      <input v-model="email" type="email" placeholder="邮箱" required>
      <input v-model="password" type="password" placeholder="密码" required>
      <button type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
    <p>还没有账户？ <router-link to="/register">立即注册</router-link></p>

  <!-- 添加调试信息 -->
    <div v-if="debugInfo" class="debug-info">
      <h4>调试信息</h4>
      <p>API地址: {{ API_BASE_URL }}</p>
      <p>请求状态: {{ requestStatus }}</p>
      <p>错误信息: {{ errorMessage }}</p>
    </div>
  </div>
</template>

<script>
import { authAPI } from '../services/api';

const API_BASE_URL = 'http://localhost:3333/api';

export default {
  name: 'LoginPage',
  data() {
    return {
      email: '',
      password: '',
      loading: false,
      debugInfo: true, // 设置为true显示调试信息
      requestStatus: '未开始',
      errorMessage: ''
    }
  },
  computed: {
    API_BASE_URL() {
      return API_BASE_URL;
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.requestStatus = '请求中...';
      this.errorMessage = '';
      
      console.log('🔄 开始登录流程...');
      console.log('📧 邮箱:', this.email);
      console.log('🔐 密码:', '***' + this.password.slice(-2)); // 安全地显示部分密码
      console.log('🌐 API地址:', API_BASE_URL);
      
      try {
        // 测试API连接
        console.log('📡 发送登录请求...');
        this.requestStatus = '发送登录请求';
        
        const credentials = {
          email: this.email,
          password: this.password
        };
        
        console.log('📦 请求数据:', credentials);
        
        const response = await authAPI.login(credentials);
        
        console.log('✅ 登录成功!');
        console.log('📊 响应数据:', response);
        console.log('🔑 Token:', response.data.token);
        console.log('👤 用户数据:', response.data.user);
        
        this.requestStatus = '登录成功';
        
        // 保存认证信息
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
          console.log('✅ Token保存成功');
        }
        
        // 保存用户ID
        if (response.data.user && response.data.user.id) {
          localStorage.setItem('userId', response.data.user.id);
          console.log('✅ 用户ID保存成功:', response.data.user.id);
        } else {
          console.warn('⚠️ 响应中没有用户ID');
          // 使用邮箱作为临时用户ID
          localStorage.setItem('userId', this.email);
        }
        
        // 保存完整的用户信息
        if (response.data.user) {
          localStorage.setItem('userData', JSON.stringify(response.data.user));
          console.log('✅ 用户数据保存成功');
        }
        
        // 显示所有本地存储内容用于调试
        console.log('📋 登录后本地存储内容:');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const value = localStorage.getItem(key);
          console.log(`   ${key}:`, value);
        }
        
        // 跳转到活动页面
        this.$router.push('/events');
        
      } catch (error) {
        console.error('❌ 登录失败:', error);
        this.requestStatus = '登录失败';
        
        let errorMsg = '登录失败: ';
        
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
          errorMsg += '无法连接到服务器，请检查后端是否运行在 localhost:3333';
          this.errorMessage = '网络连接错误 - 后端服务器可能未启动';
        } else if (error.response) {
          // 服务器响应了错误状态码
          console.error('服务器错误响应:', error.response);
          errorMsg += `服务器错误 (${error.response.status}): `;
          
          if (error.response.data && error.response.data.message) {
            errorMsg += error.response.data.message;
            this.errorMessage = error.response.data.message;
          } else {
            errorMsg += '未知服务器错误';
            this.errorMessage = `HTTP ${error.response.status}`;
          }
        } else if (error.request) {
          // 请求发送了但没有收到响应
          errorMsg += '网络错误，请检查网络连接';
          this.errorMessage = '网络请求失败 - 请检查后端服务';
        } else {
          // 其他错误
          errorMsg += error.message;
          this.errorMessage = error.message;
        }
        
        alert(errorMsg);
        
      } finally {
        this.loading = false;
        console.log('🏁 登录流程结束');
      }
    }
  },
  mounted() {
    console.log('📍 Login页面已加载');
    console.log('🔍 当前本地存储内容:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`   ${key}:`, localStorage.getItem(key));
    }
  }
}
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.login-form input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.login-form button {
  padding: 12px;
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.login-form button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* 调试信息样式 */
.debug-info {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.9rem;
}

.debug-info h4 {
  margin: 0 0 0.5rem 0;
  color: #6c757d;
}

.debug-info p {
  margin: 0.25rem 0;
  font-family: monospace;
}
</style>