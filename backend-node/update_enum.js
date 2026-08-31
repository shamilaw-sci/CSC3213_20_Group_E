const fs = require('fs');
const { Client } = require('./backend-node/node_modules/pg');

const envFile = fs.readFileSync('.env', 'utf8');
const dbLine = envFile.split('\n').find(l => l.startsWith('DATABASE_URL='));
const dbUrl = dbLine ? dbLine.substring('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '') : '';

async function main() {
    console.log('Connecting to PostgreSQL to update user_role enum...');
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('Connected to DB.');
    
    try {
        await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'BANNED'");
        console.log("Added 'BANNED' to user_role enum.");
    } catch (e) {
        console.warn("Notice for BANNED:", e.message);
    }

    try {
        await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'REJECTED_AGENT'");
        console.log("Added 'REJECTED_AGENT' to user_role enum.");
    } catch (e) {
        console.warn("Notice for REJECTED_AGENT:", e.message);
    }

    await client.end();
    console.log('Enum update completed!');
}

main().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
