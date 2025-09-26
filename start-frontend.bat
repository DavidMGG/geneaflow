@echo off
setlocal
cd /d "%~dp0frontend"

if not exist node_modules (
  echo Instalando dependencias del frontend...
  call npm.cmd install
)

echo Iniciando frontend (Vite)...
call npm.cmd run dev
