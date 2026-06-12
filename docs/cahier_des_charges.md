# Cahier des Charges - LogiHealth Stock

## 1. Contexte et Objectif Principal
LogiHealth Stock est une application web et mobile professionnelle dédiée à la gestion des stocks de médicaments d'un centre de santé.
L'objectif est de digitaliser la gestion complète des médicaments depuis la réception fournisseur jusqu'à la dispensation au patient, avec traçabilité complète des lots, gestion des expirations (FEFO), réapprovisionnement interne et reporting avancé. Le système garantit une séparation stricte entre le magasin central et la pharmacie de dispensation.

## 2. Public Cible (Types d'Utilisateurs)

### 2.1 Administrateur
- **Accès complet :** Configuration générale, gestion des utilisateurs, sécurité, rapports et audit.

### 2.2 Magasinier
- **Accès :** Stock central, entrées fournisseurs, inventaires, ajustements, transferts vers la pharmacie et gestion des expirations.

### 2.3 Pharmacien
- **Accès :** Stock pharmacie, enregistrement patient, dispensation directe, historique délivrance, demande de réapprovisionnement au magasin.

### 2.4 Auditeur
- **Lecture seule :** Rapports, historique, mouvements.

## 3. Modules Principaux

### 3.1 Authentification
- Écran login premium "Medical SaaS".
- Authentification Email / Mot de passe.
- Récupération de mot de passe, timeout session, permissions par rôle.
- Journal des connexions et déconnexion sécurisée.

### 3.2 Tableau de Bord (Dashboard)
- **KPIs :** Stock central total, stock pharmacie total, valeur du stock, ruptures, stock faible, expirations proches, expirés, transferts en attente, patients servis.
- **Widgets :** Graphique de consommation, top médicaments sortis, alertes critiques, mouvements récents.

### 3.3 Module Magasin Central
- Gestion complète de la liste des médicaments (Code, Nom, DCI, Catégorie, Forme, Dosage, Lot, Expiration, etc.).
- Historique et filtres avancés (recherche, expiration, fournisseur, etc.).
- Formulaire d'entrée fournisseur complet (Brouillon, Validation, Impression).
- Fonction d'inventaire physique et justification des écarts.

### 3.4 Gestion Expirations
- Alertes automatiques à 180, 90, 30 jours et expirés.
- Actions d'isolement, destruction, ou sortie exceptionnelle.

### 3.5 Transfert Magasin → Pharmacie
- **Workflow :** Pharmacie demande -> Magasin approuve -> Transfert -> Réception pharmacie.
- Statuts de suivi de demande.

### 3.6 Module Pharmacie & Dispensation Directe
- Workflow ultra-rapide en 2 étapes :
  1. **Infos patient :** Nom, sexe, âge, téléphone, référence dossier.
  2. **Sortie médicaments :** Recherche instantanée (auto-complétion), proposition automatique de lot FEFO, déstockage automatique à la confirmation.
- Impression de ticket et annulation sous autorisation.

### 3.7 Rapports et Audit
- Exports PDF et Excel.
- Rapports sur la valeur du stock, la consommation, les sorties, les expirations, les destructions, et l'audit.

### 3.8 Paramètres et Sécurité
- Gestion des catégories, fournisseurs, unités, seuils, rôles, permissions, devise et langue.
- Pistes d'audit, historique des actions, verouillage de session, sauvegardes.

## 4. Exigences Techniques & UI/UX
- **Style :** Premium healthcare SaaS (Minimaliste, ultra-rapide).
- **Palette :** Bleu médical, blanc, vert léger, gris clair.
- **Responsive :** Mobile/tablette.
- **Bonus :** Mode offline, synchronisation différée, scan code-barres / QR code, impression ticket.
