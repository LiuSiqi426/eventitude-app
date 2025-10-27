<template>
  <div class="event-form">
    <!-- 草稿显示区域 -->
    <div class="drafts-section" v-if="hasDrafts">
      <h4>📝 保存的草稿</h4>
      <div v-for="(draft, index) in drafts" :key="draft.id" class="draft-item">
        <div class="draft-info">
          <strong>{{ draft.title || '未命名草稿' }}</strong>
          <small>保存于: {{ formatDraftDate(draft.savedAt) }}</small>
        </div>
        <div class="draft-actions">
          <button @click="loadDraft(draft)" class="btn-primary btn-small">加载</button>
          <button @click="continueEditing(draft)" class="btn-secondary btn-small">继续编辑</button>
          <button @click="deleteDraft(draft.id, index)" class="btn-danger btn-small">删除</button>
        </div>
      </div>
    </div>

    <!-- 事件创建/编辑表单 -->
    <form @submit.prevent="handleSubmit" class="form-container">
      <h3>{{ isEditing ? '编辑活动' : '创建新活动' }}</h3>
      
      <div class="form-group">
        <label>活动标题 *</label>
        <input 
          v-model="formData.title" 
          type="text" 
          placeholder="输入活动标题"
          required
        />
      </div>

      <div class="form-group">
        <label>活动描述 *</label>
        <textarea 
          v-model="formData.description" 
          placeholder="详细描述你的活动"
          rows="4"
          required
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>活动日期 *</label>
          <input 
            v-model="formData.date" 
            type="datetime-local" 
            required
          />
        </div>

        <div class="form-group">
          <label>活动地点 *</label>
          <input 
            v-model="formData.location" 
            type="text" 
            placeholder="输入活动地点"
            required
          />
        </div>
      </div>

      <!-- 在 EventForm.vue 的表单中添加以下内容 -->

      <!-- 分类选择 -->
      <div class="form-group">
        <label>活动分类</label>
        <CategorySelector
          :selected="formData.category_ids || []"
          :categories="availableCategories"
          @update:selected="handleCategoryChange"
          :multiple="true"
          :maxSelections="3"
          label="选择活动分类"
        />
      </div>

      <!-- 组织者信息显示（隐藏输入字段） -->
      <div class="form-group" v-if="currentUser && currentUser.organizer_id">
        <label>组织者</label>
        <div class="organizer-info">
          <strong>{{ currentUser.firstName }} {{ currentUser.lastName }}</strong>
          <small>ID: {{ currentUser.organizer_id }}</small>
        </div>
        <input 
          v-model="formData.organizer_id" 
          type="hidden" 
        />
      </div>

      <!-- 如果没有当前用户，显示选择框 -->
      <div class="form-group" v-else>
        <label>组织者 *</label>
        <select 
          v-model="formData.organizer_id" 
          required
          class="form-select"
        >
          <option value="">请选择组织者</option>
          <option 
            v-for="organizer in availableOrganizers" 
            :key="organizer.id" 
            :value="organizer.id"
          >
            {{ organizer.firstName }} {{ organizer.lastName }} (ID: {{ organizer.id }})
          </option>
        </select>
        <small v-if="availableOrganizers.length === 0" class="text-warning">
          没有可用的组织者，请先创建用户
        </small>
      </div>

      <div class="form-actions">
        <button 
          type="button" 
          @click="saveDraft" 
          class="btn-secondary"
          :disabled="!hasFormData"
        >
          💾 保存草稿
        </button>
        
        <div class="action-buttons">
          <button 
            type="button" 
            @click="cancelForm" 
            class="btn-cancel"
          >
            取消
          </button>
          <button 
            type="submit" 
            class="btn-primary"
            :disabled="!isFormValid"
          >
            {{ isEditing ? '更新活动' : '创建活动' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { eventsAPI } from '../services/api';
import draftService from '../services/draftService';
import CategorySelector from './CategorySelector.vue';

export default {
  name: 'EventForm',
  components: {
    CategorySelector
  },
  props: {
    editingEvent: {
      type: Object,
      default: null
    },
    currentUser: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      formData: {
        title: '',
        description: '',
        date: '',
        location: '',
        organizer_id: '',
        category_ids: []
      },
      drafts: [],
      isEditing: false,
      availableOrganizers: [], // 存储可用的组织者列表
      availableCategories: []
    };
  },
  computed: {
    hasDrafts() {
      return this.drafts.length > 0;
    },
    hasFormData() {
      return Object.values(this.formData).some(value => {
        // 安全地处理所有类型的值
        if (value === null || value === undefined) return false;
        if (Array.isArray(value)) return value.length > 0;
        const stringValue = String(value).trim();
        return stringValue !== '';
      });
    },
    isFormValid() {
      const requiredFields = ['title', 'description', 'date', 'location', 'organizer_id'];
      return requiredFields.every(field => {
        const value = this.formData[field];
        if (value === null || value === undefined) return false;
        const stringValue = String(value).trim();
        return stringValue !== '';
      });
    }
  },
  watch: {
    editingEvent: {
      immediate: true,
      handler(newEvent) {
        if (newEvent) {
          this.isEditing = true;
          this.formData = { 
            title: newEvent.title || '',
            description: newEvent.description || '',
            date: newEvent.date || '',
            location: newEvent.location || '',
            organizer_id: newEvent.organizer_id || this.getCurrentOrganizerId(),
            category_ids: newEvent.categories ? newEvent.categories.map(cat => cat.id) : []
          };
          // 转换日期格式以适应datetime-local输入
          if (this.formData.date) {
            this.formData.date = this.formatDateForInput(this.formData.date);
          }
        } else {
          this.isEditing = false;
          this.resetForm();
        }
      }
    },
    currentUser: {
      immediate: true,
      handler(user) {
        if (user && user.organizer_id) {
          // 自动设置当前用户的组织者ID
          this.formData.organizer_id = user.organizer_id;
        }
      }
    }
  },
  async mounted() {
    await this.loadAvailableOrganizers();
    await this.loadAvailableCategories();
    this.loadDrafts();
    
    // 确保组织者ID被正确设置
    if (!this.formData.organizer_id) {
      this.formData.organizer_id = this.getCurrentOrganizerId();
    }
  },
  methods: {
    async loadAvailableCategories() {
      try {
        const response = await eventsAPI.getCategories();
        if (response.data && response.data.data) {
          this.availableCategories = response.data.data;
        } else {
          this.availableCategories = [];
        }
      } catch (error) {
        console.error('加载分类列表失败:', error);
        this.availableCategories = [];
      }
    },

    handleCategoryChange(selectedCategories) {
      this.formData.category_ids = selectedCategories;
    },

    getCurrentOrganizerId() {
      // 从当前用户获取组织者ID
      if (this.currentUser && this.currentUser.organizer_id) {
        return this.currentUser.organizer_id;
      }
      
      // 从本地存储获取
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          return user.organizer_id || '';
        } catch (error) {
          console.error('解析用户信息失败:', error);
        }
      }
      
      return '';
    },

    async loadAvailableOrganizers() {
      try {
        // 尝试获取用户列表（组织者）
        // 注意：这里需要根据你的后端API调整
        // 如果后端没有 /api/users 接口，可以使用模拟数据
        const response = await eventsAPI.getUsers?.(); // 使用可选链操作符
        
        if (response && response.data) {
          this.availableOrganizers = response.data;
        } else {
          // 如果API不可用，使用模拟数据
          this.availableOrganizers = this.getMockOrganizers();
        }
        
        // 如果没有设置组织者，自动选择第一个
        if (this.availableOrganizers.length > 0 && !this.formData.organizer_id) {
          this.formData.organizer_id = this.availableOrganizers[0].id;
        }
      } catch (error) {
        console.error('获取组织者列表失败:', error);
        // 使用模拟数据
        this.availableOrganizers = this.getMockOrganizers();
        if (this.availableOrganizers.length > 0 && !this.formData.organizer_id) {
          this.formData.organizer_id = this.availableOrganizers[0].id;
        }
      }
    },

    getMockOrganizers() {
      // 模拟数据 - 在实际应用中应该从API获取
      return [
        { id: 1, firstName: '系统', lastName: '管理员' },
        { id: 2, firstName: '活动', lastName: '组织者' },
        { id: 3, firstName: '测试', lastName: '用户' }
      ];
    },

    async handleSubmit() {
      try {
        console.log('🔔 开始提交表单');
        
        // 验证表单数据
        if (!this.isFormValid) {
          alert('请填写所有必填字段');
          return;
        }

        // 准备提交的数据
        const submitData = {
          title: this.formData.title.trim(),
          description: this.formData.description.trim(),
          date: this.formatDateForAPI(this.formData.date),
          location: this.formData.location.trim(),
          organizer_id: parseInt(this.formData.organizer_id), // 确保是数字
          category_ids: this.formData.category_ids || [] // 添加分类ID数组
        };

        console.log('📤 提交的数据:', submitData);

        let response;
        if (this.isEditing) {
          response = await eventsAPI.update(this.editingEvent.id, submitData);
          console.log('✅ 更新活动响应:', response);
          this.$emit('event-updated');
        } else {
          response = await eventsAPI.create(submitData);
          console.log('✅ 创建活动响应:', response);
          this.$emit('event-created');
        }

        // 显示成功消息
        alert('🎉 活动创建成功！');
        
        // 直接跳转到活动列表页面
        this.$router.push('/events');
        
        this.resetForm();
        this.clearRelatedDrafts();
        
      } catch (error) {
        console.error('❌ 保存活动失败:', error);
        console.error('错误响应:', error.response);
        
        let errorMessage = '保存失败: ';
        if (error.response && error.response.data) {
          errorMessage += JSON.stringify(error.response.data);
        } else {
          errorMessage += error.message;
        }
        
        alert(errorMessage);
      }
    },

    saveDraft() {
      try {
        const draft = draftService.saveDraft(this.formData);
        this.drafts.unshift(draft);
        alert('草稿已保存到本地！');
      } catch (error) {
        alert(error.message);
      }
    },

    loadDraft(draft) {
      this.formData = {
        title: draft.title || '',
        description: draft.description || '',
        date: draft.date || '',
        location: draft.location || '',
        organizer_id: draft.organizer_id || this.getCurrentOrganizerId(),
        category_ids: draft.category_ids || []
      };
      draftService.deleteDraft(draft.id);
      this.loadDrafts();
    },

    continueEditing(draft) {
      this.formData = {
        title: draft.title || '',
        description: draft.description || '',
        date: draft.date || '',
        location: draft.location || '',
        organizer_id: draft.organizer_id || this.getCurrentOrganizerId(),
        category_ids: draft.category_ids || []
      };
    },

    deleteDraft(draftId, index) {
      if (confirm('确定要删除这个草稿吗？')) {
        draftService.deleteDraft(draftId);
        this.drafts.splice(index, 1);
      }
    },

    clearRelatedDrafts() {
      this.drafts.forEach(draft => {
        if (draft.title === this.formData.title || 
            draft.description === this.formData.description) {
          draftService.deleteDraft(draft.id);
        }
      });
      this.loadDrafts();
    },

    loadDrafts() {
      try {
        this.drafts = draftService.getDrafts();
      } catch (error) {
        console.error('加载草稿失败:', error);
        this.drafts = [];
      }
    },

    resetForm() {
      this.formData = {
        title: '',
        description: '',
        date: '',
        location: '',
        organizer_id: this.getCurrentOrganizerId() || 
                     (this.availableOrganizers.length > 0 ? this.availableOrganizers[0].id : ''),
        category_ids: []
      };
      this.isEditing = false;
    },

    cancelForm() {
      this.resetForm();
      this.$emit('cancel');
    },

    formatDraftDate(dateString) {
      return new Date(dateString).toLocaleString();
    },

    formatDateForInput(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    },

    formatDateForAPI(dateString) {
      const date = new Date(dateString);
      return date.toISOString();
    }
  }
};
</script>

<style scoped>
.event-form {
  max-width: 600px;
  margin: 0 auto;
}

.drafts-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #dee2e6;
}

.drafts-section h4 {
  margin-bottom: 15px;
  color: #495057;
}

.draft-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.draft-info {
  flex-grow: 1;
}

.draft-info strong {
  display: block;
  margin-bottom: 4px;
}

.draft-info small {
  color: #6c757d;
  font-size: 0.8rem;
}

.draft-actions {
  display: flex;
  gap: 8px;
}

.form-container {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-container h3 {
  margin-bottom: 25px;
  color: #2c3e50;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #495057;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
}

.organizer-info {
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.organizer-info strong {
  display: block;
  color: #2c3e50;
}

.organizer-info small {
  color: #6c757d;
  font-size: 0.8rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-primary, .btn-secondary, .btn-danger, .btn-cancel {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-cancel {
  background-color: #6c757d;
  color: white;
}

.btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.text-warning {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 5px;
  display: block;
}

.btn-primary:hover:not(:disabled),
.btn-secondary:hover:not(:disabled),
.btn-danger:hover:not(:disabled),
.btn-cancel:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
