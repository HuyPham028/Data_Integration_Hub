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

    const db = mongoose.connection.db;
    if (!db) {
      console.error('Database object is undefined');
      process.exit(1);
    }

    // Get apischemas collection
    const collection = db.collection('apischemas');
    const count = await collection.countDocuments();

    console.log(`\n=== API Schemas Collection ===`);
    console.log(`Total documents: ${count}\n`);

    if (count === 0) {
      console.log('No documents found in apischemas collection.');
    } else {
      // Get all documents
      const documents = await collection.find({}).toArray();

      console.log('Defined Tables/Schemas:');
      documents.forEach((doc, idx) => {
        console.log(`\n${idx + 1}. ${doc.name || doc._id}`);
        console.log(`   ID: ${doc._id}`);
        console.log(`   Structure:`);
        if (doc.fields) {
          console.log(`     Fields: ${JSON.stringify(doc.fields, null, 6)}`);
        } else {
          console.log(`     ${JSON.stringify(doc, null, 6)}`);
        }
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error inspecting collection:', err);
    process.exit(1);
  }
}

main();
