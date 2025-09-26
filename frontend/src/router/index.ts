import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Landing from '../views/Landing.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Dashboard from '../views/Dashboard.vue';
import TreeView from '../views/TreeView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Landing', component: Landing },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/trees/:id', name: 'TreeView', component: TreeView, props: true }
];

const router = createRouter({ history: createWebHistory(), routes });
export default router;
