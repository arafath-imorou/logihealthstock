import React, { useState } from 'react';
import { useStore, Medicament, StockItem } from '../store';
import { 
  Plus, 
  Search, 
  UserPlus, 
  ClipboardList, 
  FileText, 
  History, 
  CheckCircle, 
  AlertOctagon, 
  Printer, 
  XCircle, 
  HelpCircle, 
  Send, 
  Eye,
  Edit3
} from 'lucide-react';
import StockCardModal from '../components/StockCardModal';
import { InventaireLigne } from '../store';

export default function Pharmacie() {
  const { 
    stockPharmacie, 
    medicaments, 
    dispensations, 
    effectuerDispensation,
    creerDemandeTransfert,
    transferts,
    receptionnerTransfert,
    currentUser,
    inventaires,
    creerSessionInventaire,
    sauvegarderBrouillonInventaire,
    validerInventaire
  } = useStore();

  // Consommation Moyenne Mensuelle (CMM)
  const calculateCMM = (medicamentId: string) => {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);

    // Sorties des 3 derniers mois
    const relevantDispensations = dispensations.filter(d => {
      const dDate = new Date(d.date);
      return dDate >= threeMonthsAgo && dDate <= today;
    });

    let totalSorties = 0;
    relevantDispensations.forEach(d => {
      d.items.forEach(it => {
        if (it.medicamentId === medicamentId) {
          totalSorties += it.quantiteDelivree;
        }
      });
    });

    // Stock actuel en pharmacie
    const currentStock = stockPharmacie
      .filter(s => s.medicamentId === medicamentId)
      .reduce((acc, s) => acc + s.quantite, 0);

    let ruptureDays = 0;
    const totalDays = 91.5; // moyenne de jours sur 3 mois (30.5 * 3)

    // Estimation des jours de rupture si le stock actuel est à 0
    if (currentStock === 0) {
      if (totalSorties === 0) {
        ruptureDays = totalDays; // Rupture totale sur la période
      } else {
        // Date de la dernière dispensation
        let lastDispDate = threeMonthsAgo;
        relevantDispensations.forEach(d => {
          const hasItem = d.items.some(it => it.medicamentId === medicamentId);
          if (hasItem) {
            const dDate = new Date(d.date);
            if (dDate > lastDispDate) {
              lastDispDate = dDate;
            }
          }
        });
        const diffTime = Math.abs(today.getTime() - lastDispDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        ruptureDays = Math.min(diffDays, totalDays);
      }
    }

    if (ruptureDays >= totalDays) {
      return 0;
    }

    // Application des formules (avec ou sans rupture)
    const cmm = ruptureDays > 0 
      ? (totalSorties * 30.5) / (totalDays - ruptureDays) 
      : (totalSorties / 3);

    return Math.round(cmm * 10) / 10; // Arrondi à 1 décimale
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'stock' | 'dispensation' | 'historique' | 'receptions' | 'session_inventaire'>('dashboard');
  
  // Physical Inventory States
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [inventoryLines, setInventoryLines] = useState<InventaireLigne[]>([]);
  const [invDateInput, setInvDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [showNewInvModal, setShowNewInvModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [showPharmaReceptionModal, setShowPharmaReceptionModal] = useState<string | null>(null);
  const [selectedStockCardMedId, setSelectedStockCardMedId] = useState<string | null>(null);

  // 1. New Dispensation Form States
  const [dispStep, setDispStep] = useState<1 | 2 | 3>(1);
  const [patientNom, setPatientNom] = useState('');
  const [patientSexe, setPatientSexe] = useState<'M' | 'F'>('F');
  const [patientAge, setPatientAge] = useState<number>(0);
  const [patientTel, setPatientTel] = useState('');
  const [patientRef, setPatientRef] = useState('');
  const [numeroOrdonnance, setNumeroOrdonnance] = useState('');
  const [prescripteur, setPrescripteur] = useState('');

  // Items to dispense
  const [dispenseLines, setDispenseLines] = useState<{ medicamentId: string; quantite: number }[]>([
    { medicamentId: '', quantite: 0 }
  ]);

  // Restock Request State
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockLines, setRestockLines] = useState<{ medicamentId: string; quantiteDemandee: number }[]>([
    { medicamentId: '', quantiteDemandee: 0 }
  ]);
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'critique'>('normal');

  // Direct Dispensation functions
  const handleAddDispenseLine = () => {
    setDispenseLines([...dispenseLines, { medicamentId: '', quantite: 0 }]);
  };

  const handleRemoveDispenseLine = (index: number) => {
    setDispenseLines(dispenseLines.filter((_, i) => i !== index));
  };

  const handleDispenseLineChange = (index: number, field: string, value: any) => {
    const updated = [...dispenseLines];
    updated[index] = { ...updated[index], [field]: value };
    setDispenseLines(updated);
  };

  const submitDispensation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientNom) {
      alert('Veuillez remplir les informations obligatoires du patient (Nom).');
      return;
    }

    const validLines = dispenseLines.filter(line => line.medicamentId && line.quantite > 0);
    if (validLines.length === 0) {
      alert('Veuillez ajouter au moins un médicament à dispenser.');
      return;
    }

    // Call store dispensation function (handles FEFO automatically)
    const result = effectuerDispensation(
      {
        nomComplet: patientNom,
        sexe: patientSexe,
        age: patientAge,
        telephone: patientTel,
        referenceDossier: patientRef
      },
      validLines
    );

    if (result.success) {
      alert(result.message);
      // Reset
      setPatientNom('');
      setPatientSexe('F');
      setPatientAge(0);
      setPatientTel('');
      setPatientRef('');
      setNumeroOrdonnance('');
      setPrescripteur('');
      setDispenseLines([{ medicamentId: '', quantite: 0 }]);
      setDispStep(1);
      setActiveTab('dashboard');
    } else {
      alert(result.message);
    }
  };

  // Restocking functions
  const handleAddRestockLine = () => {
    setRestockLines([...restockLines, { medicamentId: '', quantiteDemandee: 0 }]);
  };

  const handleRemoveRestockLine = (index: number) => {
    setRestockLines(restockLines.filter((_, i) => i !== index));
  };

  const handleRestockLineChange = (index: number, field: string, value: any) => {
    const updated = [...restockLines];
    updated[index] = { ...updated[index], [field]: value };
    setRestockLines(updated);
  };

  const submitRestockRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = restockLines.filter(line => line.medicamentId && line.quantiteDemandee > 0);
    if (validLines.length === 0) {
      alert('Veuillez ajouter au moins un médicament.');
      return;
    }
    creerDemandeTransfert(validLines, urgency);
    alert('Demande de réapprovisionnement transmise avec succès au Magasin Central !');
    setShowRestockModal(false);
    setRestockLines([{ medicamentId: '', quantiteDemandee: 0 }]);
    setUrgency('normal');
  };

  // Physical Inventory Helper Functions
  const handleStartNewInventory = async () => {
    const tempId = await creerSessionInventaire('Pharmacie', invDateInput);
    setSelectedInvId(tempId);
    
    // Find newly created session to initialize lines in state
    const createdSession = useStore.getState().inventaires.find(i => i.id === tempId || i.dateInventaire === invDateInput);
    if (createdSession) {
      setInventoryLines(createdSession.lignes);
    }
    setShowNewInvModal(false);
  };

  const handleOpenInventory = (inv: any) => {
    setSelectedInvId(inv.id);
    setInventoryLines(inv.lignes || []);
  };

  const handleLinePhysicalQtyChange = (idx: number, val: number | null) => {
    setInventoryLines(lines => lines.map((l, i) => {
      if (i === idx) {
        const ecart = val !== null ? val - l.stockTheorique : null;
        return { ...l, stockPhysique: val, ecart };
      }
      return l;
    }));
  };

  const handleLineCommentChange = (idx: number, val: string) => {
    setInventoryLines(lines => lines.map((l, i) => {
      if (i === idx) {
        return { ...l, commentaire: val };
      }
      return l;
    }));
  };

  const handleSaveInventoryDraft = async () => {
    if (!selectedInvId) return;
    await sauvegarderBrouillonInventaire(selectedInvId, inventoryLines);
    alert('Brouillon d\'inventaire sauvegardé avec succès !');
    setSelectedInvId(null);
  };

  const handleValidateInventory = async () => {
    if (!selectedInvId) return;
    
    const hasUncounted = inventoryLines.some(l => l.stockPhysique === null);
    if (hasUncounted) {
      alert("Veuillez renseigner le stock physique pour toutes les lignes avant de valider.");
      return;
    }

    const confirmVal = window.confirm(
      "Êtes-vous sûr de vouloir valider cet inventaire ? Les stocks actuels de la Pharmacie seront mis à jour avec les stocks physiques saisis, et des ajustements de stock seront enregistrés pour les écarts."
    );
    if (!confirmVal) return;

    await validerInventaire(selectedInvId, inventoryLines);
    alert('L\'inventaire a été validé avec succès. Les stocks de la pharmacie ont été mis à jour.');
    setSelectedInvId(null);
  };

  // Filter stocks
  const filteredStock = stockPharmacie.filter(item => {
    const med = medicaments.find(m => m.id === item.medicamentId);
    if (!med) return false;
    return med.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
           med.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.lot.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-blue)' }}>Pharmacie de Dispensation</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gestion des sorties patient directes (FEFO), historique des ordonnances et demandes internes.</p>
        </div>
        {currentUser?.role !== 'Auditeur' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => { setActiveTab('dispensation'); setDispStep(1); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-md)' }}
            >
              <Plus size={16} /> NOUVELLE DISPENSATION
            </button>
            <button 
              className="btn" 
              onClick={() => setShowRestockModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--primary-blue)', background: 'transparent', color: 'var(--primary-blue)' }}
            >
              <Send size={16} /> Demander Stock
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '1rem', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('dashboard')}
          style={{
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'dashboard' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: activeTab === 'dashboard' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            whiteSpace: 'nowrap'
          }}
        >
          📊 Pharmacie Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('stock')}
          style={{
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'stock' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: activeTab === 'stock' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            whiteSpace: 'nowrap'
          }}
        >
          💊 Stock Actuel Pharmacie
        </button>
        <button 
          onClick={() => setActiveTab('historique')}
          style={{
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'historique' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: activeTab === 'historique' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            whiteSpace: 'nowrap'
          }}
        >
          📜 Historique Délivrances
        </button>
        <button 
          onClick={() => setActiveTab('receptions')}
          style={{
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'receptions' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: activeTab === 'receptions' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            whiteSpace: 'nowrap'
          }}
        >
          📥 Réception Transferts 
          {transferts.filter(t => t.statut === 'transfere').length > 0 && (
            <span style={{
              backgroundColor: 'var(--danger-red)',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.15rem 0.4rem',
              borderRadius: '50%',
              display: 'inline-block',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
            }}>
              {transferts.filter(t => t.statut === 'transfere').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => {
            setActiveTab('session_inventaire');
            setSelectedInvId(null);
          }}
          style={{
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'session_inventaire' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: activeTab === 'session_inventaire' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            whiteSpace: 'nowrap'
          }}
        >
          📋 Inventaire Physique
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'dashboard' && (
        <div className="grid-2-1">
          
          {/* Main Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Transfer Pending Alert Banner */}
            {transferts.filter(t => t.statut === 'transfere').length > 0 && (
              <div className="card animate-fade-in" style={{ borderLeft: '5px solid var(--warning-orange)', backgroundColor: '#FFFBEB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <div>
                  <h4 style={{ fontWeight: 700, color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    ⚠️ Transfert de stock disponible pour réception !
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#78350F', margin: '0.25rem 0 0 0' }}>
                    Le Magasin Central vous a transféré de nouveaux lots. Vous devez réceptionner et valider physiquement les produits pour les insérer dans le stock de dispensation.
                  </p>
                </div>
                <button 
                  className="btn" 
                  onClick={() => setActiveTab('receptions')}
                  style={{ background: '#D97706', color: 'white', border: 'none', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                >
                  Réceptionner
                </button>
              </div>
            )}

            {/* Pharmacy stock status */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>📈 Aperçu des Quantités en Rayons</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {medicaments.map(med => {
                  const qty = stockPharmacie.filter(s => s.medicamentId === med.id).reduce((acc, s) => acc + s.quantite, 0);
                  const isLow = qty <= med.seuilAlerte && qty > 0;
                  const isOut = qty === 0;

                  return (
                    <div key={med.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{med.nom} {med.dosage}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.forme} | Code: {med.code}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: isOut ? '#FEF2F2' : isLow ? '#FFFBEB' : '#ECFDF5',
                          color: isOut ? 'var(--danger-red)' : isLow ? 'var(--warning-orange)' : 'var(--accent-green)'
                        }}>
                          {isOut ? 'RUPTURE' : isLow ? 'STOCK FAIBLE' : 'OK'}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{qty}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Area : Quick Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>💡 Aide FEFO de Dispensation</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Lors d'une nouvelle dispensation, l'application choisit automatiquement les lots expirant en premier (méthode FEFO - First Expired First Out) pour minimiser les pertes.
              </p>
              <div style={{ borderLeft: '3px solid var(--accent-green)', paddingLeft: '0.75rem', fontSize: '0.85rem', backgroundColor: '#ECFDF5', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                <strong>Important :</strong> Vous n'avez pas besoin de choisir manuellement les lots, le système s'en charge.
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Rechercher dans le stock pharmacie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.5rem 0.5rem 2.2rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem' }}>Code</th>
                  <th style={{ padding: '1rem' }}>Médicament</th>
                  <th style={{ padding: '1rem' }}>N° Lot</th>
                  <th style={{ padding: '1rem' }}>Date Expiration</th>
                  <th style={{ padding: '1rem' }}>Stock Disponible</th>
                  <th style={{ padding: '1rem' }}>CMM</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aucun produit en stock dans la Pharmacie.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => {
                    const med = medicaments.find(m => m.id === item.medicamentId);
                    if (!med) return null;
                    const cmmValue = calculateCMM(med.id);
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{med.code}</td>
                        <td style={{ padding: '1rem' }}>{med.nom} {med.dosage} ({med.forme})</td>
                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{item.lot}</td>
                        <td style={{ padding: '1rem' }}>{item.expiration}</td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>{item.quantite}</td>
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--primary-blue)' }}>{cmmValue}</td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button 
                            type="button"
                            onClick={() => setSelectedStockCardMedId(med.id)}
                            className="btn"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', background: '#F8FAFC' }}
                            title="Visualiser la fiche de stock"
                          >
                            <Eye size={14} style={{ color: 'var(--primary-blue)' }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {activeTab === 'dispensation' && (
        <form onSubmit={submitDispensation} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {dispStep === 1 
                ? 'Étape 1 : Informations Patient' 
                : dispStep === 2 
                  ? 'Étape 2 : Sélection des Médicaments' 
                  : 'Étape 3 : Visualisation & Validation'}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Étape {dispStep} de 3
            </span>
          </div>

          <div style={{ width: '100%', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              width: dispStep === 1 ? '33.3%' : dispStep === 2 ? '66.6%' : '100%', 
              height: '100%', 
              backgroundColor: 'var(--primary-blue)', 
              transition: 'width 0.3s ease' 
            }}></div>
          </div>

          {dispStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div className="grid-1-1">
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Nom Complet du Patient *</label>
                  <input 
                    type="text" 
                    value={patientNom}
                    onChange={(e) => setPatientNom(e.target.value)}
                    required
                    placeholder="Ex: Koffi Mensah"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div className="grid-1-1">
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Sexe *</label>
                    <select 
                      value={patientSexe}
                      onChange={(e) => setPatientSexe(e.target.value as 'M' | 'F')}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'white' }}
                    >
                      <option value="F">Féminin</option>
                      <option value="M">Masculin</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Âge</label>
                    <input 
                      type="number" 
                      value={patientAge || ''}
                      onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : 0)}
                      placeholder="Ex: 34"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid-1-1">
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Téléphone</label>
                  <input 
                    type="text" 
                    value={patientTel}
                    onChange={(e) => setPatientTel(e.target.value)}
                    placeholder="Ex: +228 90 12 34 56"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>N° Dossier Patient (Optionnel)</label>
                  <input 
                    type="text" 
                    value={patientRef}
                    onChange={(e) => setPatientRef(e.target.value)}
                    placeholder="Ex: DOS-2026-042"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div className="grid-1-1">
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Numéro Ordonnance (Optionnel)</label>
                  <input 
                    type="text" 
                    value={numeroOrdonnance}
                    onChange={(e) => setNumeroOrdonnance(e.target.value)}
                    placeholder="Ex: ORD-889"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Médecin Prescripteur (Optionnel)</label>
                  <input 
                    type="text" 
                    value={prescripteur}
                    onChange={(e) => setPrescripteur(e.target.value)}
                    placeholder="Ex: Dr. Diallo"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-primary" onClick={() => { if(patientNom) setDispStep(2); else alert('Nom du patient obligatoire.'); }}>
                  Continuer <FileText size={16} />
                </button>
              </div>
            </div>
          )}

          {dispStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                👤 <strong>Patient :</strong> {patientNom} ({patientAge > 0 ? `${patientAge} ans, ` : ''}{patientSexe === 'F' ? 'Femme' : 'Homme'})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Médicaments à Délivrer</label>
                {dispenseLines.map((line, idx) => {
                  const qtyInPh = stockPharmacie
                    .filter(s => s.medicamentId === line.medicamentId)
                    .reduce((acc, s) => acc + s.quantite, 0);

                  return (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 3 }}>
                        <select
                          value={line.medicamentId}
                          onChange={(e) => handleDispenseLineChange(idx, 'medicamentId', e.target.value)}
                          required
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'white' }}
                        >
                          <option value="">Choisir un médicament...</option>
                          {medicaments.map(m => (
                            <option key={m.id} value={m.id}>{m.nom} {m.dosage} ({m.forme})</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ width: '120px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Qte à Délivrer</label>
                        <input
                          type="number"
                          value={line.quantite || ''}
                          onChange={(e) => handleDispenseLineChange(idx, 'quantite', Number(e.target.value))}
                          required
                          placeholder="Ex: 5"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                        />
                      </div>

                      <div style={{ width: '120px', fontSize: '0.8rem', color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>
                        {line.medicamentId && (
                          <span>Dispo : <strong>{qtyInPh}</strong></span>
                        )}
                      </div>

                      {dispenseLines.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveDispenseLine(idx)}
                          style={{ padding: '0.5rem', background: '#FEE2E2', border: 'none', borderRadius: '6px', color: 'var(--danger-red)', cursor: 'pointer' }}
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button 
                type="button" 
                onClick={handleAddDispenseLine}
                className="btn" 
                style={{ alignSelf: 'flex-start', border: '1px dashed var(--primary-blue)', background: 'transparent', color: 'var(--primary-blue)', fontSize: '0.85rem' }}
              >
                + Ajouter un autre médicament
              </button>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ background: '#E2E8F0' }} onClick={() => setDispStep(1)}>Retour</button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => {
                    const validLines = dispenseLines.filter(line => line.medicamentId && line.quantite > 0);
                    if (validLines.length === 0) {
                      alert('Veuillez ajouter au moins un médicament avec une quantité valide.');
                      return;
                    }
                    // Check stock
                    for (const line of validLines) {
                      const qtyInPh = stockPharmacie
                        .filter(s => s.medicamentId === line.medicamentId)
                        .reduce((acc, s) => acc + s.quantite, 0);
                      if (line.quantite > qtyInPh) {
                        const medName = medicaments.find(m => m.id === line.medicamentId)?.nom || 'produit';
                        alert(`Quantité insuffisante pour ${medName}. Disponible en pharmacie : ${qtyInPh}`);
                        return;
                      }
                    }
                    setDispStep(3);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Suivant : Validation <CheckCircle size={16} />
                </button>
              </div>
            </div>
          )}

          {dispStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Summary Alerts */}
              <div style={{ 
                backgroundColor: '#EFF6FF', 
                border: '1px solid #BFDBFE', 
                borderRadius: '8px', 
                padding: '1rem',
                fontSize: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <h4 style={{ margin: 0, fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📝 Récapitulatif de la Dispensation
                </h4>
                <p style={{ margin: 0, color: '#1E3A8A' }}>
                  Veuillez vérifier les informations ci-dessous avant la confirmation finale et le déstockage physique.
                </p>
              </div>

              {/* Patient Info Card */}
              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  👤 Informations Patient
                </h4>
                <div className="grid-1-1" style={{ fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Nom Complet :</span>
                    <strong>{patientNom}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Âge & Sexe :</span>
                    <strong>{patientAge > 0 ? `${patientAge} ans • ` : ''}{patientSexe === 'F' ? 'Femme' : 'Homme'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Téléphone :</span>
                    <strong>{patientTel || 'Non spécifié'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>N° Dossier Patient :</span>
                    <strong>{patientRef || 'Non spécifié'}</strong>
                  </div>
                  {numeroOrdonnance && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>N° Ordonnance :</span>
                      <strong>{numeroOrdonnance}</strong>
                    </div>
                  )}
                  {prescripteur && (
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Médecin Prescripteur :</span>
                      <strong>{prescripteur}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Medications List Card */}
              <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
                  💊 Médicaments Sélectionnés
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '0.5rem' }}>Médicament</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Quantité</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Prix Unitaire</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispenseLines.filter(line => line.medicamentId && line.quantite > 0).map((line, idx) => {
                      const med = medicaments.find(m => m.id === line.medicamentId);
                      const pu = med?.prixVente || 0;
                      const lineTotal = pu * line.quantite;
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 600 }}>{med?.nom} {med?.dosage} ({med?.forme})</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>{line.quantite}</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right' }}>{pu.toLocaleString()} FCFA</td>
                          <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary-blue)' }}>{lineTotal.toLocaleString()} FCFA</td>
                        </tr>
                      );
                    })}
                    <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--border-light)' }}>
                      <td colSpan={3} style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontSize: '0.95rem' }}>Total Facturé :</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--primary-blue)', fontSize: '0.95rem' }}>
                        {dispenseLines
                          .filter(line => line.medicamentId && line.quantite > 0)
                          .reduce((acc, line) => {
                            const pu = medicaments.find(m => m.id === line.medicamentId)?.prixVente || 0;
                            return acc + (pu * line.quantite);
                          }, 0)
                          .toLocaleString()
                        } FCFA
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Step 3 Navigation Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn" style={{ background: '#E2E8F0' }} onClick={() => setDispStep(2)}>Retour</button>
                <button type="submit" className="btn btn-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={16} /> CONFIRMER & DÉSTOCKER (FEFO)
                </button>
              </div>

            </div>
          )}

        </form>
      )}

      {activeTab === 'historique' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input 
              type="text" 
              placeholder="Rechercher par patient..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.5rem 0.5rem 2.2rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem' }}>Date / Heure</th>
                  <th style={{ padding: '1rem' }}>Patient</th>
                  <th style={{ padding: '1rem' }}>Médicaments Délivrés</th>
                  <th style={{ padding: '1rem' }}>Pharmacien</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dispensations.filter(d => d.patientName.toLowerCase().includes(historySearch.toLowerCase())).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aucune dispensation enregistrée.
                    </td>
                  </tr>
                ) : (
                  dispensations.filter(d => d.patientName.toLowerCase().includes(historySearch.toLowerCase())).map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '1rem' }}>{new Date(d.date).toLocaleString()}</td>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{d.patientName}</td>
                      <td style={{ padding: '1rem' }}>
                        {d.items.map((it, idx) => {
                          const med = medicaments.find(m => m.id === it.medicamentId);
                          return (
                            <div key={idx} style={{ fontSize: '0.85rem' }}>
                              • {med?.nom} - Qté: <strong>{it.quantiteDelivree}</strong> (Lot: {it.lot})
                            </div>
                          );
                        })}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{d.pharmacien}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button 
                          className="btn" 
                          onClick={() => { alert(`Impression du ticket pour ${d.patientName}`); }}
                          style={{ padding: '0.3rem 0.5rem', background: '#F1F5F9', border: '1px solid var(--border-light)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Printer size={12} /> Ticket
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Restock Request Modal */}
      {showRestockModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <form onSubmit={submitRestockRequest} className="card" style={{ width: '600px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontWeight: 700 }}>Demande de Réapprovisionnement Interne</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Émettez une demande de transfert de stock du Magasin Central vers la Pharmacie.
            </p>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Niveau d'Urgence</label>
              <select 
                value={urgency} 
                onChange={(e) => setUrgency(e.target.value as any)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', width: '200px', backgroundColor: 'white' }}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent ⚠️</option>
                <option value="critique">Critique 🚨</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {restockLines.map((line, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 3 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Médicament *</label>
                    <select
                      value={line.medicamentId}
                      onChange={(e) => handleRestockLineChange(idx, 'medicamentId', e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'white' }}
                    >
                      <option value="">Sélectionner...</option>
                      {medicaments.map(m => (
                        <option key={m.id} value={m.id}>{m.nom} {m.dosage} ({m.forme})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Qté Demandée *</label>
                    <input 
                      type="number"
                      value={line.quantiteDemandee || ''}
                      onChange={(e) => handleRestockLineChange(idx, 'quantiteDemandee', Number(e.target.value))}
                      required
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>
                  {restockLines.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveRestockLine(idx)}
                      style={{ padding: '0.5rem', background: '#FEE2E2', border: 'none', borderRadius: '6px', color: 'var(--danger-red)', cursor: 'pointer' }}
                    >
                      Retirer
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button 
              type="button" 
              onClick={handleAddRestockLine}
              className="btn" 
              style={{ alignSelf: 'flex-start', border: '1px dashed var(--primary-blue)', background: 'transparent', color: 'var(--primary-blue)', fontSize: '0.85rem' }}
            >
              + Ajouter un médicament
            </button>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn" style={{ background: '#E2E8F0' }} onClick={() => setShowRestockModal(false)}>Annuler</button>
              <button type="submit" className="btn btn-primary">Envoyer la Demande</button>
            </div>
          </form>
        </div>
      )}

      {/* Receptions Tab Content */}
      {activeTab === 'receptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Incoming Pending Transfers */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              📥 Réception de nouveaux transferts (Magasin Central)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Vérifiez la conformité physique des médicaments expédiés par le magasin central, puis cliquez sur "Réceptionner" pour les intégrer à vos rayons.
            </p>

            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '1rem' }}>ID Transfert</th>
                    <th style={{ padding: '1rem' }}>Date Expédiée</th>
                    <th style={{ padding: '1rem' }}>Motif du transfert</th>
                    <th style={{ padding: '1rem' }}>Produits inclus</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transferts.filter(t => t.statut === 'transfere').length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Aucun transfert en attente de réception actuellement.
                      </td>
                    </tr>
                  ) : (
                    transferts.filter(t => t.statut === 'transfere').map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary-blue)' }}>{t.id}</td>
                        <td style={{ padding: '1rem' }}>{t.dateDemande}</td>
                        <td style={{ padding: '1rem', fontWeight: 500 }}>{t.motif || 'Non spécifié'}</td>
                        <td style={{ padding: '1rem' }}>
                          {t.items.map((item, idx) => {
                            const med = medicaments.find(m => m.id === item.medicamentId);
                            return (
                              <div key={idx} style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                📦 <strong>{med?.nom || 'Médicament'} {med?.dosage}</strong> - Lot: <code style={{ fontWeight: 'bold' }}>{item.lotSource}</code> - Qté: <strong>{item.quantiteDemandee}</strong>
                              </div>
                            );
                          })}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => setShowPharmaReceptionModal(t.id)}
                            className="btn btn-success"
                            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', background: 'var(--accent-green)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600 }}
                          >
                            ✓ Réceptionner
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Completed Receptions */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
              📜 Historique des transferts réceptionnés
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Consultez les anciens transferts reçus et intégrés au stock de dispensation de la pharmacie.
            </p>

            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '1rem' }}>ID Transfert</th>
                    <th style={{ padding: '1rem' }}>Date Transfert</th>
                    <th style={{ padding: '1rem' }}>Motif</th>
                    <th style={{ padding: '1rem' }}>Produits Réceptionnés</th>
                    <th style={{ padding: '1rem' }}>Statut</th>
                    <th style={{ padding: '1rem' }}>Origine</th>
                  </tr>
                </thead>
                <tbody>
                  {transferts.filter(t => t.statut === 'receptionne').length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Aucun transfert réceptionné pour le moment.
                      </td>
                    </tr>
                  ) : (
                    transferts.filter(t => t.statut === 'receptionne').map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>{t.id}</td>
                        <td style={{ padding: '1rem' }}>{t.dateDemande}</td>
                        <td style={{ padding: '1rem' }}>{t.motif || 'Non spécifié'}</td>
                        <td style={{ padding: '1rem' }}>
                          {t.items.map((item, idx) => {
                            const med = medicaments.find(m => m.id === item.medicamentId);
                            return (
                              <div key={idx} style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                📦 <strong>{med?.nom || 'Médicament'} {med?.dosage}</strong> - Lot: <code>{item.lotSource}</code> - Qté: <strong>{item.quantiteDemandee}</strong>
                              </div>
                            );
                          })}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: '#ECFDF5',
                            color: 'var(--accent-green)'
                          }}>
                            ✓ INTÉGRÉ EN RAYON
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{t.demandeur}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Pharmacy Reception */}
      {showPharmaReceptionModal && (() => {
        const transfer = transferts.find(t => t.id === showPharmaReceptionModal);
        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div className="card" style={{ width: '600px', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '4px solid var(--accent-green)' }}>
              <h3 style={{ fontWeight: 700, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📥 Confirmation de la réception physique
              </h3>
              
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Veuillez confirmer que vous avez bien reçu les quantités indiquées ci-dessous de la part du Magasin Central. 
                Une fois confirmé, ces stocks seront fusionnés en pharmacie et prêts pour la dispensation.
              </p>

              {transfer && (
                <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <strong>Transfert ID :</strong> {transfer.id} | <strong>Motif :</strong> {transfer.motif || 'Non spécifié'}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.5rem' }}>
                    {transfer.items.map((item, idx) => {
                      const med = medicaments.find(m => m.id === item.medicamentId);
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: idx < transfer.items.length - 1 ? '1px dashed var(--border-light)' : 'none', fontSize: '0.85rem' }}>
                          <span>📦 <strong>{med?.nom} {med?.dosage}</strong> ({med?.forme})</span>
                          <span>Lot: <strong>{item.lotSource}</strong> (Exp: {item.expiration || 'N/A'}) - Qté: <strong>{item.quantiteDemandee}</strong></span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn" style={{ background: '#E2E8F0' }} onClick={() => setShowPharmaReceptionModal(null)}>Annuler</button>
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={async () => {
                    if (!transfer) return;
                    const res = await receptionnerTransfert(transfer.id);
                    if (res.success) {
                      alert(res.message);
                      setShowPharmaReceptionModal(null);
                      setActiveTab('stock');
                    } else {
                      alert(res.message);
                    }
                  }}
                >
                  Valider et Intégrer au Stock Rayon
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Physical Inventory Session Content */}
      {activeTab === 'session_inventaire' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {selectedInvId === null ? (
            /* LISTING DES INVENTAIRES */
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Sessions d'Inventaires Physiques</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Consultez les inventaires passés ou lancez une nouvelle session de comptage.</p>
                </div>
                {currentUser?.role !== 'Auditeur' && (
                  <button 
                    onClick={() => {
                      setInvDateInput(new Date().toISOString().split('T')[0]);
                      setShowNewInvModal(true);
                    }}
                    className="btn btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Plus size={16} /> Nouvel Inventaire Pharmacie
                  </button>
                )}
              </div>

              {/* Table of Inventories */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '0.75rem' }}>Date d'Inventaire</th>
                      <th style={{ padding: '0.75rem' }}>Créé Par</th>
                      <th style={{ padding: '0.75rem' }}>Statut</th>
                      <th style={{ padding: '0.75rem' }}>Nombre de Lots</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventaires.filter(i => i.typeStock === 'Pharmacie').length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Aucun inventaire enregistré pour la Pharmacie.
                        </td>
                      </tr>
                    ) : (
                      inventaires
                        .filter(i => i.typeStock === 'Pharmacie')
                        .map((inv) => (
                          <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{inv.dateInventaire}</td>
                            <td style={{ padding: '0.75rem' }}>{inv.creePar}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                backgroundColor: inv.statut === 'Validé' ? '#DCFCE7' : '#FEF9C3',
                                color: inv.statut === 'Validé' ? '#15803D' : '#854D0E'
                              }}>
                                {inv.statut}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>{inv.lignes.length} lot(s)</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                              {inv.statut === 'Brouillon' && currentUser?.role !== 'Auditeur' ? (
                                <button 
                                  onClick={() => handleOpenInventory(inv)}
                                  className="btn btn-primary"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                  <Edit3 size={14} /> Continuer
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleOpenInventory(inv)}
                                  className="btn"
                                  style={{ background: '#E2E8F0', padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                >
                                  <Eye size={14} /> Visualiser
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* FORMULAIRE DE COMPTAGE DE L'INVENTAIRE */
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Active inventory header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <div>
                  <button 
                    onClick={() => setSelectedInvId(null)} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.5rem' }}
                  >
                    ← Retour à la liste
                  </button>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    Fiche Inventaire - Date : {inventaires.find(i => i.id === selectedInvId)?.dateInventaire}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Créé par : {inventaires.find(i => i.id === selectedInvId)?.creePar} | Statut : 
                    <strong style={{ marginLeft: '0.3rem', color: inventaires.find(i => i.id === selectedInvId)?.statut === 'Validé' ? '#15803D' : '#854D0E' }}>
                      {inventaires.find(i => i.id === selectedInvId)?.statut}
                    </strong>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {inventaires.find(i => i.id === selectedInvId)?.statut === 'Brouillon' && currentUser?.role !== 'Auditeur' && (
                    <>
                      <button 
                        onClick={handleSaveInventoryDraft}
                        className="btn"
                        style={{ background: '#E2E8F0' }}
                      >
                        Sauvegarder Brouillon
                      </button>
                      <button 
                        onClick={handleValidateInventory}
                        className="btn btn-success"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <CheckCircle size={16} /> Valider l'Inventaire
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Items Listing Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '0.75rem', width: '80px' }}>Code</th>
                      <th style={{ padding: '0.75rem' }}>Désignation Produit</th>
                      <th style={{ padding: '0.75rem', width: '120px' }}>Lot</th>
                      <th style={{ padding: '0.75rem', width: '100px', textAlign: 'center' }}>Stock Théorique</th>
                      <th style={{ padding: '0.75rem', width: '120px', textAlign: 'center' }}>Stock Physique</th>
                      <th style={{ padding: '0.75rem', width: '100px', textAlign: 'center' }}>Écart</th>
                      <th style={{ padding: '0.75rem', width: '220px' }}>Commentaire d'écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryLines.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Aucun lot disponible en stock pour cet inventaire.
                        </td>
                      </tr>
                    ) : (
                      inventoryLines.map((line, idx) => {
                        const isDraft = inventaires.find(i => i.id === selectedInvId)?.statut === 'Brouillon' && currentUser?.role !== 'Auditeur';
                        const ecart = line.ecart;
                        
                        let ecartColor = '#475569'; // grey if 0 or null
                        let ecartText = '-';
                        if (ecart !== null) {
                          if (ecart > 0) {
                            ecartColor = 'var(--primary-blue)';
                            ecartText = `+${ecart}`;
                          } else if (ecart < 0) {
                            ecartColor = 'var(--danger-red)';
                            ecartText = `${ecart}`;
                          } else {
                            ecartColor = 'var(--accent-green)';
                            ecartText = '0 (OK)';
                          }
                        }

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>{line.code}</td>
                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>{line.nom}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#F1F5F9', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                                {line.lot}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>{line.stockTheorique}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                              {isDraft ? (
                                <input 
                                  type="number"
                                  min="0"
                                  value={line.stockPhysique === null ? '' : line.stockPhysique}
                                  onChange={(e) => handleLinePhysicalQtyChange(idx, e.target.value === '' ? null : Number(e.target.value))}
                                  placeholder="Saisir..."
                                  style={{
                                    width: '85px',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-light)',
                                    textAlign: 'center',
                                    fontSize: '0.85rem'
                                  }}
                                />
                              ) : (
                                <span style={{ fontWeight: 'bold' }}>
                                  {line.stockPhysique !== null ? line.stockPhysique : 'Non compté'}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: ecartColor }}>
                              {ecartText}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              {isDraft ? (
                                <input 
                                  type="text"
                                  value={line.commentaire || ''}
                                  onChange={(e) => handleLineCommentChange(idx, e.target.value)}
                                  placeholder={ecart !== 0 && ecart !== null ? "Renseigner le motif de l'écart..." : "RAS"}
                                  style={{
                                    width: '100%',
                                    padding: '0.35rem 0.5rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-light)',
                                    fontSize: '0.8rem'
                                  }}
                                />
                              ) : (
                                <span style={{ fontStyle: line.commentaire ? 'normal' : 'italic', color: line.commentaire ? 'inherit' : 'var(--text-muted)', fontSize: '0.8rem' }}>
                                  {line.commentaire || 'Aucun commentaire'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CRÉATION DE NOUVEL INVENTAIRE */}
      {showNewInvModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '1.2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📋 Créer un Inventaire Physique
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Sélectionnez la date pour initialiser les stocks théoriques.
              </p>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Date de l'inventaire *
              </label>
              <input 
                type="date"
                value={invDateInput}
                onChange={(e) => setInvDateInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                onClick={() => setShowNewInvModal(false)}
                className="btn"
                style={{ background: '#E2E8F0' }}
              >
                Annuler
              </button>
              <button 
                onClick={handleStartNewInventory}
                className="btn btn-primary"
              >
                Initialiser l'Inventaire
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStockCardMedId && (
        <StockCardModal 
          medicamentId={selectedStockCardMedId} 
          onClose={() => setSelectedStockCardMedId(null)} 
        />
      )}
    </div>
  );
}
