import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import MagasinCentral from './views/MagasinCentral';
import Pharmacie from './views/Pharmacie';
import Expirations from './views/Expirations';
import Rapports from './views/Rapports';
import Users from './views/Users';
import Settings from './views/Settings';
import { Wifi, WifiOff, Menu } from 'lucide-react';

function App() {
  const { isLoggedIn, fetchFromSupabase, isOnline, syncing } = useStore();
  const [currentView, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchFromSupabase();
    }
  }, [isLoggedIn, fetchFromSupabase]);

  if (!isLoggedIn) {
    return <Login />;
  }

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'magasin':
        return <MagasinCentral />;
      case 'pharmacie':
        return <Pharmacie />;
      case 'expirations':
        return <Expirations />;
      case 'rapports':
        return <Rapports />;
      case 'users':
        return <Users />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background-light)' }}>
      {/* Mobile Top Header */}
      <header className="mobile-header" style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        height: '56px',
        backgroundColor: '#1E293B',
        color: 'white',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        borderBottom: '1px solid #334155'
      }}>
        <button 
          onClick={() => setSidebarOpen(true)} 
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          title="Menu"
        >
          <Menu size={24} />
        </button>
        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>LogiHealth</div>
        <div style={{ width: 24 }}></div> {/* Spacer */}
      </header>

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 95
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        setView={(view) => { setView(view); setSidebarOpen(false); }} 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content Pane */}
      <main className="main-content" style={{ 
        flex: 1, 
        marginLeft: '260px', 
        minHeight: '100vh',
        width: 'calc(100% - 260px)',
        position: 'relative'
      }}>
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
