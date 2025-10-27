<!-- src/components/EventCard.vue -->
<template>
  <div class="event-card" @click="handleCardClick">
    <div class="event-header">
      <h3 class="event-title">{{ event.title }}</h3>
      <div class="event-categories" v-if="event.categories && event.categories.length > 0">
        <span 
          v-for="category in event.categories.slice(0, 2)" 
          :key="category.id" 
          class="category-tag"
        >
          {{ category.name }}
        </span>
        <span v-if="event.categories.length > 2" class="category-more">
          +{{ event.categories.length - 2 }}
        </span>
      </div>
    </div>
    
    <p class="event-description">{{ truncatedDescription }}</p>
    
    <div class="event-meta">
      <div class="meta-item">
        <span class="icon">📍</span>
        <span class="text">{{ event.location || '地点待定' }}</span>
      </div>
      <div class="meta-item">
        <span class="icon">📅</span>
        <span class="text">{{ formatDate(event.date) }}</span>
      </div>
      <div class="meta-item">
        <span class="icon">👤</span>
        <span class="text">{{ event.organizer_name || '组织者' }}</span>
      </div>
    </div>
    
    <div class="event-actions" v-if="showActions">
      <button 
        v-if="isEventOwner" 
        @click.stop="editEvent" 
        class="btn-edit"
      >
        编辑
      </button>
      <button 
        v-if="isEventOwner" 
        @click.stop="deleteEvent" 
        class="btn-delete"
      >
        删除
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EventCard',
  props: {
    event: {
      type: Object,
      required: true
    },
    showActions: {
      type: Boolean,
      default: false
    },
    currentUser: {
      type: Object,
      default: null
    }
  },
  computed: {
    truncatedDescription() {
      if (!this.event.description) return '暂无描述';
      return this.event.description.length > 100 
        ? this.event.description.substring(0, 100) + '...' 
        : this.event.description;
    },
    isEventOwner() {
      if (!this.currentUser || !this.event) return false;
      const currentUserId = this.currentUser.id || this.currentUser.userId;
      const eventOrganizerId = this.event.organizer_id || this.event.organizerId;
      return currentUserId && eventOrganizerId && currentUserId.toString() === eventOrganizerId.toString();
    }
  },
  methods: {
    handleCardClick() {
      this.$emit('view-details', this.event.id);
    },
    editEvent() {
      this.$emit('edit-event', this.event);
    },
    deleteEvent() {
      if (confirm(`确定要删除活动 "${this.event.title}" 吗？`)) {
        this.$emit('delete-event', this.event.id);
      }
    },
    formatDate(dateString) {
      if (!dateString) return '日期待定';
      try {
        return new Date(dateString).toLocaleString('zh-CN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return '无效日期';
      }
    }
  }
};
</script>

<style scoped>
.event-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  border-color: #3498db;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.event-title {
  color: #2c3e50;
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.4;
  flex: 1;
  margin-right: 10px;
}

.event-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: flex-end;
}

.category-tag {
  background: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  white-space: nowrap;
}

.category-more {
  background: #95a5a6;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
}

.event-description {
  color: #666;
  margin: 12px 0;
  line-height: 1.5;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-meta {
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid #f8f9fa;
}

.meta-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.meta-item .icon {
  margin-right: 8px;
  font-size: 1rem;
}

.meta-item .text {
  flex: 1;
}

.event-actions {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f8f9fa;
}

.btn-edit, .btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s;
  flex: 1;
}

.btn-edit {
  background: #f39c12;
  color: white;
}

.btn-delete {
  background: #e74c3c;
  color: white;
}

.btn-edit:hover {
  background: #e67e22;
  transform: translateY(-1px);
}

.btn-delete:hover {
  background: #c0392b;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .event-header {
    flex-direction: column;
    gap: 8px;
  }
  
  .event-categories {
    justify-content: flex-start;
    width: 100%;
  }
  
  .event-actions {
    flex-direction: column;
  }
}
</style>