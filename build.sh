#!/bin/bash
set -e

echo "Building NestKeeper..."

# Build frontend
echo "Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Copy frontend to web/dist
echo "Copying frontend to web/dist..."
rm -rf web/dist
cp -r frontend/dist web/

# Build Go binary
echo "Building Go binary..."
go build -ldflags="-s -w" -o nestkeeper .

echo "Build complete! Run ./nestkeeper to start the server."
