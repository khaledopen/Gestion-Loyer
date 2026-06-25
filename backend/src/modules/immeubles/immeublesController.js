const pool = require('../../config/db');

// Liste des immeubles
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, 
        COUNT(DISTINCT a.id) as nombre_appartements,
        COUNT(DISTINCT l.id) FILTER (WHERE l.actif = true) as nombre_locataires
      FROM immeubles i
      LEFT JOIN appartements a ON a.immeuble_id = i.id
      LEFT JOIN locataires l ON l.appartement_id = a.id
      WHERE i.user_id = $1
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur getAll immeubles:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Détail d'un immeuble
exports.getById = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM immeubles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Immeuble non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur getById immeuble:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un immeuble
exports.create = async (req, res) => {
  try {
    const { nom, adresse, ville, description, nombre_etages } = req.body;
    if (!nom || !adresse || !ville) {
      return res.status(400).json({ message: 'Nom, adresse et ville sont requis' });
    }
    const result = await pool.query(
      'INSERT INTO immeubles (nom, adresse, ville, description, nombre_etages, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nom, adresse, ville, description || '', nombre_etages || 1, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur create immeuble:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Modifier un immeuble
exports.update = async (req, res) => {
  try {
    const { nom, adresse, ville, description, nombre_etages } = req.body;
    const result = await pool.query(
      `UPDATE immeubles SET nom = $1, adresse = $2, ville = $3, description = $4, nombre_etages = $5 
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [nom, adresse, ville, description, nombre_etages, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Immeuble non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur update immeuble:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un immeuble
exports.remove = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM immeubles WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Immeuble non trouvé' });
    }
    res.json({ message: 'Immeuble supprimé avec succès' });
  } catch (error) {
    console.error('Erreur remove immeuble:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
