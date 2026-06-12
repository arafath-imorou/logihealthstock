import React from 'react';
import { useStore } from '../store';
import { AlertOctagon, AlertTriangle, Calendar, Check, Trash2 } from 'lucide-react';

export default function Expirations() {
  const { stockCentral, stockPharmacie, medicaments, destruireStockCentral } = useStore();

  const allLots = [
    ...stockCentral.map(item => ({ ...item, source: 'Magasin Central' })),
    ...stockPharmacie.map(item => ({ ...item, source: 'Pharmacie' }))
  ];

  const getDaysToExpiry = (expiryDate: string) => {
    return Math.round((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  };

  // Sort lots by expiration date
  const sortedLots = allLots.sort((a, b) => new Date(a.expiration).getTime() - new Date(b.expiration).getTime());

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-blue)' }}>Gestion des Expirations</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Contrôle strict des dates de péremption, trié selon l'approche FEFO. Isolez ou détruisez les produits impropres.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--danger-red)' }}>
          <div style={{ backgroundColor: '#FEF2F2', padding: '0.75rem', borderRadius: '12px', color: 'var(--danger-red)' }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Déjà Expiré</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {allLots.filter(l => getDaysToExpiry(l.expiration) <= 0).length} lots
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warning-orange)' }}>
          <div style={{ backgroundColor: '#FFFBEB', padding: '0.75rem', borderRadius: '12px', color: 'var(--warning-orange)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Périme &lt; 90j</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {allLots.filter(l => {
                const days = getDaysToExpiry(l.expiration);
                return days > 0 && days <= 90;
              }).length} lots
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ backgroundColor: '#FEF3C7', padding: '0.75rem', borderRadius: '12px', color: '#F59E0B' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Périme &lt; 180j</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {allLots.filter(l => {
                const days = getDaysToExpiry(l.expiration);
                return days > 90 && days <= 180;
              }).length} lots
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '1rem' }}>Médicament</th>
              <th style={{ padding: '1rem' }}>Source</th>
              <th style={{ padding: '1rem' }}>Lot</th>
              <th style={{ padding: '1rem' }}>Date d'Expiration</th>
              <th style={{ padding: '1rem' }}>Jours Restants</th>
              <th style={{ padding: '1rem' }}>Statut / Alerte</th>
              <th style={{ padding: '1rem' }}>Quantité</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedLots.map((item) => {
              const med = medicaments.find(m => m.id === item.medicamentId);
              if (!med) return null;

              const days = getDaysToExpiry(item.expiration);
              let statusText = 'Correct';
              let statusColor = 'var(--accent-green)';
              let rowBg = 'transparent';

              if (days <= 0) {
                statusText = 'EXPIRÉ 🚨';
                statusColor = 'var(--danger-red)';
                rowBg = '#FFF5F5';
              } else if (days <= 30) {
                statusText = 'Urgent < 30j ⚠️';
                statusColor = '#D97706';
                rowBg = '#FFFBEB';
              } else if (days <= 90) {
                statusText = 'Critique < 90j';
                statusColor = 'var(--warning-orange)';
              } else if (days <= 180) {
                statusText = 'Avertissement < 180j';
                statusColor = '#EAB308';
              }

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: rowBg }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{med.nom} {med.dosage}</td>
                  <td style={{ padding: '1rem' }}>{item.source}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.lot}</td>
                  <td style={{ padding: '1rem' }}>{item.expiration}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: days <= 0 ? 'var(--danger-red)' : 'inherit' }}>
                    {days <= 0 ? 'Périmé' : `${days} jours`}
                  </td>
                  <td style={{ padding: '1rem', color: statusColor, fontWeight: 700 }}>
                    {statusText}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700 }}>{item.quantite} U.</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {days <= 0 && item.source === 'Magasin Central' ? (
                      <button 
                        onClick={() => {
                          if (window.confirm('Voulez-vous enregistrer la destruction réglementaire de ce lot ?')) {
                            destruireStockCentral(item.id, item.quantite, 'Expiré (Destruction Réglementaire)');
                          }
                        }}
                        className="btn"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', background: '#FEF2F2', border: '1px solid var(--danger-red)', color: 'var(--danger-red)' }}
                      >
                        <Trash2 size={12} style={{ marginRight: '4px' }} /> Retrait / Rebut
                      </button>
                    ) : days <= 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Retourner au Magasin</span>
                    ) : (
                      <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>Prêt FEFO ✅</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
