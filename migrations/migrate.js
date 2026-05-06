import { Pool } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
    const files = fs.readdirSync(__dirname)
        .filter(f => /^\d+.*\.sql$/i.test(f))
        .sort();

    if (files.length === 0) {
        console.log('No migration files found.');
        return;
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();

    try {
        for (const file of files) {
            const filePath = path.join(__dirname, file);
            const content = fs.readFileSync(filePath, 'utf8');
            console.log(`Running migration: ${file}`);
            try {
                await client.query(content);
                console.log(`  ✓ ${file} completed`);
            } catch (err) {
                console.error(`  ✗ ${file} failed:`, err.message);
                process.exit(1);
            }
        }
        console.log('All migrations completed.');
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
