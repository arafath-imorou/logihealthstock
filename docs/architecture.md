# Architecture Technique - LogiHealth Stock

## 1. Vue d'Ensemble
L'application LogiHealth Stock suit une architecture moderne de type Single Page Application (SPA) connectée à une API REST (ou GraphQL) de backend.

## 2. Stack Technologique

### 2.1 Frontend
- **Framework :** React (via Vite)
- **Langage :** TypeScript pour la sécurité de typage.
- **Routage :** React Router DOM.
- **Gestion d'état :** Zustand ou Context API pour un état léger, et React Query pour la synchronisation des données serveur.
- **Stylisation :** Vanilla CSS avec Variables CSS pour le Design System. (Modules CSS).
- **Icônes :** Lucide React.
- **Mode Offline (PWA) :** Service Workers et IndexedDB (via localForage) pour la mise en cache des requêtes et la synchronisation différée.

### 2.2 Backend
- **Framework :** Node.js avec Express ou base de données Backend-as-a-Service (Supabase - PostgreSQL).
- **Base de données :** PostgreSQL (relations complexes, contraintes d'intégrité).
- **Authentification :** JWT, avec contrôle strict des rôles (RLS - Row Level Security sur Supabase).

### 2.3 Hébergement & CI/CD
- **Frontend :** Vercel, Netlify ou équivalent.
- **Backend / DB :** Supabase ou serveur VPS dédié.

## 3. Modèle de Données et Sécurité
- Une ségrégation stricte est faite entre la table `stock_magasin` et `stock_pharmacie`.
- Le transfert entre les deux est géré par une table transactionnelle de type `demande_transfert` avec une machine d'état (en attente, approuvé, réceptionné).
- Les mots de passe sont hachés, les requêtes sont signées et chaque modification métier ajoute une ligne dans une table `audit_logs`.

## 4. Design System (Tokens)
- **Couleurs principales :**
  - `--primary-blue`: `#1E40AF` (Bleu médical profond)
  - `--secondary-blue`: `#DBEAFE` (Bleu clair pour les fonds)
  - `--accent-green`: `#10B981` (Succès, FEFO, Validation)
  - `--warning-orange`: `#F59E0B` (Alertes d'expiration 90 jours)
  - `--danger-red`: `#EF4444` (Ruptures, expirés)
  - `--background-light`: `#F9FAFB` (Gris très clair)
  - `--surface-white`: `#FFFFFF`
- **Typographie :** Inter ou Roboto.
