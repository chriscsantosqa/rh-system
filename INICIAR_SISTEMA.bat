@echo off
setlocal
title Sistema RH - Execucao Local

cd /d "%~dp0"

echo.
echo ===============================================
echo   Sistema RH - Execucao Local
echo ===============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js nao encontrado.
  echo Instale o Node.js LTS em https://nodejs.org/
  echo Depois feche esta janela e execute este arquivo novamente.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERRO: npm nao encontrado.
  echo Reinstale o Node.js LTS marcando a opcao de instalar o npm.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo ERRO: package.json nao encontrado.
  echo Execute este arquivo dentro da pasta raiz do projeto.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Primeira execucao detectada. Instalando dependencias...
  echo Isso pode levar alguns minutos.
  call npm install
  if errorlevel 1 goto install_error
) else (
  echo Dependencias ja instaladas.
)

set PORT=3000
set URL=http://localhost:%PORT%

echo.
echo Abrindo o navegador em %URL% ...
start "Abrir Sistema RH" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 8; Start-Process '%URL%'"

echo.
echo Iniciando servidor local...
echo Para parar o sistema, pressione CTRL+C nesta janela e confirme com S.
echo.
call npm run dev:local

echo.
echo Servidor encerrado.
pause
exit /b 0

:install_error
echo.
echo ERRO: falha ao instalar dependencias.
echo Verifique sua internet, apague a pasta node_modules se existir e tente novamente.
pause
exit /b 1
