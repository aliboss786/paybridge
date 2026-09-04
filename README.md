# PayBridge - Payment Gateway (Next.js)

Pakistan's leading payment gateway platform built with Next.js.

## Features
- ✅ JazzCash & EasyPaisa integration (Redirect + Collect API)
- ✅ Merchant & Admin dashboards
- ✅ API key generation
- ✅ Live transaction monitoring
- ✅ Production-only mode
- ✅ HMAC signature verification

## Hostinger Deployment

### Prerequisites
- Node.js 18+ (Hostinger VPS or Node.js hosting)
- SSH access or File Manager

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/aliboss786/paybridge.git
cd paybridge/paybridge-nextjs

# 2. Install dependencies
npm install

# 3. Setup database
npx prisma generate
npx prisma db push

# 4. Seed admin account
curl http://localhost:3000/api/seed

# 5. Build for production
npm run build

# 6. Start production server
npm start
```

### Environment Variables (.env)
```
DATABASE_URL="file:./dev.db"
```

### Hostinger VPS Setup
1. Upload project to `/var/www/paybridge/`
2. Run `npm install && npx prisma generate && npx prisma db push`
3. Use PM2: `pm2 start npm --name paybridge -- start`
4. Setup Nginx reverse proxy to port 3000

### Admin Login
- Email: `aliphotolab@gmail.com`
- Password: `Ali78612@`

### Default Port
The app runs on port **3000** by default.

## Tech Stack
- **Frontend:** Next.js 15, React 19, Tailwind CSS v4
- **Backend:** Next.js API Routes
- **Database:** SQLite via Prisma ORM
- **Payment:** JazzCash, EasyPaisa
