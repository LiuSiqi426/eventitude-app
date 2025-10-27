<template>
  <div class="events-page">
    <div class="page-header">
      <h1>所有活动</h1>
      <button 
        v-if="isAuthenticated && !showCreateForm" 
        @click="showCreateForm = true" 
        class="btn-primary"
      >
        ➕ 创建新活动
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="search-section">
      <input 
        v-model="searchQuery" 
        @input="handleSearch" 
        placeholder="🔍 搜索活动..." 
        class="search-input"
      />
    </div>

    <!-- 事件创建表单 -->
    <EventForm 
      v-if="showCreateForm"
      @event-created="handleEventCreated"
      @event-updated="handleEventUpdated"
      @cancel="handleCancelForm"
      :currentUser="currentUser"
    />

    <!-- 活动列表 -->
    <div class="events-grid" v-if="!loading && events.length > 0">
      <EventCard 
        v-for="event in events" 
        :key="event.id" 
        :event="event"
        :currentUser="currentUser"
        @view-details="viewEventDetails"
        @edit-event="editEvent"
        @delete-event="deleteEvent"
      />
    </div>

    <div v-else-if="loading" class="loading">
      <p>加载中...</p>
    </div>
    
    <div v-else class="no-events">
      <p>暂无活动</p>
      <router-link v-if="!isAuthenticated" to="/login" class="btn">登录后创建活动</router-link>
    </div>
  </div>
</template>

<script>
import { eventsAPI } from '../services/api';
import EventForm from '../components/EventForm.vue';
import EventCard from '../components/EventCard.vue';

export default {
  name: 'EventsPage',
  components: {
    EventForm,
    EventCard
  },
  data() {
    return {
      events: [],
      searchQuery: '',
      showCreateForm: false,
      loading: true,
      currentUser: null,
      refreshCount: 0
    };
  },
  computed: {
    isAuthenticated() {
      return !!localStorage.getItem('authToken');
    }
  },
  async mounted() {
    await this.loadCurrentUser();
    await this.loadEvents();
  },
  methods: {
    async loadCurrentUser() {
      try {
        // 从本地存储加载当前用户信息
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
        }
        
        // 如果没有currentUser，尝试从其他存储位置获取
        if (!this.currentUser) {
          const userData = localStorage.getItem('userData');
          if (userData) {
            this.currentUser = JSON.parse(userData);
          }
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
      }
    },

    async loadEvents() {
      try {
        console.log('🔄 开始加载活动列表...');
        this.loading = true;
        this.refreshCount++;
    
        console.log('📡 发送 GET 请求到: /events');
        const response = await eventsAPI.getAll();
        console.log('📥 活动列表完整响应:', response);
    
        // 处理后端返回的数据格式 { status: 'success', data: [...] }
        let eventsData = [];
        if (response && response.data) {
          console.log('✅ 使用 response.data');
      
          // 检查 response.data 是否包含 data 属性（嵌套结构）
          if (response.data.data && Array.isArray(response.data.data)) {
            console.log('📊 使用 response.data.data (嵌套结构)');
            eventsData = response.data.data;
          } else if (Array.isArray(response.data)) {
            console.log('📊 使用 response.data (直接数组)');
            eventsData = response.data;
          } else {
            console.warn('⚠️ response.data 不是数组:', response.data);
            eventsData = [];
          }
        } else if (Array.isArray(response)) {
          console.log('✅ 使用直接数组响应');
          eventsData = response;
        } else {
          console.warn('⚠️ 无法解析活动数据，原始响应:', response);
          eventsData = [];
        }
    
        console.log('📊 最终活动数据:', eventsData);
        this.events = eventsData;
        console.log(`✅ 成功加载 ${this.events.length} 个活动`);
    
      } catch (error) {
        console.error('❌ 加载活动列表失败:', error);
        console.error('错误状态:', error.response?.status);
        console.error('错误数据:', error.response?.data);
        console.error('错误信息:', error.message);
    
        this.events = [];
        alert('加载活动列表失败: ' + (error.response?.data?.message || error.message));
      } finally {
        this.loading = false;
      }
    },

    async handleSearch() {
      if (this.searchQuery.trim()) {
        try {
          console.log('🔍 搜索活动:', this.searchQuery);
          const response = await eventsAPI.search(this.searchQuery);
          
          // 修复响应数据解析
          let searchResults = [];
          if (response && response.data) {
            searchResults = response.data.data || response.data;
          } else {
            searchResults = response || [];
          }
          
          this.events = Array.isArray(searchResults) ? searchResults : [];
          console.log(`🔍 搜索到 ${this.events.length} 个活动`);
          
        } catch (error) {
          console.error('搜索失败:', error);
          alert('搜索失败: ' + (error.response?.data?.message || error.message));
        }
      } else {
        this.loadEvents();
      }
    },

    async handleEventCreated() {
      console.log('🎉 收到活动创建成功事件');
      this.showCreateForm = false;
      
      // 显示成功消息
      alert('活动创建成功！正在刷新列表...');
      
      // 等待一小段时间确保数据已保存
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 重新加载活动列表
      await this.loadEvents();
      
      // 可选：滚动到顶部查看新活动
      window.scrollTo(0, 0);
    },

    async handleEventUpdated() {
      console.log('🔄 收到活动更新成功事件');
      await this.loadEvents();
    },

    handleCancelForm() {
      console.log('❌ 取消创建活动');
      this.showCreateForm = false;
    },

    viewEventDetails(eventId) {
      this.$router.push(`/events/${eventId}`);
    },

    editEvent(event) {
      // 实现编辑功能
      console.log('编辑事件:', event);
      // 这里可以打开编辑表单或跳转到编辑页面
      // 例如：this.$router.push(`/events/${event.id}/edit`);
      
      // 临时方案：在当前页面显示编辑表单
      this.showCreateForm = true;
      // 需要将事件数据传递给EventForm组件进行编辑
      this.$nextTick(() => {
        const eventForm = this.$refs.eventForm;
        if (eventForm && eventForm.setEditingEvent) {
          eventForm.setEditingEvent(event);
        }
      });
    },

    async deleteEvent(eventId) {
      try {
        if (confirm('确定要删除这个活动吗？此操作不可撤销。')) {
          await eventsAPI.delete(eventId);
          await this.loadEvents();
          alert('活动删除成功！');
        }
      } catch (error) {
        console.error('删除事件失败:', error);
        alert('删除失败: ' + (error.response?.data?.message || error.message));
      }
    },

    formatDate(dateString) {
      if (!dateString) return '日期未设置';
      try {
        return new Date(dateString).toLocaleString('zh-CN');
      } catch (error) {
        return '无效日期';
      }
    }
  }
};
</script>

<style scoped>
.events-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 2rem;
}

.search-section {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 2rem;
}

.btn-primary {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary:hover {
  background-color: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.no-events, .loading {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.btn {
  padding: 12px 24px;
  background: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  display: inline-block;
  margin-top: 1rem;
  transition: all 0.3s;
  font-size: 14px;
}

.btn:hover {
  background: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .events-page {
    padding: 15px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
    text-align: center;
  }
  
  .events-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .btn-primary {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .events-page {
    padding: 10px;
  }
  
  .search-input {
    font-size: 14px;
  }
}
</style>