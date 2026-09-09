@echo off
cd /d "%~dp0"
set "INSIGHT_PY=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
if not exist "%INSIGHT_PY%" set "INSIGHT_PY=python"
if not exist "dist\index.html" (
  echo Primeiro execute npm install e npm run build nesta pasta.
  pause
  exit /b 1
)
echo Abra http://127.0.0.1:8765 no navegador quando aparecer a mensagem de disponibilidade.
echo Mantenha esta janela aberta enquanto usa o site. Para encerrar, pressione Ctrl+C.
"%INSIGHT_PY%" backend\server.py
pause
