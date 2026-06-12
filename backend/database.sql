-- LogiHealth Stock - Database Schema

-- Extension pour générer des UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs (Roles: Admin, Magasinier, Pharmacien, Auditeur)
CREATE TABLE public.utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nom_complet VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Magasinier', 'Pharmacien', 'Auditeur')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catalogue Central des Médicaments
CREATE TABLE public.medicaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    nom VARCHAR(255) NOT NULL,
    dci VARCHAR(255),
    categorie VARCHAR(100),
    forme VARCHAR(100),
    dosage VARCHAR(100),
    unite VARCHAR(50),
    seuil_alerte INTEGER DEFAULT 10,
    prix_vente NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Magasin Central (Gestion stricte par lot et date d'expiration)
CREATE TABLE public.stock_magasin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicament_id UUID REFERENCES public.medicaments(id) ON DELETE CASCADE,
    lot VARCHAR(100) NOT NULL,
    expiration DATE NOT NULL,
    quantite INTEGER NOT NULL DEFAULT 0 CHECK (quantite >= 0),
    emplacement VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Pharmacie de Dispensation (Séparé du magasin)
CREATE TABLE public.stock_pharmacie (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicament_id UUID REFERENCES public.medicaments(id) ON DELETE CASCADE,
    lot VARCHAR(100) NOT NULL,
    expiration DATE NOT NULL,
    quantite INTEGER NOT NULL DEFAULT 0 CHECK (quantite >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des Patients (Dossiers)
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_complet VARCHAR(255) NOT NULL,
    sexe VARCHAR(10) CHECK (sexe IN ('M', 'F')),
    age INTEGER,
    telephone VARCHAR(50),
    reference_dossier VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispensations (Sorties directes en pharmacie)
CREATE TABLE public.dispensations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE RESTRICT,
    pharmacien_id UUID REFERENCES public.utilisateurs(id) ON DELETE RESTRICT,
    numero_ordonnance VARCHAR(100),
    prescripteur VARCHAR(255),
    date_dispensation TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lignes de Dispensation
CREATE TABLE public.dispensation_lignes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispensation_id UUID REFERENCES public.dispensations(id) ON DELETE CASCADE,
    medicament_id UUID REFERENCES public.medicaments(id),
    lot VARCHAR(100) NOT NULL,
    quantite_delivree INTEGER NOT NULL CHECK (quantite_delivree > 0)
);

-- Trigger pour la mise à jour des updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stock_magasin_updated_at BEFORE UPDATE ON public.stock_magasin FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_stock_pharmacie_updated_at BEFORE UPDATE ON public.stock_pharmacie FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Fonction de déstockage FEFO automatique (Exemple simplifié)
-- CREATE OR REPLACE FUNCTION destock_fefo(p_medicament_id UUID, p_quantite INTEGER) ...
