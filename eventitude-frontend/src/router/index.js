import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Events from '../views/Events.vue';
import EventDetail from '../views/EventDetail.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Profile from '../views/Profile.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/events', name: 'Events', component: Events },
  { path: '/events/:id', name: 'EventDetail', component: EventDetail },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('authToken');
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;