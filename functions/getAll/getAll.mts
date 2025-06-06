import {neon} from "@neondatabase/serverless";

export async function handler(event) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql.query('SELECT * FROM countries order by date desc;');
    return {
      statusCode: 200,
      body: JSON.stringify(rows), headers: {
        'access-control-allow-origin': '*'
      }

    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error), headers: {
        'access-control-allow-origin': '*'
      }
    };
  }
}
