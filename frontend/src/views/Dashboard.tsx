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
  const totalCentralItems = stockCentral.reduce((acc, item) => acc + item.quantite, 0);
  const totalPharmacieItems = stockPharmacie.reduce((acc, item) => acc + item.quantite, 0);
  
  // Mock Stock Value: suppose average price is $5 (or CFA 3000) per item
  const stockValue = (totalCentralItems + totalPharmacieItems) * 3000;

  // Ruptures (meds in catalogue but 0 in pharmacy and central)
  const ruptures = medicaments.filter(med => {
    const inCentral = stockCentral.filter(s => s.medicamentId === med.id).reduce((acc, s) => acc + s.quantite, 0);
    const inPharmacie = stockPharmacie.filter(s => s.medicamentId === med.id).reduce((acc, s) => acc + s.quantite, 0);
    return inCentral === 0 && inPharmacie === 0;
  }).length;

  // Low stocks (stock in pharmacy <= seuilAlerte or stock in central <= seuilAlerte * 2)
  const lowStocks = medicaments.filter(med => {
    const inPharmacie = stockPharmacie.filter(s => s.medicamentId === med.id).reduce((acc, s) => acc + s.quantite, 0);
    return inPharmacie > 0 && inPharmacie <= med.seuilAlerte;
  }).length;

  // Expiration metrics
  const today = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);

  const nearExpiration = [...stockCentral, ...stockPharmacie].filter(item => {
    const expDate = new Date(item.expiration);
    return expDate > today && expDate <= ninetyDaysFromNow;
  }).length;

  const expired = [...stockCentral, ...stockPharmacie].filter(item => {
    const expDate = new Date(item.expiration);
    return expDate <= today;
  }).length;

  // Transferts en attente
  const pendingTransfers = transferts.filter(t => t.statut === 'attente' || t.statut === 'transfere').length;

  // Patients served today
  const patientsServedToday = dispensations.filter(d => {
    const dispDate = new Date(d.date);
    return dispDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        {/* KPI 1 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary-blue)' }}>
          <div style={{ backgroundColor: '#EFF6FF', padding: '0.75rem', borderRadius: '12px', color: 'var(--primary-blue)' }}>
            <Warehouse size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Stock Central</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalCentralItems} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>U.</span></div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--accent-green)' }}>
          <div style={{ backgroundColor: '#ECFDF5', padding: '0.75rem', borderRadius: '12px', color: 'var(--accent-green)' }}>
            <PlusSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Stock Pharmacie</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalPharmacieItems} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>U.</span></div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ backgroundColor: '#F5F3FF', padding: '0.75rem', borderRadius: '12px', color: '#8B5CF6' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Valeur Estimée</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stockValue.toLocaleString()} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>FCFA</span></div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--danger-red)' }}>
          <div style={{ backgroundColor: '#FEF2F2', padding: '0.75rem', borderRadius: '12px', color: 'var(--danger-red)' }}>
            <AlertOctagon size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Ruptures</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: ruptures > 0 ? 'var(--danger-red)' : 'inherit' }}>{ruptures}</div>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--warning-orange)' }}>
          <div style={{ backgroundColor: '#FFFBEB', padding: '0.75rem', borderRadius: '12px', color: 'var(--warning-orange)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Stock Faible</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: lowStocks > 0 ? 'var(--warning-orange)' : 'inherit' }}>{lowStocks}</div>
          </div>
        </div>

        {/* KPI 6 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #E11D48' }}>
          <div style={{ backgroundColor: '#FFF1F2', padding: '0.75rem', borderRadius: '12px', color: '#E11D48' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Expirations &lt; 90j</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: nearExpiration > 0 ? '#E11D48' : 'inherit' }}>{nearExpiration}</div>
          </div>
        </div>

        {/* KPI 7 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #06B6D4' }}>
          <div style={{ backgroundColor: '#ECFEFF', padding: '0.75rem', borderRadius: '12px', color: '#06B6D4' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Patients servis (J)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{patientsServedToday}</div>
          </div>
        </div>

        {/* KPI 8 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ backgroundColor: '#FFFBEB', padding: '0.75rem', borderRadius: '12px', color: '#F59E0B' }}>
            <Inbox size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Transferts en cours</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pendingTransfers}</div>
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>En réserve central : {cenStock} U.</div>
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
