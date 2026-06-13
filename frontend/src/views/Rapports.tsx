import React, { useState } from 'react';
import { useStore } from '../store';
import { Download, FileBarChart2, FileText, Printer, CheckCircle } from 'lucide-react';

export default function Rapports() {
  const { medicaments, stockCentral, stockPharmacie } = useStore();
  const [reportType, setReportType] = useState<'val' | 'cons' | 'exp'>('val');

  const allLotsCentral = stockCentral.map(i => ({ ...i, location: 'Magasin Central' }));
  const allLotsPharmacy = stockPharmacie.map(i => ({ ...i, location: 'Pharmacie' }));
  const combinedStock = [...allLotsCentral, ...allLotsPharmacy];

  // Calculations
  const stockValuation = combinedStock.reduce((acc, item) => acc + (item.quantite * 3000), 0);

  const handleExport = (format: 'PDF' | 'EXCEL') => {
    alert(`Exportation du rapport au format ${format} réussie !`);
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-blue)' }}>Rapports et Analyses Globaux</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Consultez, analysez et exportez les rapports de valorisation de stock, consommation et pertes par péremption.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '1rem' }}>
        <button 
          onClick={() => setReportType('val')}
          style={{
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: reportType === 'val' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: reportType === 'val' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          💰 Valorisation & Inventaire
        </button>
        <button 
          onClick={() => setReportType('cons')}
          style={{
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: reportType === 'cons' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: reportType === 'cons' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          📈 Consommations & Sorties
        </button>
        <button 
          onClick={() => setReportType('exp')}
          style={{
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: 'none',
            borderBottom: reportType === 'exp' ? '3px solid var(--primary-blue)' : '3px solid transparent',
            color: reportType === 'exp' ? 'var(--primary-blue)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          ⚠️ Expirations & Pertes
        </button>
      </div>

      {/* Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button className="btn" style={{ border: '1px solid var(--border-light)', background: 'white' }} onClick={() => handleExport('PDF')}>
          <Download size={14} /> PDF
        </button>
        <button className="btn" style={{ border: '1px solid var(--border-light)', background: 'white' }} onClick={() => handleExport('EXCEL')}>
          <Download size={14} /> Excel
        </button>
      </div>

      {reportType === 'val' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card Summary */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Valeur Totale du Stock Restant</span>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-blue)', marginTop: '0.25rem' }}>
                {stockValuation.toLocaleString()} FCFA
              </h3>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Magasin Central: <strong>{(stockCentral.reduce((acc, i) => acc + i.quantite, 0) * 3000).toLocaleString()} FCFA</strong> <br />
              Pharmacie: <strong>{(stockPharmacie.reduce((acc, i) => acc + i.quantite, 0) * 3000).toLocaleString()} FCFA</strong>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem' }}>Code</th>
                  <th style={{ padding: '1rem' }}>Médicament</th>
                  <th style={{ padding: '1rem' }}>Dépôt</th>
                  <th style={{ padding: '1rem' }}>Lot</th>
                  <th style={{ padding: '1rem' }}>Expiration</th>
                  <th style={{ padding: '1rem' }}>Quantité</th>
                  <th style={{ padding: '1rem' }}>P.U. Moyen</th>
                  <th style={{ padding: '1rem' }}>Valorisation</th>
                </tr>
              </thead>
              <tbody>
                {combinedStock.map((item, idx) => {
                  const med = medicaments.find(m => m.id === item.medicamentId);
                  if (!med) return null;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600 }}>{med.code}</td>
                      <td style={{ padding: '1rem' }}>{med.nom} {med.dosage}</td>
                      <td style={{ padding: '1rem' }}>{item.location}</td>
                      <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{item.lot}</td>
                      <td style={{ padding: '1rem' }}>{item.expiration}</td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{item.quantite}</td>
                      <td style={{ padding: '1rem' }}>3 000 FCFA</td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                        {(item.quantite * 3000).toLocaleString()} FCFA
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'cons' && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileBarChart2 size={48} style={{ color: 'var(--primary-blue)', marginBottom: '1rem' }} />
          <h3>Rapport de Consommation & Taux de Rotation</h3>
          <p style={{ maxWidth: '500px', margin: '0.5rem auto 1.5rem', fontSize: '0.85rem' }}>
            Affiche les volumes consommés mensuellement par DCI, avec calcul du stock de sécurité théorique.
          </p>
          <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '20px', backgroundColor: '#EFF6FF', color: 'var(--primary-blue)', fontWeight: 600, fontSize: '0.85rem' }}>
            Générer Rapport Détaillé
          </div>
        </div>
      )}

      {reportType === 'exp' && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ color: 'var(--danger-red)', marginBottom: '1rem' }} />
          <h3>Rapport des Pertes par Expiration</h3>
          <p style={{ maxWidth: '500px', margin: '0.5rem auto 1.5rem', fontSize: '0.85rem' }}>
            Rapport réglementaire listant l'intégralité des médicaments périmés détruits ou retournés ces 12 derniers mois.
          </p>
          <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '20px', backgroundColor: '#FEF2F2', color: 'var(--danger-red)', fontWeight: 600, fontSize: '0.85rem' }}>
            Consulter les Retraits Réglementaires
          </div>
        </div>
      )}
    </div>
  );
}
