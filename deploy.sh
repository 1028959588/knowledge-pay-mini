#!/bin/bash

# ============================================================
# 知识付费系统 - 部署脚本（支持 IP/域名/本地切换）
# ============================================================

echo "=========================================="
echo "📦 知识付费系统 - 部署"
echo "=========================================="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================
# 选择部署模式
# ============================================================
echo ""
echo "请选择部署模式:"
echo "1) 🚀 生产环境 - IP部署 (http://8.138.195.169:8080)"
echo "2) 🌐 生产环境 - 域名部署 (https://api.wxtool.vip)"
echo "3) 🔧 本地开发 (http://localhost:8080)"
echo ""
read -p "请输入选择 [1-3]: " mode_choice

case $mode_choice in
    1)
        MODE_NAME="生产环境(IP)"
        API_BASE_URL="http://8.138.195.169:8080/api"
        ADMIN_BASE_URL="http://8.138.195.169:8080"
        SERVER_IP="8.138.195.169"
        SERVER_USER="root"
        API_PATH="/www/wwwroot/api"
        ADMIN_PATH="/www/wwwroot/admin"
        BUILD_MODE="staging"
        ;;
    2)
        MODE_NAME="生产环境(域名)"
        API_BASE_URL="https://api.wxtool.vip/api"
        ADMIN_BASE_URL="https://admin.wxtool.vip"
        SERVER_IP="8.138.195.169"
        SERVER_USER="root"
        API_PATH="/www/wwwroot/api"
        ADMIN_PATH="/www/wwwroot/admin"
        BUILD_MODE="production"
        ;;
    3)
        MODE_NAME="本地开发"
        API_BASE_URL="http://localhost:8080/api"
        ADMIN_BASE_URL="http://localhost:3000"
        SERVER_IP="localhost"
        SERVER_USER=""
        API_PATH=""
        ADMIN_PATH=""
        BUILD_MODE="development"
        ;;
    *)
        echo -e "${RED}❌ 无效选择，退出${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}📌 当前模式: ${MODE_NAME}${NC}"
echo -e "${BLUE}📡 API地址: ${API_BASE_URL}${NC}"
echo -e "${BLUE}🖥️ 后台地址: ${ADMIN_BASE_URL}${NC}"
echo ""

DEPLOY_TIME=$(date '+%Y-%m-%d %H:%M:%S')

