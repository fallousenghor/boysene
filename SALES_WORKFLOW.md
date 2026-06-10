# 📋 Guide du Workflow des Opérations de Ventes

## Vue d'ensemble

Le système de ventes a été entièrement refactorisé pour être **cohérent, clair et intuitif**. Les opérations suivent maintenant un **workflow logique** avec des statuts explicites et des actions appropriées à chaque étape.

---

## 🔄 Statuts de Vente (Ordre Chronologique)

```
DRAFT
  ↓
  ├─→ Modification possible
  ├─→ Annulation possible
  └─→ Confirmation
      ↓
    CONFIRMED (articles réservés, stock déduit)
      ↓
      ├─→ Paiement possible
      └─→ Annulation possible (restitution stock)
          ↓
        PARTIAL_PAID (paiement partiel enregistré)
          ↓
          ├─→ Paiement supplémentaire possible
          └─→ Annulation impossible
              ↓
            FULLY_PAID (entièrement payée)
              ↓
              └─→ Pas d'action possible


Alternative: CANCELLED (à tout moment sauf si FULLY_PAID)
```

### Description des Statuts

| Statut | Description | Stock | Actions Possibles |
|--------|-------------|-------|-------------------|
| **DRAFT** | Brouillon initial, pas validé | ❌ Non déduit | Modifier, Confirmer, Annuler |
| **CONFIRMED** | Vente finalisée, stock réservé | ✅ Déduit | Payer, Annuler, Télécharger |
| **PARTIAL_PAID** | Partie payée, solde dû | ✅ Déduit | Payer, Télécharger, Voir |
| **FULLY_PAID** | Entièrement payée | ✅ Déduit | Télécharger, Voir (pas d'action) |
| **CANCELLED** | Annulée | 🔄 Restitué | Voir (lecture seule) |

---

## 📍 Étapes du Workflow Complet

### 1️⃣ **CRÉATION** → Créer un Brouillon
```
POST /sales
{
  "items": [
    { "productId": "...", "quantity": 5, "unitPrice": 100, "discount": 10 }
  ],
  "customerId": "..." (optionnel),
  "paymentType": "CREDIT" (ou "CASH"),
  "taxRate": 18,
  "discount": 500,
  "notes": "..."
}
```
**Résultat:** Vente en statut `DRAFT`
- ❌ Stock **NON DÉDUIT** encore
- ✏️ Modifiable
- 🗑️ Annulable

---

### 2️⃣ **MODIFICATION** (Optionnel) → Adapter le Brouillon
```
PUT /sales/:id
{
  "items": [...],
  "customerId": "...",
  "taxRate": 18,
  "discount": 400,
  "notes": "..."
}
```
**Condition:** Vente doit être en `DRAFT`
**Résultat:** Brouillon mis à jour, totaux recalculés

---

### 3️⃣ **CONFIRMATION** → Finaliser la Vente
```
POST /sales/:id/confirm
{
  "amountPaid": 0,           // Montant payé immédiatement
  "paymentMethod": "CASH",   // CASH, WAVE, ORANGE_MONEY, etc.
  "notes": "..."
}
```
**Condition:** Vente doit être en `DRAFT`
**Résultat:**
- ✅ Stock **DÉDUIT** immédiatement
- 📦 Mouvements de stock enregistrés
- 🧾 Facture auto-générée
- 💰 Statut: `CONFIRMED` ou `PARTIAL_PAID` ou `FULLY_PAID` (selon amountPaid)

⚠️ **Important:** À partir de ce moment, les articles ne peuvent plus être modifiés

---

### 4️⃣ **PAIEMENT** (Optionnel) → Enregistrer un Paiement
```
POST /sales/:id/payment
{
  "amount": 50000,         // Montant à payer
  "paymentMethod": "WAVE", // Méthode de paiement
  "notes": "Paiement client X"
}
```
**Condition:** Vente en `CONFIRMED` ou `PARTIAL_PAID`
**Résultat:**
- 💵 Paiement enregistré
- 📊 Solde client mis à jour
- 🎯 Statut: `PARTIAL_PAID` → `FULLY_PAID` (selon montant restant)

---

### 5️⃣ **ANNULATION** (À tout moment avant FULLY_PAID)
```
POST /sales/:id/cancel
```
**Condition:** Vente **PAS** en `FULLY_PAID`
**Résultat:**
- ✅ Stock **RESTITUÉ** (si confirmée)
- 📦 Retour en stock enregistré
- 🧾 Facture annulée
- 💳 Solde client annulé
- 🚫 Statut: `CANCELLED`

---

## 🎯 Cas d'Usage Courants

### Cas 1: Vente comptant immédiate
```
1. Créer brouillon (POST /sales)
2. Confirmer + payer montant total (POST /sales/:id/confirm, amountPaid = total)
   → Statut: FULLY_PAID
3. Télécharger facture (GET /invoices/sale/:id/pdf)
4. Envoyer au client (POST /whatsapp/sale/:id)
```

### Cas 2: Vente crédit
```
1. Créer brouillon (POST /sales)
2. Confirmer sans paiement (POST /sales/:id/confirm, amountPaid = 0)
   → Statut: CONFIRMED, solde client augmenté
3. [Optionnel] Enregistrer paiements progressifs (POST /sales/:id/payment)
4. (Finalement) Statut: FULLY_PAID
```

### Cas 3: Erreur avant confirmation
```
1. Créer brouillon (POST /sales)
2. [Optionnel] Modifier (PUT /sales/:id)
3. Annuler (POST /sales/:id/cancel)
   → Aucun stock déduit, pas de facture créée
```

### Cas 4: Erreur après confirmation
```
1. Vente confirmée en statut CONFIRMED
2. Annuler (POST /sales/:id/cancel)
   → Stock restitué, facture annulée, solde client recalculé
```

---

## 🔍 Recherche et Filtrage

### Lister les ventes
```
GET /sales
  ?page=1
  &limit=10
  &search="VNT-2025"      // Recherche par référence ou nom client
  &status=DRAFT           // Filtrer par statut
  &customerId="..."       // Filtrer par client
  &paymentType=CASH       // Filtrer par type de paiement
  &startDate="2025-01-01" // Filtrer par date (ISO 8601)
  &endDate="2025-01-31"
```

---

## 💡 Recommandations

### ✅ Bonnes Pratiques
1. **Toujours confirmer** avant de faire confiance aux chiffres de stock
2. **Vérifier le stock** avant de créer une vente (quantité disponible)
3. **Enregistrer les paiements rapidement** pour éviter des oublis
4. **Utiliser les types de paiement corrects** (facilite la comptabilité)
5. **Laisser des notes** pour les ventes spéciales

### ❌ À Éviter
1. ❌ Créer puis confirmer tout de suite sans vérification
2. ❌ Oublier de confirmer les ventes importunes (crédit en particulier)
3. ❌ Annuler une vente payée (créer un remboursement à la place)
4. ❌ Modifier après confirmation (créer une nouvelle vente à la place)

---

## 📊 Impact sur les Comptes

### Balance Client
- **DRAFT:** Pas d'impact
- **CONFIRMED (sans paiement):** Balance ↑ (amountDue)
- **CONFIRMED (avec paiement):** Balance ↑ (amountDue restant)
- **Paiement enregistré:** Balance ↓ (montant du paiement)
- **FULLY_PAID:** Balance = 0
- **Annulation:** Balance ↓ (restitution amountDue)

### Stock
- **DRAFT:** Pas d'impact
- **CONFIRMED:** Quantité ↓ immédiatement
- **Annulation:** Quantité ↑ (restitution complète)

### Factures
- **Auto-créée** lors de la confirmation
- **Statut:** SENT (si crédit) ou PAID (si payée immédiatement)
- **Annulée** si vente annulée
- **Possible à télécharger** en PDF

---

## 🔐 Permissions & Sécurité

Toutes les opérations de ventes nécessitent une **authentification JWT** (bearer token).

**Rôles recommandés:**
- 🧑‍💼 **Vendeur:** Créer, modifier (brouillon), confirmer, enregistrer paiements
- 👨‍💼 **Responsable Stock:** Confirmation (vérification stock enfin)
- 📊 **Caissier:** Enregistrer paiements, annuler
- 🔍 **Comptable:** Consulter, télécharger PDF, rapports

---

## 📝 Exemple Complet: Workflow d'une Vente

```
JOUR 1 - Vente crédit de 500,000 FCFA
├─ 14:00 → POST /sales (Créer brouillon; DRAFT)
├─ 14:15 → PUT /sales/:id (Modifier articles; DRAFT)
├─ 14:30 → POST /sales/:id/confirm (Confirmer; CONFIRMED, stock déduit, facture créée)
└─ 14:35 → GET /sales/:id (Voir détails)

JOUR 2 - Paiement partiel
├─ 10:00 → POST /sales/:id/payment (200,000 FCFA; PARTIAL_PAID)
└─ 10:05 → GET /invoices/sale/:id/pdf (Télécharger facture pour relance)

JOUR 7 - Paiement final
├─ 16:00 → POST /sales/:id/payment (300,000 FCFA; FULLY_PAID)
└─ 16:05 → GET /invoices/sale/:id/pdf (Envoyer reçu final)
```

---

## ⚡ Résumé Graphique

```
┌─────────────────────────────────────────────────────────────┐
│                  WORKFLOW VENTE SIMPLIFIÉ                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│    BROUILLON ──→ CONFIRMÉE ──→ PAYÉE PARTIELLEMENT ──→ PAYÉE │
│    (créer)      (finaliser)       (paiement 1)      (fin)   │
│       ↓                                                        │
│    (modifier)                                                  │
│       ↓                                                        │
│    ANNULÉE ←──────────────────────┬──────────────────┐       │
│    (à tout moment sauf si PAYÉE) │                  │       │
│                                   ↓                  ↓       │
│                            (annuler)          (pas d'action) │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Prochaines Améliorations Possibles

- [ ] Devis → Conversion en vente automatique
- [ ] Remboursement (pour FULLY_PAID)
- [ ] Factures d'avoir / avoirs de crédit
- [ ] Rappels de paiement automatiques
- [ ] Impressions/exports personnalisés
- [ ] Historique des modifications (audit trail)
- [ ] Signature électronique des factures
- [ ] Paiements en ligne intégrés

---

**📅 Dernière mise à jour:** 8 juin 2026  
**👤 Auteur:** GitHub Copilot  
**📌 Version:** 2.0 (Refactorisée)
