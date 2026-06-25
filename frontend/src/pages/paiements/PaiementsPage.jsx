import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import api from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Plus, FileText, Search, CreditCard, User, CalendarDays, Printer, Download, XCircle } from 'lucide-react';

const inputStyle = "w-full px-4 py-3 rounded-xl bg-background border border-border-light text-text-main placeholder-text-muted/50 focus:bg-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium";
const labelStyle = "block text-sm font-semibold text-text-main mb-1.5";
const sectionHeaderStyle = "text-xs font-bold text-primary uppercase tracking-widest mb-5 flex items-center gap-2";
const iconWrapperStyle = "p-1.5 rounded-md bg-primary/10 text-primary";

const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const PaiementsPage = () => {
  const [paiements, setPaiements] = useState([]);
  const [filteredPaiements, setFilteredPaiements] = useState([]);
  const [locataires, setLocataires] = useState([]);
  const [locatairesARisque, setLocatairesARisque] = useState(new Set());
  const [impayesData, setImpayesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pdfModal, setPdfModal] = useState({ isOpen: false, paiement: null });
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterImmeuble, setFilterImmeuble] = useState('');
  const [filterMois, setFilterMois] = useState('');
  const [filterAnnee, setFilterAnnee] = useState('');
  const [immeubles, setImmeubles] = useState([]);
  
  const [form, setForm] = useState({ locataire_id: '', appartement_id: '', montant: '', date_paiement: '', mois_concerne: '', annee_concernee: new Date().getFullYear(), methode_paiement: 'especes', reference: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); loadLocataires(); loadImmeubles(); }, []);

  useEffect(() => {
    let filtered = paiements;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.locataire_nom && p.locataire_nom.toLowerCase().includes(q)) ||
        (p.locataire_prenom && p.locataire_prenom.toLowerCase().includes(q)) ||
        (p.immeuble_nom && p.immeuble_nom.toLowerCase().includes(q)) ||
        (p.reference && p.reference.toLowerCase().includes(q))
      );
    }

    if (filterImmeuble) {
      filtered = filtered.filter(p => p.immeuble_nom === filterImmeuble);
    }

    if (filterMois) {
      filtered = filtered.filter(p => p.mois_concerne == filterMois);
    }

    if (filterAnnee) {
      filtered = filtered.filter(p => p.annee_concernee == filterAnnee);
    }

    setFilteredPaiements(filtered);
  }, [searchQuery, filterImmeuble, filterMois, filterAnnee, paiements]);

  const loadData = async () => {
    try { 
      const { data } = await api.get('/paiements'); 
      setPaiements(data); 
      setFilteredPaiements(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const loadLocataires = async () => {
    try { 
      const [locRes, impayesRes] = await Promise.all([
        api.get('/locataires'),
        api.get('/paiements/impayes')
      ]);
      setLocataires(locRes.data.filter(l => l.actif)); 
      setImpayesData(impayesRes.data);
      setLocatairesARisque(new Set(impayesRes.data.map(i => i.locataire_id)));
    } catch (e) { console.error(e); }
  };
  const loadImmeubles = async () => {
    try { const { data } = await api.get('/immeubles'); setImmeubles(data); } catch (e) { console.error(e); }
  };

  const fmt = (a) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(a || 0);

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({ locataire_id: item.locataire_id, appartement_id: item.appartement_id, montant: item.montant, date_paiement: item.date_paiement?.split('T')[0], mois_concerne: item.mois_concerne, annee_concernee: item.annee_concernee, methode_paiement: item.methode_paiement, reference: item.reference || '', notes: item.notes || '' });
    } else {
      setEditingItem(null);
      setForm({ locataire_id: '', appartement_id: '', montant: '', date_paiement: new Date().toISOString().split('T')[0], mois_concerne: new Date().getMonth() + 1, annee_concernee: new Date().getFullYear(), methode_paiement: 'especes', reference: '', notes: '' });
    }
    setModalOpen(true);
  };

  const handleLocataireChange = (locId) => {
    const loc = locataires.find(l => l.id == locId);
    const locImpayes = impayesData.filter(i => i.locataire_id == locId);
    
    const defaultMontant = locImpayes.length > 0 ? locImpayes[0].montant_du : loc?.loyer_mensuel;
    const defaultMois = locImpayes.length > 0 ? locImpayes[0].mois : form.mois_concerne;
    const defaultAnnee = locImpayes.length > 0 ? locImpayes[0].annee : form.annee_concernee;
    
    setForm({ 
      ...form, 
      locataire_id: locId, 
      appartement_id: loc?.appartement_id || '', 
      montant: defaultMontant || form.montant,
      mois_concerne: defaultMois,
      annee_concernee: defaultAnnee
    });
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, appartement_id: form.appartement_id || null };
      await api.post('/paiements', payload);
      setModalOpen(false); loadData();
    } catch (error) { alert(error.response?.data?.message || 'Erreur'); } finally { setSaving(false); }
  };

  const handleCancel = async (item) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler ce paiement ? Cette action est irréversible.')) {
      try { await api.delete(`/paiements/${item.id}`); loadData(); } catch (e) { alert('Erreur lors de l\'annulation'); }
    }
  };

  const numberToFrench = (n) => {
    if (n === 0) return "zéro";
    const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
    const tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];
    const convertLess100 = (n) => {
      if (n < 20) return units[n];
      const t = Math.floor(n / 10);
      const u = n % 10;
      if (t === 7 || t === 9) return tens[t - 1] + (u === 1 && t === 7 ? " et " : "-") + units[10 + u];
      return tens[t] + (u === 1 ? " et un" : u > 0 ? "-" + units[u] : "");
    };
    const convertLess1000 = (n) => {
      const c = Math.floor(n / 100);
      const r = n % 100;
      let res = "";
      if (c === 1) res = "cent";
      else if (c > 1) res = units[c] + " cent" + (r === 0 ? "s" : "");
      if (r > 0) res += (res ? " " : "") + convertLess100(r);
      return res;
    };
    let res = "";
    const m = Math.floor(n / 1000000);
    n = n % 1000000;
    const k = Math.floor(n / 1000);
    n = n % 1000;
    if (m > 0) res += convertLess1000(m) + " million" + (m > 1 ? "s " : " ");
    if (k === 1) res += "mille ";
    else if (k > 1) res += convertLess1000(k) + " mille ";
    if (n > 0) res += convertLess1000(n);
    return res.trim();
  };

  const handlePdfAction = async (action) => {
    try {
      const paiement = pdfModal.paiement;
      const { data } = await api.get(`/paiements/${paiement.id}`);
      
      const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
      const blueColor = [30, 144, 255]; // Bleu ciel / royal
      
      const drawHalf = (offsetX) => {
        // Titre
        doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('QUITTANCE DE LOYER', offsetX + 74.25, 30, { align: 'center' });
        
        // Soulignement titre
        doc.setLineWidth(0.8);
        doc.setDrawColor(blueColor[0], blueColor[1], blueColor[2]);
        doc.line(offsetX + 40, 32, offsetX + 108.5, 32);

        doc.setFontSize(11);
        let y = 50;
        
        // Ligne de pointillés helpers
        const drawDottedLine = (x1, yPos, x2) => {
          doc.setLineDash([1, 1], 0);
          doc.line(offsetX + x1, yPos, offsetX + x2, yPos);
          doc.setLineDash([]);
        };

        // LOCATAIRE
        doc.text('LOCATAIRE', offsetX + 15, y);
        doc.text(`${data.locataire_prenom} ${data.locataire_nom}`, offsetX + 45, y - 1);
        drawDottedLine(42, y, 135);
        
        y += 15;
        // VERSE LA SOMME DE (Chiffre)
        doc.text('VERSE LA SOMME DE', offsetX + 15, y);
        const pdfFmt = (a) => Number(a || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
        doc.text(pdfFmt(data.montant), offsetX + 65, y - 1);
        drawDottedLine(60, y, 135);
        y += 4;
        doc.setFontSize(9);
        doc.text('(EN CHIFFRE)', offsetX + 97.5, y, { align: 'center' });
        doc.setFontSize(11);
        
        y += 12;
        // VERSE LA SOMME DE (Lettres)
        const montantLettres = numberToFrench(data.montant).toUpperCase() + ' FRANCS CFA';
        doc.text(montantLettres, offsetX + 30, y - 1);
        drawDottedLine(15, y, 135);
        y += 4;
        doc.setFontSize(9);
        doc.text('(EN LETTRE)', offsetX + 75, y, { align: 'center' });
        doc.setFontSize(11);
        
        y += 15;
        // POUR LE LOYER DU MOIS D...
        doc.text('POUR LE LOYER DU MOIS D\'', offsetX + 15, y);
        const moisAnnee = `'${MOIS_NOMS[data.mois_concerne - 1].toUpperCase()} ${data.annee_concernee}`;
        doc.text(moisAnnee, offsetX + 70, y - 1);
        drawDottedLine(68, y, 135);

        y += 15;
        // MAISON SISE A
        doc.text('MAISON SISE A', offsetX + 15, y);
        doc.text(`${data.immeuble_adresse} (Apt ${data.appartement_numero})`, offsetX + 48, y - 1);
        drawDottedLine(45, y, 135);

        y += 15;
        // DATE
        doc.text('DATE', offsetX + 15, y);
        doc.text(new Date(data.date_paiement).toLocaleDateString('fr-FR'), offsetX + 30, y - 1);
        drawDottedLine(28, y, 135);

        y += 20;
        // Signature
        doc.setFontSize(14);
        doc.setFont(undefined, 'italic');
        doc.text('Nom et Signature du Propriétaire', offsetX + 74.25, y, { align: 'center' });

        y += 45;
        // NB
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
       // doc.text("NB : Deux mois d'arriérée de loyer entrainent", offsetX + 15, y);
        //doc.text("un annullment du contrat.", offsetX + 25, y + 5);
      };

      // Dessiner la moitié gauche (Talon)
      drawHalf(0);
      
      // Ligne centrale pointillée
      doc.setLineDash([2, 2], 0);
      doc.setDrawColor(150, 150, 150);
      doc.line(148.5, 10, 148.5, 200);
      doc.setLineDash([]);
      
      // Dessiner la moitié droite (Quittance)
      drawHalf(148.5);

      if (action === 'print') {
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
      } else {
        doc.save(`quittance_${data.id}.pdf`);
      }
      
      setPdfModal({ isOpen: false, paiement: null });
    } catch (error) { 
      alert('Erreur lors de la génération du PDF'); 
      console.error(error); 
    }
  };

  const columns = [
    { header: 'Locataire', render: (r) => <span className="font-semibold text-text-main">{r.locataire_prenom} {r.locataire_nom}</span> },
    // { header: 'Immeuble', key: 'immeuble_nom' },
    { header: 'Apt.', key: 'appartement_numero' },
    // { header: 'Période', render: (r) => `${MOIS_NOMS[r.mois_concerne - 1]} ${r.annee_concernee}` },
    { header: 'Montant', render: (r) => <span className="font-bold text-success">{fmt(r.montant)}</span> },
    { header: 'Méthode', render: (r) => <span className="px-2 py-1 rounded bg-background border border-border-light text-text-muted text-xs capitalize">{r.methode_paiement}</span> },
    { header: 'Date', render: (r) => new Date(r.date_paiement).toLocaleDateString('fr-FR') },
    { 
      header: 'Actions', 
      render: (r) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setPdfModal({ isOpen: true, paiement: r })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors font-medium">
            <FileText size={14} /><span>Reçu</span>
          </button>
          <button onClick={() => handleCancel(r)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors font-medium">
            <XCircle size={14} /><span>Annuler</span>
          </button>
        </div>
      )
    },
  ];

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  const selectedLocataire = locataires.find(l => l.id == form.locataire_id);
  const entryDate = selectedLocataire && selectedLocataire.date_entree ? new Date(selectedLocataire.date_entree) : null;
  const minYear = entryDate ? entryDate.getFullYear() : 2020;
  // Si on est sur l'année d'entrée, on ne peut sélectionner que les mois à partir du mois d'entrée
  const minMonth = (entryDate && parseInt(form.annee_concernee) === minYear) ? entryDate.getMonth() + 1 : 1;
  const minDateStr = entryDate ? entryDate.toISOString().split('T')[0] : '';

  return (
    <div className="space-y-6 animate-fadeIn w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Paiements</h1>
          <p className="text-text-muted mt-1 text-sm">Historique des versements de loyer</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors shadow-sm whitespace-nowrap">
          <Plus size={18} />
          <span className="hidden sm:inline">Encaisser</span>
        </button>
      </div>

      {/* Barre de filtres */}
      <div className="bg-surface p-4 rounded-xl border border-border-light flex flex-col lg:flex-row gap-4 card-shadow">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Rechercher (Locataire, Réf)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border-light text-text-main text-sm focus:outline-none focus:border-secondary transition-colors"
          />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          <select value={filterImmeuble} onChange={(e) => setFilterImmeuble(e.target.value)} className="flex-1 sm:w-40 px-3 py-2 rounded-lg bg-background border border-border-light text-text-main text-sm focus:outline-none focus:border-secondary transition-colors">
            <option value="">Tous les immeubles</option>
            {immeubles.map(i => <option key={i.id} value={i.nom}>{i.nom}</option>)}
          </select>
          <select value={filterMois} onChange={(e) => setFilterMois(e.target.value)} className="w-full sm:w-32 px-3 py-2 rounded-lg bg-background border border-border-light text-text-main text-sm focus:outline-none focus:border-secondary transition-colors">
            <option value="">Tous les mois</option>
            {MOIS_NOMS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={filterAnnee} onChange={(e) => setFilterAnnee(e.target.value)} className="w-full sm:w-28 px-3 py-2 rounded-lg bg-background border border-border-light text-text-main text-sm focus:outline-none focus:border-secondary transition-colors">
            <option value="">Année</option>
            {[2023, 2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>
      
      <div className="w-full overflow-hidden">
        <DataTable columns={columns} data={filteredPaiements} emptyMessage="Aucun paiement trouvé" />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Encaisser un paiement" size="lg">
        <form onSubmit={handleSave} className="space-y-8 px-2 pb-2">
          
          {/* Section 1: Locataire */}
          {!editingItem && (
            <div>
              <h3 className={sectionHeaderStyle}>
                <div className={iconWrapperStyle}><User size={14} strokeWidth={2.5} /></div>
                Sélection du locataire
              </h3>
              <div>
                <select value={form.locataire_id} onChange={(e) => handleLocataireChange(e.target.value)} className={inputStyle} required>
                  <option value="">Sélectionner un locataire...</option>
                  {locataires.map(l => (
                    <option key={l.id} value={l.id}>
                      {locatairesARisque.has(l.id) ? '🔴' : '🟢'} {l.prenom} {l.nom} — {l.immeuble_nom} Apt. {l.appartement_numero}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {!editingItem && <hr className="border-border-light" />}

          {/* Section 2: Détails du paiement */}
          <div>
            <h3 className={sectionHeaderStyle}>
              <div className={iconWrapperStyle}><CreditCard size={14} strokeWidth={2.5} /></div>
              Détails du règlement
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label className={labelStyle}>Montant encaissé (XOF) *</label>
                <div className="relative">
                  <input type="number" value={form.montant} onChange={(e) => setForm({...form, montant: e.target.value})} className={`${inputStyle} text-lg font-bold`} placeholder="0" required />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted font-bold text-sm">CFA</span>
                </div>
              </div>
              <div>
                <label className={labelStyle}>Date du paiement *</label>
                <input type="date" min={minDateStr} value={form.date_paiement} onChange={(e) => setForm({...form, date_paiement: e.target.value})} className={inputStyle} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelStyle}>Moyen de paiement</label>
                <select value={form.methode_paiement} onChange={(e) => setForm({...form, methode_paiement: e.target.value})} className={inputStyle}>
                  <option value="especes">Espèces</option>
                  <option value="virement">Virement bancaire</option>
                  <option value="cheque">Chèque</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>N° Référence / Chèque</label>
                <input type="text" value={form.reference} onChange={(e) => setForm({...form, reference: e.target.value})} placeholder="Facultatif" className={inputStyle} />
              </div>
            </div>
          </div>

          <hr className="border-border-light" />

          {/* Section 3: Période (Cachée mais requise par le backend) */}
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-5 flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-background border border-border-light text-text-muted"><CalendarDays size={14} strokeWidth={2.5} /></div>
              Période concernée
            </h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <select value={form.mois_concerne} onChange={(e) => setForm({...form, mois_concerne: e.target.value})} className={inputStyle} required>
                  {MOIS_NOMS.map((m, i) => {
                    const monthNumber = i + 1;
                    return (
                      <option key={i} value={monthNumber} disabled={monthNumber < minMonth}>
                        {m} {monthNumber < minMonth ? '(Avant entrée)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <input type="number" min={minYear} max={2030} value={form.annee_concernee} onChange={(e) => {
                  const val = e.target.value;
                  const monthLimit = (entryDate && parseInt(val) === minYear) ? entryDate.getMonth() + 1 : 1;
                  setForm({...form, annee_concernee: val, mois_concerne: Math.max(form.mois_concerne, monthLimit)});
                }} className={inputStyle} required />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-border-light">
            <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-3 rounded-xl bg-background text-text-main border border-border-light hover:bg-border-light/50 transition-colors font-semibold">Annuler</button>
            <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
              {saving ? 'Traitement...' : 'Valider l\'encaissement'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal d'Action PDF */}
      <Modal isOpen={pdfModal.isOpen} onClose={() => setPdfModal({ isOpen: false, paiement: null })} title="Gestion de la Quittance">
        <div className="p-6 flex flex-col gap-6 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <FileText size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-main mb-2">Quittance de loyer générée</h3>
            <p className="text-text-muted text-sm">Le reçu a été généré en format A4 Paysage avec talon. Que souhaitez-vous faire ?</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            <button onClick={() => handlePdfAction('print')} className="px-4 py-4 rounded-xl bg-surface border-2 border-primary text-primary font-bold hover:bg-primary/10 transition-colors flex flex-col items-center justify-center gap-2">
              <Printer size={24} /> 
              <span>Imprimer</span>
            </button>
            <button onClick={() => handlePdfAction('download')} className="px-4 py-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors flex flex-col items-center justify-center gap-2 shadow-lg shadow-primary/20">
              <Download size={24} /> 
              <span>Télécharger</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PaiementsPage;
