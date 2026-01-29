require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not found in environment. Check .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);

    const client = mongoose.connection.getClient();
    const admin = client.db('admin');

    // List all databases
    const databases = await admin.admin().listDatabases();

    console.log(`\n=== MongoDB Cluster Databases & Collections ===\n`);
    console.log(`Total Databases: ${databases.databases.length}\n`);

    for (const dbInfo of databases.databases) {
      const dbName = dbInfo.name;
      const db = client.db(dbName);

      // List collections in this database
      const collections = await db.listCollections().toArray();

      console.log(
        `📦 Database: ${dbName} (${dbInfo.sizeOnDisk ? (dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2) : '?'} MB)`,
      );

      if (collections.length === 0) {
        console.log('   └─ (no collections)');
      } else {
        for (let i = 0; i < collections.length; i++) {
          const collName = collections[i].name;
          const coll = db.collection(collName);
          const docCount = await coll.countDocuments();
          const isLast = i === collections.length - 1;
          const prefix = isLast ? '   └─' : '   ├─';
          console.log(`${prefix} 📄 ${collName} (${docCount} documents)`);
        }
      }
      console.log();
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
