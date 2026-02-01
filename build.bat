@echo off
echo Building NestKeeper...

:: Build frontend
echo Building frontend...
cd frontend
call npm ci
call npm run build
cd ..

:: Copy frontend to web/dist
echo Copying frontend to web/dist...
if exist web\dist rmdir /s /q web\dist
xcopy /s /e /i frontend\dist web\dist

:: Build Go binary
echo Building Go binary...
go build -ldflags="-s -w" -o nestkeeper.exe .

echo Build complete! Run nestkeeper.exe to start the server.
