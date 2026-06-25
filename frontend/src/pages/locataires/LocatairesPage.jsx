import { useState, useEffect } from 'react';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import RiskDashboard from '../../components/RiskDashboard';
import { Plus, Search, User, Phone, Home } from 'lucide-react';

const inputStyle = "w-full px-4 py-3 rounded-xl bg-background border border-border-light text-text-main placeholder-text-muted/50 focus:bg-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium";
const labelStyle = "block text-sm font-semibold text-text-main mb-1.5";
const sectionHeaderStyle = "text-xs font-bold text-primary uppercase tracking-widest mb-5 flex items-center gap-2";
const iconWrapperStyle = "p-1.5 rounded-md bg-primary/10 text-primary";

const LocatairesPage = () => {
  const [locataires, setLocataires] = useState([]);
  const [filteredLocataires, setFilteredLocataires] = useState([]);
  const [appartements, setAppartements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [form, setForm] = useState({ nom: '', prenom: '', telephone: '', cin: '', appartement_id: '', date_entree: '', actif: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); loadAppartements(); }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLocataires(locataires);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = locataires.filter(l => 
      (l.nom && l.nom.toLowerCase().includes(q)) ||
      (l.prenom && l.prenom.toLowerCase().includes(q)) ||
      (l.telephone && l.telephone.includes(q)) ||
      (l.cin && l.cin.toLowerCase().includes(q))
    );
    setFilteredLocataires(filtered);
  }, [searchQuery, locataires]);

  const loadData = async () => {
    try { 
      const { data } = await api.get('/locataires'); 
      setLocataires(data);
      setFilteredLocataires(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const loadAppartements = async () => {
    try { const { data } = await api.get('/appartements'); setAppartements(data); } catch (e) { console.error(e); }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ nom: item.nom, prenom: item.prenom, telephone: item.telephone || '', cin: item.cin || '', appartement_id: item.appartement_id || '', date_entree: item.date_entree?.split('T')[0] || '', actif: item.actif });
    } else {
      setEditingItem(null);
      setForm({ nom: '', prenom: '', telephone: '', cin: '', appartement_id: '', date_entree: new Date().toISOString().split('T')[0], actif: true });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, appartement_id: form.appartement_id || null };
      editingItem ? await api.put(`/locataires/${editingItem.id}`, payload) : await api.post('/locataires', payload);
      setModalOpen(false); loadData(); loadAppartements();
    } catch (error) { alert(error.response?.data?.message || 'Erreur'); } finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Supprimer le locataire "${item.prenom} ${item.nom}" ?`)) {
      try { await api.delete(`/locataires/${item.id}`); loadData(); loadAppartements(); } catch (e) { alert('Erreur'); }
    }
  };

  const columns = [
    { header: 'Locataire', render: (r) => <span className="font-semibold text-text-main">{r.prenom} {r.nom}</span> },
    { header: 'Téléphone', key: 'telephone', render: (r) => r.telephone ? <span className="text-text-muted">{r.telephone}</span> : '—' },
    { header: 'CIN', key: 'cin', render: (r) => r.cin ? <span className="uppercase text-text-muted">{r.cin}</span> : '—' },
    { header: 'Appartement', render: (r) => r.appartement_numero ? <span className="text-text-main">{r.immeuble_nom} — Apt. {r.appartement_numero}</span> : <span className="text-text-muted">Non assigné</span> },
    { header: 'Loyer', render: (r) => r.loyer_mensuel ? <span className="font-medium text-text-main">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(r.loyer_mensuel)}</span> : '—' },
    { header: 'Statut', render: (r) => <span className={`px-2 py-1 rounded text-xs font-medium border ${r.actif ? 'bg-success-light text-success border-success/20' : 'bg-danger-light text-danger border-danger/20'}`}>{r.actif ? 'Actif' : 'Inactif'}</span> },
  ];

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Locataires</h1>
          <p className="text-text-muted mt-1 text-sm">Gérez vos locataires et leurs informations</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Rechercher (Nom, Téléphone, CIN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg bg-surface border border-border-light text-text-main text-sm focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          <button onClick={() => openModal()} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-sm whitespace-nowrap">
            <Plus size={18} />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
        </div>
      </div>
      
      <div className="w-full overflow-hidden space-y-12">
        
        {/* Section 1: Dashboard des Risques */}
        <div>
          <RiskDashboard />
        </div>

        <hr className="border-border-light" />

        {/* Section 2: Liste classique des locataires */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
              <User className="text-primary" size={24} />
              Annuaire des Locataires
            </h2>
          </div>
          <DataTable columns={columns} data={filteredLocataires} onEdit={openModal} onDelete={handleDelete} emptyMessage="Aucun locataire trouvé" />
        </div>

      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Modifier le locataire' : 'Nouveau locataire'} size="lg">
        <form onSubmit={handleSave} className="space-y-8 px-2 pb-2">
          
          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><User size={14} strokeWidth={2.5} /></div>
              Identité
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><label className={labelStyle}>Prénom *</label><input type="text" value={form.prenom} onChange={(e) => setForm({...form, prenom: e.target.value})} className={inputStyle} placeholder="Ex: Jean" required /></div>
              <div><label className={labelStyle}>Nom *</label><input type="text" value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} className={inputStyle} placeholder="Ex: Dupont" required /></div>
            </div>
          </div>

          <hr className="border-border-light" />

          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><Phone size={14} strokeWidth={2.5} /></div>
              Coordonnées & Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div><label className={labelStyle}>Téléphone *</label><input type="tel" value={form.telephone} onChange={(e) => setForm({...form, telephone: e.target.value})} className={inputStyle} placeholder="+225 00 00 00 00" required /></div>
              <div><label className={labelStyle}>N° CIN</label><input type="text" value={form.cin} onChange={(e) => setForm({...form, cin: e.target.value})} className={inputStyle} placeholder="N° Pièce d'identité" /></div>
            </div>
          </div>

          <hr className="border-border-light" />

          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><Home size={14} strokeWidth={2.5} /></div>
              Logement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelStyle}>Appartement</label>
                <select value={form.appartement_id} onChange={(e) => setForm({...form, appartement_id: e.target.value})} className={inputStyle}>
                  <option value="">Sélectionner</option>
                  {appartements.filter(a => a.statut === 'libre' || a.id == form.appartement_id).map(a => <option key={a.id} value={a.id}>{a.immeuble_nom} — Apt. {a.numero}</option>)}
                </select>
              </div>
              <div>
                <label className={labelStyle}>Date d'entrée</label>
                <input type="date" value={form.date_entree} onChange={(e) => setForm({...form, date_entree: e.target.value})} className={inputStyle} />
              </div>
            </div>
          </div>

          {editingItem && (
            <>
              <hr className="border-border-light" />
              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" id="actif" checked={form.actif} onChange={(e) => setForm({...form, actif: e.target.checked})} className="w-5 h-5 rounded border-border-light text-primary focus:ring-primary shadow-sm" />
                <label htmlFor="actif" className="text-sm font-bold text-text-main cursor-pointer">Locataire actif (contrat en cours)</label>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border-light">
            <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-xl bg-background text-text-main border border-border-light hover:bg-border-light/50 transition-colors font-semibold">Annuler</button>
            <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50">{saving ? 'Enregistrement...' : 'Valider'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LocatairesPage;
