import {Context} from '@netlify/functions'
import {neon} from "@neondatabase/serverless";

export async function handler(request: any, context: Context) {

  try {
    const sql = neon(process.env.DATABASE_URL);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    };
    if (request.httpMethod === "OPTIONS") {
      console.log('request.body')

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({message: "Successful preflight call."}),
      };
    } else if (request.httpMethod === "POST") {
      console.log(request.body)
      const {countryName} = JSON.parse(request.body);
      await sql.query(`INSERT INTO countries (name)  VALUES ('${countryName}');`)
      return {
        statusCode: 200,
        headers,
      };
    }
    return {
      statusCode: 200,
      headers,
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
