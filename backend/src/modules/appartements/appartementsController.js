const pool = require('../../config/db');

// Liste des appartements (filtrable par immeuble)
exports.getAll = async (req, res) => {
  try {
    const { immeuble_id } = req.query;
    let query = `
      SELECT a.*, i.nom as immeuble_nom,
        l.nom as locataire_nom, l.prenom as locataire_prenom, l.id as locataire_id
      FROM appartements a
      JOIN immeubles i ON i.id = a.immeuble_id
      LEFT JOIN locataires l ON l.appartement_id = a.id AND l.actif = true
      WHERE i.user_id = $1
    `;
    const params = [req.user.id];

    if (immeuble_id) {
      query += ' AND a.immeuble_id = $2';
      params.push(immeuble_id);
    }

    query += ' ORDER BY i.nom, a.numero';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur getAll appartements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Détail d'un appartement
exports.getById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, i.nom as immeuble_nom
      FROM appartements a
      JOIN immeubles i ON i.id = a.immeuble_id
      WHERE a.id = $1 AND i.user_id = $2
    `, [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appartement non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur getById appartement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un appartement
exports.create = async (req, res) => {
  try {
    const { numero, etage, superficie, loyer_mensuel, statut, description, immeuble_id } = req.body;
    if (!numero || !loyer_mensuel || !immeuble_id) {
      return res.status(400).json({ message: 'Numéro, loyer mensuel et immeuble sont requis' });
    }

    // Vérifier que l'immeuble appartient à l'utilisateur
    const immeuble = await pool.query(
      'SELECT id FROM immeubles WHERE id = $1 AND user_id = $2',
      [immeuble_id, req.user.id]
    );
    if (immeuble.rows.length === 0) {
      return res.status(404).json({ message: 'Immeuble non trouvé' });
    }

    const result = await pool.query(
      `INSERT INTO appartements (numero, etage, superficie, loyer_mensuel, statut, description, immeuble_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [numero, etage || 0, superficie, loyer_mensuel, statut || 'libre', description || '', immeuble_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur create appartement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Modifier un appartement
exports.update = async (req, res) => {
  try {
    const { numero, etage, superficie, loyer_mensuel, statut, description, immeuble_id } = req.body;
    const result = await pool.query(
      `UPDATE appartements SET numero = $1, etage = $2, superficie = $3, loyer_mensuel = $4, 
       statut = $5, description = $6, immeuble_id = $7
       WHERE id = $8 RETURNING *`,
      [numero, etage, superficie, loyer_mensuel, statut, description, immeuble_id, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appartement non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur update appartement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un appartement
exports.remove = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM appartements WHERE id = $1 AND immeuble_id IN 
       (SELECT id FROM immeubles WHERE user_id = $2) RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Appartement non trouvé' });
    }
    res.json({ message: 'Appartement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur remove appartement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
