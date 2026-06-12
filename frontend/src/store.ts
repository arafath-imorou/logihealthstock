import { create } from 'zustand';
import { supabase } from './supabase';

export interface Medicament {
  id: string;
  code: string;
  nom: string;
  dci: string;
  categorie: string;
  forme: string;
  dosage: string;
  unite: string;
  seuilAlerte: number;
  prixVente: number;
}

export interface StockItem {
  id: string;
  medicamentId: string;
  lot: string;
  expiration: string; // YYYY-MM-DD
  quantite: number;
  emplacement?: string;
}

export interface Patient {
  id: string;
  nomComplet: string;
  sexe: 'M' | 'F';
  age: number;
  telephone: string;
  referenceDossier?: string;
}

export interface DispensationItem {
  medicamentId: string;
  lot: string;
  quantiteDelivree: number;
}

export interface Dispensation {
  id: string;
  patientId: string;
  patientName: string;
  pharmacien: string;
  date: string;
  numeroOrdonnance?: string;
  prescripteur?: string;
  items: DispensationItem[];
}

export interface TransferItem {
  medicamentId: string;
  quantiteDemandee: number;
  quantiteApprouvee?: number;
  lotSource?: string;
  expiration?: string;
}

export interface TransferRequest {
  id: string;
  demandeur: string;
  dateDemande: string;
  statut: 'attente' | 'approuve' | 'partiel' | 'refuse' | 'transfere' | 'receptionne';
  urgence: 'normal' | 'urgent' | 'critique';
  items: TransferItem[];
  motif?: string;
}

export interface AuditLog {
  id: string;
  date: string;
  utilisateur: string;
  action: string;
  details: string;
}

export interface StockMovement {
  id: string;
  medicamentId: string;
  date: string;
  type: 'Entrée Fournisseur' | 'Transfert' | 'Dispensation' | 'Ajustement' | 'Destruction';
  lot: string;
  quantite: number; // positive for entries, negative for exits
  stockType: 'Magasin' | 'Pharmacie';
  operateur: string;
  details: string;
}

export interface Notification {
  id: string;
  type: 'rupture' | 'seuil_critique' | 'expiration' | 'transfert' | 'validation';
  message: string;
  date: string;
  lu: boolean;
}

interface AppState {
  // Supabase Sync States
  isOnline: boolean;
  syncing: boolean;
  fetchFromSupabase: () => Promise<void>;

  // Authentication
  isLoggedIn: boolean;
  currentUser: { email: string; nomComplet: string; role: 'Admin' | 'Magasinier' | 'Pharmacien' | 'Auditeur' } | null;
  login: (email: string, role: 'Admin' | 'Magasinier' | 'Pharmacien' | 'Auditeur') => boolean;
  logout: () => void;

  // Catalog
  medicaments: Medicament[];
  addMedicament: (med: Omit<Medicament, 'id'>) => void;
  updateMedicament: (id: string, med: Partial<Medicament>) => void;

  // Central Store Stock
  stockCentral: StockItem[];
  receptionnerFournisseur: (fournisseur: string, referenceFacture: string, bonLivraison: string, items: { medicamentId: string; lot: string; expiration: string; quantite: number; prixUnitaire: number }[]) => void;
  ajusterStockCentral: (id: string, nouvelleQuantite: number, motif: string) => void;
  destruireStockCentral: (id: string, quantite: number, motif: string) => void;

  // Pharmacy Stock
  stockPharmacie: StockItem[];
  ajusterStockPharmacie: (id: string, nouvelleQuantite: number, motif: string) => void;

  // Patients & Dispensation
  patients: Patient[];
  dispensations: Dispensation[];
  effectuerDispensation: (patientInfo: Omit<Patient, 'id'>, items: { medicamentId: string; quantite: number }[]) => { success: boolean; message: string };

  // Transfers Workflow
  transferts: TransferRequest[];
  creerDemandeTransfert: (items: { medicamentId: string; quantiteDemandee: number }[], urgence: 'normal' | 'urgent' | 'critique') => void;
  approuverTransfert: (id: string, itemsApprouves: { medicamentId: string; quantiteApprouvee: number; lotSource: string }[]) => void;
  receptionnerTransfert: (id: string) => Promise<{ success: boolean; message: string }>;
  refuserTransfert: (id: string) => void;
  transfererDepuisMagasin: (motif: string, dateTransfert: string, items: { stockCentralItemId: string; quantite: number }[]) => Promise<{ success: boolean; message: string }>;

  // Audit and System
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string) => void;
  notifications: Notification[];
  ajouterNotification: (type: Notification['type'], message: string) => void;
  marquerNotificationsLues: () => void;

  // Movements (Fiche de stock)
  movements: StockMovement[];
}

// Initial Mock Catalog
const initialMedicaments: Medicament[] = [
  { id: 'm1', code: 'AMX500', nom: 'Amoxicilline', dci: 'Amoxicilline', categorie: 'Antibiotique', forme: 'Gélule', dosage: '500mg', unite: 'Boîte de 30', seuilAlerte: 20, prixVente: 1500 },
  { id: 'm2', code: 'PAR500', nom: 'Paracétamol', dci: 'Paracétamol', categorie: 'Analgésique', forme: 'Comprimé', dosage: '500mg', unite: 'Boîte de 20', seuilAlerte: 50, prixVente: 500 },
  { id: 'm3', code: 'IBU400', nom: 'Ibuprofène', dci: 'Ibuprofène', categorie: 'Anti-inflammatoire', forme: 'Comprimé', dosage: '400mg', unite: 'Boîte de 10', seuilAlerte: 15, prixVente: 1200 },
  { id: 'm4', code: 'ART120', nom: 'Artésunate', dci: 'Artésunate/Amodiaquine', categorie: 'Antipaludéen', forme: 'Comprimé', dosage: '100mg/270mg', unite: 'Boîte de 6', seuilAlerte: 30, prixVente: 2500 },
  { id: 'm5', code: 'MET500', nom: 'Métronidazole', dci: 'Métronidazole', categorie: 'Anti-infectieux', forme: 'Comprimé', dosage: '500mg', unite: 'Boîte de 20', seuilAlerte: 25, prixVente: 1800 },
];

