import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, TrendingDown, Users, DollarSign, Activity, CalendarDays } from 'lucide-react';
import api from '../api/axios';

// Hook personnalisé pour récupérer les données (Adapté pour utiliser l'API existante du projet)
const usePayments = () => {
  const [locataires, setLocataires] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [impayesList, setImpayesList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, payRes, impayesRes] = await Promise.all([
          api.get('/locataires'),
          api.get('/paiements'),
          api.get('/paiements/impayes')
        ]);
        // On ne garde que les locataires actifs
        setLocataires(locRes.data.filter(l => l.actif));
        setPaiements(payRes.data);
        setImpayesList(impayesRes.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des données", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return { locataires, paiements, impayesList, loading };
};

const MOIS_NOMS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const RiskDashboard = () => {
  const { locataires, paiements, impayesList, loading } = usePayments();
  const [expandedId, setExpandedId] = useState(null);

  // Générer les 6 derniers mois
  const last6Months = useMemo(() => {
    const months = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
      months.push({
        mois: targetDate.getMonth() + 1,
        annee: targetDate.getFullYear(),
        label: `${MOIS_NOMS[targetDate.getMonth()]} ${targetDate.getFullYear().toString().slice(-2)}`
      });
    }
    return months;
  }, []);

  // Calcul du score et analyse
  const analysis = useMemo(() => {
    if (!locataires.length) return { 
      locatairesStats: [], 
      kpis: {
        totalImpayes: 0,
        countFiable: 0,
        countIrregulier: 0,
        countARisque: 0
      } 
    };

    let totalImpayes = 0;
    let countFiable = 0;
    let countIrregulier = 0;
    let countARisque = 0;

    const stats = locataires.map(locataire => {
      let score = 100;
      const loyer = parseFloat(locataire.loyer_mensuel) || 0;
      const history = [];
      let currentStreakUnpaid = 0;
      let lastMonthWasUnpaid = false;
      let resteAPayerCumule = 0;

      // Parcourir les 6 derniers mois (du plus ancien au plus récent)
      last6Months.forEach((m, index) => {
        // Chercher TOUS les paiements pour ce mois et cette année
        const paiementsDuMois = paiements.filter(p => 
          p.locataire_id === locataire.id && 
          p.mois_concerne === m.mois && 
          p.annee_concernee === m.annee
        );
        const totalPayeMois = paiementsDuMois.reduce((sum, p) => sum + parseFloat(p.montant), 0);

        // Vérifier si le mois analysé est AVANT la date d'entrée du locataire
        let isBeforeEntry = false;
        if (locataire.date_entree) {
          const entryDate = new Date(locataire.date_entree);
          const entryY = entryDate.getFullYear();
          const entryM = entryDate.getMonth() + 1;
          if (m.annee < entryY || (m.annee === entryY && m.mois < entryM)) {
            isBeforeEntry = true;
          }
        }

        let status = 'unpaid';
        
        if (isBeforeEntry) {
          // Si le mois est avant son entrée, on l'ignore (pas de pénalité)
          status = 'not_started';
          currentStreakUnpaid = 0;
          lastMonthWasUnpaid = false;
        } else if (totalPayeMois >= loyer) {
          const datePaiement = new Date(paiementsDuMois[0].date_paiement);
          // Retard si payé après le 10 du mois concerné
          if (datePaiement.getDate() > 10) {
            status = 'late';
            score -= 5;
          } else {
            status = 'paid';
          }
          currentStreakUnpaid = 0;
          lastMonthWasUnpaid = false;
        } else {
          status = 'unpaid';
          const manque = loyer - totalPayeMois;
          resteAPayerCumule += manque;
          totalImpayes += manque;

          // Pénalité allégée si paiement partiel (ex: 10 pts au lieu de 18)
          if (totalPayeMois > 0) {
            score -= 10;
          } else {
            score -= 18;
          }
          
          if (lastMonthWasUnpaid || index === last6Months.length - 1) {
            currentStreakUnpaid++;
          }
          lastMonthWasUnpaid = true;
        }

        history.push({ ...m, status });
      });

      // Pénalité pour impayés consécutifs EN COURS (les derniers mois)
      if (currentStreakUnpaid >= 2) {
        score -= 10;
      }

      score = Math.max(0, Math.min(100, score));
      if (resteAPayerCumule > 0 && score >= 75) {
        score = 74; // Rétrograder à "irregulier" s'il doit de l'argent
      }

      let level = 'risque';
      if (score >= 75) { level = 'fiable'; countFiable++; }
      else if (score >= 40) { level = 'irregulier'; countIrregulier++; }
      else { countARisque++; }

      const locImpayesData = impayesList.filter(i => i.locataire_id === locataire.id);
      const moisImpayesText = locImpayesData.length > 0 
        ? locImpayesData.map(i => `${MOIS_NOMS[i.mois - 1]} ${i.annee.toString().slice(-2)}`).join(', ') 
        : 'Aucun';

      return {
        ...locataire,
        score,
        level,
        history,
        impayesEstimes: resteAPayerCumule,
        moisImpayesText
      };
    });

    // Trier par score croissant (les plus à risque en haut)
    stats.sort((a, b) => a.score - b.score);

    return {
      locatairesStats: stats,
      kpis: {
        totalImpayes,
        countFiable,
        countIrregulier,
        countARisque
      }
    };
  }, [locataires, paiements, impayesList, last6Months]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { locatairesStats, kpis } = analysis;

  const getLevelConfig = (level) => {
    switch(level) {
      case 'fiable': return { icon: CheckCircle2, color: 'text-success', bg: 'bg-success-light', border: 'border-success/20', label: 'Fiable', bar: 'bg-success' };
      case 'irregulier': return { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning-light', border: 'border-warning/20', label: 'Irrégulier', bar: 'bg-warning' };
      case 'risque': return { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger-light', border: 'border-danger/20', label: 'À risque', bar: 'bg-danger' };
      default: return { icon: Activity, color: 'text-text-muted', bg: 'bg-background', border: 'border-border-light', label: 'Inconnu', bar: 'bg-text-muted' };
    }
  };

  const fmt = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="space-y-6">
      {/* HEADER & KPIs */}
      <div>
        <h2 className="text-2xl font-bold text-text-main flex items-center gap-2 mb-6">
          <Activity className="text-primary" />
          Dashboard des Risques Locatifs
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface p-5 rounded-2xl border border-border-light shadow-sm flex flex-col justify-between">
            <p className="text-sm font-semibold text-text-muted flex items-center gap-2"><DollarSign size={16} /> Impayés (6 mois)</p>
            <p className="text-2xl font-black text-danger mt-2">{fmt(kpis.totalImpayes)}</p>
          </div>
          <div className="bg-success-light p-5 rounded-2xl border border-success/20 flex flex-col justify-between">
            <p className="text-sm font-semibold text-success flex items-center gap-2"><CheckCircle2 size={16} /> Fiables (≥75)</p>
            <p className="text-2xl font-black text-success mt-2">{kpis.countFiable} <span className="text-sm font-medium opacity-70">locataires</span></p>
          </div>
          <div className="bg-warning-light p-5 rounded-2xl border border-warning/20 flex flex-col justify-between">
            <p className="text-sm font-semibold text-warning flex items-center gap-2"><AlertTriangle size={16} /> Irréguliers (40-74)</p>
            <p className="text-2xl font-black text-warning mt-2">{kpis.countIrregulier} <span className="text-sm font-medium opacity-70">locataires</span></p>
          </div>
          <div className="bg-danger-light p-5 rounded-2xl border border-danger/20 flex flex-col justify-between">
            <p className="text-sm font-semibold text-danger flex items-center gap-2"><AlertCircle size={16} /> À risque (&lt;40)</p>
            <p className="text-2xl font-black text-danger mt-2">{kpis.countARisque} <span className="text-sm font-medium opacity-70">locataires</span></p>
          </div>
        </div>
      </div>

      {/* LISTE DES LOCATAIRES */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-text-main mb-4">Analyse individuelle</h3>
        
        {locatairesStats.map((loc) => {
          const config = getLevelConfig(loc.level);
          const Icon = config.icon;
          const isExpanded = expandedId === loc.id;

          return (
            <div key={loc.id} className={`bg-surface rounded-2xl border ${isExpanded ? 'border-border shadow-md' : 'border-border-light shadow-sm'} overflow-hidden transition-all duration-200`}>
              
              {/* MAIN ROW */}
              <div 
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-background/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : loc.id)}
              >
                <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                  <div className={`p-3 rounded-xl ${config.bg} ${config.color}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-main text-lg">{loc.prenom} {loc.nom}</h4>
                    <p className="text-sm font-medium text-text-muted flex items-center gap-1.5 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${config.bg} ${config.color} border ${config.border}`}>
                        {config.label}
                      </span>
                      <span>•</span>
                      Apt {loc.appartement_numero || '?'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Score Bar */}
                  <div className="w-32 sm:w-40 flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-text-muted">Score</span>
                      <span className={config.color}>{loc.score}/100</span>
                    </div>
                    <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${config.bar} transition-all duration-1000 ease-out`} 
                        style={{ width: `${loc.score}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-text-muted">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {/* EXPANDED DETAILS */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-border-light bg-background/30 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    
                    {/* Historique Mini-Cards */}
                    <div>
                      <h5 className="text-sm font-bold text-text-main mb-3 flex items-center gap-2">
                        <CalendarDays size={16} className="text-primary" /> Historique (6 mois)
                      </h5>
                      <div className="flex gap-2">
                        {loc.history.map((h, i) => {
                          const statusColors = {
                            paid: 'bg-success text-white border-success-hover',
                            late: 'bg-warning text-white border-warning',
                            unpaid: 'bg-danger text-white border-danger-hover',
                            not_started: 'bg-surface text-text-muted border-border-light border-dashed'
                          };
                          const statusTooltips = {
                            paid: 'Payé à temps',
                            late: 'Payé en retard',
                            unpaid: 'Non payé',
                            not_started: "Pas encore locataire"
                          };
                          
                          return (
                            <div 
                              key={i} 
                              className="flex-1 flex flex-col items-center group cursor-help"
                              title={`${h.label} : ${statusTooltips[h.status]}`}
                            >
                              <div className={`w-full aspect-square sm:h-10 sm:w-10 rounded-lg flex items-center justify-center border shadow-sm ${statusColors[h.status]}`}>
                                {h.status === 'paid' && <CheckCircle2 size={16} strokeWidth={3} />}
                                {h.status === 'late' && <AlertTriangle size={16} strokeWidth={3} />}
                                {h.status === 'unpaid' && <TrendingDown size={16} strokeWidth={3} />}
                                {h.status === 'not_started' && <div className="w-2 h-2 rounded-full bg-border"></div>}
                              </div>
                              <span className="text-[10px] font-semibold text-text-muted mt-1.5 uppercase">{h.label.split(' ')[0]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recommandation & Détails */}
                    <div className="space-y-4">
                      <div className="bg-surface p-4 rounded-xl border border-border-light">
                        <h5 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Recommandation d'action</h5>
                        <p className="text-sm font-medium text-text-main leading-relaxed">
                          {loc.level === 'fiable' && "Aucune action requise. Excellent profil payeur, à fidéliser."}
                          {loc.level === 'irregulier' && "Mettre en place des rappels de paiement automatiques par SMS avant le 5 du mois."}
                          {loc.level === 'risque' && "Contacter urgemment pour un échéancier. Envisager une procédure de mise en demeure."}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center px-4 py-3 bg-surface rounded-xl border border-border-light">
                        <span className="text-sm font-semibold text-text-muted">Impayés estimés</span>
                        <span className={`text-base font-bold ${loc.impayesEstimes > 0 ? 'text-danger' : 'text-success'}`}>
                          {fmt(loc.impayesEstimes)}
                        </span>
                      </div>

                      {loc.impayesEstimes > 0 && (
                        <div className="px-4 py-3 bg-surface rounded-xl border border-border-light">
                          <p className="text-sm font-semibold text-text-muted mb-1">Mois impayés :</p>
                          <p className="text-sm font-bold text-danger leading-relaxed">
                            {loc.moisImpayesText}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center px-4 py-3 bg-surface rounded-xl border border-border-light">
                        <span className="text-sm font-semibold text-text-muted">Date d'entrée</span>
                        <span className="text-sm font-bold text-text-main">
                          {loc.date_entree ? new Date(loc.date_entree).toLocaleDateString('fr-FR') : 'Non définie'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          );
        })}

        {locatairesStats.length === 0 && (
          <div className="text-center py-10 bg-surface rounded-2xl border border-border-light">
            <p className="text-text-muted font-medium">Aucune donnée de paiement disponible pour l'analyse.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskDashboard;
