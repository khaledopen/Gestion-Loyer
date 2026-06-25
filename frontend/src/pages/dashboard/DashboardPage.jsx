import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import { Building2, Home, Users, Wallet, Wrench, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Build chart data
  const revenueData = new Array(12).fill(0);
  const expenseData = new Array(12).fill(0);
  if (stats?.revenus_mensuels) {
    stats.revenus_mensuels.forEach(r => { revenueData[r.mois - 1] = parseFloat(r.total); });
  }
  if (stats?.depenses_mensuelles) {
    stats.depenses_mensuelles.forEach(d => { expenseData[parseInt(d.mois) - 1] = parseFloat(d.total); });
  }

  const maxChartValue = Math.max(...revenueData, ...expenseData, 1);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-main">Tableau de bord</h1>
        <p className="text-text-muted mt-1 text-sm">Vue d'ensemble de votre patrimoine immobilier — {stats?.annee}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <StatCard icon={<Building2 size={24} />} label="Immeubles" value={stats?.immeubles || 0} color="primary" />
        <StatCard icon={<Home size={24} />} label="Appartements" value={stats?.appartements || 0} color="primary" subtitle={`${stats?.appartements_occupes || 0} occupés`} />
        <StatCard icon={<Users size={24} />} label="Locataires" value={stats?.locataires || 0} color="success" subtitle="Actifs" />
        <StatCard icon={<Wallet size={24} />} label="Revenus" value={formatMoney(stats?.revenus_total)} color="success" />
        <StatCard icon={<Wrench size={24} />} label="Dépenses" value={formatMoney(stats?.depenses_total)} color="warning" />
        <StatCard icon={<AlertTriangle size={24} />} label="Impayés" value={formatMoney(stats?.impayes_total)} color="danger" subtitle={`${stats?.impayes_nombre || 0} mois`} />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <div className="bg-surface rounded-xl border border-border-light p-6 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-text-main">Revenus mensuels ({stats?.annee})</h3>
            <span className="flex items-center gap-1 text-xs font-medium text-success bg-success-light px-2 py-1 rounded-md">
              <ArrowUpRight size={14} />
              Revenus
            </span>
          </div>
          <div className="flex items-end gap-2 h-48">
            {revenueData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative flex items-end justify-center" style={{ height: '160px' }}>
                  <div
                    className="w-full max-w-8 rounded-t bg-success/80 transition-all duration-300 group-hover:bg-success"
                    style={{ height: `${maxChartValue > 0 ? (val / maxChartValue) * 100 : 0}%`, minHeight: val > 0 ? '4px' : '0' }}
                    title={formatMoney(val)}
                  ></div>
                </div>
                <span className="text-[10px] font-medium text-text-muted uppercase">{MOIS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses chart */}
        <div className="bg-surface rounded-xl border border-border-light p-6 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-text-main">Dépenses mensuelles ({stats?.annee})</h3>
            <span className="flex items-center gap-1 text-xs font-medium text-warning bg-warning-light px-2 py-1 rounded-md">
              <ArrowDownRight size={14} />
              Dépenses
            </span>
          </div>
          <div className="flex items-end gap-2 h-48">
            {expenseData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative flex items-end justify-center" style={{ height: '160px' }}>
                  <div
                    className="w-full max-w-8 rounded-t bg-warning/80 transition-all duration-300 group-hover:bg-warning"
                    style={{ height: `${maxChartValue > 0 ? (val / maxChartValue) * 100 : 0}%`, minHeight: val > 0 ? '4px' : '0' }}
                    title={formatMoney(val)}
                  ></div>
                </div>
                <span className="text-[10px] font-medium text-text-muted uppercase">{MOIS[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-surface rounded-xl border border-border-light p-6 card-shadow">
        <h3 className="text-base font-semibold text-text-main mb-6">Derniers paiements</h3>
        {stats?.derniers_paiements?.length > 0 ? (
          <div className="space-y-4">
            {stats.derniers_paiements.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border-light hover:border-success/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-success-light flex items-center justify-center text-success">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-main">{p.locataire_prenom} {p.locataire_nom}</p>
                    <p className="text-xs text-text-muted mt-0.5">{p.immeuble_nom} — Apt. {p.appartement_numero}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">{formatMoney(p.montant)}</p>
                  <p className="text-xs text-text-muted mt-0.5">{MOIS[p.mois_concerne - 1]} {p.annee_concernee}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-8">Aucun paiement récent</p>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
