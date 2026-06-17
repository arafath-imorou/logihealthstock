import React from 'react';
import { useStore } from '../store';
import { 
  LayoutDashboard, 
  Warehouse, 
  PlusSquare, 
  ClipboardList, 
  AlertTriangle, 
  FileBarChart2, 
  Users, 
  Settings, 
  History, 
  LogOut,
  UserCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
}

export default function Sidebar({ currentView, setView, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const { currentUser, logout, login, isOnline } = useStore();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as 'Admin' | 'Magasinier' | 'Pharmacien' | 'Auditeur';
    login(role === 'Admin' ? 'admin@logihealth.org' : `${role.toLowerCase()}@logihealth.org`, role);
  };

  if (!currentUser) return null;

  // Define navigation based on user roles
  const navItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, roles: ['Admin', 'Magasinier', 'Pharmacien', 'Auditeur'] },
    { id: 'magasin', label: 'Magasin Central', icon: Warehouse, roles: ['Admin', 'Magasinier', 'Auditeur'] },
    { id: 'pharmacie', label: 'Pharmacie & Dispensation', icon: PlusSquare, roles: ['Admin', 'Pharmacien', 'Auditeur'] },
    { id: 'expirations', label: 'Gestion Expirations', icon: AlertTriangle, roles: ['Admin', 'Magasinier', 'Auditeur'] },
    { id: 'commandes', label: 'Commandes', icon: ClipboardList, roles: ['Admin', 'Magasinier', 'Auditeur'] },
    { id: 'rapports', label: 'Rapports', icon: FileBarChart2, roles: ['Admin', 'Auditeur', 'Magasinier', 'Pharmacien'] },
    { id: 'users', label: 'Utilisateurs', icon: Users, roles: ['Admin'] },
    { id: 'settings', label: 'Paramètres', icon: Settings, roles: ['Admin'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
      width: '260px',
      backgroundColor: '#1E293B',
      color: '#F8FAFC',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      borderRight: '1px solid #334155'
    }}>
      {/* Header / Brand */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            backgroundColor: 'var(--accent-green)',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'white',
            fontSize: '1.25rem'
          }}>
            LH
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: 'white' }}>LogiHealth</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Gestion des Stocks</span>
              <span 
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: isOnline ? 'var(--accent-green)' : 'var(--danger-red)',
                  boxShadow: isOnline ? '0 0 8px var(--accent-green)' : '0 0 8px var(--danger-red)',
                  display: 'inline-block'
                }} 
                title={isOnline ? 'Base de données Supabase Connectée (En ligne)' : 'Mode Local Autonome (Hors-ligne)'}
              />
            </div>
          </div>
        </div>

        {/* Close button for mobile */}
        {setSidebarOpen && (
          <button 
            className="mobile-close-btn"
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'none',
              alignItems: 'center',
              padding: '0.25rem'
            }}
            title="Fermer le menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Role Switcher for Testing (Super Useful Bonus) */}
      <div style={{ padding: '1rem', borderBottom: '1px solid #334155', backgroundColor: '#0F172A' }}>
        <label style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', fontWeight: 600 }}>
          <UserCheck size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Simuler le Rôle
        </label>
        <select 
          value={currentUser.role} 
          onChange={handleRoleChange}
          style={{
            width: '100%',
            backgroundColor: '#1E293B',
            color: 'white',
            border: '1px solid #475569',
            padding: '0.4rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="Admin">Administrateur</option>
          <option value="Magasinier">Magasinier</option>
          <option value="Pharmacien">Pharmacien</option>
          <option value="Auditeur">Auditeur (Lect. Seule)</option>
        </select>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--primary-blue)' : 'transparent',
                color: isActive ? 'white' : '#CBD5E1',
                fontSize: '0.9rem',
                fontWeight: 500,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={18} style={{ color: isActive ? 'white' : '#94A3B8' }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Profile & Logout */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid #334155',
        backgroundColor: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            color: 'white'
          }}>
            {currentUser.nomComplet.charAt(0)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {currentUser.nomComplet}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{currentUser.role}</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #EF4444',
            background: 'transparent',
            color: '#EF4444',
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
            marginTop: '0.5rem',
            transition: 'all 0.2s ease'
          }}
        >
          <LogOut size={14} /> Déconnexion
        </button>
      </div>
    </aside>
  );
}
