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
    const db = client.db('integration');
    const collection = db.collection('apischemas');

    const schemas = await collection.find({}).toArray();

    console.log(`\n=== API Schemas Summary (integration.apischemas) ===\n`);
    console.log(`Total Schemas: ${schemas.length}\n`);

    console.log(
      'Table Name'.padEnd(25) +
        'Fields'.padEnd(10) +
        'Records'.padEnd(10) +
        'Description',
    );
    console.log('─'.repeat(110));

    schemas.forEach((schema) => {
      console.log(
        (schema.tableName || 'N/A').padEnd(25) +
          (schema.fieldsCount || 0).toString().padEnd(10) +
          (schema.recordsCount || 0).toString().padEnd(10) +
          (schema.description || ''),
      );
    });

    console.log('\n📌 To view full details of a schema, run:');
    console.log('   node scripts/inspect_schema.js <tableName>');
    console.log(`\nExample: node scripts/inspect_schema.js tcns_can_bo\n`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
