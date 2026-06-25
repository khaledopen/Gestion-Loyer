import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Plus, Wrench, MapPin, CheckCircle2, Search, Info, Printer, Download, FileText, Filter } from 'lucide-react';

const inputStyle = "w-full px-4 py-3 rounded-xl bg-background border border-border-light text-text-main placeholder-text-muted/50 focus:bg-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium";
const labelStyle = "block text-sm font-semibold text-text-main mb-1.5";
const sectionHeaderStyle = "text-xs font-bold text-primary uppercase tracking-widest mb-5 flex items-center gap-2";
const iconWrapperStyle = "p-1.5 rounded-md bg-primary/10 text-primary";

const ReparationsPage = () => {
  const [reparations, setReparations] = useState([]);
  const [immeubles, setImmeubles] = useState([]);
  const [appartements, setAppartements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [pdfModal, setPdfModal] = useState({ isOpen: false, reparation: null });
  
  // Filters
  const [filterStatut, setFilterStatut] = useState('');
  
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  
  const [form, setForm] = useState({ description: '', cout: '', date_reparation: '', statut: 'en_cours', categorie: '', appartement_id: '', immeuble_id: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); loadImmeubles(); loadAppartements(); }, []);

  const loadData = async () => {
    try { const { data } = await api.get('/reparations'); setReparations(data); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const loadImmeubles = async () => {
    try { const { data } = await api.get('/immeubles'); setImmeubles(data); } catch (e) {}
  };
  const loadAppartements = async () => {
    try { const { data } = await api.get('/appartements'); setAppartements(data); } catch (e) {}
  };

  const fmt = (a) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(a || 0);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ description: item.description, cout: item.cout, date_reparation: item.date_reparation?.split('T')[0], statut: item.statut, categorie: item.categorie || '', appartement_id: item.appartement_id || '', immeuble_id: item.immeuble_id || '', notes: item.notes || '' });
    } else {
      setEditingItem(null);
      setForm({ description: '', cout: '', date_reparation: new Date().toISOString().split('T')[0], statut: 'en_cours', categorie: '', appartement_id: '', immeuble_id: '', notes: '' });
    }
    setModalOpen(true);
  };

  const openDetails = (item) => {
    setViewingItem(item);
    setDetailsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, appartement_id: form.appartement_id || null, immeuble_id: form.immeuble_id || null };
      editingItem ? await api.put(`/reparations/${editingItem.id}`, payload) : await api.post('/reparations', payload);
      setModalOpen(false); loadData();
    } catch (error) { alert(error.response?.data?.message || 'Erreur'); } finally { setSaving(false); }
  };

  const updateStatut = async (newStatut) => {
    if (!viewingItem) return;
    try {
      await api.put(`/reparations/${viewingItem.id}`, { ...viewingItem, statut: newStatut });
      setViewingItem({ ...viewingItem, statut: newStatut });
      loadData();
    } catch (error) {
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm('Supprimer cette réparation ?')) {
      try { await api.delete(`/reparations/${item.id}`); loadData(); } catch (e) { alert('Erreur'); }
    }
  };

  const handleGeneratePdf = (action) => {
    const data = pdfModal.reparation;
    if (!data) return;

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // En-tête
      doc.setFillColor(30, 58, 138); // primary color
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text("FICHE D'INTERVENTION", 105, 25, { align: 'center' });

      doc.setTextColor(0, 0, 0);
      
      let y = 60;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("DÉTAILS DE L'INTERVENTION", 20, y);
      y += 10;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      doc.text(`Date : ${new Date(data.date_reparation).toLocaleDateString('fr-FR')}`, 20, y); y += 8;
      doc.text(`Catégorie : ${data.categorie || 'Générale'}`, 20, y); y += 8;
      doc.text(`Statut : ${data.statut === 'en_cours' ? 'En cours' : data.statut === 'terminee' ? 'Terminée' : 'Annulée'}`, 20, y); y += 8;
      
      const pdfFmt = (a) => Number(a || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
      doc.text(`Coût : ${pdfFmt(data.cout)}`, 20, y); y += 15;

      doc.setFont(undefined, 'bold');
      doc.text("LOCALISATION", 20, y); y += 10;
      doc.setFont(undefined, 'normal');
      if (data.appartement_numero) {
         doc.text(`Immeuble : ${data.immeuble_nom}`, 20, y); y += 8;
         doc.text(`Appartement : Apt. ${data.appartement_numero}`, 20, y); y += 15;
      } else if (data.immeuble_nom) {
         doc.text(`Immeuble : ${data.immeuble_nom} (Parties communes)`, 20, y); y += 15;
      } else {
         doc.text("Localisation : Générale", 20, y); y += 15;
      }

      doc.setFont(undefined, 'bold');
      doc.text("DESCRIPTION", 20, y); y += 10;
      doc.setFont(undefined, 'normal');
      const splitDesc = doc.splitTextToSize(data.description || 'Aucune description', 170);
      doc.text(splitDesc, 20, y);
      
      y += (splitDesc.length * 6) + 30;

      doc.setFont(undefined, 'bold');
      doc.text("Signature du Responsable", 140, y);

      if (action === 'print') {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
      } else {
        doc.save(`fiche_intervention_${data.id}.pdf`);
      }
      
      setPdfModal({ isOpen: false, reparation: null });
    } catch (error) { 
      alert('Erreur lors de la génération du PDF'); 
      console.error(error); 
    }
  };

  const statutBadge = (s) => {
    const c = { 
      en_cours: 'bg-warning-light text-warning border-warning/20', 
      terminee: 'bg-success-light text-success border-success/20', 
      annulee: 'bg-danger-light text-danger border-danger/20' 
    };
    const l = { en_cours: 'En cours', terminee: 'Terminée', annulee: 'Annulée' };
    return <span className={`px-2.5 py-1 border rounded-md text-xs font-semibold ${c[s] || c.en_cours}`}>{l[s] || s}</span>;
  };

  const columns = [
    { header: 'Description', render: (r) => <span className="font-medium text-text-main max-w-xs truncate block" title={r.description}>{r.description}</span> },
    { header: 'Lieu', render: (r) => r.appartement_numero ? `${r.immeuble_nom} — Apt. ${r.appartement_numero}` : r.immeuble_nom || '—' },
    { header: 'Catégorie', render: (r) => <span className="text-text-muted capitalize">{r.categorie || '—'}</span> },
    { header: 'Coût', render: (r) => <span className="font-bold text-text-main">{fmt(r.cout)}</span> },
    { header: 'Date', render: (r) => new Date(r.date_reparation).toLocaleDateString('fr-FR') },
    { header: 'Statut', render: (r) => statutBadge(r.statut) },
  ];

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  const filteredReparations = reparations.filter(r => filterStatut ? r.statut === filterStatut : true);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Réparations & Maintenance</h1>
          <p className="text-text-muted mt-1 text-sm">Suivi des dépenses et interventions</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
          <Plus size={18} />
          <span>Nouvelle intervention</span>
        </button>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-border-light flex flex-col sm:flex-row items-center gap-4 card-shadow">
        <div className="flex items-center gap-2 text-text-muted font-semibold w-full sm:w-auto">
          <Filter size={18} /> Filtres :
        </div>
        <select 
          value={filterStatut} 
          onChange={(e) => setFilterStatut(e.target.value)} 
          className="w-full sm:w-48 px-4 py-2 rounded-lg bg-background border border-border-light text-text-main focus:outline-none focus:border-primary transition-colors font-medium"
        >
          <option value="">Tous les statuts</option>
          <option value="en_cours">⏳ En cours</option>
          <option value="terminee">✅ Terminée</option>
          <option value="annulee">❌ Annulée</option>
        </select>
      </div>

      <div className="w-full overflow-hidden">
        <DataTable columns={columns} data={filteredReparations} onEdit={openModal} onDelete={handleDelete} onView={openDetails} emptyMessage="Aucune réparation enregistrée" />
      </div>

      {/* MODAL AJOUT/MODIFICATION */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? 'Modifier l\'intervention' : 'Nouvelle intervention'} size="lg">
        <form onSubmit={handleSave} className="space-y-8 px-2 pb-2">
          
          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><Wrench size={14} strokeWidth={2.5} /></div>
              Détails de l'intervention
            </h3>
            <div className="space-y-5">
              <div>
                <label className={labelStyle}>Description complète *</label>
                <textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={2} className={`${inputStyle} resize-none`} placeholder="Décrivez l'intervention de manière détaillée..." required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className={labelStyle}>Coût (XOF) *</label>
                  <div className="relative">
                    <input type="number" value={form.cout} onChange={(e) => setForm({...form, cout: e.target.value})} className={inputStyle} placeholder="0" required />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">CFA</span>
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>Date de l'intervention *</label>
                  <input type="date" value={form.date_reparation} onChange={(e) => setForm({...form, date_reparation: e.target.value})} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Catégorie</label>
                  <input type="text" value={form.categorie} onChange={(e) => setForm({...form, categorie: e.target.value})} className={inputStyle} placeholder="Ex: Plomberie" />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border-light" />

          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><MapPin size={14} strokeWidth={2.5} /></div>
              Localisation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelStyle}>Immeuble concerné</label>
                <select value={form.immeuble_id} onChange={(e) => setForm({...form, immeuble_id: e.target.value})} className={inputStyle}>
                  <option value="">Général (Aucun immeuble)</option>
                  {immeubles.map(i => <option key={i.id} value={i.id}>{i.nom}</option>)}
                </select>
              </div>
              <div>
                <label className={labelStyle}>Appartement concerné</label>
                <select value={form.appartement_id} onChange={(e) => setForm({...form, appartement_id: e.target.value})} className={inputStyle} disabled={!form.immeuble_id && appartements.length === 0}>
                  <option value="">Général (Parties communes)</option>
                  {appartements.filter(a => !form.immeuble_id || a.immeuble_id == form.immeuble_id).map(a => <option key={a.id} value={a.id}>{a.immeuble_nom} — Apt. {a.numero}</option>)}
                </select>
              </div>
            </div>
          </div>

          <hr className="border-border-light" />

          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><CheckCircle2 size={14} strokeWidth={2.5} /></div>
              Statut
            </h3>
            <select value={form.statut} onChange={(e) => setForm({...form, statut: e.target.value})} className={inputStyle}>
              <option value="en_cours">⏳ En cours de traitement</option>
              <option value="terminee">✅ Terminée</option>
              <option value="annulee">❌ Annulée</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border-light">
            <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-xl bg-background text-text-main border border-border-light hover:bg-border-light/50 transition-colors font-semibold">Annuler</button>
            <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50">{saving ? 'Enregistrement...' : 'Valider'}</button>
          </div>
        </form>
      </Modal>

      {/* MODAL DETAILS REPARATION */}
      <Modal isOpen={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="Détails de la réparation" size="md">
        {viewingItem && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border-light pb-4">
              <h2 className="text-xl font-bold text-text-main">{viewingItem.categorie || 'Intervention'}</h2>
              {statutBadge(viewingItem.statut)}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-text-muted mb-1.5">Description</p>
                <p className="text-text-main bg-background p-4 rounded-xl border border-border-light">{viewingItem.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background p-4 rounded-xl border border-border-light">
                  <p className="text-xs font-semibold text-text-muted mb-1.5 flex items-center gap-1.5"><MapPin size={14} /> Localisation</p>
                  <p className="text-sm font-bold text-text-main">
                    {viewingItem.appartement_numero ? `${viewingItem.immeuble_nom} — Apt. ${viewingItem.appartement_numero}` : viewingItem.immeuble_nom || 'Non spécifiée'}
                  </p>
                </div>
                <div className="bg-background p-4 rounded-xl border border-border-light">
                  <p className="text-xs font-semibold text-text-muted mb-1.5 flex items-center gap-1.5"><Wrench size={14} /> Coût & Date</p>
                  <p className="text-sm font-black text-danger">{fmt(viewingItem.cout)}</p>
                  <p className="text-xs font-medium text-text-muted mt-1">{new Date(viewingItem.date_reparation).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-border-light mt-6">
                <label className="block text-sm font-bold text-text-main mb-2">Mettre à jour le statut :</label>
                <select 
                  value={viewingItem.statut} 
                  onChange={(e) => updateStatut(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border-light text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-semibold"
                >
                  <option value="en_cours">⏳ En cours</option>
                  <option value="terminee">✅ Terminée</option>
                  <option value="annulee">❌ Annulée</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-border-light mt-6">
              <button onClick={() => setPdfModal({ isOpen: true, reparation: viewingItem })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors font-semibold">
                <FileText size={18} />
                Générer la Fiche
              </button>
              <button onClick={() => setDetailsModalOpen(false)} className="px-6 py-2.5 rounded-xl bg-background text-text-main border border-border-light hover:bg-border-light/50 transition-colors font-semibold">Fermer</button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL IMPRESSION / TELECHARGEMENT */}
      <Modal isOpen={pdfModal.isOpen} onClose={() => setPdfModal({ isOpen: false, reparation: null })} title="Fiche de Réparation" size="sm">
        <div className="space-y-4 px-2 pb-2">
          <p className="text-text-muted text-sm text-center mb-6">Que souhaitez-vous faire avec cette fiche d'intervention ?</p>
          <div className="flex gap-4">
            <button onClick={() => handleGeneratePdf('print')} className="flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border-light hover:border-primary hover:bg-primary/5 transition-all group">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform"><Printer size={24} /></div>
              <span className="font-semibold text-text-main">Imprimer</span>
            </button>
            <button onClick={() => handleGeneratePdf('download')} className="flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-border-light hover:border-secondary hover:bg-secondary/5 transition-all group">
              <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform"><Download size={24} /></div>
              <span className="font-semibold text-text-main">Télécharger</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReparationsPage;
