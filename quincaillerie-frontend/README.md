# QuincaPro — Frontend React

Interface utilisateur complète pour la gestion de quincaillerie.

---

## Stack

| Technologie | Rôle |
|---|---|
| React 18 + TypeScript | Framework UI |
| Vite | Build tool |
| Tailwind CSS | Styles (thème sombre industriel) |
| TanStack Query | Data fetching & cache |
| Zustand | State management |
| React Hook Form + Zod | Formulaires & validation |
| Recharts | Graphiques |
| Radix UI | Composants accessibles |
| React Router v6 | Navigation |

---

## Installation

```bash
npm install
cp .env.example .env   # ajuster VITE_API_URL si besoin
npm run dev
# → http://localhost:5173
```

L'API doit tourner sur `http://localhost:3000`.

---

## Pages disponibles

| Route | Description |
|---|---|
| `/login` | Connexion |
| `/dashboard` | KPIs, graphiques, activité récente |
| `/products` | Catalogue produits + CRUD |
| `/categories` | Catégories de produits |
| `/brands` | Marques |
| `/stocks` | Inventaire, mouvements, alertes |
| `/customers` | Clients + historique + relances WhatsApp |
| `/suppliers` | Fournisseurs |
| `/purchases` | Commandes fournisseurs + réception |
| `/sales` | Ventes + paiements + PDF + WhatsApp |
| `/payments` | Historique paiements |
| `/invoices` | Factures + téléchargement PDF |
| `/whatsapp` | Historique envois WhatsApp |
| `/reports` | Rapports + export Excel |
| `/settings` | Paramètres système |
| `/users` | Utilisateurs (ADMIN seulement) |

---

## Design System

Thème **sombre industriel** :
- Fond : `hsl(220, 20%, 8%)` — anthracite profond
- Primaire : `hsl(211, 100%, 55%)` — bleu acier électrique  
- Accent : `hsl(173, 80%, 44%)` — cyan technique
- Succès / Warning / Erreur avec variantes cohérentes

Composants réutilisables dans `src/components/ui/` :
`Button`, `Input`, `Textarea`, `Label`, `Badge`, `Card`,
`Select`, `Dialog`, `Table + Pagination`, `Toast`, `DropdownMenu`, `Spinner`, `EmptyState`, `FormField`

---

## Authentification

Login → JWT stocké dans Zustand (persisté localStorage).  
Refresh token automatique via intercepteur Axios.  
Guard `RequireAuth` sur toutes les routes sauf `/login`.  
Guard `RequireAdmin` sur `/users`.

---

## Build production

```bash
npm run build
# Fichiers dans dist/
```

Déployer sur **Vercel** :
```bash
npx vercel --prod
```
