<template>
  <div class="event-detail" v-if="event">
    <div class="event-header">
      <h1>{{ event.title }}</h1>
      <div class="event-meta">
        <span>📅 {{ formatDate(event.date) }}</span>
        <span>📍 {{ event.location }}</span>
        <span>👤 创建者: {{ event.organizer_name || '未知' }}</span>
      </div>
    </div>

    <div class="event-content">
      <section class="event-description">
        <h3>活动描述</h3>
        <p>{{ event.description }}</p>
      </section>

      <!-- 问题区域 -->
      <section class="questions-section">
        <h3>问题与回答 ({{ questions.length }})</h3>
        
        <!-- 提问表单 -->
        <div v-if="isAuthenticated" class="question-form">
          <textarea 
            v-model="newQuestion" 
            placeholder="提出你的问题..." 
            rows="3" 
            maxlength="500"
            :disabled="isSubmitting"
          ></textarea>
          <div class="form-actions">
            <span class="char-count">{{ newQuestion.length }}/500</span>
            <button 
              @click="submitQuestion" 
              class="btn-primary" 
              :disabled="!newQuestion.trim() || isSubmitting"
            >
              {{ isSubmitting ? '提交中...' : '提交问题' }}
            </button>
          </div>
        </div>
        <div v-else class="login-prompt">
          <p>请 <router-link to="/login">登录</router-link> 后提问</p>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoadingQuestions" class="loading-questions">
          <p>加载问题中...</p>
        </div>

        <!-- 问题列表 -->
        <div v-else class="questions-list">
          <div v-if="questions.length === 0" class="no-questions">
            <p>还没有问题，成为第一个提问的人吧！</p>
          </div>
          
          <div v-for="question in questions" :key="question.id" class="question-item">
            <div class="question-content">
              <div class="question-header">
                <strong>{{ question.author_name || '匿名用户' }}</strong>
                <span class="upvotes">👍 {{ question.upvotes || 0 }}</span>
              </div>
              <p>{{ question.content || question.question_text }}</p>
              <small>{{ formatDate(question.created_at || question.created_date) }}</small>
            </div>
            <div class="question-actions">
              <button 
                @click="upvoteQuestion(question.id)" 
                class="btn-upvote"
                title="点赞"
              >
                👍
              </button>
              <button 
                v-if="canDeleteQuestion(question)" 
                @click="deleteQuestion(question.id)" 
                class="btn-danger btn-small"
                :disabled="isDeleting === question.id"
              >
                {{ isDeleting === question.id ? '删除中...' : '删除' }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
  <div v-else class="loading">
    <p>加载活动详情中...</p>
  </div>
</template>

<script>
import { eventsAPI, questionsAPI } from '../services/api';

export default {
  name: 'EventDetail',
  data() {
    return {
      event: null,
      questions: [],
      newQuestion: '',
      isSubmitting: false,
      isLoadingQuestions: false,
      isDeleting: null
    };
  },
  computed: {
    isAuthenticated() {
      return !!localStorage.getItem('authToken');
    },
    currentUserId() {
      return localStorage.getItem('userId');
    }
  },
  async mounted() {
    await this.loadEvent();
    await this.loadQuestions();
  },
  methods: {
    async loadEvent() {
      try {
        console.log('🔄 加载活动详情，ID:', this.$route.params.id);
        const response = await eventsAPI.getById(this.$route.params.id);
        // 处理不同的响应格式
        this.event = response.data.data || response.data;
        console.log('✅ 活动数据:', this.event);
      } catch (error) {
        console.error('❌ 加载活动失败:', error);
        alert('加载活动失败: ' + (error.response?.data?.message || error.message));
      }
    },

    async loadQuestions() {
      this.isLoadingQuestions = true;
      try {
        console.log('🔄 加载问题列表，活动ID:', this.$route.params.id);
        const response = await questionsAPI.getByEvent(this.$route.params.id);
        // 处理不同的响应格式
        this.questions = response.data.data || response.data || [];
        console.log('✅ 问题列表:', this.questions);
      } catch (error) {
        console.error('❌ 加载问题失败:', error);
        this.questions = [];
      } finally {
        this.isLoadingQuestions = false;
      }
    },

    async submitQuestion() {
      if (!this.newQuestion.trim()) {
        alert('请输入问题内容');
        return;
      }

      this.isSubmitting = true;
      
      try {
        console.log('📤 提交问题:', {
          eventId: this.$route.params.id,
          content: this.newQuestion.trim()
        });

        // 注意：现在后端从认证token中获取user_id，不需要手动传递
        const response = await questionsAPI.create(this.$route.params.id, {
          content: this.newQuestion.trim()
        });
        
        console.log('✅ 问题提交成功:', response.data);
        
        // 清空输入框
        this.newQuestion = '';
        
        // 重新加载问题列表
        await this.loadQuestions();
        
        // 显示成功消息
        this.$notify({
          title: '成功',
          message: '问题提交成功！',
          type: 'success'
        });
        
      } catch (error) {
        console.error('❌ 提交问题失败:', error);
        const errorMsg = error.response?.data?.message || error.message;
        alert('提交问题失败: ' + errorMsg);
      } finally {
        this.isSubmitting = false;
      }
    },

    async upvoteQuestion(questionId) {
      try {
        console.log('👍 点赞问题:', questionId);
        await questionsAPI.upvote(questionId);
        // 重新加载问题列表以更新点赞数
        await this.loadQuestions();
      } catch (error) {
        console.error('点赞失败:', error);
        alert('点赞失败: ' + (error.response?.data?.message || error.message));
      }
    },

    async deleteQuestion(questionId) {
      if (!confirm('确定要删除这个问题吗？')) {
        return;
      }

      this.isDeleting = questionId;
      
      try {
        await questionsAPI.delete(questionId);
        // 重新加载问题列表
        await this.loadQuestions();
        
        this.$notify({
          title: '成功',
          message: '问题删除成功！',
          type: 'success'
        });
      } catch (error) {
        console.error('删除问题失败:', error);
        alert('删除失败: ' + (error.response?.data?.message || error.message));
      } finally {
        this.isDeleting = null;
      }
    },

    canDeleteQuestion(question) {
      const currentUserId = this.currentUserId;
      const questionUserId = question.user_id;
      
      console.log('🔍 检查删除权限:', {
        currentUserId,
        questionUserId,
        canDelete: currentUserId && questionUserId && 
                  currentUserId.toString() === questionUserId.toString()
      });
      
      return currentUserId && questionUserId && 
             currentUserId.toString() === questionUserId.toString();
    },

    formatDate(dateString) {
      if (!dateString) return '未知时间';
      
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return '无效日期';
        }
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        console.error('日期格式化错误:', error);
        return '无效日期';
      }
    }
  }
};
</script>

