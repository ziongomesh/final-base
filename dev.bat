@echo off
title Data Sistemas
echo ===============================================
echo       Iniciando Sistema Data Sistemas
echo ===============================================
echo.

echo [1/2] Iniciando servidor backend...
cd server
start /b cmd /c "npm run dev 2>&1 | findstr /v /c:\"^$\""
cd ..

echo [2/2] Aguardando backend e iniciando frontend...
timeout /t 3 /nobreak > nul

echo.
echo ===============================================
echo   Sistema iniciado!
echo ===============================================
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo ===============================================
echo.

npm run dev
