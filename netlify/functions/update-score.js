import { createClient } from '@libsql/client';

// Configurare Turso
const turso = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_DB_TOKEN,
});

// Funcție pentru badge
function getUserBadge(score) {
  if (score >= 1000) return "LEGEND";
  if (score >= 500) return "ELITE";
  if (score >= 250) return "ACTIVE";
  if (score >= 100) return "RISING";
  if (score >= 50) return "BEGINNER";
  return "NEW";
}

export const handler = async (event) => {
  // Doar POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Creare tabel dacă nu există
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        address TEXT PRIMARY KEY,
        total_score INTEGER DEFAULT 0,
        badge TEXT DEFAULT 'NEW',
        last_updated INTEGER DEFAULT 0
      )
    `);

    const { address, points } = JSON.parse(event.body || '{}');
    
    if (!address || !points) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing address or points" }),
      };
    }

    const addressLower = address.toLowerCase();
    
    // Obține scorul curent
    const current = await turso.execute({
      sql: `SELECT total_score FROM leaderboard WHERE address = ?`,
      args: [addressLower],
    });
    
    const currentScore = current.rows[0]?.total_score || 0;
    const newScore = currentScore + points;
    const newBadge = getUserBadge(newScore);
    
    // Update sau insert
    await turso.execute({
      sql: `
        INSERT INTO leaderboard (address, total_score, badge, last_updated)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(address) DO UPDATE SET
          total_score = ?,
          badge = ?,
          last_updated = ?
      `,
      args: [addressLower, newScore, newBadge, Date.now(), newScore, newBadge, Date.now()],
    });
    
    console.log(`✅ Score updated for ${addressLower}: ${currentScore} → ${newScore}`);
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ 
        success: true, 
        address: addressLower,
        new_score: newScore,
        badge: newBadge
      }),
    };
  } catch (error) {
    console.error("❌ Update error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to update score" }),
    };
  }
};