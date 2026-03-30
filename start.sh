#!/bin/bash

# 班级积分管理系统 - 快速启动脚本

echo "🚀 班级积分管理系统启动中..."
echo ""

# 检查Python是否安装
if command -v python3 &> /dev/null
then
    echo "✅ 检测到 Python3"
    echo "📡 启动服务器在 http://localhost:8000"
    echo "👉 按 Ctrl+C 停止服务器"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null
then
    echo "✅ 检测到 Python"
    echo "📡 启动服务器在 http://localhost:8000"
    echo "👉 按 Ctrl+C 停止服务器"
    echo ""
    python -m http.server 8000
else
    echo "❌ 未检测到 Python"
    echo ""
    echo "请选择以下方式之一启动服务器："
    echo ""
    echo "方式1: 安装Python后运行此脚本"
    echo "方式2: 使用Node.js: npx http-server -p 8000"
    echo "方式3: 使用VS Code的Live Server插件"
    echo ""
fi
