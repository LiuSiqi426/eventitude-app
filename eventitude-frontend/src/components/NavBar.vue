<template>
  <nav class="navbar">
    <div class="nav-container">
      <router-link to="/" class="nav-logo">Eventitude</router-link>
      <div class="nav-menu">
        <router-link to="/" class="nav-link">首页</router-link>
        <router-link to="/events" class="nav-link">所有活动</router-link>
        <template v-if="isAuthenticated">
          <router-link to="/profile" class="nav-link">个人资料</router-link>
          <button @click="handleLogout" class="nav-link logout-btn">退出</button>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-link">登录</router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script>
import { authAPI } from '../services/api';

export default {
  name: 'NavBar',
  computed: {
    isAuthenticated() {
      return !!localStorage.getItem('authToken');
    },
  },
  methods: {
    async handleLogout() {
      try {
        await authAPI.logout();
        // 清理所有用户相关数据
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId'); // 新增：清理用户ID
        this.$router.push('/login');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    },
  },
};
</script>

<style scoped>
.navbar {
  background-color: #2c3e50;
  padding: 1rem 0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.nav-logo {
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
}

.nav-menu {
  display: flex;
  gap: 20px;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: #34495e;
}

.logout-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: inherit;
}
</style>