# AWS EC2 Deployment

This setup hosts the frontend and backend on one EC2 server:

- Nginx serves the built frontend.
- Nginx proxies `/api/*` and `/socket.io/*` to the backend on `127.0.0.1:5000`.
- PM2 keeps the backend running.
- GitHub Actions builds and deploys each push to `main`.

## 1. Prepare AWS

Create an Ubuntu EC2 instance and open these inbound ports in its security group:

- `22` from your IP for SSH
- `80` from the internet
- `443` from the internet after SSL is configured

Use MongoDB Atlas or another managed MongoDB for production. Redis is optional in this backend; if you use it, install Redis on the server or use a managed Redis URL.

## 2. Bootstrap the EC2 server

Copy `deploy/ec2` to the server once, then run:

```bash
cd deploy/ec2
DOMAIN=your-domain.com APP_NAME=iox-exchange ./bootstrap.sh
```

Create the production backend env file:

```bash
nano /var/www/iox-exchange/shared/backend.env
```

Use the values from `backend/.env.example`, but set production-safe values:

```bash
NODE_ENV=production
PORT=5000
API_PREFIX=/api/v1
CLIENT_ORIGIN=https://your-domain.com
MONGODB_URI=your-production-mongodb-uri
REDIS_URL=
JWT_ACCESS_SECRET=long-random-value
JWT_REFRESH_SECRET=another-long-random-value
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
OTP_TTL_MINUTES=10
OTP_MAX_ATTEMPTS=5
PASSWORD_RESET_TTL_MINUTES=15
APIHOME_KEY=your-key
M3_BASE_URL=your-m3-url
M3_API_KEY=your-m3-key
M3_MERCHANT_WALLET_ID=your-wallet-id
WALLET_SYNC_ENCRYPTION_KEY=your-32-byte-key
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=no-reply@your-domain.com
```

## 3. Configure GitHub

Add these repository secrets:

- `EC2_HOST`: public IP or domain of the EC2 instance
- `EC2_USER`: usually `ubuntu`
- `EC2_SSH_PRIVATE_KEY`: private key that can SSH into the server

Add this repository variable:

- `VITE_API_BASE_URL`: `/api/v1`

## 4. Deploy

Push to `main`, or run the `Deploy to AWS EC2` workflow manually from GitHub Actions.

After deployment:

```bash
pm2 status
curl http://localhost:5000/api/v1
```

The site should be available at:

```text
http://your-domain.com
```

## 5. SSL

After DNS points to the EC2 server, install Certbot:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Then set `CLIENT_ORIGIN=https://your-domain.com` in `/var/www/iox-exchange/shared/backend.env` and redeploy.
