# QuincaPro — Application de Gestion de Quincaillerie

Plateforme complète de gestion : produits, stocks, ventes, achats, facturation PDF et envoi WhatsApp automatique.

---

## Structure du projet

```
quincapro/
├── quincaillerie-backend/    # API NestJS + Prisma + PostgreSQL
└── quincaillerie-frontend/   # React 18 + TypeScript + Tailwind
```

---

## Démarrage rapide

### 1. Backend

```bash
cd quincaillerie-backend
npm install
cp .env.example .env          # Remplir DATABASE_URL, JWT_SECRET, etc.
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed           # Crée admin + données initiales
npm run start:dev
# → http://localhost:3000/api/v1
# → http://localhost:3000/api/docs  (Swagger)
```

**Compte admin par défaut :**
- Email : `admin@quincaillerie.com`
- Mot de passe : `Admin@123`

### 2. Frontend

```bash
cd quincaillerie-frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Stack complète

| Couche | Technologies |
|--------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand |
| Backend | NestJS 10, TypeScript, Prisma ORM, JWT, Passport |
| Base de données | PostgreSQL (Neon serverless) |
| PDF | PDFKit |
| WhatsApp | Meta Business API |
| Stockage | Cloudinary |
| Déploiement | Vercel (frontend) · Docker/VPS Ubuntu (backend) |

---

## Variables d'environnement (Backend)

Copier `quincaillerie-backend/.env.example` → `.env` et renseigner :

```env
DATABASE_URL="postgresql://user:password@host:5432/quincaillerie"
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
WHATSAPP_PHONE_NUMBER_ID=your_id
WHATSAPP_ACCESS_TOKEN=your_token
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

---

## Déploiement production

```bash
# Backend (Docker)
cd quincaillerie-backend
docker-compose up -d
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npm run prisma:seed

# Frontend (Vercel)
cd quincaillerie-frontend
npx vercel --prod
```
