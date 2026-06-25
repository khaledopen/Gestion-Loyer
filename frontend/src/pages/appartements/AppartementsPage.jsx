import { useState, useEffect } from 'react';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Plus, Home, MapPin, Maximize, CreditCard, Activity } from 'lucide-react';

const inputStyle = "w-full px-4 py-3 rounded-xl bg-background border border-border-light text-text-main placeholder-text-muted/50 focus:bg-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium";
const labelStyle = "block text-sm font-semibold text-text-main mb-1.5";
const sectionHeaderStyle = "text-xs font-bold text-primary uppercase tracking-widest mb-5 flex items-center gap-2";
const iconWrapperStyle = "p-1.5 rounded-md bg-primary/10 text-primary";

const AppartementsPage = () => {
  const [appartements, setAppartements] = useState([]);
  const [immeubles, setImmeubles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterImmeuble, setFilterImmeuble] = useState('');
  const [form, setForm] = useState({ numero: '', etage: 0, superficie: '', loyer_mensuel: '', statut: 'libre', description: '', immeuble_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); loadImmeubles(); }, []);

  const loadData = async (immeubleId = '') => {
    try {
      const params = immeubleId ? { immeuble_id: immeubleId } : {};
      const { data } = await api.get('/appartements', { params });
      setAppartements(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const loadImmeubles = async () => {
    try { const { data } = await api.get('/immeubles'); setImmeubles(data); } catch (e) { console.error(e); }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ numero: item.numero, etage: item.etage || 0, superficie: item.superficie || '', loyer_mensuel: item.loyer_mensuel, statut: item.statut, description: item.description || '', immeuble_id: item.immeuble_id });
    } else {
      setEditingItem(null);
      setForm({ numero: '', etage: 0, superficie: '', loyer_mensuel: '', statut: 'libre', description: '', immeuble_id: filterImmeuble || '' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      editingItem ? await api.put(`/appartements/${editingItem.id}`, form) : await api.post('/appartements', form);
      setModalOpen(false); loadData(filterImmeuble);
    } catch (error) { alert(error.response?.data?.message || 'Erreur'); } finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Supprimer l'appartement "${item.numero}" ?`)) {
      try { await api.delete(`/appartements/${item.id}`); loadData(filterImmeuble); } catch (e) { alert('Erreur'); }
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      // Create a payload with all existing properties but updated status
      const payload = {
        numero: item.numero,
        etage: item.etage,
        superficie: item.superficie,
        loyer_mensuel: item.loyer_mensuel,
        description: item.description,
        immeuble_id: item.immeuble_id,
        statut: newStatus
      };
      await api.put(`/appartements/${item.id}`, payload);
      loadData(filterImmeuble);
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la modification du statut');
    }
  };

  const fmt = (a) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(a || 0);
  const badge = (s) => {
    const c = { 
      libre: 'bg-success-light text-success border border-success/20', 
      occupe: 'bg-primary/10 text-primary border border-primary/20', 
      maintenance: 'bg-warning-light text-warning border border-warning/20' 
    };
    const l = { libre: 'Libre', occupe: 'Occupé', maintenance: 'Maintenance' };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${c[s] || c.libre}`}>{l[s] || s}</span>;
  };

  const columns = [
    { header: 'Numéro', render: (r) => <span className="font-semibold text-text-main">Apt. {r.numero}</span> },
    { header: 'Immeuble', key: 'immeuble_nom' },
    { header: 'Étage', key: 'etage' },
    { header: 'Superficie', render: (r) => r.superficie ? `${r.superficie} m²` : '—' },
    { header: 'Loyer', render: (r) => <span className="font-semibold text-text-main">{fmt(r.loyer_mensuel)}</span> },
    { 
      header: 'Statut', 
      render: (r) => (
        <select 
          value={r.statut} 
          onChange={(e) => handleStatusChange(r, e.target.value)}
          className={`px-2 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none transition-colors ${
            r.statut === 'libre' ? 'bg-success-light text-success border-success/20 hover:bg-success/20' : 
            r.statut === 'occupe' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : 
            'bg-warning-light text-warning border-warning/20 hover:bg-warning/30'
          }`}
        >
          <option value="libre">🟢 Libre</option>
          <option value="occupe">🔴 Occupé</option>
          <option value="maintenance">🟠 Maintenance</option>
        </select>
      ) 
    },
    { header: 'Locataire', render: (r) => r.locataire_nom ? `${r.locataire_prenom} ${r.locataire_nom}` : <span className="text-text-muted">—</span> },
  ];

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Appartements</h1>
          <p className="text-text-muted mt-1 text-sm">Gérez vos unités locatives</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterImmeuble} onChange={(e) => { setFilterImmeuble(e.target.value); loadData(e.target.value); }} className="px-4 py-2 rounded-lg bg-surface border border-border-light text-text-main text-sm focus:outline-none focus:border-secondary transition-colors">
            <option value="">Tous les immeubles</option>
            {immeubles.map(i => <option key={i.id} value={i.id}>{i.nom}</option>)}
          </select>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-sm">
            <Plus size={18} />
            <span>Ajouter</span>
          </button>
        </div>
      </div>
      <DataTable columns={columns} data={appartements} onEdit={openModal} onDelete={handleDelete} emptyMessage="Aucun appartement" />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? "Modifier l'appartement" : 'Nouvel appartement'} size="lg">
        <form onSubmit={handleSave} className="space-y-8 px-2 pb-2">
          
          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><MapPin size={14} strokeWidth={2.5} /></div>
              Localisation & Base
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelStyle}>Immeuble *</label>
                <select value={form.immeuble_id} onChange={(e) => setForm({...form, immeuble_id: e.target.value})} className={inputStyle} required>
                  <option value="">Sélectionner</option>
                  {immeubles.map(i => <option key={i.id} value={i.id}>{i.nom}</option>)}
                </select>
              </div>
              <div><label className={labelStyle}>Numéro *</label><input type="text" value={form.numero} onChange={(e) => setForm({...form, numero: e.target.value})} className={inputStyle} placeholder="Ex: A-1" required /></div>
            </div>
            <div className="mt-5"><label className={labelStyle}>Étage</label><input type="number" min="0" value={form.etage} onChange={(e) => setForm({...form, etage: e.target.value})} className={inputStyle} placeholder="0 (Rez-de-chaussée)" /></div>
          </div>

          <hr className="border-border-light" />

          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><Maximize size={14} strokeWidth={2.5} /></div>
              Caractéristiques
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelStyle}>Superficie (m²)</label>
                <input type="number" step="0.01" value={form.superficie} onChange={(e) => setForm({...form, superficie: e.target.value})} className={inputStyle} placeholder="Ex: 50.5" />
              </div>
              <div>
                <label className={labelStyle}>Loyer (XOF) *</label>
                <div className="relative">
                  <input type="number" value={form.loyer_mensuel} onChange={(e) => setForm({...form, loyer_mensuel: e.target.value})} className={inputStyle} placeholder="0" required />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">CFA</span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border-light" />

          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><Activity size={14} strokeWidth={2.5} /></div>
              Statut
            </h3>
            <select value={form.statut} onChange={(e) => setForm({...form, statut: e.target.value})} className={inputStyle}>
              <option value="libre">🟢 Libre</option>
              <option value="occupe">🔴 Occupé</option>
              <option value="maintenance">🟠 En Maintenance</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border-light">
            <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-xl bg-background text-text-main border border-border-light hover:bg-border-light/50 transition-colors font-semibold">Annuler</button>
            <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50">{saving ? 'Enregistrement...' : 'Valider'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AppartementsPage;
