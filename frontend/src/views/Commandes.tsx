import React, { useState, useEffect } from 'react';
import { useStore, Commande, CommandeLigne } from '../store';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  Package, 
  AlertTriangle,
  ArrowRightLeft,
  X
} from 'lucide-react';

export default function Commandes() {
  const { 
    medicaments, 
    stockCentral, 
    stockPharmacie, 
    dispensations, 
    commandes, 
    creerCommande, 
    modifierStatutCommande,
    currentUser
  } = useStore();

  const [activeTab, setActiveTab] = useState<'actives' | 'creer' | 'historique'>('actives');
  const [selectedCmd, setSelectedCmd] = useState<Commande | null>(null);
  
  // Create Order Form States
  const [orderLines, setOrderLines] = useState<{ medicamentId: string; quantiteProposee: number; quantiteCommandee: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // CMM Calculation (replicates the logic from Pharmacie)
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

    if (currentStock === 0) {
      if (totalSorties === 0) {
        ruptureDays = totalDays;
      } else {
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

    const cmm = ruptureDays > 0 
      ? (totalSorties * 30.5) / (totalDays - ruptureDays) 
      : (totalSorties / 3);

    return Math.round(cmm * 10) / 10;
  };

  // Stock disponible et utilisable (excluding expired lots)
  const getStockUtilisable = (medicamentId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    const centralQty = stockCentral
      .filter(s => s.medicamentId === medicamentId && s.expiration > todayStr)
      .reduce((acc, s) => acc + s.quantite, 0);
      
    const pharmacieQty = stockPharmacie
      .filter(s => s.medicamentId === medicamentId && s.expiration > todayStr)
      .reduce((acc, s) => acc + s.quantite, 0);
      
    return centralQty + pharmacieQty;
  };

  // Auto-generate proposal lines when switching to 'creer' tab
  useEffect(() => {
    if (activeTab === 'creer') {
      const proposals = medicaments
        .map(med => {
          const stock = getStockUtilisable(med.id);
          const cmm = calculateCMM(med.id);
          const proposed = Math.max(0, Math.round(cmm * 2 - stock));
          const isAtRisk = stock === 0 || stock <= med.seuilAlerte || stock < cmm;
          
          return {
            medicamentId: med.id,
            quantiteProposee: proposed,
            quantiteCommandee: proposed,
            isAtRisk
          };
        })
        .filter(p => p.isAtRisk && p.quantiteProposee > 0);

      setOrderLines(proposals.map(p => ({
        medicamentId: p.medicamentId,
        quantiteProposee: p.quantiteProposee,
        quantiteCommandee: p.quantiteCommandee
      })));
    }
  }, [activeTab, medicaments]);

  // Form handlers
  const handleLineChange = (index: number, field: 'quantiteCommandee', value: number) => {
    const updated = [...orderLines];
    updated[index] = { ...updated[index], [field]: Math.max(0, value) };
    setOrderLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    setOrderLines(orderLines.filter((_, i) => i !== index));
  };

  const handleAddMedToOrder = (medId: string) => {
    // Check if already in order
    if (orderLines.some(l => l.medicamentId === medId)) {
      alert('Ce médicament est déjà présent dans la liste.');
      return;
    }

    const stock = getStockUtilisable(medId);
    const cmm = calculateCMM(medId);
    const proposed = Math.max(0, Math.round(cmm * 2 - stock));
    
    setOrderLines([...orderLines, {
      medicamentId: medId,
      quantiteProposee: proposed,
      quantiteCommandee: proposed || 10 // default to 10 if proposed is 0
    }]);
    
    setSearchTerm('');
    setSearchFocused(false);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = orderLines.filter(line => line.quantiteCommandee > 0);
    if (validLines.length === 0) {
      alert('Veuillez commander au moins un produit avec une quantité supérieure à 0.');
      return;
    }

    const res = await creerCommande(validLines);
    if (res.success) {
      alert(res.message);
      setOrderLines([]);
      setActiveTab('actives');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'Réceptionnée' | 'Annulée') => {
    const confirmMsg = status === 'Réceptionnée' 
      ? 'Voulez-vous marquer cette commande comme réceptionnée ? Assurez-vous de saisir les lots reçus dans le stock du Magasin Central.'
      : 'Voulez-vous vraiment annuler cette commande ?';
      
    if (window.confirm(confirmMsg)) {
      const res = await modifierStatutCommande(id, status);
      alert(res.message);
      if (selectedCmd && selectedCmd.id === id) {
        setSelectedCmd({ ...selectedCmd, statut: status });
      }
    }
  };

  // Lists
  const activeOrders = commandes.filter(c => c.statut === 'En cours');
  const pastOrders = commandes.filter(c => c.statut !== 'En cours');

  // Search filter
  const filteredMeds = searchTerm.trim() === ''
    ? []
    : medicaments.filter(m => 
        m.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.dci && m.dci.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 5);

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-blue)' }}>Gestion des Commandes Grossistes</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Calculez vos besoins, lancez des commandes de réapprovisionnement et suivez l'historique de vos livraisons.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '1rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => { setActiveTab('actives'); setSelectedCmd(null); }}
          style={{
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'actives' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: activeTab === 'actives' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          📋 Commandes en Cours ({activeOrders.length})
        </button>
        {currentUser?.role !== 'Auditeur' && (
          <button 
            onClick={() => { setActiveTab('creer'); setSelectedCmd(null); }}
            style={{
              padding: '0.75rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'creer' ? '3px solid var(--primary-blue)' : '3px solid transparent',
              color: activeTab === 'creer' ? 'var(--primary-blue)' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            ➕ Nouvelle Commande
          </button>
        )}
        <button 
          onClick={() => { setActiveTab('historique'); setSelectedCmd(null); }}
          style={{
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'historique' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: activeTab === 'historique' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          📜 Historique ({pastOrders.length})
        </button>
      </div>

      {/* TAB: ACTIVE ORDERS */}
      {activeTab === 'actives' && !selectedCmd && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Commandes en cours de traitement</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Liste des commandes envoyées aux grossistes et en attente de livraison physique.</p>
          </div>

          <div className="table-container" style={{ margin: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem' }}>Code Commande</th>
                  <th style={{ padding: '1rem' }}>Date Commande</th>
                  <th style={{ padding: '1rem' }}>Créateur</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Nombre d'Articles</th>
                  <th style={{ padding: '1rem' }}>Statut</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <ClipboardList size={48} style={{ color: 'var(--border-light)', marginBottom: '0.5rem' }} />
                      <p style={{ fontWeight: 500 }}>Aucune commande en cours.</p>
                    </td>
                  </tr>
                ) : (
                  activeOrders.map((cmd) => (
                    <tr key={cmd.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary-blue)' }}>{cmd.numeroCommande}</td>
                      <td style={{ padding: '1rem' }}>{new Date(cmd.dateCommande).toLocaleDateString()} {new Date(cmd.dateCommande).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ padding: '1rem' }}>{cmd.creePar}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>{cmd.lignes.length}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.6rem', borderRadius: '50px', backgroundColor: '#FFF3C4', color: '#855D00', fontSize: '0.8rem', fontWeight: 700 }}>
                          En cours
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            className="btn" 
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', background: '#F8FAFC' }}
                            onClick={() => setSelectedCmd(cmd)}
                            title="Voir Détails"
                          >
                            <Eye size={14} style={{ color: 'var(--primary-blue)' }} /> Voir
                          </button>
                          {currentUser?.role !== 'Auditeur' && (
                            <>
                              <button 
                                className="btn btn-success" 
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => handleUpdateStatus(cmd.id, 'Réceptionnée')}
                                title="Marquer comme Réceptionnée"
                              >
                                <CheckCircle size={14} /> Réceptionner
                              </button>
                              <button 
                                className="btn" 
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', background: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--danger-red)' }}
                                onClick={() => handleUpdateStatus(cmd.id, 'Annulée')}
                                title="Annuler la commande"
                              >
                                <XCircle size={14} /> Annuler
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CREATE NEW ORDER */}
      {activeTab === 'creer' && (
        <form onSubmit={handleSubmitOrder} className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-blue)' }}>Préparation de la Commande</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Les produits en rupture ou à risque de rupture sont automatiquement listés ci-dessous avec une suggestion basée sur la formule: <br />
              <strong style={{ color: '#0F172A' }}>Quantité à commander = CMM x 2 - Stock disponible</strong>. Vous pouvez ajuster les quantités avant de valider.
            </p>
          </div>

          {/* Add custom product selector */}
          <div style={{ position: 'relative', maxWidth: '500px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Ajouter un autre produit au panier :</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  placeholder="Rechercher un médicament (nom, code, DCI)..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setSearchFocused(true); }}
                  onFocus={() => setSearchFocused(true)}
                  style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {searchFocused && filteredMeds.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                marginTop: '0.25rem',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {filteredMeds.map(med => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => handleAddMedToOrder(med.id)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 1rem',
                      textAlign: 'left',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      borderBottom: '1px solid var(--border-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong>{med.nom} {med.dosage}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({med.code})</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 600 }}>Ajouter +</span>
                  </button>
                ))}
              </div>
            )}
            
            {searchFocused && searchTerm && filteredMeds.length === 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                padding: '0.75rem',
                textAlign: 'center',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginTop: '0.25rem'
              }}>
                Aucun produit trouvé.
              </div>
            )}

            {searchFocused && (
              <div 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}
                onClick={() => setSearchFocused(false)}
              />
            )}
          </div>

          {/* Lines Table */}
          <div className="table-container" style={{ margin: 0, border: '1px solid var(--border-light)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Code</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Nom Commercial</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Stock Dispo</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>CMM</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--primary-blue)' }}>Qté Suggérée</th>
                  <th style={{ padding: '0.75rem 1rem', width: '150px' }}>Quantité Commandée</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orderLines.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <AlertTriangle size={36} style={{ color: 'var(--warning-orange)', marginBottom: '0.5rem' }} />
                      <p style={{ fontWeight: 500 }}>Aucune proposition automatique en cours.</p>
                      <p style={{ fontSize: '0.8rem' }}>Utilisez le sélecteur ci-dessus pour ajouter des articles manuellement.</p>
                    </td>
                  </tr>
                ) : (
                  orderLines.map((line, idx) => {
                    const med = medicaments.find(m => m.id === line.medicamentId);
                    if (!med) return null;
                    const stock = getStockUtilisable(med.id);
                    const cmm = calculateCMM(med.id);

                    return (
                      <tr key={med.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{med.code}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600 }}>{med.nom} {med.dosage}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.dci}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: stock === 0 ? 'var(--danger-red)' : 'var(--text-main)' }}>
                          {stock}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>
                          {cmm}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: 'var(--primary-blue)' }}>
                          {line.quantiteProposee}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <input 
                            type="number"
                            min="0"
                            value={line.quantiteCommandee}
                            onChange={(e) => handleLineChange(idx, 'quantiteCommandee', Number(e.target.value))}
                            style={{ 
                              width: '100px', 
                              padding: '0.4rem', 
                              borderRadius: '6px', 
                              border: '1px solid var(--primary-blue)', 
                              fontWeight: 700,
                              textAlign: 'center' 
                            }}
                            required
                          />
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <button 
                            type="button" 
                            className="btn" 
                            style={{ padding: '0.35rem', background: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--danger-red)' }}
                            onClick={() => handleRemoveLine(idx)}
                            title="Supprimer du panier"
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

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            <button 
              type="button" 
              className="btn" 
              style={{ border: '1px solid var(--border-light)', background: 'white' }}
              onClick={() => { if (window.confirm('Réinitialiser la commande ?')) setOrderLines([]); }}
            >
              Annuler / Vider
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={orderLines.length === 0}
            >
              <ClipboardList size={16} /> Envoyer la Commande au Grossiste
            </button>
          </div>
        </form>
      )}

      {/* TAB: ORDER HISTORY */}
      {activeTab === 'historique' && !selectedCmd && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Historique des commandes closes</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Historique complet des commandes réceptionnées ou annulées.</p>
          </div>

          <div className="table-container" style={{ margin: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem' }}>Code Commande</th>
                  <th style={{ padding: '1rem' }}>Date Commande</th>
                  <th style={{ padding: '1rem' }}>Créateur</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Articles</th>
                  <th style={{ padding: '1rem' }}>Statut</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pastOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <ClipboardList size={48} style={{ color: 'var(--border-light)', marginBottom: '0.5rem' }} />
                      <p style={{ fontWeight: 500 }}>Aucune commande dans l'historique.</p>
                    </td>
                  </tr>
                ) : (
                  pastOrders.map((cmd) => (
                    <tr key={cmd.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{cmd.numeroCommande}</td>
                      <td style={{ padding: '1rem' }}>{new Date(cmd.dateCommande).toLocaleDateString()} {new Date(cmd.dateCommande).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ padding: '1rem' }}>{cmd.creePar}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>{cmd.lignes.length}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.6rem', 
                          borderRadius: '50px', 
                          backgroundColor: cmd.statut === 'Réceptionnée' ? '#ECFDF5' : '#FEF2F2', 
                          color: cmd.statut === 'Réceptionnée' ? '#047857' : 'var(--danger-red)', 
                          fontSize: '0.8rem', 
                          fontWeight: 700 
                        }}>
                          {cmd.statut}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button 
                          className="btn" 
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', border: '1px solid var(--border-light)', background: '#F8FAFC' }}
                          onClick={() => setSelectedCmd(cmd)}
                        >
                          <Eye size={14} style={{ color: 'var(--primary-blue)' }} /> Voir Détails
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

      {/* DETAIL MODAL (INLINE OR DETAILED VIEW) */}
      {selectedCmd && (
        <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '5px solid var(--primary-blue)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
            <div>
              <span style={{ 
                padding: '0.2rem 0.5rem', 
                borderRadius: '4px', 
                fontSize: '0.75rem', 
                fontWeight: 700,
                backgroundColor: selectedCmd.statut === 'En cours' ? '#FFF3C4' : selectedCmd.statut === 'Réceptionnée' ? '#ECFDF5' : '#FEF2F2',
                color: selectedCmd.statut === 'En cours' ? '#855D00' : selectedCmd.statut === 'Réceptionnée' ? '#047857' : 'var(--danger-red)'
              }}>
                {selectedCmd.statut}
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.25rem 0 0 0' }}>Commande {selectedCmd.numeroCommande}</h3>
            </div>
            <button 
              className="btn" 
              style={{ border: '1px solid var(--border-light)', background: 'white' }}
              onClick={() => setSelectedCmd(null)}
            >
              <X size={16} /> Fermer
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Date d'émission :</span>
              <strong>{new Date(selectedCmd.dateCommande).toLocaleDateString()} {new Date(selectedCmd.dateCommande).toLocaleTimeString()}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Créé par :</span>
              <strong>{selectedCmd.creePar}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nombre de médicaments commandés :</span>
              <strong>{selectedCmd.lignes.length}</strong>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>📦 Liste des Articles</h4>
            <div className="table-container" style={{ margin: 0, border: '1px solid var(--border-light)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Code</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Médicament</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Quantité Suggérée</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary-blue)' }}>Quantité Commandée</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCmd.lignes.map((line) => {
                    const med = medicaments.find(m => m.id === line.medicamentId);
                    if (!med) return null;
                    return (
                      <tr key={line.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{med.code}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600 }}>{med.nom} {med.dosage}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.dci}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          {line.quantiteProposee}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-blue)' }}>
                          {line.quantiteCommandee}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selectedCmd.statut === 'En cours' && currentUser?.role !== 'Auditeur' && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <button 
                className="btn btn-success"
                onClick={() => handleUpdateStatus(selectedCmd.id, 'Réceptionnée')}
              >
                <CheckCircle size={16} /> Réceptionner la Commande
              </button>
              <button 
                className="btn" 
                style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: 'var(--danger-red)' }}
                onClick={() => handleUpdateStatus(selectedCmd.id, 'Annulée')}
              >
                <XCircle size={16} /> Annuler la Commande
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
