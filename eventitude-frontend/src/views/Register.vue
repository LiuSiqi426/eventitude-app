<template>
  <div class="register-page">
    <div class="register-container">
      <h2>注册 Eventitude 账户</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-row">
          <div class="form-group">
            <label>姓 *</label>
            <input 
              v-model="userData.firstName" 
              type="text" 
              placeholder="请输入姓"
              required 
            />
          </div>
          <div class="form-group">
            <label>名 *</label>
            <input 
              v-model="userData.lastName" 
              type="text" 
              placeholder="请输入名"
              required 
            />
          </div>
        </div>
        
        <div class="form-group">
          <label>邮箱 *</label>
          <input 
            v-model="userData.email" 
            type="email" 
            placeholder="请输入邮箱地址"
            required 
          />
        </div>
        
        <div class="form-group">
          <label>密码 *</label>
          <input 
            v-model="userData.password" 
            type="password" 
            placeholder="请输入密码（至少6位）"
            required 
            minlength="6"
          />
        </div>

        <div class="form-group" v-if="confirmPassword">
          <label>确认密码 *</label>
          <input 
            v-model="userData.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码"
            required 
          />
          <small v-if="userData.confirmPassword && !passwordsMatch" class="error-text">
            密码不一致
          </small>
        </div>

        <button 
          type="submit" 
          class="btn-primary" 
          :disabled="loading || (confirmPassword && !passwordsMatch)"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <p class="switch-mode">
        已有账户？ <router-link to="/login">立即登录</router-link>
      </p>

      <!-- 注册成功后的信息展示 -->
      <div v-if="registrationSuccess" class="success-message">
        <h3>🎉 注册成功！</h3>
        <div class="user-info-preview">
          <p><strong>姓名:</strong> {{ userData.lastName }} {{ userData.firstName }}</p>
          <p><strong>邮箱:</strong> {{ userData.email }}</p>
          <p v-if="registeredUser.organizer_id" class="organizer-id">
            <strong>组织者ID:</strong> {{ registeredUser.organizer_id }}
          </p>
        </div>
        <p>系统已自动为您分配组织者ID，现在可以创建活动了！</p>
        <button @click="goToLogin" class="btn-success">
          立即登录
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { authAPI } from '../services/api';

