const environment = require('./environment');
const pouch = require('./db');
const log = require('./log');

const getDocsToDelete = async (db, specificExtensions) => {
  if (specificExtensions && specificExtensions.length > 0) {
    const docs = [];
    for (const name of specificExtensions) {
      try {
        const doc = await db.get(`ui-extension:${name}`);
        docs.push(doc);
      } catch (err) {
        if (err.status === 404) {
          log.warn(`UI Extension "${name}" not found in database. Skipping.`);
        } else {
          throw new Error(`Failed to fetch extension "${name}": ${err.message}`);
        }
      }
    }
    return docs;
  }

  log.info('No specific extensions provided. Fetching all UI extensions...');
  const result = await db.allDocs({
    startkey: 'ui-extension:',
    endkey: 'ui-extension:\ufff0',
    include_docs: true
  });

  return result.rows.map(row => row.doc);
};

const executeDelete = async (specificExtensions = []) => {
  const db = pouch(environment.apiUrl);

  const docs = await getDocsToDelete(db, specificExtensions);

  if (!docs.length) {
    log.info('No UI extensions found to delete.');
    return;
  }

  log.info(`Deleting ${docs.length} UI extension(s)...`);

  for (const doc of docs) {
    try {
      await db.remove(doc);
      log.info(`Deleted UI Extension: ${doc._id.replace('ui-extension:', '')}`);
    } catch (err) {
      throw new Error(`Failed to delete ${doc._id}: ${err.message}`);
    }
  }
};

module.exports = {
  run: executeDelete
};