# ============================================================
# 更新管理后台 API 地址
# ============================================================
update_admin_config() {
    echo -e "${YELLOW}🖥️ 更新管理后台 API 配置...${NC}"
    
    if [ -f "admin/src/config/index.js" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|baseURL: '.*'|baseURL: '$API_BASE_URL'|" admin/src/config/index.js
        else
            sed -i "s|baseURL: '.*'|baseURL: '$API_BASE_URL'|" admin/src/config/index.js
        fi
        echo -e "${GREEN}✅ 管理后台 API 地址已更新为: ${API_BASE_URL}${NC}"
    else
        echo -e "${YELLOW}⚠️ 未找到 admin/src/config/index.js${NC}"
    fi
}

# ============================================================
# 部署后端
# ============================================================
deploy_backend() {
    if [ "$mode_choice" = "3" ]; then
        echo -e "${YELLOW}⚠️ 本地开发模式，启动本地服务...${NC}"
        start_local
        return
    fi
    
    echo -e "${YELLOW}📤 部署后端到服务器...${NC}"
    
    cd backend
    tar -czf ../backend.tar.gz . --exclude=node_modules --exclude=.env --exclude=backend.tar.gz 2>/dev/null
    cd ..
    
    scp backend.tar.gz ${SERVER_USER}@${SERVER_IP}:/root/
    
    ssh ${SERVER_USER}@${SERVER_IP} "
        cd ${API_PATH}
        tar -xzf /root/backend.tar.gz
        npm install --production
        pm2 reload knowledge-pay-api 2>/dev/null || pm2 start src/app.js --name knowledge-pay-api
        pm2 save
        echo '✅ 后端重启完成'
    "
    
    rm -f backend.tar.gz
    echo -e "${GREEN}✅ 后端部署完成${NC}"
}

# ============================================================
# 部署管理后台
# ============================================================
deploy_admin() {
    if [ "$mode_choice" = "3" ]; then
        echo -e "${YELLOW}⚠️ 本地开发模式，管理后台已在本地启动${NC}"
        return
    fi
    
    echo -e "${YELLOW}📤 部署管理后台到服务器...${NC}"
    
    cd admin
    npm install
    if [ "$BUILD_MODE" = "production" ]; then
        npm run build:prod
    else
        npm run build:staging
    fi
    cd ..
    
    scp -r admin/dist/* ${SERVER_USER}@${SERVER_IP}:${ADMIN_PATH}/
    
    echo -e "${GREEN}✅ 管理后台部署完成${NC}"
}

# ============================================================
# 本地启动
# ============================================================
start_local() {
    echo -e "${YELLOW}🚀 启动本地服务...${NC}"
    
    # 更新 API 配置为本地
    update_admin_config
    
    # 启动后端
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # 启动管理后台
    cd admin
    npm run dev &
    ADMIN_PID=$!
    cd ..
    
    echo -e "${GREEN}✅ 本地服务已启动${NC}"
    echo -e "${BLUE}📡 后端: http://localhost:8080${NC}"
    echo -e "${BLUE}🖥️ 管理后台: http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
    
    wait
}

# ============================================================
# 检查服务状态
# ============================================================
check_status() {
    if [ "$mode_choice" = "3" ]; then
        echo -e "${YELLOW}🔍 本地服务状态...${NC}"
        curl -s http://localhost:8080/api/health 2>/dev/null && echo "✅ 后端运行中" || echo "❌ 后端未启动"
        return
    fi
    
    echo -e "${YELLOW}🔍 检查服务状态...${NC}"
    
    ssh ${SERVER_USER}@${SERVER_IP} "
        echo '=== PM2 状态 ==='
        pm2 list
        echo ''
        echo '=== 健康检查 ==='
        curl -s http://localhost:8080/api/health
    "
}

# ============================================================
# 查看日志
# ============================================================
view_logs() {
    if [ "$mode_choice" = "3" ]; then
        echo -e "${YELLOW}📋 查看本地日志...${NC}"
        tail -50 /Users/huati/Documents/HBuilderProjects/knowledge-pay-mini/backend/nohup.out 2>/dev/null || echo "无日志"
        return
    fi
    
    ssh ${SERVER_USER}@${SERVER_IP} "pm2 logs knowledge-pay-api --lines 30"
}

# ============================================================
# 输出部署信息
# ============================================================
show_deploy_info() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}🎉 操作完成！${NC}"
    echo "=========================================="
    echo -e "${BLUE}📅 时间: ${DEPLOY_TIME}${NC}"
    echo -e "${BLUE}🌐 模式: ${MODE_NAME}${NC}"
    if [ "$mode_choice" != "3" ]; then
        echo -e "${BLUE}🖥️ 服务器: ${SERVER_IP}${NC}"
    fi
    echo "=========================================="
    echo ""
    echo -e "${GREEN}📡 访问地址:${NC}"
    echo "=========================================="
    
    if [ "$mode_choice" = "3" ]; then
        echo -e "  ${BLUE}后端 API:${NC}"
        echo -e "    🔹 ${GREEN}http://localhost:8080/api/health${NC}"
        echo -e "    🔹 ${GREEN}http://localhost:8080/api/auth/login${NC}"
        echo ""
        echo -e "  ${BLUE}管理后台:${NC}"
        echo -e "    🔹 ${GREEN}http://localhost:3000${NC}"
        echo -e "    🔹 账号: ${YELLOW}13800138000${NC}"
        echo -e "    🔹 密码: ${YELLOW}123456${NC}"
    else
        echo -e "  ${BLUE}后端 API:${NC}"
        echo -e "    🔹 ${GREEN}${API_BASE_URL}/health${NC}"
        echo -e "    🔹 ${GREEN}${API_BASE_URL}/auth/login${NC}"
        echo ""
        echo -e "  ${BLUE}管理后台:${NC}"
        echo -e "    🔹 ${GREEN}${ADMIN_BASE_URL}${NC}"
        echo -e "    🔹 账号: ${YELLOW}13800138000${NC}"
        echo -e "    🔹 密码: ${YELLOW}123456${NC}"
    fi
    echo "=========================================="
}

# ============================================================
# 主菜单
# ============================================================
show_menu() {
    echo ""
    echo "请选择操作:"
    echo "1) 📦 部署全部（后端 + 管理后台）"
    echo "2) 📤 仅部署后端"
    echo "3) 🖥️ 仅部署管理后台"
    echo "4) 🔄 仅重启后端（不更新代码）"
    echo "5) 🔍 查看服务状态"
    echo "6) 📋 查看日志"
    echo "7) ❌ 退出"
    echo ""
    read -p "请输入选择 [1-7]: " choice
    
    case $choice in
        1)
            update_admin_config
            deploy_backend
            deploy_admin
            show_deploy_info
            ;;
        2)
            update_admin_config
            deploy_backend
            show_deploy_info
            ;;
        3)
            update_admin_config
            deploy_admin
            show_deploy_info
            ;;
        4)
            if [ "$mode_choice" = "3" ]; then
                echo -e "${YELLOW}本地模式请使用『本地启动』${NC}"
            else
                echo -e "${YELLOW}🔄 重启后端服务...${NC}"
                ssh ${SERVER_USER}@${SERVER_IP} "
                    cd ${API_PATH}
                    pm2 reload knowledge-pay-api
                    echo '✅ 后端已重启'
                "
                echo -e "${GREEN}✅ 重启完成${NC}"
            fi
            ;;
        5)
            check_status
            ;;
        6)
            view_logs
            ;;
        7)
            echo -e "${GREEN}退出${NC}"
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            ;;
    esac
}

# 运行主菜单
show_menu