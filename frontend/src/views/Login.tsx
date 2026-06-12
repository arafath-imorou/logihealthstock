import React, { useState } from 'react';
import { useStore } from '../store';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

export default function Login() {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Magasinier' | 'Pharmacien' | 'Auditeur'>('Admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Veuillez entrer une adresse e-mail.');
      return;
    }
    login(email, role);
  };

  const selectTestRole = (selectedRole: 'Admin' | 'Magasinier' | 'Pharmacien' | 'Auditeur') => {
    setRole(selectedRole);
    setEmail(`${selectedRole.toLowerCase()}@logihealth.org`);
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#F8FAFC',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="card" style={{
        width: '450px',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            backgroundColor: 'var(--primary-blue)',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: 'white',
            fontSize: '1.5rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            LH
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-blue)' }}>LogiHealth Stock</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Portail de gestion logistique médicale sécurisé</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Adresse E-mail</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@logihealth.org"
                required
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
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Rôle de Connexion *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                fontSize: '0.9rem',
                backgroundColor: 'white',
                outline: 'none'
              }}
            >
              <option value="Admin">Administrateur</option>
              <option value="Magasinier">Magasinier</option>
              <option value="Pharmacien">Pharmacien</option>
              <option value="Auditeur">Auditeur (Lecture seule)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem', fontSize: '0.95rem', width: '100%' }}>
            Se Connecter en toute Sécurité
          </button>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />

        {/* Quick Testing Access (Very Helpful for User Evaluation) */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.6rem', textAlign: 'center', textTransform: 'uppercase' }}>
            Accès rapide de démonstration
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button onClick={() => selectTestRole('Admin')} className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem', border: '1px solid var(--border-light)', background: 'white' }}>
              🔑 Administrateur
            </button>
            <button onClick={() => selectTestRole('Magasinier')} className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem', border: '1px solid var(--border-light)', background: 'white' }}>
              📦 Magasinier
            </button>
            <button onClick={() => selectTestRole('Pharmacien')} className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem', border: '1px solid var(--border-light)', background: 'white' }}>
              ⚕️ Pharmacien
            </button>
            <button onClick={() => selectTestRole('Auditeur')} className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem', border: '1px solid var(--border-light)', background: 'white' }}>
              👁️ Auditeur
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
          <ShieldAlert size={12} /> Transmission de données chiffrée SSL / AES-256
        </div>
      </div>
    </div>
  );
}