<style scoped>
.event-detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.event-header {
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #eee;
}

.event-header h1 {
  font-size: 2.2rem;
  margin-bottom: 10px;
  color: #2c3e50;
}

.event-meta span {
  display: inline-block;
  margin-right: 20px;
  color: #666;
  font-size: 0.9rem;
}

.event-content section {
  margin-bottom: 30px;
}

.event-description h3, .questions-section h3 {
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.question-form {
  margin-bottom: 25px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.question-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 10px;
  resize: vertical;
  font-family: inherit;
}

.question-form textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.question-form textarea:disabled {
  background-color: #f8f9fa;
  opacity: 0.7;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  color: #666;
  font-size: 0.8rem;
}

.questions-list {
  space-y: 12px;
}

.no-questions {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}

.question-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  transition: box-shadow 0.2s;
}

.question-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.question-content {
  flex-grow: 1;
  margin-right: 15px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.question-header strong {
  color: #2c3e50;
}

.upvotes {
  color: #666;
  font-size: 0.8rem;
}

.question-content p {
  margin: 8px 0;
  line-height: 1.5;
  color: #333;
}

.question-content small {
  color: #888;
  font-size: 0.8rem;
}

.question-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 80px;
}

.btn-upvote {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-upvote:hover {
  background: #e9ecef;
  transform: scale(1.05);
}

.btn-small {
  padding: 4px 8px;
  font-size: 0.75rem;
}

.login-prompt {
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 20px;
  color: #666;
}

.login-prompt a {
  color: #3498db;
  text-decoration: none;
}

.login-prompt a:hover {
  text-decoration: underline;
}

.loading, .loading-questions {
  text-align: center;
  padding: 40px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .event-detail {
    padding: 15px;
  }
  
  .event-header h1 {
    font-size: 1.8rem;
  }
  
  .question-item {
    flex-direction: column;
  }
  
  .question-actions {
    flex-direction: row;
    justify-content: flex-end;
    width: 100%;
    margin-top: 10px;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
}
</style>