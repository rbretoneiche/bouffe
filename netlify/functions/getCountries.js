import { neon } from '@neondatabase/serverless';

// Docs on request and context https://docs.netlify.com/functions/build/#code-your-function-2
exports.handler = async (request, context) => {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const rows = await sql('SELECT * FROM countries;');
    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({error: error.message}),
    };
  }
}
