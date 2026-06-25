const pool = require('../../config/db');

// Liste des paiements
exports.getAll = async (req, res) => {
  try {
    const { locataire_id, annee, mois } = req.query;
    let query = `
      SELECT p.*, l.nom as locataire_nom, l.prenom as locataire_prenom, 
        a.numero as appartement_numero, i.nom as immeuble_nom
      FROM paiements p
      JOIN locataires l ON l.id = p.locataire_id
      JOIN appartements a ON a.id = p.appartement_id
      JOIN immeubles i ON i.id = a.immeuble_id
      WHERE i.user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (locataire_id) {
      query += ` AND p.locataire_id = $${paramIndex}`;
      params.push(locataire_id);
      paramIndex++;
    }
    if (annee) {
      query += ` AND p.annee_concernee = $${paramIndex}`;
      params.push(annee);
      paramIndex++;
    }
    if (mois) {
      query += ` AND p.mois_concerne = $${paramIndex}`;
      params.push(mois);
      paramIndex++;
    }

    query += ' ORDER BY p.date_paiement DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur getAll paiements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Détail d'un paiement
exports.getById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, l.nom as locataire_nom, l.prenom as locataire_prenom, l.cin as locataire_cin,
        a.numero as appartement_numero, a.loyer_mensuel, i.nom as immeuble_nom, i.adresse as immeuble_adresse
      FROM paiements p
      JOIN locataires l ON l.id = p.locataire_id
      JOIN appartements a ON a.id = p.appartement_id
      JOIN immeubles i ON i.id = a.immeuble_id
      WHERE p.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur getById paiement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un paiement
exports.create = async (req, res) => {
  try {
    const { locataire_id, appartement_id, montant, date_paiement, mois_concerne, annee_concernee, methode_paiement, reference, notes } = req.body;
    if (!locataire_id || !appartement_id || !montant || !date_paiement || !mois_concerne || !annee_concernee) {
      return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
    }

    // Les paiements partiels sont autorisés, pas de blocage si un paiement existe déjà

    const result = await pool.query(
      `INSERT INTO paiements (locataire_id, appartement_id, montant, date_paiement, mois_concerne, annee_concernee, methode_paiement, reference, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [locataire_id, appartement_id, montant, date_paiement, mois_concerne, annee_concernee, methode_paiement || 'especes', reference || '', notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur create paiement:', error);
    res.status(500).json({ message: error.message || 'Erreur serveur', stack: error.stack });
  }
};

// Modifier un paiement
exports.update = async (req, res) => {
  try {
    const { montant, date_paiement, mois_concerne, annee_concernee, methode_paiement, reference, notes } = req.body;
    const result = await pool.query(
      `UPDATE paiements SET montant = $1, date_paiement = $2, mois_concerne = $3, annee_concernee = $4,
       methode_paiement = $5, reference = $6, notes = $7
       WHERE id = $8 RETURNING *`,
      [montant, date_paiement, mois_concerne, annee_concernee, methode_paiement, reference, notes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur update paiement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un paiement
exports.remove = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM paiements WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paiement non trouvé' });
    }
    res.json({ message: 'Paiement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur remove paiement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Loyers impayés
exports.getImpayes = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Simplified approach: get active tenants and check which months are unpaid
    const locatairesResult = await pool.query(`
      SELECT l.id, l.nom, l.prenom, l.telephone, l.date_entree,
        a.id as appartement_id, a.numero as appartement_numero, a.loyer_mensuel,
        i.nom as immeuble_nom
      FROM locataires l
      JOIN appartements a ON a.id = l.appartement_id
      JOIN immeubles i ON i.id = a.immeuble_id
      WHERE l.actif = true AND i.user_id = $1
    `, [req.user.id]);

    const impayes = [];
    for (const loc of locatairesResult.rows) {
      const paiementsResult = await pool.query(
        'SELECT mois_concerne, annee_concernee, SUM(montant) as total_paye FROM paiements WHERE locataire_id = $1 AND annee_concernee = $2 GROUP BY mois_concerne, annee_concernee',
        [loc.id, currentYear]
      );
      
      const paymentsMap = {};
      paiementsResult.rows.forEach(p => {
        paymentsMap[`${p.annee_concernee}-${p.mois_concerne}`] = parseFloat(p.total_paye);
      });

      const entreeDate = new Date(loc.date_entree);
      const startMonth = entreeDate.getFullYear() === currentYear ? entreeDate.getMonth() + 1 : 1;

      for (let m = startMonth; m <= currentMonth; m++) {
        const totalPaye = paymentsMap[`${currentYear}-${m}`] || 0;
        const loyer = parseFloat(loc.loyer_mensuel || 0);

        if (totalPaye < loyer) {
          impayes.push({
            locataire_id: loc.id,
            locataire_nom: loc.nom,
            locataire_prenom: loc.prenom,
            telephone: loc.telephone,
            appartement_id: loc.appartement_id,
            appartement_numero: loc.appartement_numero,
            loyer_mensuel: loyer,
            immeuble_nom: loc.immeuble_nom,
            mois: m,
            annee: currentYear,
            montant_du: loyer - totalPaye,
            montant_paye: totalPaye
          });
        }
      }
    }

    res.json(impayes);
  } catch (error) {
    console.error('Erreur getImpayes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
