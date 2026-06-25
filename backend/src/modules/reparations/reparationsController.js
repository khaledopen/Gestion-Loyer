const pool = require('../../config/db');

// Liste des réparations
exports.getAll = async (req, res) => {
  try {
    const { immeuble_id, appartement_id } = req.query;
    let query = `
      SELECT r.*, a.numero as appartement_numero, i.nom as immeuble_nom
      FROM reparations r
      LEFT JOIN appartements a ON a.id = r.appartement_id
      LEFT JOIN immeubles i ON i.id = COALESCE(r.immeuble_id, a.immeuble_id)
      WHERE i.user_id = $1
    `;
    const params = [req.user.id];
    let paramIndex = 2;

    if (immeuble_id) {
      query += ` AND (r.immeuble_id = $${paramIndex} OR a.immeuble_id = $${paramIndex})`;
      params.push(immeuble_id);
      paramIndex++;
    }
    if (appartement_id) {
      query += ` AND r.appartement_id = $${paramIndex}`;
      params.push(appartement_id);
      paramIndex++;
    }

    query += ' ORDER BY r.date_reparation DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur getAll reparations:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Détail d'une réparation
exports.getById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, a.numero as appartement_numero, i.nom as immeuble_nom
      FROM reparations r
      LEFT JOIN appartements a ON a.id = r.appartement_id
      LEFT JOIN immeubles i ON i.id = COALESCE(r.immeuble_id, a.immeuble_id)
      WHERE r.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Réparation non trouvée' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur getById reparation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer une réparation
exports.create = async (req, res) => {
  try {
    const { description, cout, date_reparation, statut, categorie, appartement_id, immeuble_id, notes } = req.body;
    if (!description || !cout || !date_reparation) {
      return res.status(400).json({ message: 'Description, coût et date sont requis' });
    }

    const result = await pool.query(
      `INSERT INTO reparations (description, cout, date_reparation, statut, categorie, appartement_id, immeuble_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [description, cout, date_reparation, statut || 'en_cours', categorie || '', appartement_id || null, immeuble_id || null, notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur create reparation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Modifier une réparation
exports.update = async (req, res) => {
  try {
    const { description, cout, date_reparation, statut, categorie, appartement_id, immeuble_id, notes } = req.body;
    const result = await pool.query(
      `UPDATE reparations SET description = $1, cout = $2, date_reparation = $3, statut = $4, 
       categorie = $5, appartement_id = $6, immeuble_id = $7, notes = $8
       WHERE id = $9 RETURNING *`,
      [description, cout, date_reparation, statut, categorie, appartement_id, immeuble_id, notes, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Réparation non trouvée' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur update reparation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer une réparation
exports.remove = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reparations WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Réparation non trouvée' });
    }
    res.json({ message: 'Réparation supprimée avec succès' });
  } catch (error) {
    console.error('Erreur remove reparation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
