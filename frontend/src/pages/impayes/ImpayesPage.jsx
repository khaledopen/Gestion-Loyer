import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const ImpayesPage = () => {
  const [impayes, setImpayes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const { data } = await api.get('/paiements/impayes'); setImpayes(data); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fmt = (a) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(a || 0);
  const total = impayes.reduce((s, i) => s + parseFloat(i.montant_du || 0), 0);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Loyers Impayés</h1>
          <p className="text-text-muted mt-1 text-sm">Suivi des paiements en retard</p>
        </div>
        <div className="px-5 py-3 rounded-xl bg-danger-light border border-danger/20 text-right">
          <p className="text-xs text-danger font-medium uppercase tracking-wider mb-1">Total impayés</p>
          <p className="text-2xl font-bold text-danger leading-none">{fmt(total)}</p>
        </div>
      </div>

      {impayes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted bg-surface rounded-xl border border-border-light card-shadow">
          <CheckCircle2 size={48} className="mb-4 text-success" />
          <p className="text-lg font-semibold text-text-main">Aucun impayé</p>
          <p className="text-sm mt-1">Tous les loyers sont à jour !</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {impayes.map((item, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl bg-surface border border-border-light hover:border-danger/30 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-danger-light flex items-center justify-center text-danger shrink-0">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <p className="font-semibold text-text-main">{item.locataire_prenom} {item.locataire_nom}</p>
                  <p className="text-sm text-text-muted mt-0.5">{item.immeuble_nom} — Apt. {item.appartement_numero}</p>
                  {item.telephone && <p className="text-xs text-text-muted mt-1 font-medium bg-background border border-border-light px-2 py-0.5 rounded-md inline-block">📞 {item.telephone}</p>}
                </div>
              </div>
              <div className="mt-4 sm:mt-0 text-left sm:text-right">
                <p className="text-lg font-bold text-danger">{fmt(item.montant_du)}</p>
                <p className="text-sm font-medium text-text-muted mt-0.5">{MOIS[item.mois - 1]} {item.annee}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImpayesPage;
