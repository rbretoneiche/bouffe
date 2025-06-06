import {neon} from "@neondatabase/serverless";

require("dotenv").config();

// export default (request: Request, context: Context) => {
//   try {
//     const sql = neon(process.env.DATABASE_URL);
//
//     const url = new URL(request.url)
//     const subject = url.searchParams.get('name') || 'World'
//
//     return new Response(`Hello ${subject}`)
//   } catch (error) {
//     return new Response(error.toString(), {
//       status: 500,
//     })
//   }
// }

export async function handler(event) {
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
      body: JSON.stringify(error),
    };
  }
}
