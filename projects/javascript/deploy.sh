#!/bin/bash

# Enhanced deployment script with error handling and logging
set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the React app
echo "🔨 Building React app..."
npm run build

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Error: Build failed. No build directory found."
    exit 1
fi

# Create public directory if it doesn't exist
mkdir -p server/public

# Copy build files to server's public directory
echo "📁 Copying build files to server directory..."
cp -r build/* server/public/

# Copy server files (excluding node_modules and other unnecessary files)
echo "📁 Copying server files..."
cp server.js server/
cp -r server/php server/ 2>/dev/null || true
cp -r server/db.php server/ 2>/dev/null || true

# Create a deployment info file
echo "📝 Creating deployment info..."
cat > server/deployment-info.txt << EOF
Deployment Date: $(date)
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "Unknown")
Git Branch: $(git branch --show-current 2>/dev/null || echo "Unknown")
Build Version: $(node -p "require('./package.json').version")
EOF

echo "✅ Deployment files are ready!"
echo "📊 Deployment Summary:"
echo "   - Build directory: $(du -sh build | cut -f1)"
echo "   - Server directory: $(du -sh server | cut -f1)"
echo ""
echo "🔄 Next steps:"
echo "1. Upload the contents of the 'server' directory to your PlanetHoster server"
echo "2. Make sure your .env file is properly configured on the server"
echo "3. Start the server with: node server.js"
echo ""
echo "🎉 Deployment completed successfully!" 