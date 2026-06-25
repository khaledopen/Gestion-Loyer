require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authMiddleware = require('./middleware/auth');

// Routes
const authRoutes = require('./modules/auth/authRoutes');
const immeublesRoutes = require('./modules/immeubles/immeublesRoutes');
const appartementsRoutes = require('./modules/appartements/appartementsRoutes');
const locatairesRoutes = require('./modules/locataires/locatairesRoutes');
const paiementsRoutes = require('./modules/paiements/paiementsRoutes');
const reparationsRoutes = require('./modules/reparations/reparationsRoutes');
const dashboardRoutes = require('./modules/dashboard/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes publiques
app.use('/api/auth', authRoutes);

// Routes protégées
app.use('/api/immeubles', authMiddleware, immeublesRoutes);
app.use('/api/appartements', authMiddleware, appartementsRoutes);
app.use('/api/locataires', authMiddleware, locatairesRoutes);
app.use('/api/paiements', authMiddleware, paiementsRoutes);
app.use('/api/reparations', authMiddleware, reparationsRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📡 API disponible à http://localhost:${PORT}/api`);
});
