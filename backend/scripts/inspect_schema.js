require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  const tableName = process.argv[2];

  if (!tableName) {
    console.error('Usage: node scripts/inspect_schema.js <tableName>');
    console.error('Example: node scripts/inspect_schema.js tcns_can_bo');
    process.exit(1);
  }

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

    const schema = await collection.findOne({ tableName });

    if (!schema) {
      console.error(`❌ Schema "${tableName}" not found`);
      process.exit(1);
    }

    console.log(`\n=== Schema: ${schema.tableName} ===\n`);

    console.log(`📋 Basic Info:`);
    console.log(`  Description: ${schema.description}`);
    console.log(`  Fields Count: ${schema.fieldsCount}`);
    console.log(`  Records Count: ${schema.recordsCount}`);
    console.log(`  Data From: ${schema.dataFrom}`);
    console.log(`  API: ${schema.dataFromMethod} ${schema.dataFromApi}`);
    if (schema.primaryKey) {
      console.log(`  Primary Key: ${schema.primaryKey.join(', ')}`);
    }
    console.log(`  Created: ${schema.createdAt}`);
    console.log(`  Updated: ${schema.updatedAt}`);

    if (schema.details && schema.details.length > 0) {
      console.log(`\n📊 Current Fields (${schema.details.length}):`);
      console.log('─'.repeat(80));
      schema.details.forEach((field, idx) => {
        console.log(`${idx + 1}. ${field.name}`);
        console.log(
          `   Type: ${field.type}${field.length ? ` | Length: ${field.length}` : ''}`,
        );
        if (field.description)
          console.log(`   Description: ${field.description}`);
      });
    }

    if (schema.oldDetails && schema.oldDetails.length > 0) {
      console.log(`\n📋 Old Fields (${schema.oldDetails.length}):`);
      console.log('─'.repeat(80));
      schema.oldDetails.forEach((field, idx) => {
        console.log(`${idx + 1}. ${field.name}`);
        console.log(
          `   Type: ${field.type}${field.length ? ` | Length: ${field.length}` : ''}`,
        );
        if (field.description)
          console.log(`   Description: ${field.description}`);
      });
    }

    console.log('\n✅ Full JSON:\n');
    console.log(JSON.stringify(schema, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
