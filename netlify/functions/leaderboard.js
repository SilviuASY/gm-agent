import { createClient } from '@libsql/client';

// Configurare Turso
const turso = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_DB_TOKEN,
});

function getUserBadge(score) {
  if (score >= 1000) return { label: "LEGEND", icon: "👑", color: "#ffd700" };
  if (score >= 500) return { label: "ELITE", icon: "⚡", color: "#c0c0c0" };
  if (score >= 250) return { label: "ACTIVE", icon: "🔥", color: "#ff6b35" };
  if (score >= 100) return { label: "RISING", icon: "⭐", color: "#c084fc" };
  if (score >= 50) return { label: "BEGINNER", icon: "🌿", color: "#4ade80" };
  return { label: "NEW", icon: "✨", color: "#9ca3af" };
}

export const handler = async (event) => {
  // Doar GET
  if (event.httpMethod !== "GET") {
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
        last_updated INTEGER DEFAULT 0
      )
    `);

    const { search, userAddress } = event.queryStringParameters || {};
    
    // Căutare utilizator specific (după adresă parțială)
    if (search) {
      const searchLower = search.toLowerCase();
      const result = await turso.execute({
        sql: `SELECT address, total_score FROM leaderboard WHERE LOWER(address) LIKE ? ORDER BY total_score DESC LIMIT 10`,
        args: [`%${searchLower}%`],
      });
      
      const users = result.rows.map((row) => ({
        address: row.address,
        truncated_address: `${row.address.slice(0, 6)}...${row.address.slice(-4)}`,
        score: row.total_score,
        badge: getUserBadge(row.total_score),
      }));
      
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ users, total: users.length }),
      };
    }
    
    // Rank-ul utilizatorului conectat
    if (userAddress) {
      const addressLower = userAddress.toLowerCase();
      
      // Obține scorul utilizatorului
      const userResult = await turso.execute({
        sql: `SELECT total_score FROM leaderboard WHERE address = ?`,
        args: [addressLower],
      });
      
      const userScore = userResult.rows[0]?.total_score || 0;
      
      // Calculează rank-ul (câți au scor mai mare)
      const rankResult = await turso.execute({
        sql: `SELECT COUNT(*) as rank FROM leaderboard WHERE total_score > ?`,
        args: [userScore],
      });
      
      const rank = (rankResult.rows[0]?.rank || 0) + 1;
      
      // Total utilizatori în leaderboard
      const totalResult = await turso.execute({
        sql: `SELECT COUNT(*) as total FROM leaderboard`,
      });
      
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ 
          rank: userScore === 0 ? null : rank,
          score: userScore,
          total_users: totalResult.rows[0]?.total || 0,
          message: userScore === 0 ? "Complete an action to appear on leaderboard!" : undefined
        }),
      };
    }
    
    // TOP 50 utilizatori
    const result = await turso.execute({
      sql: `SELECT address, total_score FROM leaderboard ORDER BY total_score DESC LIMIT 50`,
    });
    
    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      address: row.address,
      truncated_address: `${row.address.slice(0, 6)}...${row.address.slice(-4)}`,
      score: row.total_score,
      badge: getUserBadge(row.total_score),
    }));
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ leaderboard, total: leaderboard.length }),
    };
  } catch (error) {
    console.error("❌ Leaderboard error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Failed to fetch leaderboard" }),
    };
  }
};