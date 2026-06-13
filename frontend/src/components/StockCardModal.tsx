import React, { useState } from 'react';
import { useStore, StockMovement } from '../store';
import { 
  X, 
  Warehouse, 
  PlusSquare, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  User, 
  Info, 
  Search, 
  Activity, 
  Package 
} from 'lucide-react';

interface StockCardModalProps {
  medicamentId: string;
  onClose: () => void;
}

export default function StockCardModal({ medicamentId, onClose }: StockCardModalProps) {
  const { medicaments, stockCentral, stockPharmacie, movements } = useStore();
  const [filterType, setFilterType] = useState<string>('Tous');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const med = medicaments.find(m => m.id === medicamentId);

  if (!med) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}>
        <div className="card" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--danger-red)', fontWeight: 600 }}>Erreur: Produit introuvable.</p>
          <button onClick={onClose} className="btn btn-primary" style={{ alignSelf: 'center' }}>Fermer</button>
        </div>
      </div>
    );
  }

  // Calculate current stock levels
  const qtyCentral = stockCentral
    .filter(s => s.medicamentId === med.id)
    .reduce((acc, s) => acc + s.quantite, 0);

  const qtyPharmacie = stockPharmacie
    .filter(s => s.medicamentId === med.id)
    .reduce((acc, s) => acc + s.quantite, 0);

  const totalStock = qtyCentral + qtyPharmacie;

  // Filter movements for this product
  const productMovements = movements
    .filter(m => m.medicamentId === med.id)
    .filter(m => {
      if (filterType === 'Tous') return true;
      return m.type === filterType;
    })
    .filter(m => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return m.details.toLowerCase().includes(searchLower) || 
             m.lot.toLowerCase().includes(searchLower) ||
             m.operateur.toLowerCase().includes(searchLower);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '1.5rem'
    }}>
      <div className="card animate-fade-in" style={{ 
        width: '100%', 
        maxWidth: '900px', 
        maxHeight: '90vh',
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem',
        padding: '2rem',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        borderTop: '4px solid var(--primary-blue)'
      }}>
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.5rem', right: '1.5rem',
            border: 'none', background: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', transition: 'color 0.2s'
          }}
          title="Fermer"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div style={{ 
            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
            color: 'var(--primary-blue)', 
            width: '48px', height: '48px', 
            borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Activity size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Fiche de Stock</h3>
              <span style={{ 
                padding: '0.15rem 0.5rem', backgroundColor: '#F1F5F9', borderRadius: '4px', 
                fontSize: '0.75rem', fontWeight: 700, color: '#475569' 
              }}>
                {med.code}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
              Détails, niveaux de stock et historique des mouvements pour <strong>{med.nom}</strong>
            </p>
          </div>
        </div>

        {/* Product Details Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          backgroundColor: '#F8FAFC',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-light)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nom Commercial / DCI</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{med.nom} ({med.dci})</span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Catégorie / Format</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{med.categorie} • {med.forme} ({med.dosage})</span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Unité & Seuil Alerte</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{med.unite} (Seuil : {med.seuilAlerte})</span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Prix Public Officiel</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-blue)' }}>{med.prixVente.toLocaleString()} FCFA</span>
          </div>
        </div>

        {/* Stock Status Cards */}
        <div className="grid-3">
          
          <div style={{ 
            backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', 
            padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' 
          }}>
            <div style={{ color: 'var(--primary-blue)', backgroundColor: 'white', padding: '0.4rem', borderRadius: '6px' }}>
              <Warehouse size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#1E40AF', display: 'block', fontWeight: 500 }}>Magasin Central</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1E3A8A' }}>{qtyCentral}</span>
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', 
            padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' 
          }}>
            <div style={{ color: 'var(--accent-green)', backgroundColor: 'white', padding: '0.4rem', borderRadius: '6px' }}>
              <PlusSquare size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#065F46', display: 'block', fontWeight: 500 }}>Pharmacie Dispens.</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#064E3B' }}>{qtyPharmacie}</span>
            </div>
          </div>

          <div style={{ 
            backgroundColor: totalStock <= med.seuilAlerte ? '#FEF2F2' : '#F5F3FF', 
            border: `1px solid ${totalStock <= med.seuilAlerte ? '#FCA5A5' : '#DDD6FE'}`, 
            borderRadius: '8px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' 
          }}>
            <div style={{ 
              color: totalStock <= med.seuilAlerte ? 'var(--danger-red)' : '#8B5CF6', 
              backgroundColor: 'white', padding: '0.4rem', borderRadius: '6px' 
            }}>
              <Package size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: totalStock <= med.seuilAlerte ? '#991B1B' : '#5B21B6', display: 'block', fontWeight: 500 }}>
                Stock Global {totalStock <= med.seuilAlerte ? '(Seuil Critique)' : ''}
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: totalStock <= med.seuilAlerte ? 'var(--danger-red)' : '#4C1D95' }}>
                {totalStock}
              </span>
            </div>
          </div>

        </div>

        {/* Movements Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minHeight: '300px' }}>
          
          {/* Filters Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h4 style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📋 Historique des Mouvements de Stock
            </h4>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              
              {/* Type Filter */}
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '0.4rem 0.5rem', borderRadius: '6px',
                  border: '1px solid var(--border-light)', fontSize: '0.85rem',
                  backgroundColor: 'white', cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="Tous">Tous les types</option>
                <option value="Entrée Fournisseur">Entrées Fournisseurs</option>
                <option value="Transfert">Transferts detail</option>
                <option value="Dispensation">Dispensations patient</option>
                <option value="Ajustement">Ajustements</option>
                <option value="Destruction">Destructions</option>
              </select>

              {/* Search Bar */}
              <div style={{ position: 'relative', width: '180px' }}>
                <input 
                  type="text" 
                  placeholder="Rechercher lot, auteur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%', padding: '0.4rem 0.5rem 0.4rem 1.8rem',
                    borderRadius: '6px', border: '1px solid var(--border-light)',
                    fontSize: '0.85rem', outline: 'none'
                  }}
                />
                <Search size={12} style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>

            </div>
          </div>

          {/* Movements Table */}
          <div style={{ border: '1px solid var(--border-light)', borderRadius: '8px', overflow: 'hidden', overflowY: 'auto', maxHeight: '350px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 10 }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Date / Heure</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Opération</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Lot</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Quantité</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Localisation</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Détails</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Opérateur</th>
                </tr>
              </thead>
              <tbody>
                {productMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Aucun mouvement de stock enregistré pour les critères sélectionnés.
                    </td>
                  </tr>
                ) : (
                  productMovements.map((m) => {
                    const isAddition = m.quantite > 0;
                    
                    let badgeBg = '#F1F5F9';
                    let badgeColor = '#475569';
                    if (m.type === 'Entrée Fournisseur') { badgeBg = '#EFF6FF'; badgeColor = 'var(--primary-blue)'; }
                    else if (m.type === 'Transfert') { badgeBg = '#F5F3FF'; badgeColor = '#8B5CF6'; }
                    else if (m.type === 'Dispensation') { badgeBg = '#ECFDF5'; badgeColor = 'var(--accent-green)'; }
                    else if (m.type === 'Ajustement') { badgeBg = '#FFFBEB'; badgeColor = 'var(--warning-orange)'; }
                    else if (m.type === 'Destruction') { badgeBg = '#FEF2F2'; badgeColor = 'var(--danger-red)'; }

                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.1s' }}>
                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={12} /> {new Date(m.date).toLocaleDateString()} {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ 
                            padding: '0.15rem 0.4rem', borderRadius: '4px', 
                            fontSize: '0.75rem', fontWeight: 600,
                            backgroundColor: badgeBg, color: badgeColor
                          }}>
                            {m.type}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 600 }}>{m.lot}</td>
                        <td style={{ 
                          padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700,
                          color: isAddition ? 'var(--accent-green)' : 'var(--danger-red)'
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            {isAddition ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {isAddition ? '+' : ''}{m.quantite}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ 
                            padding: '0.15rem 0.4rem', borderRadius: '4px', 
                            fontSize: '0.75rem', fontWeight: 550,
                            backgroundColor: m.stockType === 'Magasin' ? '#F8FAFC' : '#ECFDF5', 
                            color: m.stockType === 'Magasin' ? '#475569' : '#047857',
                            border: `1px solid ${m.stockType === 'Magasin' ? '#E2E8F0' : '#A7F3D0'}`
                          }}>
                            {m.stockType === 'Magasin' ? 'Stock Dispo' : 'Pharmacie'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#334155' }} title={m.details}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                            <Info size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                              {m.details}
                            </span>
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <User size={12} /> {m.operateur}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
}
