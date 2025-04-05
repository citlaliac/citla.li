#!/bin/bash

# Build the React application
echo "Building React application..."
npm run build

# Copy the build files to the server directory
echo "Copying build files..."
cp -r build/* server/public/

# Install server dependencies if needed
echo "Installing server dependencies..."
cd server
npm install

# Start the server
echo "Starting server..."
node server.js 