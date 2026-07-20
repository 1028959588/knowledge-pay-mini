<template>
  <div class="login-page">
    <!-- ===== 背景装饰 ===== -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
      <div class="circle circle-4"></div>
    </div>

    <!-- ===== 左侧品牌展示（大屏） ===== -->
    <div class="login-brand">
      <div class="brand-content">
        <div class="brand-icon">📚</div>
        <h1 class="brand-title">知识付费</h1>
        <p class="brand-subtitle">Knowledge Payment System</p>
        <div class="brand-features">
          <div class="feature-item">
            <span class="feature-icon">✅</span>
            <span>内容管理</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">👥</span>
            <span>用户管理</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📊</span>
            <span>数据统计</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔐</span>
            <span>安全可靠</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 右侧登录表单 ===== -->
    <div class="login-form-wrapper">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">
            <span class="logo-icon">📚</span>
            <span class="logo-text">知识付费</span>
          </div>
          <h2 class="login-title">欢迎回来</h2>
          <p class="login-subtitle">登录以管理您的知识付费平台</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="0"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <div class="input-wrapper">
              <el-icon class="input-icon"><User /></el-icon>
              <el-input
                v-model="form.username"
                placeholder="请输入手机号"
                size="large"
                clearable
              />
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <div class="input-wrapper">
              <el-icon class="input-icon"><Lock /></el-icon>
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                clearable
              />
            </div>
          </el-form-item>

          <div class="login-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <span class="forgot-password">忘记密码？</span>
          </div>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleLogin"
              class="login-btn"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <p>登录即代表同意 <span class="link">《用户协议》</span> 和 <span class="link">《隐私政策》</span></p>
          <p class="version">v1.0.0</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { authAPI } from '@/api'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const rememberMe = ref(true)

const form = reactive({
  username: '13800138000',
  password: '123456'
})

const rules = {
  username: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  await formRef.value.validate()

  loading.value = true

  try {
    const data = await authAPI.login(form.username, form.password)
    console.log('登录成功:', data)

    localStorage.setItem('admin_token', data.token)
    localStorage.setItem('admin_user', JSON.stringify(data.userInfo))

    if (rememberMe.value) {
      localStorage.setItem('admin_remember', 'true')
    }

    ElMessage.success('登录成功')
    router.push('/')
  } catch (err) {
    console.error('登录失败:', err)
    ElMessage.error(err.message || '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
// ============================================================
// 颜色变量
// ============================================================
$primary: #6C5CE7;
$primary-dark: #5A4BD1;
$primary-light: #A29BFE;
$primary-gradient: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
$bg-start: #F0F2FF;
$bg-end: #E8E9F5;

// ============================================================
// 页面容器
// ============================================================
.login-page {
  display: flex;
  min-height: 100vh;
  background: $bg-start;
  position: relative;
  overflow: hidden;
}

// ============================================================
// 背景装饰
// ============================================================
.bg-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  .circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.06;

    &.circle-1 {
      width: 600px;
      height: 600px;
      background: $primary;
      top: -200px;
      right: -150px;
    }

    &.circle-2 {
      width: 400px;
      height: 400px;
      background: $primary-light;
      bottom: -100px;
      left: -100px;
    }

    &.circle-3 {
      width: 200px;
      height: 200px;
      background: $primary;
      top: 30%;
      right: -50px;
    }

    &.circle-4 {
      width: 100px;
      height: 100px;
      background: $primary-light;
      bottom: 30%;
      left: -30px;
    }
  }
}

// ============================================================
// 左侧品牌展示
// ============================================================
.login-brand {
  display: none;

  @media (min-width: 992px) {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding: 60px;
    background: $primary-gradient;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }

    .brand-content {
      position: relative;
      z-index: 1;
      color: #fff;
      max-width: 420px;

      .brand-icon {
        font-size: 72px;
        margin-bottom: 16px;
        display: block;
      }

      .brand-title {
        font-size: 42px;
        font-weight: 700;
        margin: 0 0 8px;
        letter-spacing: 2px;
      }

      .brand-subtitle {
        font-size: 16px;
        opacity: 0.8;
        letter-spacing: 4px;
        text-transform: uppercase;
        margin-bottom: 40px;
      }

      .brand-features {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          backdrop-filter: blur(4px);
          font-size: 14px;

          .feature-icon {
            font-size: 18px;
          }
        }
      }
    }
  }
}

// ============================================================
// 右侧登录表单
// ============================================================
.login-form-wrapper {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;

  @media (min-width: 992px) {
    flex: 0 0 480px;
    padding: 60px 48px;
    background: #fff;
    box-shadow: -20px 0 60px rgba(0, 0, 0, 0.04);
  }
}

.login-card {
  width: 100%;
  max-width: 400px;

  .login-header {
    margin-bottom: 40px;
    text-align: center;

    .login-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 24px;

      .logo-icon {
        font-size: 32px;
      }

      .logo-text {
        font-size: 24px;
        font-weight: 700;
        color: #303133;
      }
    }

    .login-title {
      font-size: 28px;
      font-weight: 700;
      color: #303133;
      margin: 0 0 8px;
    }

    .login-subtitle {
      font-size: 14px;
      color: #909399;
      margin: 0;
    }
  }

  .login-form {
    .input-wrapper {
      display: flex;
      align-items: center;
      background: #F5F7FA;
      border-radius: 12px;
      padding: 0 16px;
      transition: all 0.3s ease;

      &:focus-within {
        background: #fff;
        box-shadow: 0 0 0 2px rgba(108, 92, 231, 0.2);
      }

      .input-icon {
        color: #909399;
        font-size: 18px;
        margin-right: 12px;
        flex-shrink: 0;
      }

      :deep(.el-input) {
        .el-input__wrapper {
          background: transparent;
          box-shadow: none !important;
          padding: 0;
          border-radius: 0;

          .el-input__inner {
            height: 48px;
            font-size: 14px;
            color: #303133;

            &::placeholder {
              color: #C0C4CC;
            }
          }

          &.is-focus {
            box-shadow: none !important;
          }
        }
      }
    }

    .login-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 16px 0 24px;

      :deep(.el-checkbox) {
        .el-checkbox__label {
          font-size: 13px;
          color: #606266;
        }
      }

      .forgot-password {
        font-size: 13px;
        color: $primary;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .login-btn {
      width: 100%;
      height: 48px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      background: $primary-gradient;
      border: none;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(108, 92, 231, 0.35);
      }

      &:active {
        transform: translateY(0);
        box-shadow: 0 4px 12px rgba(108, 92, 231, 0.25);
      }

      &.is-loading {
        transform: none;
        box-shadow: none;
      }
    }
  }

  .login-footer {
    margin-top: 32px;
    text-align: center;

    p {
      font-size: 12px;
      color: #C0C4CC;
      margin: 4px 0;

      .link {
        color: $primary;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .version {
      margin-top: 8px;
      font-size: 11px;
      color: #D0D4DC;
    }
  }
}
</style>