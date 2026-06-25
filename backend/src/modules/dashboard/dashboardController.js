const pool = require('../../config/db');

exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Nombre d'immeubles
    const immeublesCount = await pool.query(
      'SELECT COUNT(*) as count FROM immeubles WHERE user_id = $1', [userId]
    );

    // Nombre d'appartements
    const appartementsCount = await pool.query(
      `SELECT COUNT(*) as count FROM appartements a 
       JOIN immeubles i ON i.id = a.immeuble_id WHERE i.user_id = $1`, [userId]
    );

    // Nombre d'appartements occupés
    const appartementsOccupes = await pool.query(
      `SELECT COUNT(*) as count FROM appartements a 
       JOIN immeubles i ON i.id = a.immeuble_id 
       WHERE i.user_id = $1 AND a.statut = 'occupe'`, [userId]
    );

    // Nombre de locataires actifs
    const locatairesCount = await pool.query(
      `SELECT COUNT(*) as count FROM locataires l 
       JOIN appartements a ON a.id = l.appartement_id
       JOIN immeubles i ON i.id = a.immeuble_id 
       WHERE i.user_id = $1 AND l.actif = true`, [userId]
    );

    // Revenus totaux (année en cours)
    const revenus = await pool.query(
      `SELECT COALESCE(SUM(p.montant), 0) as total FROM paiements p
       JOIN appartements a ON a.id = p.appartement_id
       JOIN immeubles i ON i.id = a.immeuble_id
       WHERE i.user_id = $1 AND p.annee_concernee = $2`, [userId, currentYear]
    );

    // Revenus par mois (année en cours)
    const revenusMensuels = await pool.query(
      `SELECT p.mois_concerne as mois, COALESCE(SUM(p.montant), 0) as total 
       FROM paiements p
       JOIN appartements a ON a.id = p.appartement_id
       JOIN immeubles i ON i.id = a.immeuble_id
       WHERE i.user_id = $1 AND p.annee_concernee = $2
       GROUP BY p.mois_concerne
       ORDER BY p.mois_concerne`, [userId, currentYear]
    );

    // Dépenses totales (année en cours)
    const depenses = await pool.query(
      `SELECT COALESCE(SUM(r.cout), 0) as total FROM reparations r
       LEFT JOIN appartements a ON a.id = r.appartement_id
       LEFT JOIN immeubles i ON i.id = COALESCE(r.immeuble_id, a.immeuble_id)
       WHERE i.user_id = $1 AND EXTRACT(YEAR FROM r.date_reparation) = $2`, [userId, currentYear]
    );

    // Dépenses par mois (année en cours)
    const depensesMensuelles = await pool.query(
      `SELECT EXTRACT(MONTH FROM r.date_reparation) as mois, COALESCE(SUM(r.cout), 0) as total 
       FROM reparations r
       LEFT JOIN appartements a ON a.id = r.appartement_id
       LEFT JOIN immeubles i ON i.id = COALESCE(r.immeuble_id, a.immeuble_id)
       WHERE i.user_id = $1 AND EXTRACT(YEAR FROM r.date_reparation) = $2
       GROUP BY EXTRACT(MONTH FROM r.date_reparation)
       ORDER BY mois`, [userId, currentYear]
    );

    // Calcul des impayés
    const locatairesActifs = await pool.query(`
      SELECT l.id, l.date_entree, a.loyer_mensuel
      FROM locataires l
      JOIN appartements a ON a.id = l.appartement_id
      JOIN immeubles i ON i.id = a.immeuble_id
      WHERE l.actif = true AND i.user_id = $1
    `, [userId]);

    let totalImpayes = 0;
    let nombreImpayes = 0;
    for (const loc of locatairesActifs.rows) {
      const paiementsResult = await pool.query(
        'SELECT mois_concerne, SUM(montant) as total_paye FROM paiements WHERE locataire_id = $1 AND annee_concernee = $2 GROUP BY mois_concerne',
        [loc.id, currentYear]
      );
      
      const paymentsMap = {};
      paiementsResult.rows.forEach(p => {
        paymentsMap[p.mois_concerne] = parseFloat(p.total_paye);
      });

      const entreeDate = new Date(loc.date_entree);
      const startMonth = entreeDate.getFullYear() === currentYear ? entreeDate.getMonth() + 1 : 1;
      
      for (let m = startMonth; m <= currentMonth; m++) {
        const totalPaye = paymentsMap[m] || 0;
        const loyer = parseFloat(loc.loyer_mensuel || 0);

        if (totalPaye < loyer) {
          totalImpayes += (loyer - totalPaye);
          nombreImpayes++;
        }
      }
    }

    // Derniers paiements
    const derniersPaiements = await pool.query(`
      SELECT p.*, l.nom as locataire_nom, l.prenom as locataire_prenom,
        a.numero as appartement_numero, i.nom as immeuble_nom
      FROM paiements p
      JOIN locataires l ON l.id = p.locataire_id
      JOIN appartements a ON a.id = p.appartement_id
      JOIN immeubles i ON i.id = a.immeuble_id
      WHERE i.user_id = $1
      ORDER BY p.created_at DESC LIMIT 5
    `, [userId]);

    res.json({
      immeubles: parseInt(immeublesCount.rows[0].count),
      appartements: parseInt(appartementsCount.rows[0].count),
      appartements_occupes: parseInt(appartementsOccupes.rows[0].count),
      locataires: parseInt(locatairesCount.rows[0].count),
      revenus_total: parseFloat(revenus.rows[0].total),
      revenus_mensuels: revenusMensuels.rows,
      depenses_total: parseFloat(depenses.rows[0].total),
      depenses_mensuelles: depensesMensuelles.rows,
      impayes_total: totalImpayes,
      impayes_nombre: nombreImpayes,
      derniers_paiements: derniersPaiements.rows,
      annee: currentYear
    });
  } catch (error) {
    console.error('Erreur dashboard:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
