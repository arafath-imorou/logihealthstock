import React from 'react';
import { Shield, UserPlus, Users as UsersIcon } from 'lucide-react';

export default function Users() {
  const mockUsers = [
    { id: '1', name: 'Christiane QUENUM', email: 'admin@logihealth.org', role: 'Admin', status: 'Actif' },
    { id: '2', name: 'M. Amadou Sow', email: 'magasinier@logihealth.org', role: 'Magasinier', status: 'Actif' },
    { id: '3', name: 'Mme. Claire Touré', email: 'pharmacien@logihealth.org', role: 'Pharmacien', status: 'Actif' },
    { id: '4', name: 'Dr. Marc Dubois', email: 'auditeur@logihealth.org', role: 'Auditeur', status: 'Actif' },
  ];

  const permissions = [
    { module: 'Stock Central (Magasin)', admin: true, magasinier: true, pharmacien: false, auditeur: 'Lecture seule' },
    { module: 'Entrées Fournisseurs', admin: true, magasinier: true, pharmacien: false, auditeur: 'Lecture seule' },
    { module: 'Ajustements & Rebuts', admin: true, magasinier: true, pharmacien: false, auditeur: 'Non autorisé' },
    { module: 'Demande de Restockage', admin: true, magasinier: false, pharmacien: true, auditeur: 'Lecture seule' },
    { module: 'Dispensation Directe', admin: true, magasinier: false, pharmacien: true, auditeur: 'Non autorisé' },
  ];

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-blue)' }}>Gestion des Rôles et Utilisateurs</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Configurez et gérez les permissions des professionnels de santé sur LogiHealth.</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserPlus size={16} /> Ajouter Collaborateur
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* User list */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UsersIcon size={18} /> Liste des Comptes
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '0.75rem' }}>Collaborateur</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Rôle</th>
                  <th style={{ padding: '0.75rem' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{user.name}</td>
                    <td style={{ padding: '0.75rem' }}>{user.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        backgroundColor: '#EFF6FF',
                        color: 'var(--primary-blue)'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--accent-green)', fontWeight: 600 }}>{user.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Permissions matrix */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} style={{ color: 'var(--primary-blue)' }} /> Matrice des Habilitations par Rôle
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid var(--border-light)' }}>
                  <th style={{ padding: '0.75rem' }}>Fonctionnalité / Module</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Admin</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Magasin</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Pharma</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Audit</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{perm.module}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', color: perm.admin === true ? 'var(--accent-green)' : 'var(--danger-red)', fontWeight: 'bold' }}>
                      {perm.admin === true ? 'Oui' : 'Non'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', color: perm.magasinier === true ? 'var(--accent-green)' : 'var(--danger-red)', fontWeight: 'bold' }}>
                      {perm.magasinier === true ? 'Oui' : 'Non'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', color: perm.pharmacien === true ? 'var(--accent-green)' : 'var(--danger-red)', fontWeight: 'bold' }}>
                      {perm.pharmacien === true ? 'Oui' : 'Non'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold', color: typeof perm.auditeur === 'string' && perm.auditeur.includes('Lecture') ? 'var(--warning-orange)' : 'var(--danger-red)' }}>
                      {perm.auditeur === 'Lecture seule' ? 'L/S' : perm.auditeur === 'Non autorisé' ? 'Non' : perm.auditeur}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
