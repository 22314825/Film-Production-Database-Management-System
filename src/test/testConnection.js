import sql from '../../src/services/neonClient.js';

async function test() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log("Connection OK:", result[0].now);
  } catch (err) {
    console.error("Connection FAILED:", err);
  }
}

test();
