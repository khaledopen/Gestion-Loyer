import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Plus, Building, MapPin, AlignLeft } from 'lucide-react';

const inputStyle = "w-full px-4 py-3 rounded-xl bg-background border border-border-light text-text-main placeholder-text-muted/50 focus:bg-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium";
const labelStyle = "block text-sm font-semibold text-text-main mb-1.5";
const sectionHeaderStyle = "text-xs font-bold text-primary uppercase tracking-widest mb-5 flex items-center gap-2";
const iconWrapperStyle = "p-1.5 rounded-md bg-primary/10 text-primary";

const ImmeublesPage = () => {
  const [immeubles, setImmeubles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ nom: '', adresse: '', ville: '', description: '', nombre_etages: 1 });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data } = await api.get('/immeubles');
      setImmeubles(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ nom: item.nom, adresse: item.adresse, ville: item.ville, description: item.description || '', nombre_etages: item.nombre_etages || 1 });
    } else {
      setEditingItem(null);
      setForm({ nom: '', adresse: '', ville: '', description: '', nombre_etages: 1 });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingItem) {
        await api.put(`/immeubles/${editingItem.id}`, form);
      } else {
        await api.post('/immeubles', form);
      }
      setModalOpen(false);
      loadData();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Supprimer l'immeuble "${item.nom}" ? Cette action est irréversible.`)) {
      try {
        await api.delete(`/immeubles/${item.id}`);
        loadData();
      } catch (error) {
        alert(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const columns = [
    { header: 'Nom', key: 'nom', render: (row) => <span className="font-semibold text-primary">{row.nom}</span> },
    { header: 'Adresse', key: 'adresse' },
    { header: 'Ville', key: 'ville' },
    { header: 'Étages', key: 'nombre_etages' },
    { header: 'Appartements', key: 'nombre_appartements', render: (row) => (
      <span className="px-2.5 py-1 rounded bg-background border border-border-light text-text-main text-xs font-medium">
        {row.nombre_appartements || 0}
      </span>
    )},
    { header: 'Locataires', key: 'nombre_locataires', render: (row) => (
      <span className="px-2.5 py-1 rounded bg-success-light text-success text-xs font-medium">
        {row.nombre_locataires || 0}
      </span>
    )},
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Immeubles</h1>
          <p className="text-text-muted mt-1 text-sm">Gérez vos biens immobiliers</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-sm">
          <Plus size={18} />
          <span>Ajouter</span>
        </button>
      </div>

      <DataTable columns={columns} data={immeubles} onView={(item) => navigate(`/immeubles/${item.id}`)} onEdit={openModal} onDelete={handleDelete} emptyMessage="Aucun immeuble enregistré" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Modifier l\'immeuble' : 'Nouvel immeuble'}>
        <form onSubmit={handleSave} className="space-y-8 px-2 pb-2">
          
          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><Building size={14} strokeWidth={2.5} /></div>
              Informations générales
            </h3>
            <div>
              <label className={labelStyle}>Nom de l'immeuble *</label>
              <input type="text" value={form.nom} onChange={(e) => setForm({...form, nom: e.target.value})} className={inputStyle} placeholder="Ex: Résidence Les Palmiers" required />
            </div>
          </div>

          <hr className="border-border-light" />

          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><MapPin size={14} strokeWidth={2.5} /></div>
              Localisation
            </h3>
            <div className="space-y-5">
              <div>
                <label className={labelStyle}>Adresse *</label>
                <input type="text" value={form.adresse} onChange={(e) => setForm({...form, adresse: e.target.value})} className={inputStyle} placeholder="Adresse complète de l'immeuble" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelStyle}>Ville *</label>
                  <input type="text" value={form.ville} onChange={(e) => setForm({...form, ville: e.target.value})} className={inputStyle} placeholder="Ex: Abidjan" required />
                </div>
                <div>
                  <label className={labelStyle}>Nombre d'étages</label>
                  <input type="number" min="1" value={form.nombre_etages} onChange={(e) => setForm({...form, nombre_etages: e.target.value})} className={inputStyle} placeholder="Ex: 4" />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border-light" />

          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><AlignLeft size={14} strokeWidth={2.5} /></div>
              Détails supplémentaires
            </h3>
            <div>
              <label className={labelStyle}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} className={`${inputStyle} resize-none`} placeholder="Notes, particularités ou consignes concernant cet immeuble..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border-light">
            <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-xl bg-background text-text-main border border-border-light hover:bg-border-light/50 transition-colors font-semibold">Annuler</button>
            <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ImmeublesPage;
