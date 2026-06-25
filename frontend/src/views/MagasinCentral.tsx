import React, { useState } from 'react';
import { useStore, Medicament, StockItem } from '../store';
import StockCardModal from '../components/StockCardModal';
import { 
  Plus, 
  Search, 
  ArrowRightLeft, 
  Clipboard, 
  AlertTriangle,
  CheckCircle,
  Truck,
  Eye,
  Trash2,
  Edit3
} from 'lucide-react';
import { InventaireLigne } from '../store';

const formatUnit = (unit?: string) => {
  return '';
};

export default function MagasinCentral() {
  const { 
    stockCentral, 
    medicaments, 
    receptionnerFournisseur, 
    ajusterStockCentral, 
    modifierLotExpirationCentral,
    destruireStockCentral,
    transfererDepuisMagasin,
    transferts,
    currentUser,
    inventaires,
    creerSessionInventaire,
    sauvegarderBrouillonInventaire,
    validerInventaire,
    updateMedicament
  } = useStore();

  const [activeTab, setActiveTab] = useState<'inventaire' | 'reception' | 'transferts' | 'session_inventaire'>('inventaire');
  
  // Physical Inventory States
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [inventoryLines, setInventoryLines] = useState<InventaireLigne[]>([]);
  const [invDateInput, setInvDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [showNewInvModal, setShowNewInvModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedStockCardMedId, setSelectedStockCardMedId] = useState<string | null>(null);

  // Modals / Form States
  const [showAdjustModal, setShowAdjustModal] = useState<string | null>(null);
  const [newQty, setNewQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [editLot, setEditLot] = useState('');
  const [editExpiration, setEditExpiration] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);

  const [showDestructionModal, setShowDestructionModal] = useState<string | null>(null);
  const [destructQty, setDestructQty] = useState(0);
  const [destructReason, setDestructReason] = useState('');

  // Transfer Basket Form States
  const [showTransferBasketModal, setShowTransferBasketModal] = useState(false);
  const [transferDate, setTransferDate] = useState('');
  const [transferMotif, setTransferMotif] = useState('');
  const [transferBasket, setTransferBasket] = useState<{ stockCentralItemId: string; quantite: number }[]>([]);
  const [selectedStockItemId, setSelectedStockItemId] = useState('');
  const [selectedStockItemQty, setSelectedStockItemQty] = useState(1);

  // Supplier Reception Form States
  const [fournisseur, setFournisseur] = useState('');
  const [refFacture, setRefFacture] = useState('');
  const [bonLivraison, setBonLivraison] = useState('');
  const [receptionLines, setReceptionLines] = useState<{ medicamentId: string; lot: string; expiration: string; quantite: number; prixUnitaire: number }[]>([
    { medicamentId: '', lot: '', expiration: '', quantite: 0, prixUnitaire: 0 }
  ]);

  // Handle Supplier Reception Submit
  const handleAddReceptionLine = () => {
    setReceptionLines([...receptionLines, { medicamentId: '', lot: '', expiration: '', quantite: 0, prixUnitaire: 0 }]);
  };

  const handleRemoveReceptionLine = (index: number) => {
    setReceptionLines(receptionLines.filter((_, i) => i !== index));
  };

  const handleReceptionLineChange = (index: number, field: string, value: any) => {
    const updated = [...receptionLines];
    updated[index] = { ...updated[index], [field]: value };
    setReceptionLines(updated);
  };

  const submitReception = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fournisseur || !refFacture || !bonLivraison) {
      alert('Veuillez remplir toutes les informations d\'en-tête.');
      return;
    }
    const validLines = receptionLines.filter(line => line.medicamentId && line.lot && line.expiration && line.quantite > 0);
    if (validLines.length === 0) {
      alert('Veuillez ajouter au moins une ligne de produit valide.');
      return;
    }
    receptionnerFournisseur(fournisseur, refFacture, bonLivraison, validLines);
    alert('Réception enregistrée avec succès au Magasin Central !');
    // Reset
    setFournisseur('');
    setRefFacture('');
    setBonLivraison('');
    setReceptionLines([{ medicamentId: '', lot: '', expiration: '', quantite: 0, prixUnitaire: 0 }]);
    setActiveTab('inventaire');
  };

  // Physical Inventory Helper Functions
  const handleStartNewInventory = async () => {
    const tempId = await creerSessionInventaire('Magasin', invDateInput);
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
    
    // Check if any physical stock values are empty/null
    const hasUncounted = inventoryLines.some(l => l.stockPhysique === null);
    if (hasUncounted) {
      alert("Veuillez renseigner le stock physique pour toutes les lignes avant de valider.");
      return;
    }

    const confirmVal = window.confirm(
      "Êtes-vous sûr de vouloir valider cet inventaire ? Les stocks disponibles actuels seront mis à jour avec les stocks physiques saisis, et des ajustements de stock seront enregistrés pour les écarts."
    );
    if (!confirmVal) return;

    await validerInventaire(selectedInvId, inventoryLines);
    alert('L\'inventaire a été validé avec succès. Les stocks ont été mis à jour.');
    setSelectedInvId(null);
  };

  // Filter central stock items
  const filteredStock = stockCentral.filter(item => {
    const med = medicaments.find(m => m.id === item.medicamentId);
    if (!med) return false;
    const matchesSearch = med.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          med.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          med.dci.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.lot.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === '' || med.categorie === categoryFilter;
    return matchesSearch && matchesCat;
  }).sort((a, b) => {
    const medA = medicaments.find(m => m.id === a.medicamentId);
    const medB = medicaments.find(m => m.id === b.medicamentId);
    if (!medA || !medB) return 0;
    return medA.nom.localeCompare(medB.nom);
  });

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* View Header */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-blue)' }}>Gestion du Magasin Central</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Suivi des stocks globaux, réceptions fournisseurs, inventaires physiques et transferts.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '1rem', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('inventaire')}
          style={{
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'inventaire' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: activeTab === 'inventaire' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            whiteSpace: 'nowrap'
          }}
        >
          📦 Stock Disponible
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
        {currentUser?.role !== 'Auditeur' && (
          <>
            <button 
              onClick={() => setActiveTab('reception')}
              style={{
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'reception' ? '3px solid var(--primary-blue)' : '3px solid transparent',
                color: activeTab === 'reception' ? 'var(--primary-blue)' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.95rem',
                whiteSpace: 'nowrap'
              }}
            >
              🚚 Réception Fournisseur
            </button>
            <button 
              onClick={() => setActiveTab('transferts')}
              style={{
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'transferts' ? '3px solid var(--primary-blue)' : '3px solid transparent',
                color: activeTab === 'transferts' ? 'var(--primary-blue)' : 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.95rem',
                whiteSpace: 'nowrap'
              }}
            >
              🔄 Transferts émis
            </button>
          </>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === 'inventaire' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Controls Bar */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '300px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="text" 
                  placeholder="Rechercher par médicament, code, DCI ou lot..."
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
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.9rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="">Toutes catégories</option>
                <option value="Antibiotique">Antibiotiques</option>
                <option value="Analgésique">Analgésiques</option>
                <option value="Anti-inflammatoire">Anti-inflammatoires</option>
                <option value="Antipaludéen">Antipaludéens</option>
                <option value="Anti-infectieux">Anti-infectieux</option>
              </select>
            </div>
            {currentUser?.role !== 'Auditeur' && (
              <button
                onClick={() => {
                  setShowTransferBasketModal(true);
                  setTransferDate(new Date().toISOString().split('T')[0]);
                  setTransferMotif('');
                  setTransferBasket([]);
                  setSelectedStockItemId('');
                  setSelectedStockItemQty(1);
                }}
                className="btn btn-success"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-green)', border: 'none', color: 'white', fontWeight: 600, boxShadow: 'var(--shadow-md)' }}
              >
                <ArrowRightLeft size={16} /> NOUVEAU TRANSFERT VERS DETAIL
              </button>
            )}
          </div>

          {/* Stock Table */}
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem' }}>Code</th>
                  <th style={{ padding: '1rem' }}>Médicament / DCI</th>
                  <th style={{ padding: '1rem' }}>Catégorie</th>
                  <th style={{ padding: '1rem' }}>Forme & Dosage</th>
                  <th style={{ padding: '1rem' }}>N° Lot</th>
                  <th style={{ padding: '1rem' }}>Expiration</th>
                  <th style={{ padding: '1rem' }}>Stock Disponible</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aucun lot de médicament trouvé dans le Magasin Central.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => {
                    const med = medicaments.find(m => m.id === item.medicamentId);
                    if (!med) return null;

                    // Days until expiry
                    const daysToExpiry = (new Date(item.expiration).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                    let expBadgeStyle = { backgroundColor: '#ECFDF5', color: 'var(--accent-green)' };
                    if (daysToExpiry <= 0) {
                      expBadgeStyle = { backgroundColor: '#FEF2F2', color: 'var(--danger-red)' };
                    } else if (daysToExpiry <= 90) {
                      expBadgeStyle = { backgroundColor: '#FFFBEB', color: 'var(--warning-orange)' };
                    }

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{med.code}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600 }}>{med.nom}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.dci}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>{med.categorie}</td>
                        <td style={{ padding: '1rem' }}>
                          <div>{med.forme}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.dosage}</div>
                        </td>
                        <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.lot}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '4px', 
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            ...expBadgeStyle
                          }}>
                            {item.expiration} {daysToExpiry <= 0 ? '(Expiré)' : ''}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>{item.quantite}{formatUnit(med.unite)}</td>
                        <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button 
                                onClick={() => setSelectedStockCardMedId(med.id)}
                                className="btn"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', background: '#F8FAFC' }}
                                title="Visualiser la fiche de stock"
                              >
                                <Eye size={14} style={{ color: 'var(--primary-blue)' }} />
                              </button>
                              {currentUser?.role !== 'Auditeur' && (
                                <>
                                  <button 
                                    onClick={() => { 
                                      setShowAdjustModal(item.id); 
                                      setNewQty(item.quantite); 
                                      setEditLot(item.lot);
                                      setEditExpiration(item.expiration);
                                      const med = medicaments.find(m => m.id === item.medicamentId);
                                      setEditPrice(med ? med.prixVente : 0);
                                    }}
                                    className="btn"
                                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', background: '#F8FAFC' }}
                                    title="Modifier le lot, la date de péremption et le prix de vente"
                                  >
                                    <Edit3 size={14} style={{ color: 'var(--primary-blue)' }} />
                                  </button>
                                  <button 
                                    onClick={() => { setShowDestructionModal(item.id); setDestructQty(item.quantite); }}
                                    className="btn"
                                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', border: '1px solid #FCA5A5', background: '#FEF2F2' }}
                                    title="Mettre au rebut / Détruire"
                                  >
                                    <Trash2 size={14} style={{ color: 'var(--danger-red)' }} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Edit Lot & Expiration Modal */}
          {showAdjustModal && (() => {
            const item = stockCentral.find(s => s.id === showAdjustModal);
            const med = item ? medicaments.find(m => m.id === item.medicamentId) : null;
            return (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
              }}>
                <div className="card" style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '1.2rem', padding: '1.5rem', borderRadius: '12px' }}>
                  <h3 style={{ fontWeight: 700, margin: 0, fontSize: '1.2rem' }}>Modifier Lot, Péremption & Prix</h3>
                  {med && (
                    <div style={{ 
                      padding: '0.75rem', 
                      background: 'var(--bg-light)', 
                      borderRadius: '8px', 
                      borderLeft: '4px solid var(--primary-blue)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--text-dark)'
                    }}>
                      {med.nom} {med.dosage}
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                      Numéro de Lot :
                    </label>
                    <input 
                      type="text" 
                      value={editLot}
                      onChange={(e) => setEditLot(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                      Date de péremption :
                    </label>
                    <input 
                      type="date" 
                      value={editExpiration}
                      onChange={(e) => setEditExpiration(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                      Prix de vente (FCFA) :
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                      Quantité disponible (Non modifiable) :
                    </label>
                    <input 
                      type="text" 
                      value={item ? `${item.quantite}${formatUnit(med?.unite)}` : ''}
                      disabled
                      style={{ 
                        width: '100%', 
                        padding: '0.6rem', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-light)', 
                        backgroundColor: '#F1F5F9', 
                        color: '#64748B', 
                        cursor: 'not-allowed',
                        fontSize: '0.9rem',
                        fontWeight: 600
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button className="btn" style={{ background: '#E2E8F0' }} onClick={() => setShowAdjustModal(null)}>Annuler</button>
                    <button className="btn btn-primary" onClick={() => {
                      modifierLotExpirationCentral(showAdjustModal, editLot, editExpiration);
                      if (med) {
                        updateMedicament(med.id, { prixVente: editPrice });
                      }
                      setShowAdjustModal(null);
                    }}>Valider</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Destruction Modal */}
          {showDestructionModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div className="card" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--danger-red)' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--danger-red)' }}>Destruction / Retrait de Médicaments</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cette action retirera définitivement les médicaments périmés ou altérés du stock disponible.</p>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Quantité à détruire :</label>
                  <input 
                    type="number" 
                    value={destructQty}
                    onChange={(e) => setDestructQty(Number(e.target.value))}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Raison du retrait :</label>
                  <select 
                    value={destructReason}
                    onChange={(e) => setDestructReason(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'white' }}
                  >
                    <option value="">Sélectionner une raison...</option>
                    <option value="Périmé (FEFO)">Lot Périmé</option>
                    <option value="Altéré / Cassé">Produit endommagé</option>
                    <option value="Retrait du fabricant">Rappel de lot par le fabricant</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button className="btn" style={{ background: '#E2E8F0' }} onClick={() => setShowDestructionModal(null)}>Annuler</button>
                  <button className="btn btn-success" style={{ background: 'var(--danger-red)' }} onClick={() => {
                    if(!destructReason) { alert('Veuillez spécifier la raison.'); return; }
                    destruireStockCentral(showDestructionModal, destructQty, destructReason);
                    setShowDestructionModal(null);
                    setDestructReason('');
                  }}>Confirmer la Destruction</button>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Medication Transfer Basket Modal */}
          {showTransferBasketModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
              <div className="card" style={{ width: '800px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto', borderTop: '4px solid var(--accent-green)' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
                  <ArrowRightLeft size={24} /> Préparation d'un Transfert vers la Pharmacie (Détail)
                </h3>
                
                {/* Header Information */}
                <div className="grid-1-2">
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Date du Transfert *</label>
                    <input 
                      type="date"
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Motif du Transfert *</label>
                    <input 
                      type="text"
                      placeholder="Ex: Réapprovisionnement hebdomadaire ou Urgence rupture..."
                      value={transferMotif}
                      onChange={(e) => setTransferMotif(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }} />

                {/* Add Product Section */}
                <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>➕ Ajouter un médicament au panier :</h4>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 3, minWidth: '250px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Choisir le Lot Central disponible :</label>
                      <select
                        value={selectedStockItemId}
                        onChange={(e) => {
                          setSelectedStockItemId(e.target.value);
                          setSelectedStockItemQty(1);
                        }}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'white' }}
                      >
                        <option value="">Sélectionner un produit en stock...</option>
                        {stockCentral.filter(s => s.quantite > 0).map(s => {
                          const med = medicaments.find(m => m.id === s.medicamentId);
                          if (!med) return null;
                          return (
                            <option key={s.id} value={s.id}>
                              {med.nom} {med.dosage} ({med.forme}) - Lot: {s.lot} (Exp: {s.expiration}) - Dispo: {s.quantite}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div style={{ width: '120px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Qté à transférer :</label>
                      <input 
                        type="number"
                        min={1}
                        value={selectedStockItemQty || ''}
                        onChange={(e) => setSelectedStockItemQty(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedStockItemId) {
                          alert('Veuillez sélectionner un médicament.');
                          return;
                        }
                        const item = stockCentral.find(s => s.id === selectedStockItemId);
                        if (!item) return;

                        if (selectedStockItemQty <= 0 || selectedStockItemQty > item.quantite) {
                          alert(`Quantité invalide. Maximum disponible : ${item.quantite}`);
                          return;
                        }

                        // Check if already in basket
                        const existingIdx = transferBasket.findIndex(b => b.stockCentralItemId === selectedStockItemId);
                        if (existingIdx >= 0) {
                          const newBasket = [...transferBasket];
                          const total = newBasket[existingIdx].quantite + selectedStockItemQty;
                          if (total > item.quantite) {
                            alert(`Impossible d'ajouter cette quantité. Le total dépasserait le stock disponible (${item.quantite}).`);
                            return;
                          }
                          newBasket[existingIdx].quantite = total;
                          setTransferBasket(newBasket);
                        } else {
                          setTransferBasket([...transferBasket, { stockCentralItemId: selectedStockItemId, quantite: selectedStockItemQty }]);
                        }

                        // Reset selection
                        setSelectedStockItemId('');
                        setSelectedStockItemQty(1);
                      }}
                      className="btn"
                      style={{ background: 'var(--primary-blue)', color: 'white', border: 'none', padding: '0.5rem 1rem' }}
                    >
                      Ajouter au panier
                    </button>
                  </div>
                </div>

                {/* Basket List Table */}
                <div>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.95rem' }}>🛒 Panier des produits sélectionnés :</h4>
                  <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                          <th style={{ padding: '0.75rem' }}>Produit</th>
                          <th style={{ padding: '0.75rem' }}>Lot & Expiry</th>
                          <th style={{ padding: '0.75rem' }}>Stock Disponible</th>
                          <th style={{ padding: '0.75rem', width: '120px' }}>Qté à transférer</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', width: '80px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transferBasket.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                              Le panier est vide. Sélectionnez un produit ci-dessus pour l'ajouter.
                            </td>
                          </tr>
                        ) : (
                          transferBasket.map((b, idx) => {
                            const item = stockCentral.find(s => s.id === b.stockCentralItemId);
                            const med = item ? medicaments.find(m => m.id === item.medicamentId) : null;
                            if (!item || !med) return null;

                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td style={{ padding: '0.75rem' }}>
                                  <div style={{ fontWeight: 600 }}>{med.nom} {med.dosage}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.forme} | {med.code}</div>
                                </td>
                                <td style={{ padding: '0.75rem' }}>
                                  <strong>Lot: {item.lot}</strong>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Exp: {item.expiration}</div>
                                </td>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{item.quantite}</td>
                                <td style={{ padding: '0.75rem' }}>
                                  <input 
                                    type="number"
                                    min={1}
                                    max={item.quantite}
                                    value={b.quantite || ''}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      const newBasket = [...transferBasket];
                                      newBasket[idx].quantite = val;
                                      setTransferBasket(newBasket);
                                    }}
                                    style={{ width: '100%', padding: '0.35rem', borderRadius: '4px', border: '1px solid var(--border-light)', fontWeight: 'bold' }}
                                  />
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTransferBasket(transferBasket.filter((_, i) => i !== idx));
                                    }}
                                    style={{ padding: '0.3rem', background: '#FEE2E2', border: 'none', borderRadius: '4px', color: 'var(--danger-red)', cursor: 'pointer' }}
                                    title="Retirer du panier"
                                  >
                                    <Trash2 size={14} />
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

                {/* Visualization / Summary Section */}
                {transferBasket.length > 0 && (
                  <div style={{ backgroundColor: '#ECFDF5', padding: '0.85rem', borderRadius: '8px', border: '1px solid #A7F3D0', fontSize: '0.85rem', color: '#065F46' }}>
                    📢 <strong>Visualisation du Transfert :</strong> Vous allez transférer un total de <strong>{transferBasket.length} produit(s)</strong> représentant <strong>{transferBasket.reduce((sum, item) => sum + item.quantite, 0)} unités</strong> vers la Pharmacie de Dispensation. Ces produits seront immédiatement déduits du Magasin Central et placés en statut "En cours de transfert" en attente de réception par la pharmacie.
                  </div>
                )}

                {/* Footer Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" className="btn" style={{ background: '#E2E8F0' }} onClick={() => setShowTransferBasketModal(false)}>Annuler</button>
                  <button 
                    type="button" 
                    className="btn btn-success" 
                    disabled={transferBasket.length === 0 || !transferDate || !transferMotif}
                    onClick={async () => {
                      if (!transferDate || !transferMotif) {
                        alert('Veuillez spécifier la date et le motif du transfert.');
                        return;
                      }
                      
                      // Double check quantities
                      for (const b of transferBasket) {
                        const item = stockCentral.find(s => s.id === b.stockCentralItemId);
                        if (!item || b.quantite <= 0 || b.quantite > item.quantite) {
                          alert(`Erreur : quantité invalide pour l'un des produits.`);
                          return;
                        }
                      }

                      const res = await transfererDepuisMagasin(transferMotif, transferDate, transferBasket);
                      if (res.success) {
                        alert(res.message);
                        setShowTransferBasketModal(false);
                        setActiveTab('transferts');
                      } else {
                        alert(res.message);
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: (transferBasket.length === 0 || !transferDate || !transferMotif) ? 0.6 : 1 }}
                  >
                    <CheckCircle size={16} /> Valider et Envoyer le Transfert
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {activeTab === 'transferts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowRightLeft size={22} style={{ color: 'var(--primary-blue)' }} /> Historique des Transferts émis vers la Pharmacie
          </h3>
          
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem' }}>ID Transfert</th>
                  <th style={{ padding: '1rem' }}>Date Transfert</th>
                  <th style={{ padding: '1rem' }}>Motif / Raison</th>
                  <th style={{ padding: '1rem' }}>Médicaments Transférés</th>
                  <th style={{ padding: '1rem' }}>Statut de Réception</th>
                  <th style={{ padding: '1rem' }}>Auteur</th>
                </tr>
              </thead>
              <tbody>
                {transferts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aucun transfert émis vers la pharmacie.
                    </td>
                  </tr>
                ) : (
                  transferts.map((t) => (
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
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: t.statut === 'receptionne' ? '#ECFDF5' : '#FFFBEB',
                          color: t.statut === 'receptionne' ? 'var(--accent-green)' : 'var(--warning-orange)'
                        }}>
                          {t.statut === 'receptionne' ? '✓ RÉCEPTIONNÉ EN DETAIL' : '⚡ EXPÉDIÉ / EN TRANSIT'}
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
      )}

      {activeTab === 'reception' && (
        <form onSubmit={submitReception} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={22} style={{ color: 'var(--primary-blue)' }} /> Enregistrement de Réception Fournisseur
          </h3>
          
          {/* Header Form */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Nom du Fournisseur *</label>
              <select 
                value={fournisseur}
                onChange={(e) => setFournisseur(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'white' }}
              >
                <option value="">Choisir un fournisseur...</option>
                <option value="Pharma Benin S.A.">Pharma Benin S.A.</option>
                <option value="UBPHAR Togo">UBPHAR Togo</option>
                <option value="Centrale Achat Médicaments">Centrale d'Achat de Médicaments Africains</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Référence Facture *</label>
              <input 
                type="text" 
                value={refFacture}
                onChange={(e) => setRefFacture(e.target.value)}
                required
                placeholder="Ex: FAC-2026-990"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Bon de Livraison (N°BL) *</label>
              <input 
                type="text" 
                value={bonLivraison}
                onChange={(e) => setBonLivraison(e.target.value)}
                required
                placeholder="Ex: BL-55670"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />

          {/* Dynamic Products Table */}
          <div>
            <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Produits Réceptionnés</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {receptionLines.map((line, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  
                  <div style={{ flex: 2, minWidth: '200px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Médicament *</label>
                    <select 
                      value={line.medicamentId}
                      onChange={(e) => handleReceptionLineChange(idx, 'medicamentId', e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'white' }}
                    >
                      <option value="">Sélectionner...</option>
                      {medicaments.map(m => (
                        <option key={m.id} value={m.id}>{m.nom} {m.dosage} ({m.forme})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: '100px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Numéro de Lot *</label>
                    <input 
                      type="text" 
                      value={line.lot}
                      onChange={(e) => handleReceptionLineChange(idx, 'lot', e.target.value)}
                      required
                      placeholder="Ex: LOT-XX"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Date d'Expiration *</label>
                    <input 
                      type="date" 
                      value={line.expiration}
                      onChange={(e) => handleReceptionLineChange(idx, 'expiration', e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>

                  <div style={{ width: '90px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Quantité *</label>
                    <input 
                      type="number" 
                      value={line.quantite || ''}
                      onChange={(e) => handleReceptionLineChange(idx, 'quantite', Number(e.target.value))}
                      required
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>

                  <div style={{ width: '110px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>P.U. (FCFA)</label>
                    <input 
                      type="number" 
                      value={line.prixUnitaire || ''}
                      onChange={(e) => handleReceptionLineChange(idx, 'prixUnitaire', Number(e.target.value))}
                      placeholder="0"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>

                  {receptionLines.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => handleRemoveReceptionLine(idx)}
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', background: '#FEE2E2', color: 'var(--danger-red)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button 
              type="button" 
              onClick={handleAddReceptionLine}
              className="btn" 
              style={{ marginTop: '1rem', border: '1px dashed var(--primary-blue)', background: 'transparent', color: 'var(--primary-blue)' }}
            >
              <Plus size={16} /> Ajouter une ligne
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn" style={{ background: '#E2E8F0' }} onClick={() => setActiveTab('inventaire')}>Annuler</button>
            <button type="submit" className="btn btn-success">Enregistrer & Valider Entrée</button>
          </div>
        </form>
      )}

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
                    <Plus size={16} /> Nouvel Inventaire Magasin
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
                    {inventaires.filter(i => i.typeStock === 'Magasin').length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          Aucun inventaire enregistré pour le Magasin Central.
                        </td>
                      </tr>
                    ) : (
                      inventaires
                        .filter(i => i.typeStock === 'Magasin')
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
