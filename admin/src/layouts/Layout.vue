<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <span v-if="!isCollapse">📚 知识付费</span>
        <span v-else>📚</span>
      </div>
      
      <el-menu
        :default-active="$route.path"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><Menu /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        
        <!-- 内容管理 -->
        <el-sub-menu index="/articles">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/articles">文章列表</el-menu-item>
          <el-menu-item index="/articles/create">发布文章</el-menu-item>
          <!-- ✅ 批量导入 -->
          <el-menu-item index="/articles/import">
            <el-icon><Upload /></el-icon>
            <span>批量导入</span>
          </el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="/orders">
          <template #title>
            <el-icon><Money /></el-icon>
            <span>订单管理</span>
          </template>
          <el-menu-item index="/orders/recharge">充值订单</el-menu-item>
          <el-menu-item index="/orders/pay">付费订单</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧内容 -->
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon :size="24" @click="toggleCollapse" class="collapse-btn">
            <Expand v-if="isCollapse" />
            <Fold v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ $route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userInfo.avatar || ''">
                {{ userInfo.nickname?.charAt(0) || 'A' }}
              </el-avatar>
              <span class="username">{{ userInfo.nickname || '管理员' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Expand, Fold,
  DataAnalysis, User, Menu, Document, Money, Setting, Upload 
} from '@element-plus/icons-vue'

const router = useRouter()
const isCollapse = ref(false)
const userInfo = ref({})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    router.push('/login')
    ElMessage.success('已退出登录')
  } else if (command === 'profile') {
    ElMessage.info('个人信息功能开发中')
  }
}

onMounted(() => {
  const user = localStorage.getItem('admin_user')
  if (user) {
    userInfo.value = JSON.parse(user)
  }
})
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: #001529;
  overflow-y: auto;
  transition: width 0.3s;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  
  .el-menu {
    border-right: none;
    background: #001529;
    
    .el-menu-item,
    .el-sub-menu {
      color: rgba(255,255,255,0.65);
      
      &:hover {
        color: #fff;
        background: rgba(255,255,255,0.05);
      }
      
      &.is-active {
        color: #fff;
        background: #1890ff;
      }
    }
    
    .el-sub-menu .el-menu-item {
      background: #000c17;
      
      &.is-active {
        background: #1890ff;
      }
    }
  }
}

.header {
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f0;
  
  .header-left {
    display: flex;
    align-items: center;
    
    .collapse-btn {
      cursor: pointer;
      margin-right: 20px;
      
      &:hover {
        color: #1890ff;
      }
    }
  }
  
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      
      .username {
        margin-left: 8px;
        color: #303133;
      }
    }
  }
}

.main-content {
  background: #f0f2f5;
  padding: 24px;
  overflow-y: auto;
}
</style>