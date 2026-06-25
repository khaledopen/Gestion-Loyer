import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Mail, Lock, User } from 'lucide-react';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(nom, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-md animate-fadeIn">
        
        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border-light card-shadow p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 mx-auto rounded-lg bg-primary text-white flex items-center justify-center mb-4">
              <Building2 size={24} />
            </div>
            <h1 className="text-2xl font-bold text-text-main">Gestion Loyer</h1>
            <p className="text-text-muted mt-1 text-sm">Votre espace de gestion immobilière</p>
          </div>

          <h2 className="text-lg font-semibold text-text-main mb-6 text-center">
            {isLogin ? 'Connexion à votre compte' : 'Créer un compte'}
          </h2>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-danger-light border border-danger/20 text-danger text-sm flex items-start gap-2">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Nom complet</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-border-light text-text-main focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                    placeholder="Jean Dupont"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-border-light text-text-main focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  placeholder="nom@exemple.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-border-light text-text-main focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover focus:ring-2 focus:ring-primary/50 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border-light text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-sm text-secondary hover:text-secondary-hover font-medium transition-colors"
            >
              {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </button>
          </div>

          {isLogin && (
            <div className="mt-6 p-4 rounded-lg bg-background border border-border-light">
              <p className="text-xs text-text-muted text-center flex flex-col gap-1">
                <span><strong>Demo Account</strong></span>
                <span>Email: <span className="text-text-main font-medium">admin@gestionloyer.com</span></span>
                <span>Pass: <span className="text-text-main font-medium">admin123</span></span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
