@echo off
setlocal
cd /d "%~dp0backend"

if not exist node_modules (
  echo Instalando dependencias del backend...
  call npm.cmd install
)

if not exist .env (
  echo Creando archivo .env por defecto...
  powershell -NoProfile -Command "$content = @'\r\nPORT=4000\r\nMONGODB_URI=mongodb+srv://asijtujhernandez_db_user:dFG88eLX8GSqZ2vy@cluster0.nq8rxn7.mongodb.net/arbolG?retryWrites=true&w=majority\r\nJWT_SECRET=change_this_secret\r\nJWT_ACCESS_TTL=15m\r\nJWT_REFRESH_TTL=30d\r\nCORS_ORIGIN=http://localhost:5173\r\nNODE_ENV=development\r\n'@; Set-Content -Encoding ascii .env $content"
)

set "MONGODB_URI=mongodb+srv://asijtujhernandez_db_user:dFG88eLX8GSqZ2vy@cluster0.nq8rxn7.mongodb.net/arbolG?retryWrites=true&w=majority"
echo Iniciando backend (ts-node-dev) usando MongoDB Atlas (DB arbolG)...
call npm.cmd run dev
