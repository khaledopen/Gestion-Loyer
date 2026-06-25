require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const schema = `
-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des immeubles
CREATE TABLE IF NOT EXISTS immeubles (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(150) NOT NULL,
  adresse VARCHAR(255) NOT NULL,
  ville VARCHAR(100) NOT NULL,
  description TEXT,
  nombre_etages INTEGER DEFAULT 1,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des appartements
CREATE TABLE IF NOT EXISTS appartements (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(20) NOT NULL,
  etage INTEGER DEFAULT 0,
  superficie DECIMAL(10,2),
  loyer_mensuel DECIMAL(12,2) NOT NULL,
  statut VARCHAR(20) DEFAULT 'libre',
  description TEXT,
  immeuble_id INTEGER REFERENCES immeubles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des locataires
CREATE TABLE IF NOT EXISTS locataires (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20),
  email VARCHAR(150),
  cin VARCHAR(50),
  appartement_id INTEGER REFERENCES appartements(id) ON DELETE SET NULL,
  date_entree DATE,
  date_sortie DATE,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS paiements (
  id SERIAL PRIMARY KEY,
  locataire_id INTEGER REFERENCES locataires(id) ON DELETE CASCADE,
  appartement_id INTEGER REFERENCES appartements(id) ON DELETE CASCADE,
  montant DECIMAL(12,2) NOT NULL,
  date_paiement DATE NOT NULL,
  mois_concerne INTEGER NOT NULL CHECK (mois_concerne BETWEEN 1 AND 12),
  annee_concernee INTEGER NOT NULL,
  methode_paiement VARCHAR(50) DEFAULT 'especes',
  reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(locataire_id, mois_concerne, annee_concernee)
);

-- Table des réparations
CREATE TABLE IF NOT EXISTS reparations (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  cout DECIMAL(12,2) NOT NULL,
  date_reparation DATE NOT NULL,
  statut VARCHAR(30) DEFAULT 'en_cours',
  categorie VARCHAR(50),
  appartement_id INTEGER REFERENCES appartements(id) ON DELETE SET NULL,
  immeuble_id INTEGER REFERENCES immeubles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_appartements_immeuble ON appartements(immeuble_id);
CREATE INDEX IF NOT EXISTS idx_locataires_appartement ON locataires(appartement_id);
CREATE INDEX IF NOT EXISTS idx_paiements_locataire ON paiements(locataire_id);
CREATE INDEX IF NOT EXISTS idx_paiements_appartement ON paiements(appartement_id);
CREATE INDEX IF NOT EXISTS idx_reparations_appartement ON reparations(appartement_id);
CREATE INDEX IF NOT EXISTS idx_reparations_immeuble ON reparations(immeuble_id);
`;

async function initDb() {
  try {
    console.log('🔄 Initialisation de la base de données...');
    await pool.query(schema);
    console.log('✅ Tables créées avec succès.');

    // Créer un utilisateur admin par défaut
    const existingAdmin = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@gestionloyer.com']);
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (nom, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['Administrateur', 'admin@gestionloyer.com', hashedPassword, 'admin']
      );
      console.log('✅ Utilisateur admin créé: admin@gestionloyer.com / admin123');
    } else {
      console.log('ℹ️  Utilisateur admin existe déjà.');
    }

    console.log('🎉 Base de données initialisée avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
  } finally {
    await pool.end();
  }
}

initDb();
