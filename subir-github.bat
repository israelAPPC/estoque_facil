@echo off
rem ============================================================================
rem  subir-github.bat - backup local + commit + push para o GitHub (EstoqueFacil)
rem
rem  Uso (duplo clique ou no terminal, na raiz do projeto):
rem    subir-github.bat                      backup, testes, commit e push
rem    subir-github.bat "feat: minha msg"    mesma coisa, com a sua mensagem de commit
rem    subir-github.bat --so-backup          so o backup local (zip), sem Git
rem    subir-github.bat --sem-testes         pula lint/typecheck/testes
rem    subir-github.bat --sem-backup         pula o backup local
rem
rem  Seguranca: nunca usa --force; nao grava senha nem token (o login do GitHub
rem  fica com o Git Credential Manager); aborta se achar .env, chaves ou banco
rem  local entre os arquivos a enviar.
rem ============================================================================
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

set "REPO_URL=https://github.com/israelAPPC/estoque_facil.git"
set "BRANCH=main"
set "BACKUP_DIR=%USERPROFILE%\Backups\estoque_facil"
set "MANTER=10"
set "MSG="
set "SEM_TESTES=0"
set "SEM_BACKUP=0"
set "SO_BACKUP=0"

:args
if "%~1"=="" goto args_ok
if /i "%~1"=="--sem-testes" (set "SEM_TESTES=1" & shift & goto args)
if /i "%~1"=="--sem-backup" (set "SEM_BACKUP=1" & shift & goto args)
if /i "%~1"=="--so-backup" (set "SO_BACKUP=1" & shift & goto args)
set "MSG=%~1"
shift
goto args
:args_ok

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmm"') do set "TS=%%i"
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set "DATA=%%i"
if "%MSG%"=="" set "MSG=chore: atualizacao %DATA%"

echo.
echo === EstoqueFacil: subir para o GitHub ===
echo Pasta: %CD%
echo Repositorio: %REPO_URL%
echo.

rem ---------------------------------------------------------------- 1. BACKUP
if "%SEM_BACKUP%"=="1" goto pos_backup
echo [1/5] Backup local...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
set "STG=%TEMP%\estoque_facil_stg_%TS%"
robocopy "%CD%" "%STG%" /E /XD node_modules .next .git .vercel coverage out dist build .cache /XF *.tsbuildinfo /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
  echo ERRO: nao foi possivel copiar os arquivos para o backup.
  goto erro
)
powershell -NoProfile -Command "Compress-Archive -Path '%STG%\*' -DestinationPath '%BACKUP_DIR%\estoque_facil_%TS%.zip' -Force"
if errorlevel 1 (
  echo ERRO: falha ao criar o zip do backup.
  rmdir /s /q "%STG%" 2>nul
  goto erro
)
rmdir /s /q "%STG%" 2>nul
powershell -NoProfile -Command "Get-ChildItem '%BACKUP_DIR%' -Filter 'estoque_facil_*.zip' | Sort-Object LastWriteTime -Descending | Select-Object -Skip %MANTER% | Remove-Item -Force"
echo Backup: %BACKUP_DIR%\estoque_facil_%TS%.zip  (mantendo os ultimos %MANTER%)
echo ATENCAO: o zip inclui .env.local e rag.db (segredos e memoria local). Guarde so neste computador.
:pos_backup
if "%SO_BACKUP%"=="1" goto fim_ok

rem ------------------------------------------------------------------ 2. GIT
echo.
echo [2/5] Verificando o Git...
where git >nul 2>&1
if errorlevel 1 (
  echo ERRO: o Git nao esta instalado ou nao esta no PATH. Instale em https://git-scm.com
  goto erro
)
if not exist ".git" (
  echo Primeira vez: inicializando o repositorio...
  git init -b %BRANCH%
  if errorlevel 1 goto erro
  if exist node_modules call npx simple-git-hooks
)
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin %REPO_URL%
) else (
  for /f "delims=" %%u in ('git remote get-url origin') do set "ORIGEM=%%u"
  if /i not "!ORIGEM!"=="%REPO_URL%" (
    echo ERRO: o remoto origin aponta para !ORIGEM!, e nao para %REPO_URL%.
    echo Corrija com: git remote set-url origin %REPO_URL%
    goto erro
  )
)
for /f "delims=" %%n in ('git config user.name') do set "GIT_NOME=%%n"
for /f "delims=" %%e in ('git config user.email') do set "GIT_EMAIL=%%e"
if "%GIT_NOME%"=="" goto sem_identidade
if "%GIT_EMAIL%"=="" goto sem_identidade
goto identidade_ok
:sem_identidade
echo ERRO: configure sua identidade no Git (uma vez) e rode de novo:
echo   git config --global user.name "Seu Nome"
echo   git config --global user.email "seu@email"
goto erro
:identidade_ok

