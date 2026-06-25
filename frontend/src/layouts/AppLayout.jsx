import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Home, Users, CreditCard, Wrench, BarChart3, Menu, X, LogOut, Bell, Search } from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Tableau de bord', icon: BarChart3 },
  { path: '/immeubles', label: 'Immeubles', icon: Building2 },
  { path: '/appartements', label: 'Appartements', icon: Home },
  { path: '/locataires', label: 'Locataires', icon: Users },
  { path: '/paiements', label: 'Paiements', icon: CreditCard },
  { path: '/reparations', label: 'Réparations', icon: Wrench },
];

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar - Blue Navy (#1E3A8A) */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-primary text-white flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white text-primary flex items-center justify-center font-bold text-lg">
              GL
            </div>
            <div>
              <h1 className="text-base font-semibold">Gestion Loyer</h1>
            </div>
          </div>
          <button className="lg:hidden ml-auto text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-sm font-medium">
              {user?.nom?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.nom || 'Utilisateur'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-surface border-b border-border-light flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-text-muted hover:text-text-main transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-text-muted bg-background px-3 py-1.5 rounded-md border border-border-light">
              <Search size={16} />
              <input type="text" placeholder="Rechercher..." className="bg-transparent border-none outline-none text-sm w-48 text-text-main" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-text-muted hover:text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger rounded-full"></span>
            </button>
            <div className="h-6 w-px bg-border-light mx-2"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-danger transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