const initialStockCentral: StockItem[] = [
  { id: 'sc1', medicamentId: 'm1', lot: 'LOT-AMX2026A', expiration: '2026-10-15', quantite: 120, emplacement: 'Rayon A1' },
  { id: 'sc2', medicamentId: 'm1', lot: 'LOT-AMX2026B', expiration: '2026-12-01', quantite: 80, emplacement: 'Rayon A1' },
  { id: 'sc3', medicamentId: 'm2', lot: 'LOT-PAR2026X', expiration: '2026-06-25', quantite: 300, emplacement: 'Rayon B3' },
  { id: 'sc4', medicamentId: 'm3', lot: 'LOT-IBU2026C', expiration: '2026-08-30', quantite: 50, emplacement: 'Rayon A4' },
  { id: 'sc5', medicamentId: 'm4', lot: 'LOT-ART2026Z', expiration: '2026-05-30', quantite: 15, emplacement: 'Chambre Froide' },
  { id: 'sc6', medicamentId: 'm5', lot: 'LOT-MET2026K', expiration: '2026-11-20', quantite: 90, emplacement: 'Rayon B1' }
];

const initialStockPharmacie: StockItem[] = [
  { id: 'sp1', medicamentId: 'm1', lot: 'LOT-AMX2026A', expiration: '2026-10-15', quantite: 15 },
  { id: 'sp2', medicamentId: 'm2', lot: 'LOT-PAR2026X', expiration: '2026-06-25', quantite: 60 },
  { id: 'sp3', medicamentId: 'm3', lot: 'LOT-IBU2026C', expiration: '2026-08-30', quantite: 8 },
];

const initialPatients: Patient[] = [
  { id: 'p1', nomComplet: 'Koffi Mensah', sexe: 'M', age: 34, telephone: '+228 90 12 34 56', referenceDossier: 'DOS-2026-001' },
  { id: 'p2', nomComplet: 'Amina Diallo', sexe: 'F', age: 28, telephone: '+229 97 00 11 22', referenceDossier: 'DOS-2026-002' },
];

const initialMovements: StockMovement[] = [
  { id: 'mvt_1', medicamentId: 'm1', date: new Date(Date.now() - 3600000 * 24 * 5).toISOString(), type: 'Entrée Fournisseur', lot: 'LOT-AMX2026A', quantite: 200, stockType: 'Magasin', operateur: 'M. Amadou Sow', details: 'Fournisseur: PharmaGros, Facture: FAC-2026-981' },
  { id: 'mvt_2', medicamentId: 'm1', date: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), type: 'Transfert', lot: 'LOT-AMX2026A', quantite: -50, stockType: 'Magasin', operateur: 'M. Amadou Sow', details: 'Sortie transfert approuvé pour Pharmacie' },
  { id: 'mvt_3', medicamentId: 'm1', date: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), type: 'Transfert', lot: 'LOT-AMX2026A', quantite: 50, stockType: 'Pharmacie', operateur: 'Mme. Claire Touré', details: 'Réception transfert magasin' },
  { id: 'mvt_4', medicamentId: 'm1', date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), type: 'Dispensation', lot: 'LOT-AMX2026A', quantite: -15, stockType: 'Pharmacie', operateur: 'Mme. Claire Touré', details: 'Patient: Koffi Mensah, Ordonnance: ORD-8716' },
  { id: 'mvt_5', medicamentId: 'm2', date: new Date(Date.now() - 3600000 * 24 * 4).toISOString(), type: 'Entrée Fournisseur', lot: 'LOT-PAR2026X', quantite: 400, stockType: 'Magasin', operateur: 'M. Amadou Sow', details: 'Fournisseur: PharmaGros, Facture: FAC-2026-981' },
  { id: 'mvt_6', medicamentId: 'm2', date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), type: 'Transfert', lot: 'LOT-PAR2026X', quantite: -100, stockType: 'Magasin', operateur: 'M. Amadou Sow', details: 'Sortie transfert approuvé pour Pharmacie' },
  { id: 'mvt_7', medicamentId: 'm2', date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), type: 'Transfert', lot: 'LOT-PAR2026X', quantite: 100, stockType: 'Pharmacie', operateur: 'Mme. Claire Touré', details: 'Réception transfert magasin' },
  { id: 'mvt_8', medicamentId: 'm2', date: new Date(Date.now() - 3600000 * 12).toISOString(), type: 'Dispensation', lot: 'LOT-PAR2026X', quantite: -40, stockType: 'Pharmacie', operateur: 'Mme. Claire Touré', details: 'Patient: Amina Diallo, Ordonnance: ORD-9012' },
  { id: 'mvt_9', medicamentId: 'm3', date: new Date(Date.now() - 3600000 * 24 * 6).toISOString(), type: 'Entrée Fournisseur', lot: 'LOT-IBU2026C', quantite: 80, stockType: 'Magasin', operateur: 'M. Amadou Sow', details: 'Fournisseur: Medix SA, Facture: FAC-MED-4421' },
  { id: 'mvt_10', medicamentId: 'm3', date: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), type: 'Transfert', lot: 'LOT-IBU2026C', quantite: -20, stockType: 'Magasin', operateur: 'M. Amadou Sow', details: 'Sortie transfert' },
  { id: 'mvt_11', medicamentId: 'm3', date: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), type: 'Transfert', lot: 'LOT-IBU2026C', quantite: 20, stockType: 'Pharmacie', operateur: 'Mme. Claire Touré', details: 'Réception transfert' },
  { id: 'mvt_12', medicamentId: 'm3', date: new Date(Date.now() - 3600000 * 2).toISOString(), type: 'Dispensation', lot: 'LOT-IBU2026C', quantite: -12, stockType: 'Pharmacie', operateur: 'Mme. Claire Touré', details: 'Patient: Amina Diallo' }
];

