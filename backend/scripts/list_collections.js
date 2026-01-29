require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not found in environment. Check .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      // you can add options here if needed
    });

    const db = mongoose.connection.db;
    if (!db) {
      console.error('Database object is undefined');
      process.exit(1);
    }

    const collections = await db.listCollections().toArray();
    if (!collections.length) {
      console.log('No collections found in the connected database.');
    } else {
      console.log('Collections:');
      collections.forEach((c) => console.log('- ' + c.name));
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error listing collections:', err);
    process.exit(1);
  }
}

main();
