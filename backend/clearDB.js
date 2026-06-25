require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function clearDatabase() {
  try {
    console.log("Suppression des données de test en cours...");
    // On vide toutes les tables (CASCADE gère les clés étrangères) SAUF la table users
    await pool.query('TRUNCATE TABLE paiements, reparations, locataires, appartements, immeubles CASCADE;');
    console.log("✅ Toutes les données ont été supprimées avec succès !");
    console.log("Vous pouvez maintenant entrer vos propres données depuis l'interface.");
  } catch (err) {
    console.error("❌ Erreur lors du nettoyage de la base:", err);
  } finally {
    await pool.end();
  }
}

clearDatabase();
