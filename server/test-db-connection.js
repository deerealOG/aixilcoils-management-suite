const { Client } = require('pg');

const connectionString = process.argv[2];

if (!connectionString) {
  console.error('Please provide a connection string as an argument.');
  console.error('Usage: node test-db-connection.js "postgresql://user:pass@host:5432/db"');
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false } // Required for some RDS configurations
});

console.log('Testing connection to:', connectionString.replace(/:[^:@]*@/, ':****@'));

client.connect()
  .then(() => {
    console.log('✅ Success! Connected to the database.');
    return client.end();
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
