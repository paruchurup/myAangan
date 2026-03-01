#!/bin/bash
# ─────────────────────────────────────────────────────────────
# MyAangan — Docker Deploy Script
# Run from your LOCAL machine.
# Usage:   bash deploy.sh <EC2_IP> <KEY_FILE.pem>
# Example: bash deploy.sh 13.235.45.67 ~/.ssh/mykey.pem
# ─────────────────────────────────────────────────────────────

set -e

EC2_IP=$1
KEY_FILE=$2

if [ -z "$EC2_IP" ] || [ -z "$KEY_FILE" ]; then
    echo "Usage: bash deploy.sh <EC2_IP> <KEY_FILE.pem>"
    exit 1
fi

SSH="ssh -i $KEY_FILE ubuntu@$EC2_IP"
SCP="scp -i $KEY_FILE"

echo ""
echo "🚀 Deploying MyAangan to EC2: $EC2_IP"
echo ""

# ── Step 1: Package source for upload ──────────────────────
echo "📦 Step 1: Packaging project..."
tar --exclude='backend/.gradle' \
    --exclude='backend/build' \
    --exclude='frontend/node_modules' \
    --exclude='frontend/dist' \
    --exclude='frontend/android' \
    --exclude='.git' \
    -czf /tmp/myaangan-deploy.tar.gz \
    backend/ frontend/ docker-compose.yml .env.example

echo "   Package size: $(du -sh /tmp/myaangan-deploy.tar.gz | cut -f1)"

# ── Step 2: Upload to EC2 ──────────────────────────────────
echo ""
echo "📤 Step 2: Uploading to EC2..."
$SCP /tmp/myaangan-deploy.tar.gz ubuntu@$EC2_IP:~/myaangan-deploy.tar.gz

# ── Step 3: Remote setup and launch ───────────────────────
echo ""
echo "🔧 Step 3: Setting up and starting containers on EC2..."
$SSH << 'REMOTE'
set -e

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "  Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker ubuntu
    echo "  Docker installed."
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo "  Installing Docker Compose..."
    sudo apt-get install -y docker-compose-plugin
fi

# Extract project
mkdir -p ~/myaangan
tar -xzf ~/myaangan-deploy.tar.gz -C ~/myaangan --strip-components=0
cd ~/myaangan

# Create .env from example if it doesn't exist yet
if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "  ⚠️  .env file created from .env.example"
    echo "  Please edit ~/myaangan/.env with your real secrets, then re-run this script."
    exit 1
fi

# Pull latest images and rebuild
echo "  Building and starting containers (this takes a few minutes first time)..."
docker compose down --remove-orphans
docker compose up -d --build

echo ""
echo "  Container status:"
docker compose ps
REMOTE

echo ""
echo "════════════════════════════════════════════"
echo "  ✅ Deployment complete!"
echo "════════════════════════════════════════════"
echo "  App URL : http://$EC2_IP"
echo "  API URL : http://$EC2_IP/api"
echo ""
echo "  Useful remote commands:"
echo "  ssh -i $KEY_FILE ubuntu@$EC2_IP"
echo "  cd ~/myaangan && docker compose logs -f"
echo "  cd ~/myaangan && docker compose ps"
echo "════════════════════════════════════════════"
