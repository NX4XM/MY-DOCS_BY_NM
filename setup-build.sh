#!/bin/bash

echo "🚀 Starting complete setup and build..."

# Step 1: Clean everything
echo "📦 Step 1: Cleaning old files..."
rm -rf node_modules
rm -rf artifacts/my-docs/node_modules
rm -rf pnpm-lock.yaml
rm -rf artifacts/my-docs/pnpm-lock.yaml

# Step 2: Install root dependencies
echo "📦 Step 2: Installing root dependencies..."
pnpm install --no-frozen-lockfile

# Step 3: Navigate to my-docs and install
echo "📦 Step 3: Installing my-docs dependencies..."
cd artifacts/my-docs
pnpm install --no-frozen-lockfile

# Step 4: Build
echo "🏗️ Step 4: Building application..."
pnpm build

echo "✅ Build complete! Your app is ready!"
