<template>
  <div class="home">
    <h1>欢迎使用 Eventitude</h1>
    <p>事件管理平台</p>
    <div class="actions">
      <router-link to="/events" class="btn">浏览活动</router-link>
      <router-link to="/login" class="btn">登录系统</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage'
}
</script>

<style scoped>
.home {
  text-align: center;
  padding: 4rem 0;
}

.home h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.home p {
  font-size: 1.2rem;
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  background: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.3s;
}

.btn:hover {
  background: #2980b9;
}
</style>