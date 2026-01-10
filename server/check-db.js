const { Client } = require('pg');
const readline = require('readline');

// Configuration
const config = {
  user: 'postgres',
  host: 'aixilcoils-db.cg9egmgqyh6e.us-east-1.rds.amazonaws.com', // Updated endpoint
  database: 'postgres',
  port: 5432,
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('--- Database Connection Tester ---');
console.log(`Target: ${config.host}`);
console.log(`User: ${config.user}`);

rl.question('Enter your Database Master Password: ', (password) => {
  // Hide password in logs if possible, but standard stdin shows it.
  // For a simple local test script, this is acceptable.
  
  const client = new Client({
    user: config.user,
    host: config.host,
    database: config.database,
    password: password,
    port: config.port,
    ssl: { rejectUnauthorized: false }
  });

  console.log('\nAttempting to connect...');

  client.connect()
    .then(() => {
      console.log('✅ SUCCESS! Connection established.');
      console.log('\nYour Database Connection String for App Runner is:');
      console.log(`postgresql://${config.user}:${password}@${config.host}:${config.port}/${config.database}`);
      client.end();
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ CONNECTION FAILED');
      console.error('Error:', err.message);
      if (err.message.includes('password')) {
        console.log('Tip: Double check your password.');
      } else if (err.message.includes('getaddrinfo') || err.message.includes('ETIMEDOUT')) {
        console.log('Tip: Check if "Public access" is set to "Yes" in AWS RDS Console.');
        console.log('Tip: Check your Security Groups allow access from anywhere (0.0.0.0/0).');
      }
      process.exit(1);
    });
    
  rl.close();
});
