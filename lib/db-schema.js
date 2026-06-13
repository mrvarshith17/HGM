/**
 * Database Schema Initialization
 * Initializes Firestore collections and indexes for the HGM app
 */

const { getDb } = require('./mongo-firestore-adapter');

async function initializeCollections() {
  try {
    const db = getDb();
    console.log('[DB Schema] Initializing database collections...');

    // Create sample documents to ensure collections exist
    const collections = {
      users: {
        docId: '_meta',
        data: { type: 'metadata', initialized: true }
      },
      salons: {
        docId: '_meta',
        data: { type: 'metadata', initialized: true }
      },
      bookings: {
        docId: '_meta',
        data: { type: 'metadata', initialized: true }
      },
      reviews: {
        docId: '_meta',
        data: { type: 'metadata', initialized: true }
      },
      favorites: {
        docId: '_meta',
        data: { type: 'metadata', initialized: true }
      }
    };

    for (const [collectionName, { docId, data }] of Object.entries(collections)) {
      try {
        const docRef = db.collection(collectionName).doc(docId);
        const docSnap = await docRef.get();
        
        if (!docSnap.exists) {
          await docRef.set(data);
          console.log(`[DB Schema] ✓ Collection created: ${collectionName}`);
        }
      } catch (error) {
        console.warn(`[DB Schema] Could not initialize collection ${collectionName}:`, error.message);
      }
    }

    console.log('[DB Schema] ✓ Database schema initialized');
  } catch (error) {
    console.error('[DB Schema] Initialization error:', error);
  }
}

module.exports = { initializeCollections };
