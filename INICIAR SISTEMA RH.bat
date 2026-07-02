@echo off
chcp 65001 >nul
title Sistema RH - Lupatelli e Enlace
cd /d "%~dp0"

echo.
echo  =================================================
echo    SISTEMA RH - LUPATELLI ^& ENLACE
echo  =================================================
echo.

rem --- Erro comum: executar de dentro do ZIP sem extrair
if not exist "package.json" (
  echo  [ATENCAO] Os arquivos do sistema nao foram encontrados.
  echo.
  echo  Voce provavelmente abriu este arquivo de DENTRO do ZIP.
  echo  Feche esta janela, clique com o botao DIREITO no arquivo
  echo  sistema-rh.zip, escolha "Extrair Tudo...", abra a pasta
  echo  extraida e clique 2x neste arquivo novamente.
  echo.
  pause
  exit /b 1
)

rem --- Se o sistema ja estiver rodando, apenas abre o navegador
powershell -NoProfile -Command "$c=New-Object Net.Sockets.TcpClient; try{$c.Connect('localhost',3000);$c.Close();exit 0}catch{exit 1}" >nul 2>&1
if %errorlevel%==0 (
  echo  O sistema ja esta em execucao. Abrindo o navegador...
  start "" http://localhost:3000
  timeout /t 3 >nul
  exit /b 0
)

rem --- Verifica se o Node.js esta instalado
where node >nul 2>&1
if %errorlevel% neq 0 goto instalar_node

for /f "tokens=*" %%v in ('node -v') do set NODEVER=%%v
echo  [OK] Node.js encontrado (versao %NODEVER%)

rem --- Primeira execucao: instala os componentes
if not exist "node_modules" (
  echo.
  echo  [1/2] PRIMEIRA EXECUCAO: instalando componentes do sistema.
  echo        Isso leva alguns minutos e acontece SO UMA VEZ.
  echo        Nao feche esta janela. Aguarde...
  echo.
  call npm install --no-audit --no-fund
  if %errorlevel% neq 0 (
    echo.
    echo  [ERRO] A instalacao falhou.
    echo  Verifique sua conexao com a internet e clique 2x
    echo  neste arquivo novamente.
    echo.
    pause
    exit /b 1
  )
  echo.
  echo  [OK] Componentes instalados!
)

echo.
echo  [2/2] Iniciando o sistema...
echo.
echo  -----------------------------------------------------------
echo   O navegador vai abrir sozinho em http://localhost:3000
echo   (na primeira vez pode levar ate 1 minuto)
echo.
echo   DEIXE ESTA JANELA ABERTA enquanto usa o sistema.
echo   Para ENCERRAR o sistema: feche esta janela.
echo  -----------------------------------------------------------
echo.

rem --- Abre o navegador automaticamente quando o servidor responder
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 90;$i++){try{$c=New-Object Net.Sockets.TcpClient;$c.Connect('localhost',3000);$c.Close();Start-Process 'http://localhost:3000';break}catch{Start-Sleep -Seconds 2}}"

call npm run dev
echo.
echo  O sistema foi encerrado.
pause
exit /b 0

:instalar_node
echo  [ATENCAO] O Node.js ainda NAO esta instalado neste computador.
echo  (Ele e o motor gratuito que faz o sistema funcionar.)
echo.
echo  Tentando instalar automaticamente, aguarde...
echo.
winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
if %errorlevel%==0 (
  echo.
  echo  [OK] Node.js instalado com sucesso!
  echo.
  echo  IMPORTANTE: feche esta janela e clique 2x neste
  echo  arquivo NOVAMENTE para iniciar o sistema.
  echo.
  pause
  exit /b 0
)
echo.
echo  Nao foi possivel instalar automaticamente.
echo  Vou abrir o site oficial do Node.js no seu navegador:
echo.
echo   1. Clique no botao verde escrito "LTS" para baixar
echo   2. Abra o arquivo baixado e clique em Avancar/Next
echo      ate o final (nao precisa mudar nada)
echo   3. Depois, clique 2x neste arquivo novamente
echo.
start "" https://nodejs.org/pt
pause
exit /b 1
