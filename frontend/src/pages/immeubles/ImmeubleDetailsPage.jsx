import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Building2, ArrowLeft, Home, MapPin, Layers, Users } from 'lucide-react';
import DataTable from '../../components/DataTable';

const ImmeubleDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [immeuble, setImmeuble] = useState(null);
  const [appartements, setAppartements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [id]);

  const loadDetails = async () => {
    try {
      // Pour l'instant on récupère tous les immeubles et on filtre, ou l'API a peut-être un GET /immeubles/:id
      // Essayons GET /immeubles/:id (si l'API l'a), sinon on fetch tout.
      const [immRes, appRes] = await Promise.all([
        api.get(`/immeubles`), 
        api.get(`/appartements?immeuble_id=${id}`)
      ]);
      
      const found = immRes.data.find(i => i.id == id);
      if (found) setImmeuble(found);
      
      // Filter appartements for this building
      setAppartements(appRes.data.filter(a => a.immeuble_id == id));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Apt.', render: (r) => <span className="font-semibold text-text-main">N° {r.numero}</span> },
    { header: 'Étage', key: 'etage' },
    { header: 'Loyer', render: (r) => <span className="font-medium text-text-main">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(r.loyer_mensuel)}</span> },
    { header: 'Statut', render: (r) => {
      const isOccupied = r.statut === 'occupe';
      return (
        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${isOccupied ? 'bg-primary/10 text-primary border-primary/20' : 'bg-success-light text-success border-success/20'}`}>
          {isOccupied ? 'Occupé' : 'Libre'}
        </span>
      );
    }},
    { header: 'Locataire', render: (r) => r.locataire_nom ? `${r.locataire_prenom} ${r.locataire_nom}` : <span className="text-text-muted">—</span> }
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!immeuble) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-text-main mb-4">Immeuble introuvable</h2>
        <button onClick={() => navigate('/immeubles')} className="text-primary hover:underline">Retour à la liste</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/immeubles')} className="p-2 rounded-lg bg-surface border border-border-light text-text-muted hover:text-text-main transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-text-main flex items-center gap-2">
            <Building2 size={24} className="text-primary" />
            {immeuble.nom}
          </h1>
          <p className="text-text-muted mt-1 text-sm flex items-center gap-1.5">
            <MapPin size={14} /> {immeuble.adresse}, {immeuble.ville}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border-light p-5 flex items-center gap-4 card-shadow">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Home size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-muted">Appartements</p>
            <p className="text-2xl font-semibold text-text-main">{appartements.length}</p>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border-light p-5 flex items-center gap-4 card-shadow">
          <div className="w-12 h-12 rounded-lg bg-success-light text-success flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-muted">Occupés</p>
            <p className="text-2xl font-semibold text-text-main">{appartements.filter(a => a.statut === 'occupe').length}</p>
          </div>
        </div>
        <div className="bg-surface rounded-xl border border-border-light p-5 flex items-center gap-4 card-shadow">
          <div className="w-12 h-12 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-muted">Étages</p>
            <p className="text-2xl font-semibold text-text-main">{immeuble.nombre_etages}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {immeuble.description && (
        <div className="bg-surface rounded-xl border border-border-light p-6 card-shadow">
          <h3 className="text-sm font-semibold text-text-main uppercase tracking-wider mb-2">Description</h3>
          <p className="text-text-muted text-sm leading-relaxed">{immeuble.description}</p>
        </div>
      )}

      {/* Appartements List */}
      <div>
        <h3 className="text-lg font-semibold text-text-main mb-4">Liste des appartements</h3>
        <DataTable columns={columns} data={appartements} emptyMessage="Aucun appartement dans cet immeuble" />
      </div>
    </div>
  );
};

export default ImmeubleDetailsPage;
