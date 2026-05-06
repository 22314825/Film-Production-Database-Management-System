import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function reset() {
    const filePath = path.join(__dirname, 'Reset.sql');
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('Running Reset.sql...');

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();

    try {
        await client.query(content);
        console.log('  ✓ Reset completed');
    } catch (err) {
        console.error('  ✗ Reset failed:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

reset();
