import React from 'react';
import { useStore } from '../store';
import { 
  Warehouse, 
  PlusSquare, 
  DollarSign, 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  Users, 
  ArrowUpRight,
  TrendingUp,
  Inbox
} from 'lucide-react';

export default function Dashboard() {
  const { stockCentral, stockPharmacie, medicaments, dispensations, transferts, notifications } = useStore();

  // 1. Calculate values
  // Unique products at Central Store
  const uniqueCentralProducts = new Set(stockCentral.map(item => item.medicamentId)).size;
  const totalCentralUnits = stockCentral.reduce((acc, item) => acc + item.quantite, 0);

  // Unique products at Pharmacy
  const uniquePharmacieProducts = new Set(stockPharmacie.map(item => item.medicamentId)).size;
  const totalPharmacieUnits = stockPharmacie.reduce((acc, item) => acc + item.quantite, 0);

  // Expiration metrics (lots expiring in less than 90 days)
  const today = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);

  const itemsNearExpiration = [...stockCentral, ...stockPharmacie].filter(item => {
    const expDate = new Date(item.expiration);
    return expDate > today && expDate <= ninetyDaysFromNow;
  });
  const nearExpiration = itemsNearExpiration.length;

  // Ruptures (medicines in catalog with 0 stock in both central and pharmacy)
  const ruptures = medicaments.filter(med => {
    const inCentral = stockCentral.filter(s => s.medicamentId === med.id).reduce((acc, s) => acc + s.quantite, 0);
    const inPharmacie = stockPharmacie.filter(s => s.medicamentId === med.id).reduce((acc, s) => acc + s.quantite, 0);
    return inCentral === 0 && inPharmacie === 0;
  }).length;

  // Total stock value (quantity in stock * sale price in the central catalog)
  const stockValue = [...stockCentral, ...stockPharmacie].reduce((acc, item) => {
    const med = medicaments.find(m => m.id === item.medicamentId);
    return acc + (item.quantite * (med?.prixVente || 0));
  }, 0);

  // Sales Today (total price of products dispensed today)
  const salesToday = dispensations
    .filter(d => new Date(d.date).toDateString() === today.toDateString())
    .reduce((acc, d) => {
      const dispValue = d.items.reduce((itemAcc, item) => {
        const med = medicaments.find(m => m.id === item.medicamentId);
        return itemAcc + (item.quantiteDelivree * (med?.prixVente || 0));
      }, 0);
      return acc + dispValue;
    }, 0);

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* CSS injection for premium card hover effects */}
      <style>{`
        .dashboard-kpi-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          cursor: pointer;
        }
        .dashboard-kpi-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
          border-color: rgba(30, 64, 175, 0.15);
        }
        .dashboard-kpi-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--card-accent, var(--primary-blue));
          transition: width 0.2s ease;
        }
        .dashboard-kpi-card:hover::before {
          width: 6px;
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-blue)' }}>Tableau de Bord Central</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aperçu en temps réel des stocks de médicaments, alertes critiques et performances de dispensation.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--surface-white)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-green)' }}>● Connecté</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>| Mode Offline Prêt</span>
        </div>
      </div>

      {/* Grid of KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* KPI 1: Magasin Central */}
        <div className="card dashboard-kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', '--card-accent': '#3B82F6' } as React.CSSProperties}>
          <div style={{ backgroundColor: '#EFF6FF', padding: '0.85rem', borderRadius: '12px', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Warehouse size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Magasin Central</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {uniqueCentralProducts} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Produits</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {totalCentralUnits.toLocaleString()} unités en stock
            </div>
          </div>
        </div>

        {/* KPI 2: Pharmacie */}
        <div className="card dashboard-kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', '--card-accent': '#10B981' } as React.CSSProperties}>
          <div style={{ backgroundColor: '#ECFDF5', padding: '0.85rem', borderRadius: '12px', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlusSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pharmacie</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {uniquePharmacieProducts} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Produits</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {totalPharmacieUnits.toLocaleString()} unités en stock
            </div>
          </div>
        </div>

        {/* KPI 3: Risques de péremption */}
        <div className="card dashboard-kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', '--card-accent': '#F59E0B' } as React.CSSProperties}>
          <div style={{ backgroundColor: '#FFFBEB', padding: '0.85rem', borderRadius: '12px', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risque Péremption</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: nearExpiration > 0 ? '#D97706' : 'inherit', marginTop: '0.2rem' }}>
              {nearExpiration} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Lots</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Expiration dans les 90 jours
            </div>
          </div>
        </div>

        {/* KPI 4: Ruptures de stock */}
        <div className="card dashboard-kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', '--card-accent': '#EF4444' } as React.CSSProperties}>
          <div style={{ backgroundColor: '#FEF2F2', padding: '0.85rem', borderRadius: '12px', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ruptures de Stock</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: ruptures > 0 ? '#DC2626' : 'inherit', marginTop: '0.2rem' }}>
              {ruptures} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Produits</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Stock à zéro globalement
            </div>
          </div>
        </div>

        {/* KPI 5: Valeur du stock disponible */}
        <div className="card dashboard-kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', '--card-accent': '#8B5CF6' } as React.CSSProperties}>
          <div style={{ backgroundColor: '#F5F3FF', padding: '0.85rem', borderRadius: '12px', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valeur du Stock</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.2rem' }}>
              {stockValue.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>FCFA</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Valorisé au prix de vente
            </div>
          </div>
        </div>

        {/* KPI 6: Valeur des produits vendus pour la journée */}
        <div className="card dashboard-kpi-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', '--card-accent': '#06B6D4' } as React.CSSProperties}>
          <div style={{ backgroundColor: '#ECFEFF', padding: '0.85rem', borderRadius: '12px', color: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ventes du Jour</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: salesToday > 0 ? '#0891B2' : 'inherit', marginTop: '0.2rem' }}>
              {salesToday.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>FCFA</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Dispenses de la journée
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Left Column : Charts & Critical Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Consumption Chart SVG Component */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} style={{ color: 'var(--primary-blue)' }} /> Consommation Mensuelle (Unités Sorties)
              </h3>
              <select style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                <option>Derniers 6 mois</option>
                <option>Cette année</option>
              </select>
            </div>
            
            {/* SVG Chart */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '220px', padding: '1rem' }}>
              <svg viewBox="0 0 600 200" style={{ width: '100%', height: '100%' }}>
                {/* Grid Lines */}
                <line x1="50" y1="20" x2="550" y2="20" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="50" y1="70" x2="550" y2="70" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="50" y1="120" x2="550" y2="120" stroke="#F1F5F9" strokeWidth="1" />
                <line x1="50" y1="170" x2="550" y2="170" stroke="#E2E8F0" strokeWidth="2" />

                {/* Y Axis Labels */}
                <text x="20" y="25" fill="#94A3B8" fontSize="10" textAnchor="middle">1500</text>
                <text x="20" y="75" fill="#94A3B8" fontSize="10" textAnchor="middle">1000</text>
                <text x="20" y="125" fill="#94A3B8" fontSize="10" textAnchor="middle">500</text>
                <text x="20" y="175" fill="#94A3B8" fontSize="10" textAnchor="middle">0</text>

                {/* Area under the line */}
                <path d="M 50 170 Q 133 130 216 110 T 382 60 T 548 100 L 548 170 Z" fill="url(#blue-gradient)" opacity="0.1" />

                {/* Trend line */}
                <path d="M 50 170 Q 133 130 216 110 T 382 60 T 548 100" fill="none" stroke="var(--primary-blue)" strokeWidth="3" />

                {/* Points */}
                <circle cx="50" cy="170" r="5" fill="var(--primary-blue)" />
                <circle cx="133" cy="140" r="5" fill="var(--primary-blue)" />
                <circle cx="216" cy="110" r="5" fill="var(--primary-blue)" />
                <circle cx="299" cy="95" r="5" fill="var(--primary-blue)" />
                <circle cx="382" cy="60" r="5" fill="var(--primary-blue)" />
                <circle cx="465" cy="80" r="5" fill="var(--primary-blue)" />
                <circle cx="548" cy="100" r="5" fill="var(--primary-blue)" />

                {/* X Axis Labels */}
                <text x="50" y="190" fill="#64748B" fontSize="11" textAnchor="middle">Déc</text>
                <text x="133" y="190" fill="#64748B" fontSize="11" textAnchor="middle">Jan</text>
                <text x="216" y="190" fill="#64748B" fontSize="11" textAnchor="middle">Fév</text>
                <text x="299" y="190" fill="#64748B" fontSize="11" textAnchor="middle">Mar</text>
                <text x="382" y="190" fill="#64748B" fontSize="11" textAnchor="middle">Avr</text>
                <text x="465" y="190" fill="#64748B" fontSize="11" textAnchor="middle">Mai</text>
                <text x="548" y="190" fill="#64748B" fontSize="11" textAnchor="middle">Juin (Proj)</text>

                {/* Gradient Definition */}
                <defs>
                  <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary-blue)" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--danger-red)' }}>
              ⚠️ Alertes Critiques de Stock Faible / Rupture
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {medicaments.map(med => {
                const phStock = stockPharmacie.filter(s => s.medicamentId === med.id).reduce((acc, s) => acc + s.quantite, 0);
                const cenStock = stockCentral.filter(s => s.medicamentId === med.id).reduce((acc, s) => acc + s.quantite, 0);

                if (phStock <= med.seuilAlerte) {
                  return (
                    <div key={med.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      backgroundColor: phStock === 0 ? '#FEF2F2' : '#FFFBEB',
                      border: `1px solid ${phStock === 0 ? 'var(--danger-red)' : 'var(--warning-orange)'}`,
                      borderRadius: '8px'
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{med.nom} {med.dosage} ({med.forme})</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DCI: {med.dci} | Seuil d'alerte : {med.seuilAlerte} boîtes</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: phStock === 0 ? 'var(--danger-red)' : 'var(--warning-orange)' }}>
                          {phStock === 0 ? 'RUPTURE' : `${phStock} Restants`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>En réserve central : {cenStock}</div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

        </div>

        {/* Right Column : Notifications and Quick Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Expiration Near Cards */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>🔔 Dernières Notifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.slice(0, 4).map(notif => (
                <div key={notif.id} style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: '#F8FAFC',
                  borderLeft: `4px solid ${
                    notif.type === 'rupture' || notif.type === 'expiration' ? 'var(--danger-red)' : 'var(--primary-blue)'
                  }`
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ textTransform: 'uppercase', color: 'var(--text-muted)' }}>{notif.type}</span>
                    <span style={{ fontWeight: 400, color: '#94A3B8' }}>{new Date(notif.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: '#334155' }}>{notif.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Portal */}
          <div className="card" style={{ backgroundColor: 'var(--primary-blue)', color: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'white' }}>Accès Rapide</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '1rem' }}>Raccourcis vers les actions prioritaires de votre rôle.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', padding: '0.5rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Nouvelle dispensation directe</span>
                <ArrowUpRight size={14} />
              </div>
              <div style={{ fontSize: '0.8rem', padding: '0.5rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Demander approvisionnement</span>
                <ArrowUpRight size={14} />
              </div>
              <div style={{ fontSize: '0.8rem', padding: '0.5rem', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Saisir entrée fournisseur</span>
                <ArrowUpRight size={14} />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
