const pool = require('../../config/db');

// Liste des locataires
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, a.numero as appartement_numero, a.loyer_mensuel, i.nom as immeuble_nom
      FROM locataires l
      LEFT JOIN appartements a ON a.id = l.appartement_id
      LEFT JOIN immeubles i ON i.id = a.immeuble_id
      WHERE i.user_id = $1 OR l.appartement_id IS NULL
      ORDER BY l.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur getAll locataires:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Détail d'un locataire
exports.getById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, a.numero as appartement_numero, a.loyer_mensuel, i.nom as immeuble_nom
      FROM locataires l
      LEFT JOIN appartements a ON a.id = l.appartement_id
      LEFT JOIN immeubles i ON i.id = a.immeuble_id
      WHERE l.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Locataire non trouvé' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur getById locataire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un locataire
exports.create = async (req, res) => {
  try {
    const { nom, prenom, telephone, email, cin, appartement_id, date_entree } = req.body;
    if (!nom || !prenom) {
      return res.status(400).json({ message: 'Nom et prénom sont requis' });
    }

    const result = await pool.query(
      `INSERT INTO locataires (nom, prenom, telephone, email, cin, appartement_id, date_entree, actif) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
      [nom, prenom, telephone || '', email || '', cin || '', appartement_id || null, date_entree || new Date()]
    );

    // Mettre à jour le statut de l'appartement
    if (appartement_id) {
      await pool.query("UPDATE appartements SET statut = 'occupe' WHERE id = $1", [appartement_id]);
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur create locataire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Modifier un locataire
exports.update = async (req, res) => {
  try {
    const { nom, prenom, telephone, email, cin, appartement_id, date_entree, date_sortie, actif } = req.body;

    // Si le locataire change d'appartement, libérer l'ancien
    const current = await pool.query('SELECT appartement_id FROM locataires WHERE id = $1', [req.params.id]);
    if (current.rows.length > 0 && current.rows[0].appartement_id && current.rows[0].appartement_id !== appartement_id) {
      await pool.query("UPDATE appartements SET statut = 'libre' WHERE id = $1", [current.rows[0].appartement_id]);
    }

    const result = await pool.query(
      `UPDATE locataires SET nom = $1, prenom = $2, telephone = $3, email = $4, cin = $5, 
       appartement_id = $6, date_entree = $7, date_sortie = $8, actif = $9
       WHERE id = $10 RETURNING *`,
      [nom, prenom, telephone, email, cin, appartement_id, date_entree, date_sortie, actif, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Locataire non trouvé' });
    }

    // Mettre à jour le statut du nouveau appartement
    if (appartement_id && actif) {
      await pool.query("UPDATE appartements SET statut = 'occupe' WHERE id = $1", [appartement_id]);
    }
    if (!actif && appartement_id) {
      await pool.query("UPDATE appartements SET statut = 'libre' WHERE id = $1", [appartement_id]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur update locataire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un locataire
exports.remove = async (req, res) => {
  try {
    const current = await pool.query('SELECT appartement_id FROM locataires WHERE id = $1', [req.params.id]);
    
    const result = await pool.query('DELETE FROM locataires WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Locataire non trouvé' });
    }

    // Libérer l'appartement
    if (current.rows.length > 0 && current.rows[0].appartement_id) {
      await pool.query("UPDATE appartements SET statut = 'libre' WHERE id = $1", [current.rows[0].appartement_id]);
    }

    res.json({ message: 'Locataire supprimé avec succès' });
  } catch (error) {
    console.error('Erreur remove locataire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
