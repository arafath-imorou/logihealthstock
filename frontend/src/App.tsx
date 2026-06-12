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
import { Wifi, WifiOff } from 'lucide-react';

function App() {
  const { isLoggedIn, fetchFromSupabase, isOnline, syncing } = useStore();
  const [currentView, setView] = useState('dashboard');

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
      {/* Sidebar Navigation */}
      <Sidebar currentView={currentView} setView={setView} />

      {/* Main Content Pane */}
      <main style={{ 
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
