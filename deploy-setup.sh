#!/bin/bash

# EC2 Deployment Setup Script for Zero Trust Media Backend API
# Run this script on your EC2 Ubuntu/Debian instance

set -e

echo "Updating packages..."
sudo apt update && sudo apt upgrade -y

echo "Installing Nginx..."
sudo apt install nginx -y

echo "Installing Node.js (via NVM)..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 20
nvm use 20
nvm alias default 20

echo "Installing PM2 globally..."
npm install -g pm2

echo "Setup complete!"
echo "Next steps:"
echo "1. Clone your repository."
echo "2. Navigate to the server folder, run 'npm install'."
echo "3. Copy your .env file."
echo "4. Run 'pm2 start ecosystem.config.js'."
echo "5. Copy nginx.conf to /etc/nginx/sites-available/default and restart nginx."
