<template>
  <div class="category-filter">
    <h4>🔍 筛选分类</h4>
    
    <!-- 搜索分类 -->
    <div class="search-category">
      <input 
        v-model="searchTerm" 
        @input="filterCategories"
        placeholder="搜索分类..."
        class="search-input"
      />
    </div>

    <!-- 分类列表 -->
    <div class="categories-list">
      <div 
        v-for="category in filteredCategories" 
        :key="category.id"
        class="category-item"
        :class="{ 'selected': isCategorySelected(category.id) }"
        @click="toggleCategory(category.id)"
      >
        <span class="category-name">{{ category.name }}</span>
        <span class="category-checkbox">
          {{ isCategorySelected(category.id) ? '✓' : '' }}
        </span>
      </div>
    </div>

    <!-- 选中的分类显示 -->
    <div v-if="selectedCategories.length > 0" class="selected-categories">
      <h5>已选分类:</h5>
      <div class="selected-tags">
        <span 
          v-for="category in getSelectedCategoryDetails()" 
          :key="category.id"
          class="category-tag"
        >
          {{ category.name }}
          <span @click="removeCategory(category.id)" class="remove-btn">×</span>
        </span>
      </div>
      <button @click="clearAll" class="clear-all-btn">清除所有</button>
    </div>

    <!-- 操作按钮 -->
    <div class="filter-actions">
      <button @click="applyFilter" class="btn-primary">应用筛选</button>
      <button @click="resetFilter" class="btn-secondary">重置</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CategoryFilter',
  props: {
    categories: {
      type: Array,
      default: () => []
    },
    initialSelected: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedCategories: [...this.initialSelected],
      searchTerm: '',
      filteredCategories: [...this.categories]
    };
  },
  watch: {
    categories: {
      immediate: true,
      handler(newCategories) {
        this.filteredCategories = newCategories;
      }
    },
    initialSelected: {
      immediate: true,
      handler(newSelected) {
        this.selectedCategories = [...newSelected];
      }
    }
  },
  methods: {
    filterCategories() {
      if (!this.searchTerm.trim()) {
        this.filteredCategories = this.categories;
        return;
      }
      
      const term = this.searchTerm.toLowerCase();
      this.filteredCategories = this.categories.filter(category => 
        category.name.toLowerCase().includes(term) ||
        (category.description && category.description.toLowerCase().includes(term))
      );
    },

    toggleCategory(categoryId) {
      const index = this.selectedCategories.indexOf(categoryId);
      if (index > -1) {
        this.selectedCategories.splice(index, 1);
      } else {
        this.selectedCategories.push(categoryId);
      }
    },

    isCategorySelected(categoryId) {
      return this.selectedCategories.includes(categoryId);
    },

    removeCategory(categoryId) {
      const index = this.selectedCategories.indexOf(categoryId);
      if (index > -1) {
        this.selectedCategories.splice(index, 1);
      }
    },

    clearAll() {
      this.selectedCategories = [];
    },

    getSelectedCategoryDetails() {
      return this.categories.filter(cat => 
        this.selectedCategories.includes(cat.id)
      );
    },

    applyFilter() {
      this.$emit('filter-changed', this.selectedCategories);
    },

    resetFilter() {
      this.selectedCategories = [];
      this.searchTerm = '';
      this.filteredCategories = this.categories;
      this.$emit('filter-changed', []);
    }
  }
};
</script>

<style scoped>
.category-filter {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.category-filter h4 {
  margin-bottom: 15px;
  color: #2c3e50;
  font-size: 1.1rem;
}

.search-category {
  margin-bottom: 15px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.categories-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 5px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.category-item:hover {
  background: #e3f2fd;
  border-color: #3498db;
}

.category-item.selected {
  background: #3498db;
  color: white;
  border-color: #2980b9;
}

.category-name {
  font-size: 14px;
}

.category-checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid #ccc;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.category-item.selected .category-checkbox {
  background: white;
  color: #3498db;
  border-color: white;
}

.selected-categories {
  margin-bottom: 15px;
  padding: 15px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.selected-categories h5 {
  margin-bottom: 10px;
  color: #495057;
  font-size: 0.9rem;
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
  padding: 4px 8px;
  background: #3498db;
  color: white;
  border-radius: 12px;
  font-size: 12px;
}

.remove-btn {
  cursor: pointer;
  font-weight: bold;
  padding: 0 2px;
}

.remove-btn:hover {
  color: #ffeb3b;
}

.clear-all-btn {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 12px;
  text-decoration: underline;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.btn-primary, .btn-secondary {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  flex: 1;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

/* 滚动条样式 */
.categories-list::-webkit-scrollbar {
  width: 6px;
}

.categories-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.categories-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.categories-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>