<!-- src/views/Profile.vue -->
<template>
  <div class="profile-page">
    <h1>个人资料</h1>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="retryLoad" class="btn-primary">重试</button>
    </div>
    
    <!-- 正常显示 -->
    <div v-else>
      <div class="profile-card">
        <div class="profile-header">
          <h2>用户信息</h2>
          <button @click="refreshData" class="btn-refresh">🔄 刷新</button>
        </div>
        
        <div class="profile-content" v-if="userProfile">
          <div class="info-grid">
            <div class="info-item">
              <label>姓:</label>
              <span>{{ userProfile.lastName || userProfile.lastname || '未设置' }}</span>
            </div>
            <div class="info-item">
              <label>名:</label>
              <span>{{ userProfile.firstName || userProfile.firstname || '未设置' }}</span>
            </div>
            <div class="info-item">
              <label>邮箱:</label>
              <span>{{ userProfile.email || '未设置' }}</span>
            </div>
            <div class="info-item">
              <label>组织者ID:</label>
              <span class="organizer-id">{{ getOrganizerId() }}</span>
            </div>
            <div class="info-item">
              <label>用户ID:</label>
              <span>{{ userProfile.id || userProfile.userId || '未知' }}</span>
            </div>
            <div class="info-item">
              <label>注册时间:</label>
              <span>{{ formatDate(userProfile.createdAt || userProfile.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户创建的活动 -->
      <div class="user-events">
        <h3>我创建的活动</h3>
        <div v-if="userEvents.length > 0" class="events-grid">
          <div v-for="event in userEvents" :key="event.id" class="event-card">
            <div class="event-header">
              <h4>{{ event.title }}</h4>
              <span class="event-status" :class="getEventStatus(event.date)">
                {{ getEventStatusText(event.date) }}
              </span>
            </div>
            <p class="event-description">{{ event.description }}</p>
            <div class="event-details">
              <div class="detail-item">
                <span class="icon">📅</span>
                <span>{{ formatEventDate(event.date) }}</span>
              </div>
              <div class="detail-item">
                <span class="icon">📍</span>
                <span>{{ event.location }}</span>
              </div>
            </div>
            <div class="event-actions">
              <button @click="editEvent(event)" class="btn-secondary btn-small">编辑</button>
              <button @click="deleteEvent(event.id)" class="btn-danger btn-small">删除</button>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📝</div>
          <p>你还没有创建任何活动</p>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- 在 script 部分修复导入 -->
<script>
import { authAPI, eventsAPI, userAPI } from '../services/api'; // 添加 userAPI 导入

export default {
  name: 'ProfilePage',
  data() {
    return {
      userProfile: null,
      userEvents: [],
      loading: true,
      error: null
    };
  },
  async mounted() {
    console.log('🚀 Profile页面已加载');
    console.log('📍 当前路由:', this.$route.path);
    
    // 首先显示所有本地存储内容用于调试
    console.log('📋 所有本地存储内容:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      console.log(`   ${key}:`, value);
    }
    
    await this.loadUserProfile();
    await this.loadUserEvents();
    this.loading = false;
  },
  methods: {
    async loadUserProfile() {
      try {
        console.log('🔄 开始获取用户资料...');
        
        // 检查认证状态
        const token = localStorage.getItem('authToken');
        console.log('🔐 认证Token:', token ? '存在' : '不存在');
        
        if (!token) {
          console.warn('❌ 用户未登录');
          this.$router.push('/login');
          return;
        }

        // 首先尝试从本地存储获取用户数据
        await this.tryLoadFromLocalStorage();
        
        // 然后尝试调用API获取最新数据
        console.log('📡 调用后端API获取用户资料...');
        
        // 获取用户ID - 从本地存储或token中获取
        const userId = localStorage.getItem('userId');
        console.log('👤 用户ID:', userId);
        
        if (userId && userId !== 'undefined' && userId !== 'null') {
          try {
            const response = await authAPI.getProfile(userId);
            console.log('✅ API响应状态:', response.status);
            console.log('📊 完整API响应:', response);
            console.log('👤 API返回的用户数据:', response.data);
            
            if (response.data && Object.keys(response.data).length > 0) {
              this.userProfile = response.data;
              console.log('🎯 从API设置的用户资料:', this.userProfile);
              
              // 保存到本地存储备用
              localStorage.setItem('userData', JSON.stringify(this.userProfile));
            } else {
              console.warn('⚠️ API返回空数据或无效数据');
              // 如果本地存储也没有数据，使用注册数据
              if (!this.userProfile) {
                await this.loadFromRegistrationData();
              }
            }
          } catch (apiError) {
            console.error('❌ 调用authAPI.getProfile失败:', apiError);
            // 尝试使用userAPI
            await this.tryUserAPI(userId);
          }
        } else {
          console.warn('⚠️ 没有有效的用户ID，尝试备用方法');
          await this.tryLoadAllUsers();
        }
        
      } catch (error) {
        console.error('❌ 获取用户资料失败:', error);
        console.error('🔧 错误详情:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // API失败时使用本地数据
        if (!this.userProfile) {
          await this.loadFromRegistrationData();
        }
      }
    },

    // 新增方法：尝试使用userAPI
    async tryUserAPI(userId) {
      try {
        console.log('🔄 尝试使用userAPI获取用户资料...');
        const response = await userAPI.getProfile(userId);
        console.log('✅ userAPI响应:', response);
        
        if (response.data) {
          this.userProfile = response.data;
          localStorage.setItem('userData', JSON.stringify(this.userProfile));
        }
      } catch (userApiError) {
        console.error('❌ userAPI也失败:', userApiError);
        throw userApiError;
      }
    },

    // 新增方法：尝试获取所有用户
    async tryLoadAllUsers() {
      try {
        console.log('🔄 尝试获取所有用户列表...');
        const response = await userAPI.getAllUsers();
        console.log('✅ 获取用户列表成功:', response.data);
        
        // 尝试通过邮箱匹配当前用户
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail && response.data) {
          const currentUser = response.data.find(user => 
            user.email === userEmail || 
            user.userId === localStorage.getItem('userId')
          );
          if (currentUser) {
            this.userProfile = currentUser;
            console.log('✅ 通过用户列表找到当前用户:', currentUser);
          }
        }
      } catch (error) {
        console.error('❌ 获取用户列表失败:', error);
      }
    },

    // 其余方法保持不变...
    async tryLoadFromLocalStorage() {
      console.log('🔍 尝试从本地存储加载用户数据...');
      
      // 检查所有可能的键名
      const possibleKeys = ['userData', 'currentUser', 'user', 'registrationData'];
      let userDataFound = null;
      
      for (const key of possibleKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          console.log(`✅ 找到本地存储数据 (${key}):`, data);
          try {
            const parsedData = JSON.parse(data);
            userDataFound = parsedData;
            
            // 如果是注册数据，需要特殊处理
            if (key === 'registrationData') {
              this.userProfile = {
                firstName: parsedData.firstName,
                lastName: parsedData.lastName,
                email: parsedData.email,
                id: 'temp_user',
                organizer_id: this.generateOrganizerId('temp_user')
              };
            } else {
              this.userProfile = parsedData;
            }
            
            console.log(`🎯 从${key}加载的用户资料:`, this.userProfile);
            break;
          } catch (e) {
            console.error(`❌ 解析${key}失败:`, e);
          }
        }
      }
      
      if (!userDataFound) {
        console.warn('⚠️ 本地存储中未找到用户数据');
      }
      
      return userDataFound;
    },

    async loadFromRegistrationData() {
      console.log('🔄 尝试从注册数据加载...');
      
      const registrationData = localStorage.getItem('registrationData');
      console.log('📝 注册数据:', registrationData);
      
      if (registrationData) {
        try {
          const regData = JSON.parse(registrationData);
          this.userProfile = {
            firstName: regData.firstName,
            lastName: regData.lastName,
            email: regData.email,
            id: 'user_' + Date.now(),
            organizer_id: this.generateOrganizerId('user_' + Date.now())
          };
          console.log('✅ 从注册数据创建用户资料:', this.userProfile);
        } catch (e) {
          console.error('解析注册数据失败:', e);
          this.setDefaultUserData();
        }
      } else {
        this.setDefaultUserData();
      }
    },

    setDefaultUserData() {
      const token = localStorage.getItem('authToken');
      if (token) {
        this.userProfile = {
          id: 'unknown',
          firstName: '用户',
          lastName: '未知',
          email: '未知邮箱',
          organizer_id: 'ORG_0000'
        };
        console.log('⚠️ 使用默认用户数据');
      } else {
        this.error = '用户未登录，请先登录';
        console.log('🚪 未登录，显示错误信息');
      }
    },

    getOrganizerId() {
      if (!this.userProfile) return '未分配';
      
      const organizerId = this.userProfile.organizer_id || 
                         this.userProfile.organizerId || 
                         this.userProfile.organizerID;
      
      if (organizerId) {
        return organizerId;
      }
      
      // 如果没有组织者ID，生成一个
      const userId = this.userProfile.id;
      if (userId) {
        return this.generateOrganizerId(userId);
      }
      
      return '未分配';
    },

    generateOrganizerId(userId) {
      // 确保 userId 是字符串
      const userIdStr = String(userId || '');
  
      if (userIdStr && userIdStr !== 'unknown' && 
          !userIdStr.startsWith('temp_') && 
          !userIdStr.startsWith('user_') &&
          userIdStr.length > 0) {
        return 'ORG_' + userIdStr.padStart(4, '0');
      } else {
        return 'ORG_' + Date.now().toString().slice(-4);
      }
    },

    refreshData() {
      this.loading = true;
      this.error = null;
      this.loadUserProfile();
      this.loadUserEvents();
    },

    retryLoad() {
      this.error = null;
      this.loading = true;
      this.refreshData();
    },

    async loadUserEvents() {
      // 等待用户资料加载完成
      if (!this.userProfile) {
        console.log('⏳ 等待用户资料加载...');
        setTimeout(() => this.loadUserEvents(), 100);
        return;
      }

      try {
        console.log('🔄 开始加载用户活动...');
        
        const organizerId = this.getOrganizerId();
        console.log('🎯 使用的组织者ID:', organizerId);

        if (organizerId && organizerId !== '未分配') {
          try {
            const realOrganizerId = organizerId.replace('ORG_', '');
            const response = await eventsAPI.getEventsByOrganizer(realOrganizerId);
            this.userEvents = response.data || [];
            console.log('✅ 按组织者获取的活动:', this.userEvents.length);
          } catch (organizerError) {
            console.warn('⚠️ 按组织者获取失败，使用备用方法:', organizerError);
            await this.loadEventsFallback();
          }
        } else {
          await this.loadEventsFallback();
        }
      } catch (error) {
        console.error('❌ 加载用户活动失败:', error);
        await this.loadEventsFallback();
      }
    },

    async loadEventsFallback() {
      try {
        console.log('🔄 使用备用方法加载活动...');
        const response = await eventsAPI.getAll();
        const userId = this.userProfile?.id;
        
        this.userEvents = response.data.filter(event => 
          event.organizer_id === userId || 
          event.creatorId === userId ||
          event.organizerId === userId ||
          event.userId === userId
        );
        
        console.log('✅ 备用方法加载的活动:', this.userEvents.length);
      } catch (fallbackError) {
        console.error('❌ 备用方法也失败:', fallbackError);
        this.userEvents = [];
      }
    },

    async deleteEvent(eventId) {
      if (confirm('确定要删除这个活动吗？此操作不可撤销。')) {
        try {
          await eventsAPI.delete(eventId);
          await this.loadUserEvents();
        } catch (error) {
          console.error('Failed to delete event:', error);
          alert('删除活动失败: ' + (error.response?.data?.message || error.message));
        }
      }
    },

    editEvent(event) {
      this.$router.push(`/events/${event.id}/edit`);
    },

    createNewEvent() {
      this.$router.push('/events/create');
    },

    formatDate(dateString) {
      if (!dateString) return '未知';
      try {
        return new Date(dateString).toLocaleDateString('zh-CN');
      } catch (e) {
        return '无效日期';
      }
    },

    formatEventDate(dateString) {
      try {
        return new Date(dateString).toLocaleString('zh-CN');
      } catch (e) {
        return '无效日期';
      }
    },

    getEventStatus(eventDate) {
      const now = new Date();
      const eventTime = new Date(eventDate);
      return eventTime > now ? 'upcoming' : 'past';
    },

    getEventStatusText(eventDate) {
      const status = this.getEventStatus(eventDate);
      return status === 'upcoming' ? '即将开始' : '已结束';
    }
  },
};
</script>

<!-- 样式部分保持不变 -->
 <style scoped>
.profile-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 2s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #e74c3c;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.error-state p {
  font-size: 1.2rem;
  margin-bottom: 25px;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #3498db;
  padding-bottom: 15px;
  margin-bottom: 25px;
}

.profile-header h2 {
  color: #2c3e50;
  margin: 0;
}

.btn-refresh {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-refresh:hover {
  background: #2980b9;
  transform: translateY(-1px);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.info-item label {
  font-weight: bold;
  color: #495057;
  min-width: 100px;
}

.info-item span {
  color: #2c3e50;
  font-weight: 500;
}

.organizer-id {
  background: #3498db;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: bold;
}

.user-events {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.user-events h3 {
  color: #2c3e50;
  border-bottom: 2px solid #e74c3c;
  padding-bottom: 15px;
  margin-bottom: 25px;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.event-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  background: #f8f9fa;
  transition: transform 0.3s, box-shadow 0.3s;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.event-header h4 {
  margin: 0;
  color: #2c3e50;
  flex: 1;
  margin-right: 10px;
}

.event-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  white-space: nowrap;
}

.event-status.upcoming {
  background: #d4edda;
  color: #155724;
}

.event-status.past {
  background: #f8d7da;
  color: #721c24;
}

.event-description {
  color: #6c757d;
  margin-bottom: 15px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-details {
  margin-bottom: 15px;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #495057;
}

.detail-item .icon {
  margin-right: 8px;
}

.event-actions {
  display: flex;
  gap: 10px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 1.2rem;
  margin-bottom: 25px;
}

.btn-primary, .btn-secondary, .btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-primary:hover,
.btn-secondary:hover,
.btn-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-page {
    padding: 10px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .events-grid {
    grid-template-columns: 1fr;
  }
  
  .event-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .event-actions {
    flex-direction: column;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .info-item label {
    min-width: auto;
  }
  
  .profile-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
}
</style>