export default {
  name: 'RegisterPage',
  data() {
    return {
      userData: {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      loading: false,
      registrationSuccess: false,
      registeredUser: {},
      confirmPassword: true // 控制是否显示确认密码字段
    };
  },
  computed: {
    passwordsMatch() {
      if (!this.confirmPassword) return true;
      return this.userData.password === this.userData.confirmPassword;
    }
  },
  methods: {
    async handleRegister() {
      // 前端验证
      if (this.confirmPassword && !this.passwordsMatch) {
        alert('密码不一致，请重新输入');
        return;
      }

      if (this.userData.password.length < 6) {
        alert('密码长度至少6位');
        return;
      }

      this.loading = true;
      try {
        console.log('🔄 开始注册过程...');
        console.log('📝 提交的表单数据:', {
          firstName: this.userData.firstName,
          lastName: this.userData.lastName,
          email: this.userData.email,
          password: '***' // 不记录真实密码
        });

        // 调用注册API
        const registrationData = {
          firstName: this.userData.firstName.trim(),
          lastName: this.userData.lastName.trim(),
          email: this.userData.email.trim(),
          password: this.userData.password
        };
        
        console.log('📡 调用注册API，数据:', registrationData);
        const response = await authAPI.register(registrationData);

        console.log('✅ 注册API调用成功!');
        console.log('📊 完整的API响应:', response);
        console.log('🔑 响应状态码:', response.status);
        console.log('📨 响应数据:', response.data);
        console.log('👤 响应中的用户数据:', response.data.user);
        console.log('🎫 响应中的token:', response.data.token);

        // 注册成功
        this.registeredUser = response.data.user;
        this.registrationSuccess = true;

        console.log('💾 开始保存数据到本地存储...');
        
        // 保存用户信息到本地存储
        if (response.data.user) {
          localStorage.setItem('userData', JSON.stringify(response.data.user));
          console.log('✅ userData 保存成功:', response.data.user);
        } else {
          console.warn('⚠️ 响应中没有user数据，使用表单数据创建');
          const fallbackUser = {
            firstName: this.userData.firstName,
            lastName: this.userData.lastName,
            email: this.userData.email,
            id: 'temp_' + Date.now(),
            organizer_id: 'ORG_' + Date.now().toString().slice(-4)
          };
          localStorage.setItem('userData', JSON.stringify(fallbackUser));
          this.registeredUser = fallbackUser;
        }

        // 保存token
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
          console.log('✅ authToken 保存成功');
        } else {
          console.warn('⚠️ 响应中没有token');
        }

        // 保存注册表单数据作为备用
        localStorage.setItem('registrationData', JSON.stringify({
          firstName: this.userData.firstName,
          lastName: this.userData.lastName,
          email: this.userData.email,
          timestamp: new Date().toISOString()
        }));
        console.log('✅ registrationData 保存成功');

        // 验证所有数据是否保存成功
        console.log('🔍 验证本地存储内容:');
        console.log('   userData:', localStorage.getItem('userData'));
        console.log('   authToken:', localStorage.getItem('authToken') ? '存在' : '不存在');
        console.log('   registrationData:', localStorage.getItem('registrationData'));

        // 显示所有本地存储内容
        console.log('📋 所有本地存储键:');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          console.log(`   ${key}:`, localStorage.getItem(key));
        }

        console.log('🎉 注册流程完成!');
        
      } catch (error) {
        console.error('❌ 注册失败:', error);
        console.error('🔧 错误详情:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          config: error.config
        });
        
        let errorMessage = '注册失败: ';
        
        if (error.response) {
          if (error.response.data.error) {
            errorMessage += error.response.data.error;
          } else if (error.response.data.message) {
            errorMessage += error.response.data.message;
          } else {
            errorMessage += '服务器错误，请稍后重试';
          }
        } else if (error.request) {
          errorMessage += '网络错误，请检查网络连接';
        } else {
          errorMessage += error.message;
        }
        
        alert(errorMessage);
      } finally {
        this.loading = false;
      }
    },

    goToLogin() {
      console.log('🚀 跳转到登录页面');
      this.$router.push('/login');
    },

    // 重置表单
    resetForm() {
      this.userData = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      };
      this.registrationSuccess = false;
      this.registeredUser = {};
    }
  },
  watch: {
    // 监听路由变化，当离开注册页面时重置表单
    '$route'(to, from) {
      if (from.name === 'register' && to.name !== 'register') {
        this.resetForm();
      }
    }
  },
  mounted() {
    console.log('📍 Register页面已加载');
    console.log('🔍 当前本地存储内容:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`   ${key}:`, localStorage.getItem(key));
    }
  }
};
</script>

<style scoped>
/* 样式保持不变 */
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-container {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 450px;
}

.register-container h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
  font-size: 1.8rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-group input:invalid {
  border-color: #e74c3c;
}

.error-text {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 5px;
  display: block;
}

.btn-primary {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-success {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 15px;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);
}

.switch-mode {
  margin-top: 25px;
  text-align: center;
  color: #6c757d;
}

.switch-mode a {
  color: #3498db;
  text-decoration: none;
  font-weight: 600;
}

.switch-mode a:hover {
  text-decoration: underline;
}

.success-message {
  margin-top: 30px;
  padding: 20px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  text-align: center;
}

.success-message h3 {
  color: #155724;
  margin-bottom: 15px;
}

.user-info-preview {
  background: white;
  padding: 15px;
  border-radius: 6px;
  margin: 15px 0;
  text-align: left;
}

.user-info-preview p {
  margin: 8px 0;
  color: #495057;
}

.organizer-id {
  background: #3498db;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  display: inline-block;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .register-container {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .register-container h2 {
    font-size: 1.5rem;
  }
}
</style>
