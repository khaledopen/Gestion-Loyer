require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function seedDb() {
  try {
    console.log('🌱 Démarrage du Seeder...');

    // 1. Vider les tables (sauf users) avec CASCADE
    console.log('🧹 Nettoyage des anciennes données...');
    await pool.query('TRUNCATE TABLE reparations, paiements, locataires, appartements, immeubles RESTART IDENTITY CASCADE');

    // 2. Récupérer l'admin
    const userRes = await pool.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.error('❌ Aucun utilisateur trouvé. Lancez npm run db:init d\'abord.');
      process.exit(1);
    }
    const userId = userRes.rows[0].id;

    // 3. Immeubles
    console.log('🏢 Création des immeubles...');
    const immeubles = [
      { nom: 'Résidence Les Palmiers', adresse: '15 Avenue Hassan II', ville: 'Casablanca', description: 'Résidence haut standing au centre-ville', etages: 5 },
      { nom: 'Tour Azur', adresse: 'Boulevard de la Corniche', ville: 'Casablanca', description: 'Vue sur mer, sécurité 24/7', etages: 8 },
      { nom: 'Complexe Al Oumnia', adresse: 'Quartier Guéliz', ville: 'Marrakech', description: 'Architecture moderne avec piscine', etages: 4 },
    ];

    const insertedImmeubles = [];
    for (const imm of immeubles) {
      const res = await pool.query(
        'INSERT INTO immeubles (nom, adresse, ville, description, nombre_etages, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [imm.nom, imm.adresse, imm.ville, imm.description, imm.etages, userId]
      );
      insertedImmeubles.push({ ...imm, id: res.rows[0].id });
    }

    // 4. Appartements
    console.log('🏠 Création des appartements...');
    const insertedAppartements = [];
    for (const imm of insertedImmeubles) {
      const numApparts = getRandomInt(4, 8);
      for (let i = 1; i <= numApparts; i++) {
        const etage = Math.ceil(i / 2); // 2 apparts par étage
        const loyer = getRandomInt(3000, 10000);
        const res = await pool.query(
          'INSERT INTO appartements (numero, etage, superficie, loyer_mensuel, statut, immeuble_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, loyer_mensuel',
          [`${imm.nom.substring(0,3).toUpperCase()}-${i}`, etage, getRandomInt(50, 150), loyer, 'libre', imm.id]
        );
        insertedAppartements.push({ id: res.rows[0].id, loyer: loyer, immeuble_id: imm.id, numero: `${imm.nom.substring(0,3).toUpperCase()}-${i}` });
      }
    }

    // 5. Locataires
    console.log('👥 Création des locataires...');
    const noms = ['Benali', 'Kettani', 'Amrani', 'El Fassi', 'Berrada', 'Tazi', 'Idrissi', 'Chraibi', 'Alaoui', 'Mansouri'];
    const prenoms = ['Youssef', 'Sara', 'Mehdi', 'Fatima', 'Omar', 'Karima', 'Amine', 'Salma', 'Hassan', 'Nadia'];
    
    // Assigner 70% des appartements
    const appartsToAssign = insertedAppartements.sort(() => 0.5 - Math.random()).slice(0, Math.floor(insertedAppartements.length * 0.7));
    const insertedLocataires = [];

    for (let i = 0; i < appartsToAssign.length; i++) {
      const apt = appartsToAssign[i];
      const nom = noms[getRandomInt(0, noms.length - 1)];
      const prenom = prenoms[getRandomInt(0, prenoms.length - 1)];
      const dateEntree = getRandomDate(new Date(2023, 0, 1), new Date());
      
      const res = await pool.query(
        'INSERT INTO locataires (nom, prenom, telephone, email, cin, appartement_id, date_entree, actif) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [nom, prenom, `06${getRandomInt(10000000, 99999999)}`, `${prenom.toLowerCase()}.${nom.toLowerCase()}@email.com`, `AB${getRandomInt(100000, 999999)}`, apt.id, dateEntree, true]
      );
      
      // Mettre à jour le statut de l'appartement
      await pool.query('UPDATE appartements SET statut = $1 WHERE id = $2', ['occupe', apt.id]);
      
      insertedLocataires.push({ id: res.rows[0].id, appartement_id: apt.id, loyer: apt.loyer, date_entree: dateEntree });
    }

    // 6. Paiements
    console.log('💰 Création des paiements...');
    const methodes = ['especes', 'virement', 'cheque'];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12

    for (const loc of insertedLocataires) {
      // Pour chaque locataire, on génère des paiements pour les mois depuis son entrée jusqu'au mois actuel
      let startMonth = loc.date_entree.getMonth() + 1;
      let startYear = loc.date_entree.getFullYear();
      
      while(startYear < currentYear || (startYear === currentYear && startMonth <= currentMonth)) {
        // 10% de chance d'être un impayé
        if (Math.random() > 0.1) {
          const datePaiement = new Date(startYear, startMonth - 1, getRandomInt(1, 10)); // Payé entre le 1er et le 10
          await pool.query(
            'INSERT INTO paiements (locataire_id, appartement_id, montant, date_paiement, mois_concerne, annee_concernee, methode_paiement, reference) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [loc.id, loc.appartement_id, loc.loyer, datePaiement, startMonth, startYear, methodes[getRandomInt(0, 2)], `REF-${startYear}${startMonth}-${loc.id}`]
          );
        }
        
        startMonth++;
        if (startMonth > 12) {
          startMonth = 1;
          startYear++;
        }
      }
    }

    // 7. Réparations
    console.log('🔧 Création des réparations...');
    const cats = ['Plomberie', 'Électricité', 'Menuiserie', 'Peinture', 'Gros oeuvre'];
    const statuts = ['en_cours', 'terminee', 'annulee'];
    
    for (let i = 0; i < 15; i++) {
      const isImmeubleOnly = Math.random() > 0.6;
      const imm = insertedImmeubles[getRandomInt(0, insertedImmeubles.length - 1)];
      const apt = isImmeubleOnly ? null : insertedAppartements.filter(a => a.immeuble_id === imm.id)[getRandomInt(0, insertedAppartements.filter(a => a.immeuble_id === imm.id).length - 1)];
      
      await pool.query(
        'INSERT INTO reparations (description, cout, date_reparation, statut, categorie, immeuble_id, appartement_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [`Réparation ${cats[getRandomInt(0, cats.length - 1)].toLowerCase()} - Intervention de routine`, getRandomInt(500, 15000), getRandomDate(new Date(2023, 0, 1), new Date()), statuts[getRandomInt(0, 2)], cats[getRandomInt(0, cats.length - 1)], imm.id, apt ? apt.id : null]
      );
    }

    console.log('✅ Base de données remplie avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du seeding :', error);
  } finally {
    pool.end();
  }
}

seedDb();
