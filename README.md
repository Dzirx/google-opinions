# 🚀 Google Opinion - Automated SMS Review Requests

Open-source SaaS for automatically sending SMS requests for Google Reviews.

## ✨ Features

- 📅 **Customer & Visit Management** - Track customers and their visits, import via CSV
- 📱 **Dual SMS Flow** - Send reminder SMS before visit + review request SMS after visit
- 🌍 **Universal SMS Sending** - Support for multiple SMS providers (SMSAPI.pl, Twilio, Vonage)
- 📊 **Dashboard** - Track SMS status, view statistics
- 🐳 **Docker Ready** - One-command deployment
- 🔐 **Secure** - NextAuth.js authentication, encrypted credentials

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL (Neon for cloud, Docker for self-hosted)
- **Auth**: NextAuth.js v5
- **SMS**: Universal provider support (SMSAPI.pl, Twilio, Vonage, extensible)

## 🚀 Quick Start

### Option 1: Docker (Recommended for Self-Hosting)

1. **Clone the repository**
```bash
git clone https://github.com/dzirx/google-opinion.git
cd google-opinion
```

2. **Create `.env.local`** (copy from `.env.example`)
```bash
cp .env.example .env.local
```

3. **Generate secrets**
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -base64 32
```

4. **Edit `.env.local`** and add your secrets:
- `NEXTAUTH_SECRET` - Generated in step 3
- `CRON_SECRET` - Generated in step 3
- SMS provider will be configured in dashboard after login

5. **Start the application**
```bash
# Full stack (app + database)
docker-compose -f docker/docker-compose.yml up

# Only database (for local development)
docker-compose -f docker/docker-compose.yml up db
```

6. **Run migrations** (in another terminal)
```bash
npm run db:push
```

7. **Open app**
```
http://localhost:3000
```

### Option 2: Local Development

1. **Install dependencies**
```bash
npm install
```

2. **Start PostgreSQL** (via Docker)
```bash
docker-compose -f docker/docker-compose.yml up db
```

3. **Create `.env.local`** (same as Docker Option 1, step 2-4)

4. **Run migrations**
```bash
npm run db:push
```

5. **Start dev server**
```bash
npm run dev
```

6. **Open app**
```
http://localhost:3000
```

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start Next.js dev server

# Database
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:push          # Push schema to database (no migrations)
npm run db:studio        # Open Drizzle Studio

# Production
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint
```
## 🔧 Configuration

### Environment Variables

See `.env.example` for all available options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for JWT encryption
- `CRON_SECRET` - Secret for cron endpoints

**SMS Provider:**
- SMS providers (SMSAPI.pl, Twilio, Vonage) are configured in the **dashboard**

## 🤝 Contributing

Contributions welcome! Fork the repo and submit a pull request.

## 📝 License

**Fair Source License** - Free for up to 200 customers per business.

- ✅ **Free:** Use with up to 200 customers (end-users in database)
- 💼 **Commercial:** For more than 200 customers, [contact us](https://github.com/dzirx/google-opinion/issues) for a commercial license

See [LICENSE](./LICENSE) for full details.

---

⭐ Star this repo if you find it useful!
