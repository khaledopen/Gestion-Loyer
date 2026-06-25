const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = 'postgresql://neondb_owner:npg_SfGo2alvLRj3@ep-solitary-sound-atxvv9ws.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE INDEX IF NOT EXISTS idx_appartements_immeuble ON appartements(immeuble_id);
CREATE INDEX IF NOT EXISTS idx_locataires_appartement ON locataires(appartement_id);
CREATE INDEX IF NOT EXISTS idx_paiements_locataire ON paiements(locataire_id);
CREATE INDEX IF NOT EXISTS idx_paiements_appartement ON paiements(appartement_id);
CREATE INDEX IF NOT EXISTS idx_reparations_appartement ON reparations(appartement_id);
CREATE INDEX IF NOT EXISTS idx_reparations_immeuble ON reparations(immeuble_id);
`;

async function initNeon() {
  try {
    console.log('🔄 Initialisation de la base Neon...');
    await pool.query(schema);
    console.log('✅ Tables créées avec succès.');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO users (nom, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      ['Administrateur', 'admin@gestionloyer.com', hashedPassword, 'admin']
    );
    console.log('✅ Utilisateur admin créé.');
  } catch(e) {
    console.error('Erreur:', e);
  } finally {
    await pool.end();
  }
}
initNeon();
