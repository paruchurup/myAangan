#!/bin/bash
# =============================================================
# MyAangan App - EC2 Server Setup Script
# Run this script on your fresh Ubuntu 22.04 EC2 instance
# Usage: bash ec2-setup.sh
# =============================================================

set -e  # Exit on error

echo "============================================"
echo "  MyAangan App - EC2 Server Setup"
echo "============================================"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Java 17
echo "☕ Installing Java 17..."
sudo apt install -y openjdk-17-jdk
java -version

# Install Nginx (to serve Angular app)
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# Install MySQL client (for testing connection)
echo "🗄️ Installing MySQL client..."
sudo apt install -y mysql-client

# Create app directory
echo "📁 Creating app directory..."
sudo mkdir -p /opt/myaangan
sudo chown ubuntu:ubuntu /opt/myaangan
mkdir -p /opt/myaangan/logs

# Create systemd service for Spring Boot
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/myaangan.service > /dev/null <<EOF
[Unit]
Description=MyAangan Spring Boot Application
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/myaangan
ExecStart=/usr/bin/java -jar /opt/myaangan/myaangan-backend.jar \\
  --spring.profiles.active=prod
SuccessExitStatus=143
TimeoutStopSec=10
Restart=on-failure
RestartSec=5
StandardOutput=append:/opt/myaangan/logs/app.log
StandardError=append:/opt/myaangan/logs/error.log
Environment="DB_HOST=YOUR_RDS_ENDPOINT"
Environment="DB_NAME=myaangandb"
Environment="DB_USER=admin"
Environment="DB_PASSWORD=YOUR_DB_PASSWORD"
Environment="JWT_SECRET=your-very-long-secure-jwt-secret-key-min-32-chars"
Environment="CORS_ORIGINS=http://YOUR_EC2_IP,http://localhost"

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx for Angular
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/myaangan > /dev/null <<'NGINX'
server {
    listen 80;
    server_name _;

    root /var/www/myaangan;
    index index.html;

    # Angular app - handle routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to Spring Boot
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
NGINX

sudo ln -sf /etc/nginx/sites-available/myaangan /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t  # Test config
sudo systemctl restart nginx
sudo systemctl enable nginx

# Create web directory
sudo mkdir -p /var/www/myaangan
sudo chown ubuntu:ubuntu /var/www/myaangan

# Enable and start services
sudo systemctl daemon-reload
sudo systemctl enable myaangan

echo ""
echo "============================================"
echo "  ✅ EC2 Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Update /etc/systemd/system/myaangan.service with your RDS details"
echo "2. Upload myaangan-backend.jar to /opt/myaangan/"
echo "3. Upload Angular build to /var/www/myaangan/"
echo "4. Run: sudo systemctl start myaangan"
echo ""
