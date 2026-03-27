# OptykCRM

System CRM dla salonów optycznych. Zarządzanie klientami, wizytami, zleceniami optycznymi oraz automatyczne wysyłanie SMS z prośbą o opinię Google.

## Funkcje

- **Klienci** — baza klientów z danymi kontaktowymi i zgodą SMS
- **Wizyty** — rejestracja wizyt, automatyczne SMS przypomnienia i prośby o opinię Google
- **Zlecenia optyczne** — zarządzanie zleceniami z receptą (OP/OL), oprawkami, szkłami i soczewkami kontaktowymi
- **Wiadomości grupowe** — wysyłka SMS do wybranych klientów z filtrami (zgoda, liczba wizyt, data wizyty)
- **Integracja SMS** — obsługa SMSAPI, SMSPlanet, Twilio, Vonage

## Stack

- **Frontend/Backend** — Next.js 16, TypeScript, Tailwind CSS
- **Baza danych** — PostgreSQL + Prisma ORM
- **Autentykacja** — NextAuth.js v5

## 🚀 Quick Start

### Option 1: Docker (Recommended for Self-Hosting)

1. **Clone the repository**
```bash
git clone https://github.com/dzirx/google-opinion.git
cd google-opinion
```

2. **Create `.env.local`** (copy from `.env`)
```bash
cp .env .env.local
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
docker-compose up
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
docker-compose up db
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
npm run db:studio        # Open Prisma Studio

# Production
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint
```
## 🔧 Configuration

### Environment Variables

See `.env` for all available options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for JWT encryption
- `CRON_SECRET` - Secret for cron endpoints

**SMS Provider:**
- SMS providers (SMSAPI.pl, Twilio, Vonage) are configured in the **dashboard**

### Database (PostgreSQL)

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/google_opinion"
```

## 🤝 Contributing

Contributions welcome! Fork the repo and submit a pull request.

## 📝 License

**Fair Source License** - Free for up to 200 customers per business.

- ✅ **Free:** Use with up to 200 customers (end-users in database)
- 💼 **Commercial:** For more than 200 customers, [contact us](https://github.com/dzirx/google-opinion/issues) for a commercial license

See [LICENSE](./LICENSE) for full details.

---

⭐ Star this repo if you find it useful!
