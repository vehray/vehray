@echo off
REM 设置Node.js路径
set NODE_HOME=E:\ad_project\trae_projects\demo\nodejs\node-v20.15.1-win-x64
set PATH=%NODE_HOME%;%PATH%

REM 检查是否有命令参数
if "%~1" neq "" (
    REM 执行传入的命令
    npm %*
) else (
    REM 显示版本信息
echo Node.js版本:
node -v
echo npm版本:
npm -v
echo.
echo 现在可以使用npm命令了，例如:
echo npm install
echo npm run dev
echo.

REM 保持窗口打开
cmd /k
)