export const useStore = create<AppState>((set, get) => ({
  isOnline: false,
  syncing: false,
  movements: initialMovements,

  fetchFromSupabase: async () => {
    set({ syncing: true });
    try {
      // 1. Fetch medications
      let { data: medsData, error: medsError } = await supabase.from('medicaments').select('*');
      if (medsError) throw medsError;

      // Auto-seeding if Supabase is completely empty
      if (!medsData || medsData.length === 0) {
        const seedMeds = [
          { code: 'AMX500', nom: 'Amoxicilline', dci: 'Amoxicilline', categorie: 'Antibiotique', forme: 'Gélule', dosage: '500mg', unite: 'Boîte de 30', seuil_alerte: 20, prix_vente: 1500 },
          { code: 'PAR500', nom: 'Paracétamol', dci: 'Paracétamol', categorie: 'Analgésique', forme: 'Comprimé', dosage: '500mg', unite: 'Boîte de 20', seuil_alerte: 50, prix_vente: 500 },
          { code: 'IBU400', nom: 'Ibuprofène', dci: 'Ibuprofène', categorie: 'Anti-inflammatoire', forme: 'Comprimé', dosage: '400mg', unite: 'Boîte de 10', seuil_alerte: 15, prix_vente: 1200 },
          { code: 'ART120', nom: 'Artésunate', dci: 'Artésunate/Amodiaquine', categorie: 'Antipaludéen', forme: 'Comprimé', dosage: '100mg/270mg', unite: 'Boîte de 6', seuil_alerte: 30, prix_vente: 2500 },
          { code: 'MET500', nom: 'Métronidazole', dci: 'Métronidazole', categorie: 'Anti-infectieux', forme: 'Comprimé', dosage: '500mg', unite: 'Boîte de 20', seuil_alerte: 25, prix_vente: 1800 },
        ];
        const { data: insertedMeds, error: insertError } = await supabase.from('medicaments').insert(seedMeds).select('*');
        if (insertError) throw insertError;
        medsData = insertedMeds;

        // Auto-seed mock stocks using valid UUIDs from inserted medicaments
        if (medsData && medsData.length >= 5) {
          const seedCentral = [
            { medicament_id: medsData[0].id, lot: 'LOT-AMX2026A', expiration: '2026-10-15', quantite: 120, emplacement: 'Rayon A1' },
            { medicament_id: medsData[0].id, lot: 'LOT-AMX2026B', expiration: '2026-12-01', quantite: 80, emplacement: 'Rayon A1' },
            { medicament_id: medsData[1].id, lot: 'LOT-PAR2026X', expiration: '2026-06-25', quantite: 300, emplacement: 'Rayon B3' },
            { medicament_id: medsData[2].id, lot: 'LOT-IBU2026C', expiration: '2026-08-30', quantite: 50, emplacement: 'Rayon A4' },
            { medicament_id: medsData[3].id, lot: 'LOT-ART2026Z', expiration: '2026-05-30', quantite: 15, emplacement: 'Chambre Froide' },
            { medicament_id: medsData[4].id, lot: 'LOT-MET2026K', expiration: '2026-11-20', quantite: 90, emplacement: 'Rayon B1' }
          ];
          await supabase.from('stock_magasin').insert(seedCentral);

          const seedPharmacy = [
            { medicament_id: medsData[0].id, lot: 'LOT-AMX2026A', expiration: '2026-10-15', quantite: 15 },
            { medicament_id: medsData[1].id, lot: 'LOT-PAR2026X', expiration: '2026-06-25', quantite: 60 },
            { medicament_id: medsData[2].id, lot: 'LOT-IBU2026C', expiration: '2026-08-30', quantite: 8 }
          ];
          await supabase.from('stock_pharmacie').insert(seedPharmacy);
        }
      }

      const mappedMeds: Medicament[] = (medsData || []).map((m: any) => ({
          id: m.id,
          code: m.code,
          nom: m.nom,
          dci: m.dci || '',
          categorie: m.categorie || '',
          forme: m.forme || '',
          dosage: m.dosage || '',
          unite: m.unite || '',
          seuilAlerte: m.seuil_alerte || 10,
          prixVente: Number(m.prix_vente) || 0
      }));

      // 2. Fetch Central Stock
      const { data: centralData, error: centralError } = await supabase.from('stock_magasin').select('*');
      if (centralError) throw centralError;

      const mappedCentral: StockItem[] = (centralData || []).map((c: any) => ({
        id: c.id,
        medicamentId: c.medicament_id,
        lot: c.lot,
        expiration: c.expiration,
        quantite: c.quantite,
        emplacement: c.emplacement || ''
      }));

      // 3. Fetch Pharmacy Stock
      const { data: phData, error: phError } = await supabase.from('stock_pharmacie').select('*');
      if (phError) throw phError;

      const mappedPharmacy: StockItem[] = (phData || []).map((p: any) => ({
        id: p.id,
        medicamentId: p.medicament_id,
        lot: p.lot,
        expiration: p.expiration,
        quantite: p.quantite
      }));

      // 4. Fetch Patients
      const { data: patientsData, error: patientsError } = await supabase.from('patients').select('*');
      if (patientsError) throw patientsError;

      const mappedPatients: Patient[] = (patientsData || []).map((p: any) => ({
        id: p.id,
        nomComplet: p.nom_complet,
        sexe: p.sexe || 'M',
        age: p.age || 0,
        telephone: p.telephone || '',
        referenceDossier: p.reference_dossier || ''
      }));

      set({
        medicaments: mappedMeds,
        stockCentral: mappedCentral,
        stockPharmacie: mappedPharmacy,
        patients: mappedPatients,
        isOnline: true,
        syncing: false
      });

      get().addAuditLog('Synchronisation', 'Données synchronisées avec succès depuis Supabase !');
    } catch (err: any) {
      console.warn('Mode hors-ligne :', err.message);
      // Fallback: use mock data if offline
      set({
        medicaments: initialMedicaments,
        stockCentral: initialStockCentral,
        stockPharmacie: initialStockPharmacie,
        patients: initialPatients,
        isOnline: false,
        syncing: false
      });
    }
  },

  // Authentication
  isLoggedIn: true,
  currentUser: { email: 'pharma.port@logihealth.org', nomComplet: 'Dr. Jean-Pierre Lomé', role: 'Admin' },
  
  login: (email, role) => {
    const names = {
      Admin: 'Dr. Jean-Pierre Lomé (Admin)',
      Magasinier: 'M. Amadou Sow (Magasinier)',
      Pharmacien: 'Mme. Claire Touré (Pharmacienne)',
      Auditeur: 'Dr. Marc Dubois (Auditeur)'
    };
    const user = { email, nomComplet: names[role], role };
    set({ isLoggedIn: true, currentUser: user });
    get().addAuditLog('Connexion', `L'utilisateur s'est connecté en tant que ${role}`);
    return true;
  },

  logout: () => {
    const user = get().currentUser;
    if (user) {
      get().addAuditLog('Déconnexion', `L'utilisateur ${user.nomComplet} s'est déconnecté`);
    }
    set({ isLoggedIn: false, currentUser: null });
  },

  // Catalog
  medicaments: [],
  addMedicament: async (med) => {
    const newMed: Medicament = {
      ...med,
      id: 'm_' + Math.random().toString(36).substr(2, 9),
    };
    set((state) => ({ medicaments: [...state.medicaments, newMed] }));
    get().addAuditLog('Ajout Catalogue', `Médicament ajouté : ${newMed.nom} (${newMed.dosage})`);

    try {
      const { data, error } = await supabase.from('medicaments').insert([{
        code: newMed.code,
        nom: newMed.nom,
        dci: newMed.dci,
        categorie: newMed.categorie,
        forme: newMed.forme,
        dosage: newMed.dosage,
        unite: newMed.unite,
        seuil_alerte: newMed.seuilAlerte,
        prix_vente: newMed.prixVente
      }]).select('*');
      if (!error && data && data[0]) {
        const res = data as any[];
        // Update local id to match Supabase UUID
        set((state) => ({
          medicaments: state.medicaments.map(m => m.code === newMed.code ? { ...m, id: res[0].id } : m)
        }));
      }
    } catch (e) {
      console.warn('Mode hors-ligne : sauvegarde locale active');
    }
  },

  updateMedicament: async (id, updatedMed) => {
    set((state) => ({
      medicaments: state.medicaments.map((m) => (m.id === id ? { ...m, ...updatedMed } : m)),
    }));
    const med = get().medicaments.find(m => m.id === id);
    get().addAuditLog('Modification Catalogue', `Médicament modifié : ${med?.nom}`);

    try {
      if (!id.includes('m_')) { // Avoid syncing mock IDs
        await supabase.from('medicaments').update({
          code: updatedMed.code,
          nom: updatedMed.nom,
          dci: updatedMed.dci,
          categorie: updatedMed.categorie,
          forme: updatedMed.forme,
          dosage: updatedMed.dosage,
          unite: updatedMed.unite,
          seuil_alerte: updatedMed.seuilAlerte,
          prix_vente: updatedMed.prixVente
        }).eq('id', id);
      }
    } catch (e) {
      console.warn('Mode hors-ligne');
    }
  },

  // Central Store Stock
  stockCentral: [],
  receptionnerFournisseur: async (fournisseur, referenceFacture, bonLivraison, items) => {
    const newStockItems: StockItem[] = items.map((item) => ({
      id: 'sc_' + Math.random().toString(36).substr(2, 9),
      medicamentId: item.medicamentId,
      lot: item.lot,
      expiration: item.expiration,
      quantite: item.quantite,
      emplacement: 'Rayon Réception'
    }));

    const newMovements: StockMovement[] = items.map((item) => ({
      id: 'mvt_' + Math.random().toString(36).substr(2, 9),
      medicamentId: item.medicamentId,
      date: new Date().toISOString(),
      type: 'Entrée Fournisseur',
      lot: item.lot,
      quantite: item.quantite,
      stockType: 'Magasin',
      operateur: get().currentUser?.nomComplet || 'Magasinier',
      details: `Fournisseur: ${fournisseur}, Facture: ${referenceFacture}`
    }));

    set((state) => ({
      stockCentral: [...state.stockCentral, ...newStockItems],
      movements: [...newMovements, ...state.movements]
    }));

    get().addAuditLog(
      'Réception Fournisseur',
      `Facture: ${referenceFacture}, BL: ${bonLivraison}, Fournisseur: ${fournisseur}, ${items.length} produits reçus`
    );

    // Sync with Supabase
    try {
      const inserts = newStockItems.map(item => ({
        medicament_id: item.medicamentId.includes('m') ? null : item.medicamentId,
        lot: item.lot,
        expiration: item.expiration,
        quantite: item.quantite,
        emplacement: item.emplacement
      })).filter(x => x.medicament_id !== null);

      if (inserts.length > 0) {
        await supabase.from('stock_magasin').insert(inserts);
      }
    } catch (e) {
      console.warn('Mode hors-ligne');
    }

    // Expiration checks and notifications
    items.forEach((item) => {
      const med = get().medicaments.find((m) => m.id === item.medicamentId);
      if (med) {
        const daysToExpiry = (new Date(item.expiration).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
        if (daysToExpiry <= 180) {
          get().ajouterNotification(
            'expiration',
            `Le lot ${item.lot} de ${med.nom} reçu expire bientôt (dans ${Math.round(daysToExpiry)} jours)`
          );
        }
      }
    });
  },

  ajusterStockCentral: async (id, nouvelleQuantite, motif) => {
    const item = get().stockCentral.find((s) => s.id === id);
    const med = item ? get().medicaments.find((m) => m.id === item.medicamentId) : null;
    
    if (item) {
      const difference = nouvelleQuantite - item.quantite;
      const newMvt: StockMovement = {
        id: 'mvt_' + Math.random().toString(36).substr(2, 9),
        medicamentId: item.medicamentId,
        date: new Date().toISOString(),
        type: 'Ajustement',
        lot: item.lot,
        quantite: difference,
        stockType: 'Magasin',
        operateur: get().currentUser?.nomComplet || 'Magasinier',
        details: `Ajustement stock physique. Motif: ${motif}`
      };

      set((state) => ({
        stockCentral: state.stockCentral.map((s) => (s.id === id ? { ...s, quantite: nouvelleQuantite } : s)),
        movements: [newMvt, ...state.movements]
      }));
    } else {
      set((state) => ({
        stockCentral: state.stockCentral.map((s) => (s.id === id ? { ...s, quantite: nouvelleQuantite } : s)),
      }));
    }

    get().addAuditLog(
      'Ajustement Magasin Central',
      `Ajustement de ${med?.nom} (Lot: ${item?.lot}) de ${item?.quantite} à ${nouvelleQuantite}. Motif: ${motif}`
    );

    try {
      if (item && !id.includes('sc')) {
        await supabase.from('stock_magasin').update({ quantite: nouvelleQuantite }).eq('id', id);
      }
    } catch (e) {
      console.warn('Mode hors-ligne');
    }
  },

  destruireStockCentral: async (id, quantite, motif) => {
    const item = get().stockCentral.find((s) => s.id === id);
    const med = item ? get().medicaments.find((m) => m.id === item.medicamentId) : null;

    if (!item || item.quantite < quantite) return;

    const newMvt: StockMovement = {
      id: 'mvt_' + Math.random().toString(36).substr(2, 9),
      medicamentId: item.medicamentId,
      date: new Date().toISOString(),
      type: 'Destruction',
      lot: item.lot,
      quantite: -quantite,
      stockType: 'Magasin',
      operateur: get().currentUser?.nomComplet || 'Magasinier',
      details: `Retrait/Destruction. Motif: ${motif}`
    };

    set((state) => ({
      stockCentral: state.stockCentral
        .map((s) => (s.id === id ? { ...s, quantite: s.quantite - quantite } : s))
        .filter((s) => s.quantite > 0),
      movements: [newMvt, ...state.movements]
    }));

    get().addAuditLog(
      'Destruction Médicaments',
      `Destruction de ${quantite} unités de ${med?.nom} (Lot: ${item.lot}). Motif: ${motif}`
    );

    try {
      if (!id.includes('sc')) {
        if (item.quantite - quantite === 0) {
          await supabase.from('stock_magasin').delete().eq('id', id);
        } else {
          await supabase.from('stock_magasin').update({ quantite: item.quantite - quantite }).eq('id', id);
        }
      }
    } catch (e) {
      console.warn('Mode hors-ligne');
    }
  },

  // Pharmacy Stock
  stockPharmacie: [],
  ajusterStockPharmacie: async (id, nouvelleQuantite, motif) => {
    const item = get().stockPharmacie.find((s) => s.id === id);
    const med = item ? get().medicaments.find((m) => m.id === item.medicamentId) : null;

    if (item) {
      const difference = nouvelleQuantite - item.quantite;
      const newMvt: StockMovement = {
        id: 'mvt_' + Math.random().toString(36).substr(2, 9),
        medicamentId: item.medicamentId,
        date: new Date().toISOString(),
        type: 'Ajustement',
        lot: item.lot,
        quantite: difference,
        stockType: 'Pharmacie',
        operateur: get().currentUser?.nomComplet || 'Pharmacien',
        details: `Ajustement stock pharmacie. Motif: ${motif}`
      };

      set((state) => ({
        stockPharmacie: state.stockPharmacie.map((s) => (s.id === id ? { ...s, quantite: nouvelleQuantite } : s)),
        movements: [newMvt, ...state.movements]
      }));
    } else {
      set((state) => ({
        stockPharmacie: state.stockPharmacie.map((s) => (s.id === id ? { ...s, quantite: nouvelleQuantite } : s)),
      }));
    }

    get().addAuditLog(
      'Ajustement Pharmacie',
      `Ajustement de ${med?.nom} (Lot: ${item?.lot}) en pharmacie de ${item?.quantite} à ${nouvelleQuantite}. Motif: ${motif}`
    );

    try {
      if (item && !id.includes('sp')) {
        await supabase.from('stock_pharmacie').update({ quantite: nouvelleQuantite }).eq('id', id);
      }
    } catch (e) {
      console.warn('Mode hors-ligne');
    }
  },

  // Patients & Dispensation
  patients: [],
  dispensations: [],

  effectuerDispensation: (patientInfo, items) => {
    const transactionItems: DispensationItem[] = [];
    const stockUpdates: { id: string; newQty: number }[] = [];

    // Check availability and FEFO
    for (const item of items) {
      const med = get().medicaments.find((m) => m.id === item.medicamentId);
      if (!med) return { success: false, message: `Médicament introuvable.` };

      const phStock = get().stockPharmacie
        .filter((s) => s.medicamentId === item.medicamentId && s.quantite > 0)
        .sort((a, b) => new Date(a.expiration).getTime() - new Date(b.expiration).getTime());

      const totalAvailable = phStock.reduce((acc, s) => acc + s.quantite, 0);

      if (totalAvailable < item.quantite) {
        return {
          success: false,
          message: `Stock insuffisant pour ${med.nom}. Disponible en pharmacie : ${totalAvailable}.`
        };
      }

      let remainingToDeduct = item.quantite;

      for (const stockUnit of phStock) {
        if (remainingToDeduct <= 0) break;

        const deduct = Math.min(stockUnit.quantite, remainingToDeduct);
        transactionItems.push({
          medicamentId: item.medicamentId,
          lot: stockUnit.lot,
          quantiteDelivree: deduct
        });

        stockUpdates.push({
          id: stockUnit.id,
          newQty: stockUnit.quantite - deduct
        });

        remainingToDeduct -= deduct;
      }
    }

    // Register/Find Patient
    let patient = get().patients.find(
      (p) => p.nomComplet.toLowerCase() === patientInfo.nomComplet.toLowerCase()
    );

    if (!patient) {
      patient = {
        id: 'p_' + Math.random().toString(36).substr(2, 9),
        ...patientInfo
      };
      set((state) => ({ patients: [...state.patients, patient!] }));

      // Sync Patient & Dispensation sequentially to maintain foreign keys
      supabase.from('patients').insert([{
        nom_complet: patientInfo.nomComplet,
        sexe: patientInfo.sexe,
        age: patientInfo.age,
        telephone: patientInfo.telephone,
        reference_dossier: patientInfo.referenceDossier
      }]).select().then(({ data, error }) => {
        if (!error && data && data[0]) {
          const res = data as any[];
          const realPatientId = res[0].id;
          
          set((state) => ({
            patients: state.patients.map(p => p.nomComplet === patientInfo.nomComplet ? { ...p, id: realPatientId } : p)
          }));

          // Link and Sync Dispensation with the newly created real UUID
          try {
            supabase.from('dispensations').insert([{
              patient_id: realPatientId,
              numero_ordonnance: patientInfo.referenceDossier || null,
              prescripteur: 'Médecin Externe'
            }]).select('id').then(({ data: dispData, error: dispError }) => {
              if (!dispError && dispData && dispData[0]) {
                const dispRes = dispData as any[];
                const lines = transactionItems.map(tItem => ({
                  dispensation_id: dispRes[0].id,
                  medicament_id: tItem.medicamentId.includes('m') ? null : tItem.medicamentId,
                  lot: tItem.lot,
                  quantite_delivree: tItem.quantiteDelivree
                })).filter(x => x.medicament_id !== null);

                if (lines.length > 0) {
                  supabase.from('dispensation_lignes').insert(lines);
                }
              }
            });
          } catch (e) {
            console.warn('Mode hors-ligne - Dispensation');
          }
        }
      });
    } else {
      // Patient already exists, sync dispensation immediately using existing UUID (if it's a valid database UUID and not local mock 'p1'/'p2')
      try {
        const dbPatientId = patient.id.includes('p') ? null : patient.id;
        if (dbPatientId) {
          supabase.from('dispensations').insert([{
            patient_id: dbPatientId,
            numero_ordonnance: patientInfo.referenceDossier || null,
            prescripteur: 'Médecin Externe'
          }]).select('id').then(({ data, error }) => {
            if (!error && data && data[0]) {
              const res = data as any[];
              const lines = transactionItems.map(tItem => ({
                dispensation_id: res[0].id,
                medicament_id: tItem.medicamentId.includes('m') ? null : tItem.medicamentId,
                lot: tItem.lot,
                quantite_delivree: tItem.quantiteDelivree
              })).filter(x => x.medicament_id !== null);

              if (lines.length > 0) {
                supabase.from('dispensation_lignes').insert(lines);
              }
            }
          });
        }
      } catch (e) {
        console.warn('Mode hors-ligne - Dispensation');
      }
    }

    // Apply Stock Deductions locally
    set((state) => ({
      stockPharmacie: state.stockPharmacie
        .map((s) => {
          const update = stockUpdates.find((u) => u.id === s.id);
          return update ? { ...s, quantite: update.newQty } : s;
        })
        .filter((s) => s.quantite > 0)
    }));

    // Update Supabase stocks
    stockUpdates.forEach(async (update) => {
      try {
        if (!update.id.includes('sp')) {
          if (update.newQty === 0) {
            await supabase.from('stock_pharmacie').delete().eq('id', update.id);
          } else {
            await supabase.from('stock_pharmacie').update({ quantite: update.newQty }).eq('id', update.id);
          }
        }
      } catch (e) {
        console.warn('Mode hors-ligne');
      }
    });

    // Register Dispensation Transaction
    const newDispensation: Dispensation = {
      id: 'disp_' + Math.random().toString(36).substr(2, 9),
      patientId: patient.id,
      patientName: patient.nomComplet,
      pharmacien: get().currentUser?.nomComplet || 'Pharmacien',
      date: new Date().toISOString(),
      items: transactionItems
    };

    const newMovements: StockMovement[] = transactionItems.map(tItem => ({
      id: 'mvt_' + Math.random().toString(36).substr(2, 9),
      medicamentId: tItem.medicamentId,
      date: new Date().toISOString(),
      type: 'Dispensation',
      lot: tItem.lot,
      quantite: -tItem.quantiteDelivree,
      stockType: 'Pharmacie',
      operateur: get().currentUser?.nomComplet || 'Pharmacien',
      details: `Patient: ${patient.nomComplet}`
    }));

    set((state) => ({
      dispensations: [newDispensation, ...state.dispensations],
      movements: [...newMovements, ...state.movements]
    }));

    get().addAuditLog(
      'Dispensation Directe',
      `Dispensation de ${items.length} médicaments à ${patient.nomComplet}`
    );

    // Low stock warnings
    items.forEach((item) => {
      const med = get().medicaments.find((m) => m.id === item.medicamentId);
      if (med) {
        const remainingStock = get().stockPharmacie
          .filter((s) => s.medicamentId === item.medicamentId)
          .reduce((acc, s) => acc + s.quantite, 0);

        if (remainingStock === 0) {
          get().ajouterNotification('rupture', `Rupture totale de ${med.nom} en Pharmacie de dispensation !`);
        } else if (remainingStock <= med.seuilAlerte) {
          get().ajouterNotification('seuil_critique', `Seuil critique atteint pour ${med.nom} en pharmacie (${remainingStock} restants)`);
        }
      }
    });

    return { success: true, message: `Dispensation enregistrée avec succès.` };
  },

  // Transfers Workflow
  transferts: [
    {
      id: 'tr_1',
      demandeur: 'Mme. Claire Touré',
      dateDemande: new Date(Date.now() - 3600000 * 24).toISOString(),
      statut: 'attente',
      urgence: 'urgent',
      items: [
        { medicamentId: 'm1', quantiteDemandee: 50 },
        { medicamentId: 'm2', quantiteDemandee: 100 }
      ]
    }
  ],

  creerDemandeTransfert: (items, urgence) => {
    const newReq: TransferRequest = {
      id: 'tr_' + Math.random().toString(36).substr(2, 9),
      demandeur: get().currentUser?.nomComplet || 'Pharmacien',
      dateDemande: new Date().toISOString(),
      statut: 'attente',
      urgence,
      items
    };

    set((state) => ({ transferts: [newReq, ...state.transferts] }));
    get().addAuditLog('Demande Transfert', `Nouvelle demande de transfert émise (${urgence})`);
    get().ajouterNotification('transfert', `Nouvelle demande de transfert de stock reçue de la Pharmacie (${urgence})`);
  },

  approuverTransfert: (id, itemsApprouves) => {
    const centralUpdates: { id: string; deductQty: number }[] = [];
    const newPharmacyItems: Omit<StockItem, 'id'>[] = [];

    for (const item of itemsApprouves) {
      if (item.quantiteApprouvee <= 0) continue;

      const centralStockUnits = get().stockCentral
        .filter((s) => s.medicamentId === item.medicamentId && s.lot === item.lotSource)
        .sort((a, b) => new Date(a.expiration).getTime() - new Date(b.expiration).getTime());

      let needed = item.quantiteApprouvee;
      for (const unit of centralStockUnits) {
        if (needed <= 0) break;
        const deduct = Math.min(unit.quantite, needed);
        centralUpdates.push({ id: unit.id, deductQty: deduct });

        newPharmacyItems.push({
          medicamentId: item.medicamentId,
          lot: unit.lot,
          expiration: unit.expiration,
          quantite: deduct
        });

        needed -= deduct;
      }
    }

    // Apply central deductions
    set((state) => ({
      stockCentral: state.stockCentral
        .map((s) => {
          const update = centralUpdates.find((u) => u.id === s.id);
          return update ? { ...s, quantite: s.quantite - update.deductQty } : s;
        })
        .filter((s) => s.quantite > 0)
    }));

    // Update central database stock
    centralUpdates.forEach(async (update) => {
      try {
        if (!update.id.includes('sc')) {
          const currentUnit = get().stockCentral.find(s => s.id === update.id);
          if (!currentUnit) {
            await supabase.from('stock_magasin').delete().eq('id', update.id);
          } else {
            await supabase.from('stock_magasin').update({ quantite: currentUnit.quantite }).eq('id', update.id);
          }
        }
      } catch (e) {
        console.warn('Mode hors-ligne');
      }
    });

    const newMvts: StockMovement[] = itemsApprouves.map(item => ({
      id: 'mvt_' + Math.random().toString(36).substr(2, 9),
      medicamentId: item.medicamentId,
      date: new Date().toISOString(),
      type: 'Transfert',
      lot: item.lotSource,
      quantite: -item.quantiteApprouvee,
      stockType: 'Magasin',
      operateur: get().currentUser?.nomComplet || 'Magasinier',
      details: `Expédié vers la Pharmacie (Transfert ${id})`
    }));

    set((state) => ({
      transferts: state.transferts.map((t) =>
        t.id === id
          ? {
              ...t,
              statut: 'transfere',
              valideur: get().currentUser?.nomComplet,
              items: t.items.map((i) => {
                const approvedItem = itemsApprouves.find((ai) => ai.medicamentId === i.medicamentId);
                return approvedItem
                  ? {
                      ...i,
                      quantiteApprouvee: approvedItem.quantiteApprouvee,
                      lotSource: approvedItem.lotSource
                    }
                  : i;
              })
            }
          : t
      ),
      movements: [...newMvts, ...state.movements]
    }));

    get().addAuditLog('Approbation Transfert', `Transfert ${id} approuvé et expédié à la pharmacie.`);
    get().ajouterNotification('validation', `Le transfert de médicaments ${id} a été validé et expédié par le magasin.`);
  },

  receptionnerTransfert: async (id) => {
    const req = get().transferts.find((t) => t.id === id);
    if (!req) return { success: false, message: 'Transfert introuvable.' };

    const newStock: StockItem[] = [];
    for (const item of req.items) {
      if (!item.quantiteApprouvee || !item.lotSource) continue;

      const originalExpiration = item.expiration || get().stockCentral.find((s) => s.medicamentId === item.medicamentId && s.lot === item.lotSource)?.expiration || '2027-01-01';

      const existing = get().stockPharmacie.find(
        (s) => s.medicamentId === item.medicamentId && s.lot === item.lotSource
      );

      if (existing) {
        set((state) => ({
          stockPharmacie: state.stockPharmacie.map((s) =>
            s.id === existing.id ? { ...s, quantite: s.quantite + item.quantiteApprouvee! } : s
          )
        }));

        try {
          if (!existing.id.includes('sp')) {
            await supabase.from('stock_pharmacie').update({ quantite: existing.quantite + item.quantiteApprouvee! }).eq('id', existing.id);
          }
        } catch (e) {
          console.warn('Mode hors-ligne');
        }
      } else {
        const localId = 'sp_' + Math.random().toString(36).substr(2, 9);
        const newPharmaItem = {
          id: localId,
          medicamentId: item.medicamentId,
          lot: item.lotSource,
          expiration: originalExpiration,
          quantite: item.quantiteApprouvee
        };
        newStock.push(newPharmaItem);

        try {
          const { data, error } = await supabase.from('stock_pharmacie').insert([{
            medicament_id: item.medicamentId.includes('m') ? null : item.medicamentId,
            lot: item.lotSource,
            expiration: originalExpiration,
            quantite: item.quantiteApprouvee
          }]).select('id');
          
          if (!error && data && data[0]) {
            const res = data as any[];
            set((state) => ({
              stockPharmacie: state.stockPharmacie.map(s => s.id === localId ? { ...s, id: res[0].id } : s)
            }));
          }
        } catch (e) {
          console.warn('Mode hors-ligne');
        }
      }
    }

    if (newStock.length > 0) {
      set((state) => ({ stockPharmacie: [...state.stockPharmacie, ...newStock] }));
    }

    const newMvts = req.items.map((item): StockMovement | null => {
      if (!item.quantiteApprouvee || !item.lotSource) return null;
      return {
        id: 'mvt_' + Math.random().toString(36).substr(2, 9),
        medicamentId: item.medicamentId,
        date: new Date().toISOString(),
        type: 'Transfert',
        lot: item.lotSource,
        quantite: item.quantiteApprouvee,
        stockType: 'Pharmacie',
        operateur: get().currentUser?.nomComplet || 'Pharmacien',
        details: `Réceptionné en Pharmacie (Transfert ${id})`
      };
    }).filter((x): x is StockMovement => x !== null);

    set((state) => ({
      transferts: state.transferts.map((t) => (t.id === id ? { ...t, statut: 'receptionne' } : t)),
      movements: [...newMvts, ...state.movements]
    }));

    get().addAuditLog('Réception Transfert', `Pharmacie a réceptionné et stocké le transfert ${id}`);
    return { success: true, message: 'Stock du transfert réceptionné et intégré en pharmacie avec succès !' };
  },

  refuserTransfert: (id) => {
    set((state) => ({
      transferts: state.transferts.map((t) => (t.id === id ? { ...t, statut: 'refuse' } : t))
    }));
    get().addAuditLog('Refus Transfert', `Magasin a refusé le transfert ${id}`);
  },

  transfererDepuisMagasin: async (motif, dateTransfert, items) => {
    const centralUpdates: { id: string; deductQty: number }[] = [];
    const transferLines: TransferItem[] = [];

    for (const x of items) {
      const centralStockItem = get().stockCentral.find((s) => s.id === x.stockCentralItemId);
      if (!centralStockItem) {
        return { success: false, message: `Lot central introuvable pour la sélection.` };
      }
      if (x.quantite <= 0 || x.quantite > centralStockItem.quantite) {
        return { success: false, message: `Quantité invalide pour le lot ${centralStockItem.lot}. Disponible : ${centralStockItem.quantite}` };
      }
      centralUpdates.push({ id: centralStockItem.id, deductQty: x.quantite });
      transferLines.push({
        medicamentId: centralStockItem.medicamentId,
        quantiteDemandee: x.quantite,
        quantiteApprouvee: x.quantite,
        lotSource: centralStockItem.lot,
        expiration: centralStockItem.expiration
      });
    }

    // Deduct from stockCentral state
    set((state) => ({
      stockCentral: state.stockCentral
        .map((s) => {
          const update = centralUpdates.find((u) => u.id === s.id);
          return update ? { ...s, quantite: s.quantite - update.deductQty } : s;
        })
        .filter((s) => s.quantite > 0)
    }));

    // Sync deductions to Supabase
    for (const update of centralUpdates) {
      try {
        if (!update.id.includes('sc')) {
          const currentUnit = get().stockCentral.find(s => s.id === update.id);
          if (!currentUnit) {
            await supabase.from('stock_magasin').delete().eq('id', update.id);
          } else {
            await supabase.from('stock_magasin').update({ quantite: currentUnit.quantite }).eq('id', update.id);
          }
        }
      } catch (e) {
        console.warn('Mode hors-ligne - Déduction Magasin Central');
      }
    }

    // Create Transfer Request with status 'transfere'
    const newTransferId = 'tr_' + Math.random().toString(36).substr(2, 9);
    const newTransferRequest: TransferRequest = {
      id: newTransferId,
      demandeur: `Magasin Central (${get().currentUser?.nomComplet || 'Magasinier'})`,
      dateDemande: dateTransfert || new Date().toISOString().split('T')[0],
      statut: 'transfere',
      urgence: 'normal',
      items: transferLines,
      motif: motif
    };

    const newMvts: StockMovement[] = [];
    for (const x of items) {
      const centralStockItem = get().stockCentral.find((s) => s.id === x.stockCentralItemId);
      if (centralStockItem) {
        newMvts.push({
          id: 'mvt_' + Math.random().toString(36).substr(2, 9),
          medicamentId: centralStockItem.medicamentId,
          date: new Date().toISOString(),
          type: 'Transfert',
          lot: centralStockItem.lot,
          quantite: -x.quantite,
          stockType: 'Magasin',
          operateur: get().currentUser?.nomComplet || 'Magasinier',
          details: `Expédié vers la Pharmacie (Transfert direct ${newTransferId}). Motif: ${motif || 'Non spécifié'}`
        });
      }
    }

    set((state) => ({
      transferts: [newTransferRequest, ...state.transferts],
      movements: [...newMvts, ...state.movements]
    }));

    // Add Audit & Notification
    get().addAuditLog(
      'Transfert Central émis',
      `Magasin Central a initié un transfert de ${items.length} médicament(s). Motif: ${motif || 'Non spécifié'}`
    );
    get().ajouterNotification(
      'transfert',
      `Nouveau transfert de stock émis par le Magasin Central vers la Pharmacie (Motif: ${motif || 'Non spécifié'}).`
    );

    return { success: true, message: 'Le transfert de stock a été initié et expédié vers la Pharmacie avec succès !' };
  },

  // Audit Logs
  auditLogs: [
    { id: '1', date: new Date(Date.now() - 3600000 * 2).toISOString(), utilisateur: 'Admin (Dr. Jean-Pierre Lomé)', action: 'Initialisation Système', details: 'Démarrage et chargement des stocks initiaux.' }
  ],
  addAuditLog: (action, details) => {
    const newLog: AuditLog = {
      id: 'a_' + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      utilisateur: get().currentUser?.nomComplet || 'Système',
      action,
      details
    };
    set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
  },

  // Notifications
  notifications: [
    { id: 'n1', type: 'seuil_critique', message: 'Ibuprofène 400mg en pharmacie sous le seuil critique (8 restant).', date: new Date().toISOString(), lu: false },
    { id: 'n2', type: 'expiration', message: 'Lot LOT-ART2026Z de Artésunate expédiant bientôt (Mai 2026).', date: new Date().toISOString(), lu: false }
  ],
  ajouterNotification: (type, message) => {
    const newNotif: Notification = {
      id: 'not_' + Math.random().toString(36).substr(2, 9),
      type,
      message,
      date: new Date().toISOString(),
      lu: false
    };
    set((state) => ({ notifications: [newNotif, ...state.notifications] }));
  },
  marquerNotificationsLues: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, lu: true }))
    }));
  }
}));
