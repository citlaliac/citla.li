#!/bin/bash

# Build the React app
echo "Building React app..."
npm run build

# Create public directory if it doesn't exist
mkdir -p server/public

# Copy build files to server's public directory
echo "Copying build files to server directory..."
cp -r build/* server/public/

echo "Deployment files are ready!"
echo "Next steps:"
echo "1. Upload the contents of the 'server' directory to your PlanetHoster server"
echo "2. Make sure your .env file is properly configured on the server"
echo "3. Start the server with: node server.js" 