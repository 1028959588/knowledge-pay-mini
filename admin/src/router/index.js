// admin/src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layouts/Layout.vue'

// 直接导入页面组件
const Dashboard = () => import('@/views/Dashboard.vue')
const Login = () => import('@/views/Login.vue')
const Users = () => import('@/views/Users.vue')
const Categories = () => import('@/views/Categories.vue')
const Articles = () => import('@/views/Articles.vue')
const ArticleCreate = () => import('@/views/ArticleCreate.vue')
const ArticleImport = () => import('@/views/ArticleImport.vue')
const RechargeOrders = () => import('@/views/RechargeOrders.vue')
const PayOrders = () => import('@/views/PayOrders.vue')
const Settings = () => import('@/views/Settings.vue')
const ZhihuImport = () => import('@/views/ArticleZhihuImport.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { title: '登录' }
    },
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        {
          path: '/dashboard',
          name: 'Dashboard',
          component: Dashboard,
          meta: { title: '仪表盘', icon: 'DataAnalysis' }
        },
        {
          path: '/users',
          name: 'Users',
          component: Users,
          meta: { title: '用户管理', icon: 'User' }
        },
        {
          path: '/categories',
          name: 'Categories',
          component: Categories,
          meta: { title: '分类管理', icon: 'Menu' }
        },
        {
          path: '/articles',
          name: 'Articles',
          component: Articles,
          meta: { title: '文章管理', icon: 'Document' }
        },
        {
          path: '/articles/create',
          name: 'ArticleCreate',
          component: ArticleCreate,
          meta: { title: '发布文章', icon: 'Edit' }
        },
        {
          path: '/articles/edit/:id',
          name: 'ArticleEdit',
          component: ArticleCreate,
          meta: { title: '编辑文章', icon: 'Edit' }
        },
        {
          path: '/articles/import',
          name: 'ArticleImport',
          component: ArticleImport,
          meta: { title: '批量导入', icon: 'Upload' }
        },
        {
          path: '/orders/recharge',
          name: 'RechargeOrders',
          component: RechargeOrders,
          meta: { title: '充值订单', icon: 'Money' }
        },
        {
          path: '/orders/pay',
          name: 'PayOrders',
          component: PayOrders,
          meta: { title: '付费订单', icon: 'Money' }
        },
        {
          path: '/settings',
          name: 'Settings',
          component: Settings,
          meta: { title: '系统设置', icon: 'Setting' }
        },
		{
		  path: '/articles/zhihu-import',
		  name: 'ArticleZhihuImport',
		  component: ZhihuImport,
		  meta: { title: '知乎导入', icon: 'Link' }
		}
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router