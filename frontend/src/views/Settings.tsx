import React, { useState } from 'react';
import { useStore, Medicament } from '../store';
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw, 
  Database, 
  Plus, 
  Edit, 
  Search, 
  DollarSign, 
  Briefcase,
  Layers,
  FileText,
  Eye
} from 'lucide-react';
import StockCardModal from '../components/StockCardModal';

export default function Settings() {
  const { 
    medicaments, 
    addMedicament, 
    updateMedicament, 
    addAuditLog, 
    ajouterNotification 
  } = useStore();

  const [activeTab, setActiveTab] = useState<'generaux' | 'tarification'>('generaux');
  
  // Settings Tab State
  const [currency, setCurrency] = useState('XOF');
  const [backupStatus, setBackupStatus] = useState<'idle' | 'running' | 'success'>('idle');

  // Tarification Tab State
  const [searchTerm, setSearchTerm] = useState('');
  const [editingMed, setEditingMed] = useState<Medicament | null>(null);
  const [selectedStockCardMedId, setSelectedStockCardMedId] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [nom, setNom] = useState('');
  const [dci, setDci] = useState('');
  const [categorie, setCategorie] = useState('Antibiotique');
  const [forme, setForme] = useState('Comprimé');
  const [dosage, setDosage] = useState('');
  const [unite, setUnite] = useState('Boîte');
  const [prixVente, setPrixVente] = useState('');
  const [seuilAlerte, setSeuilAlerte] = useState('10');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addAuditLog('Paramètres modifiés', 'Mise à jour de la devise de facturation et des configurations système.');
    alert('Paramètres système enregistrés avec succès !');
  };

  const handleBackup = () => {
    setBackupStatus('running');
    setTimeout(() => {
      setBackupStatus('success');
      addAuditLog('Sauvegarde Système', 'Sauvegarde complète de la base de données effectuée.');
      setTimeout(() => setBackupStatus('idle'), 3000);
    }, 1500);
  };

  const resetForm = () => {
    setEditingMed(null);
    setCode('');
    setNom('');
    setDci('');
    setCategorie('Antibiotique');
    setForme('Comprimé');
    setDosage('');
    setUnite('Boîte');
    setPrixVente('');
    setSeuilAlerte('10');
  };

  const handleEditMed = (med: Medicament) => {
    setEditingMed(med);
    setCode(med.code);
    setNom(med.nom);
    setDci(med.dci);
    setCategorie(med.categorie);
    setForme(med.forme);
    setDosage(med.dosage);
    setUnite(med.unite);
    setPrixVente(med.prixVente.toString());
    setSeuilAlerte(med.seuilAlerte.toString());
  };

  const handleSubmitMedForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !nom || !prixVente) {
      alert('Veuillez remplir les champs obligatoires (Code, Nom, Prix de Vente).');
      return;
    }

    const medData = {
      code: code.toUpperCase().trim(),
      nom: nom.trim(),
      dci: dci.trim() || nom.trim(),
      categorie,
      forme,
      dosage: dosage.trim() || 'Unité',
      unite,
      prixVente: parseFloat(prixVente) || 0,
      seuilAlerte: parseInt(seuilAlerte) || 10
    };

    if (editingMed) {
      // Modify
      await updateMedicament(editingMed.id, medData);
      ajouterNotification('validation', `Médicament ${medData.nom} mis à jour avec succès.`);
      alert('Médicament mis à jour avec succès dans le catalogue !');
    } else {
      // Add
      // Check if code already exists to avoid duplication
      const exists = medicaments.some(m => m.code === medData.code);
      if (exists) {
        alert('Un médicament avec ce code existe déjà.');
        return;
      }

      await addMedicament(medData);
      ajouterNotification('validation', `Nouveau médicament ${medData.nom} ajouté à la tarification.`);
      alert('Médicament enregistré avec succès dans le catalogue !');
    }

    resetForm();
  };

  const filteredMeds = medicaments.filter(m =>
    m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.dci.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px' }}>
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary-blue)' }}>Paramètres Système</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Gérez les options générales de l'application et la tarification officielle des médicaments du centre.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('generaux')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'generaux' ? 'var(--primary-blue)' : 'var(--text-muted)',
            borderBottom: activeTab === 'generaux' ? '2px solid var(--primary-blue)' : '2px solid transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <SettingsIcon size={16} /> Configuration Générale
        </button>
        <button 
          onClick={() => setActiveTab('tarification')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'tarification' ? 'var(--primary-blue)' : 'var(--text-muted)',
            borderBottom: activeTab === 'tarification' ? '2px solid var(--primary-blue)' : '2px solid transparent',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <DollarSign size={16} /> Tarification Médicament
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'generaux' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
          <form onSubmit={handleSaveSettings} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SettingsIcon size={18} /> Configuration Générale
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Devise Principale</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'white' }}
                >
                  <option value="XOF">Franc CFA (BCEAO - FCFA)</option>
                  <option value="USD">Dollar Américain ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Langue d'Interface</label>
                <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'white' }}>
                  <option>Français (FR)</option>
                  <option>English (EN)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Seuil d'Alerte Expiration Par Défaut</label>
              <select style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'white' }}>
                <option>180 jours (6 mois)</option>
                <option>90 jours (3 mois)</option>
                <option>30 jours (1 mois)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} /> Enregistrer
            </button>
          </form>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '4px solid var(--accent-green)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} style={{ color: 'var(--accent-green)' }} /> Sécurité et Sauvegardes
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Assurez la pérennité de vos données de santé. Téléchargez une copie complète et sécurisée du schéma et des données.
            </p>

            <button 
              onClick={handleBackup} 
              disabled={backupStatus === 'running'}
              className="btn btn-success" 
              style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {backupStatus === 'running' ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Sauvegarde en cours...
                </>
              ) : backupStatus === 'success' ? (
                <>
                  Sauvegarde Réussie ! ✅
                </>
              ) : (
                <>
                  Créer une Sauvegarde Immédiate
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tarification Medicament Tab */}
      {activeTab === 'tarification' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Catalog & Pricing List */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Catalogue & Prix de Vente</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Liste officielle des médicaments dispensés par le centre avec leur tarification.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button 
                  onClick={resetForm}
                  className="btn btn-success"
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    boxShadow: 'var(--shadow-sm)',
                    backgroundColor: 'var(--accent-green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  <Plus size={14} /> Ajouter un produit
                </button>
                <div style={{ position: 'relative', width: '200px' }}>
                  <input 
                    type="text" 
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.5rem 0.4rem 2rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.85rem'
                    }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Code</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Commercial / DCI</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Catégorie</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Forme & Dosage</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Prix de Vente</th>
                    <th style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeds.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Aucun médicament trouvé dans le catalogue.
                      </td>
                    </tr>
                  ) : (
                    filteredMeds.map((med) => (
                      <tr key={med.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{med.code}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <div style={{ fontWeight: 600 }}>{med.nom}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.dci}</div>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span style={{
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: 'var(--primary-blue)',
                            fontWeight: 550
                          }}>
                            {med.categorie}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          {med.forme} ({med.dosage})
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--primary-blue)', textAlign: 'right' }}>
                          {med.prixVente.toLocaleString()} FCFA
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                            <button 
                              type="button"
                              onClick={() => setSelectedStockCardMedId(med.id)}
                              className="btn"
                              style={{ padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: '#F8FAFC', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              title="Visualiser la fiche de stock"
                            >
                              <Eye size={12} style={{ color: 'var(--primary-blue)' }} /> Visualiser
                            </button>
                            <button 
                              onClick={() => handleEditMed(med)}
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Edit size={12} /> Modifier
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pricing Config Form */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {editingMed ? <Edit size={18} style={{ color: 'var(--primary-blue)' }} /> : <Plus size={18} style={{ color: 'var(--accent-green)' }} />}
              {editingMed ? `Modifier : ${editingMed.nom}` : 'Ajouter un Médicament'}
            </h3>

            <form onSubmit={handleSubmitMedForm} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Code (ex: AMX500) *</label>
                  <input 
                    type="text" 
                    placeholder="Code médicament"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={!!editingMed}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: editingMed ? '#f3f4f6' : 'white' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Nom Commercial *</label>
                  <input 
                    type="text" 
                    placeholder="ex: Amoxicilline"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Nom DCI (Molécule)</label>
                <input 
                  type="text" 
                  placeholder="ex: Amoxicilline"
                  value={dci}
                  onChange={(e) => setDci(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Catégorie</label>
                  <select 
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'white' }}
                  >
                    <option value="Antibiotique">Antibiotique</option>
                    <option value="Analgésique">Analgésique</option>
                    <option value="Anti-inflammatoire">Anti-inflammatoire</option>
                    <option value="Antipaludéen">Antipaludéen</option>
                    <option value="Anti-infectieux">Anti-infectieux</option>
                    <option value="Cardiovasculaire">Cardiovasculaire</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Forme Galénique</label>
                  <select 
                    value={forme}
                    onChange={(e) => setForme(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)', backgroundColor: 'white' }}
                  >
                    <option value="Comprimé">Comprimé</option>
                    <option value="Gélule">Gélule</option>
                    <option value="Sirop">Sirop</option>
                    <option value="Injection">Injection</option>
                    <option value="Crème">Crème</option>
                    <option value="Flacon">Flacon</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Dosage (ex: 500mg)</label>
                  <input 
                    type="text" 
                    placeholder="Dosage"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Unité de Mesure</label>
                  <input 
                    type="text" 
                    placeholder="ex: Boîte de 30"
                    value={unite}
                    onChange={(e) => setUnite(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem', color: 'var(--primary-blue)' }}>Prix de Vente (FCFA) *</label>
                  <input 
                    type="number" 
                    placeholder="ex: 1500"
                    value={prixVente}
                    onChange={(e) => setPrixVente(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--primary-blue)', fontWeight: 600 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>Seuil d'Alerte Stock</label>
                  <input 
                    type="number" 
                    placeholder="ex: 10"
                    value={seuilAlerte}
                    onChange={(e) => setSeuilAlerte(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {editingMed ? <Save size={16} /> : <Plus size={16} />}
                  {editingMed ? 'Modifier le Produit' : 'Ajouter le Produit'}
                </button>
                {editingMed && (
                  <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ flex: 0.5 }}>
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedStockCardMedId && (
        <StockCardModal 
          medicamentId={selectedStockCardMedId} 
          onClose={() => setSelectedStockCardMedId(null)} 
        />
      )}
    </div>
  );
}