rem --------------------------------------------------------------- 3. TESTES
if "%SEM_TESTES%"=="1" goto pos_testes
echo.
echo [3/5] Lint, tipos e testes...
call npm run lint
if errorlevel 1 goto erro_testes
call npm run typecheck
if errorlevel 1 goto erro_testes
call npm test
if errorlevel 1 goto erro_testes
goto pos_testes
:erro_testes
echo.
echo ERRO: lint, tipos ou testes falharam. Corrija, ou rode com --sem-testes se for proposital.
goto erro
:pos_testes

rem ------------------------------------------------- 4. CONFERENCIA DE SEGREDOS
echo.
echo [4/5] Conferindo o que sera enviado...
git add -A
if errorlevel 1 goto erro

set "BLOQ=%TEMP%\estoque_facil_bloq.txt"
git diff --cached --name-only | findstr /i /r /c:"\.env" /c:"\.pem$" /c:"\.key$" /c:"rag\.db" /c:"\.sqlite" | findstr /v /i /c:".env.example" > "%BLOQ%"
for %%A in ("%BLOQ%") do if %%~zA gtr 0 (
  echo ERRO: arquivos sensiveis estao na lista de envio:
  type "%BLOQ%"
  git reset -q
  del "%BLOQ%" 2>nul
  goto erro
)
del "%BLOQ%" 2>nul

set "SEG=%TEMP%\estoque_facil_seg.txt"
git diff --cached -U0 | findstr /r /c:"SERVICE_ROLE_KEY=[A-Za-z0-9]" /c:"eyJ[A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-]" /c:"AIza[A-Za-z0-9_-][A-Za-z0-9_-][A-Za-z0-9_-]" /c:"BEGIN [A-Z ]*PRIVATE KEY" > "%SEG%"
for %%A in ("%SEG%") do if %%~zA gtr 0 (
  echo ERRO: parece haver chave ou segredo nas linhas a enviar ^(o conteudo nao sera exibido^).
  echo Revise com: git diff --cached
  git reset -q
  del "%SEG%" 2>nul
  goto erro
)
del "%SEG%" 2>nul

git diff --cached --quiet
if not errorlevel 1 (
  echo Nada novo para commitar.
  git rev-parse HEAD >nul 2>&1
  if errorlevel 1 goto fim_ok
  goto push
)
echo.
git status --short
echo.
echo Mensagem do commit: %MSG%
set "RESP="
set /p "RESP=Enviar estas mudancas ao GitHub? (S/N): "
if /i not "%RESP%"=="S" (
  git reset -q
  echo Cancelado. Nada foi commitado nem enviado.
  goto fim_ok
)
git commit -m "%MSG%"
if errorlevel 1 (
  echo ERRO: o commit falhou ^(o pre-commit pode ter reprovado; leia a mensagem acima^).
  goto erro
)

rem ------------------------------------------------------------------ 5. PUSH
:push
echo.
echo [5/5] Enviando para o GitHub...
git push -u origin %BRANCH%
if errorlevel 1 (
  echo.
  echo ERRO: o push foi recusado ou falhou. Se o GitHub ja tem commits que voce nao tem
  echo ^(por exemplo um README criado no site^), rode:  git pull --rebase origin %BRANCH%
  echo e depois este .bat de novo. O script nunca usa --force.
  goto erro
)
echo.
echo Pronto. Enviado para %REPO_URL% ^(branch %BRANCH%^).
goto fim_ok

:erro
echo.
echo Interrompido com erro. Nada foi apagado do projeto.
pause
exit /b 1

:fim_ok
echo.
pause
exit /b 0
