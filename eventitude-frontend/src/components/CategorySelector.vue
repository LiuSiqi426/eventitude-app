<template>
  <div class="category-selector">
    <label v-if="label">{{ label }} <span v-if="required" class="required">*</span></label>
    
    <!-- 选中的分类标签 -->
    <div v-if="selectedCategories.length > 0" class="selected-tags">
      <span 
        v-for="category in getSelectedCategoryDetails()" 
        :key="category.id"
        class="category-tag"
      >
        {{ category.name }}
        <span @click="removeCategory(category.id)" class="remove-btn">×</span>
      </span>
    </div>

    <!-- 分类选择下拉框 -->
    <div class="selector-container">
      <select 
        v-model="tempSelected" 
        @change="addCategory"
        class="category-select"
        :disabled="categories.length === 0"
      >
        <option value="">选择分类...</option>
        <option 
          v-for="category in availableCategories" 
          :key="category.id" 
          :value="category.id"
          :disabled="isCategorySelected(category.id)"
        >
          {{ category.name }}
        </option>
      </select>
      
      <button 
        v-if="showCreateButton" 
        @click="showCreateModal = true" 
        class="btn-create"
        type="button"
      >
        ➕ 新建分类
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <!-- 创建分类模态框 -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal-content">
        <h3>创建新分类</h3>
        <div class="form-group">
          <label>分类名称 *</label>
          <input 
            v-model="newCategory.name" 
            type="text" 
            placeholder="输入分类名称"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>分类描述</label>
          <textarea 
            v-model="newCategory.description" 
            placeholder="输入分类描述"
            rows="3"
            class="form-textarea"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="createCategory" class="btn-primary" :disabled="!canCreateCategory">
            创建
          </button>
          <button @click="cancelCreate" class="btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <!-- 分类列表显示（可选） -->
    <div v-if="showCategoryList" class="category-list-hint">
      <small>可选分类: {{ availableCategories.map(c => c.name).join(', ') }}</small>
    </div>
  </div>
</template>

<script>
import { categoriesAPI } from '../services/api';

export default {
  name: 'CategorySelector',
  props: {
    label: {
      type: String,
      default: '选择分类'
    },
    selected: {
      type: Array,
      default: () => []
    },
    categories: {
      type: Array,
      default: () => []
    },
    required: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: true
    },
    maxSelections: {
      type: Number,
      default: 5
    },
    showCreateButton: {
      type: Boolean,
      default: true
    },
    showCategoryList: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedCategories: [...this.selected],
      tempSelected: '',
      showCreateModal: false,
      newCategory: {
        name: '',
        description: ''
      },
      error: ''
    };
  },
  computed: {
    availableCategories() {
      return this.categories.filter(cat => 
        !this.selectedCategories.includes(cat.id)
      );
    },
    
    canCreateCategory() {
      return this.newCategory.name.trim().length > 0;
    }
  },
  watch: {
    selected: {
      immediate: true,
      handler(newSelected) {
        this.selectedCategories = [...newSelected];
      }
    }
  },
  methods: {
    addCategory() {
      if (this.tempSelected && !this.isCategorySelected(this.tempSelected)) {
        if (this.multiple) {
          if (this.selectedCategories.length < this.maxSelections) {
            this.selectedCategories.push(parseInt(this.tempSelected));
            this.emitChange();
          } else {
            this.error = `最多只能选择 ${this.maxSelections} 个分类`;
          }
        } else {
          this.selectedCategories = [parseInt(this.tempSelected)];
          this.emitChange();
        }
        this.tempSelected = '';
        this.error = '';
      }
    },

    removeCategory(categoryId) {
      const index = this.selectedCategories.indexOf(categoryId);
      if (index > -1) {
        this.selectedCategories.splice(index, 1);
        this.emitChange();
      }
    },

    isCategorySelected(categoryId) {
      return this.selectedCategories.includes(categoryId);
    },

    getSelectedCategoryDetails() {
      return this.categories.filter(cat => 
        this.selectedCategories.includes(cat.id)
      );
    },

    async createCategory() {
      try {
        if (!this.canCreateCategory) {
          this.error = '请输入分类名称';
          return;
        }

        const response = await categoriesAPI.create(this.newCategory);
        const newCategory = response.data;
        
        // 添加新创建的分类到选中列表
        if (this.multiple) {
          this.selectedCategories.push(newCategory.id);
        } else {
          this.selectedCategories = [newCategory.id];
        }
        
        // 通知父组件刷新分类列表
        this.$emit('category-created');
        
        // 重置表单并关闭模态框
        this.newCategory = { name: '', description: '' };
        this.showCreateModal = false;
        this.error = '';
        
        this.emitChange();
        
      } catch (error) {
        console.error('创建分类失败:', error);
        this.error = '创建分类失败: ' + (error.response?.data?.message || error.message);
      }
    },

    cancelCreate() {
      this.showCreateModal = false;
      this.newCategory = { name: '', description: '' };
      this.error = '';
    },

    emitChange() {
      this.$emit('update:selected', this.selectedCategories);
      this.$emit('change', this.selectedCategories);
    },

    validate() {
      if (this.required && this.selectedCategories.length === 0) {
        this.error = '请至少选择一个分类';
        return false;
      }
      this.error = '';
      return true;
    },

    clear() {
      this.selectedCategories = [];
      this.emitChange();
    }
  }
};
</script>

<style scoped>
.category-selector {
  margin-bottom: 20px;
}

.category-selector label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #495057;
}

.required {
  color: #e74c3c;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.category-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: #3498db;
  color: white;
  border-radius: 16px;
  font-size: 14px;
}

.remove-btn {
  cursor: pointer;
  font-weight: bold;
  padding: 0 2px;
  font-size: 16px;
}

.remove-btn:hover {
  color: #ffeb3b;
}

.selector-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.category-select {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.category-select:focus {
  outline: none;
  border-color: #3498db;
}

.btn-create {
  padding: 10px 16px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.btn-create:hover {
  background: #219a52;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 20px;
  color: #2c3e50;
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

.form-input, .form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #3498db;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.category-list-hint {
  margin-top: 8px;
}

.category-list-hint small {
  color: #6c757d;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .selector-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .modal-content {
    padding: 20px;
    margin: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>