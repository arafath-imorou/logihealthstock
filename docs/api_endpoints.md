# API Endpoints - LogiHealth Stock

## 1. Authentification
- `POST /api/auth/login` : Authentification et récupération du token JWT.
- `POST /api/auth/logout` : Déconnexion.
- `GET /api/auth/me` : Récupère les infos de l'utilisateur connecté.

## 2. Médicaments (Magasin Central)
- `GET /api/medicaments` : Liste des médicaments du catalogue.
- `POST /api/medicaments` : Ajoute un nouveau médicament.
- `PUT /api/medicaments/:id` : Modifie un médicament.
- `GET /api/stock-magasin` : Liste le stock actuel du magasin central (avec lots et expirations).

## 3. Réceptions (Entrées Fournisseurs)
- `POST /api/receptions` : Enregistre une nouvelle réception de médicaments.
- `GET /api/receptions` : Liste les historiques d'entrée.

## 4. Transferts (Magasin -> Pharmacie)
- `POST /api/transferts` : Crée une demande de transfert (Pharmacie).
- `PUT /api/transferts/:id/approuver` : Approuve une demande (Magasin).
- `PUT /api/transferts/:id/receptionner` : Valide la réception (Pharmacie).

## 5. Pharmacie & Dispensation
- `GET /api/stock-pharmacie` : Liste le stock disponible en pharmacie.
- `POST /api/dispensations` : Enregistre une dispensation directe (crée le patient si nouveau, et déstocke automatiquement).
- `GET /api/dispensations/historique` : Historique des délivrances pour l'audit.

## 6. Tableaux de bord (Analytics)
- `GET /api/analytics/dashboard` : Récupère les KPIs globaux (Stock, valeur, expirations, patients servis).
