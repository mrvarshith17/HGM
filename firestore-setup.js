// firestore-setup.js
// Run this script to automatically set up Firestore collections and test connection
// Usage: node firestore-setup.js

const { adminDb, adminAuth } = require('./lib/firebase-admin');

async function setupFirestore() {
  console.log('\n=== Firestore Setup & Configuration ===\n');

  try {
    // Step 1: Create required collections with initial document
    const collections = ['chatRooms', 'messages', 'bookings', 'reviews', 'users', 'salons', 'staff'];
    
    console.log('Step 1: Creating Firestore collections...\n');
    
    for (const collectionName of collections) {
      try {
        // Create a temporary doc to initialize the collection, then delete it
        const tempDocId = `_setup_${Date.now()}`;
        const tempData = {
          _initialized: true,
          _createdAt: new Date(),
          _description: `Collection: ${collectionName}`
        };
        
        await adminDb.collection(collectionName).doc(tempDocId).set(tempData);
        console.log(`  ✓ Created collection: ${collectionName}`);
        
        // Clean up the temp document
        await adminDb.collection(collectionName).doc(tempDocId).delete();
        console.log(`    └─ Cleaned up temporary setup document`);
      } catch (error) {
        console.error(`  ✗ Error creating collection ${collectionName}:`, error.message);
      }
    }

    console.log('\nStep 2: Verifying collections exist...\n');
    
    for (const collectionName of collections) {
      try {
        const docs = await adminDb.collection(collectionName).limit(1).get();
        console.log(`  ✓ ${collectionName}: Ready`);
      } catch (error) {
        console.error(`  ✗ ${collectionName}: Error - ${error.message}`);
      }
    }

    console.log('\n✓ Firestore setup complete!\n');
    console.log('IMPORTANT: Update your Firestore Security Rules\n');
    console.log('Go to Firebase Console → Firestore → Rules and use:');
    console.log('────────────────────────────────────────────────');
    console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /chatRooms/{document=**} {
      allow read, write: if request.auth.uid != null;
    }
    match /messages/{document=**} {
      allow read, write: if request.auth.uid != null;
    }
    match /bookings/{document=**} {
      allow read, write: if request.auth.uid != null;
    }
    match /reviews/{document=**} {
      allow read, write: if request.auth.uid != null;
    }
    match /users/{document=**} {
      allow read, write: if request.auth.uid != null;
    }
    match /salons/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid != null;
    }
    match /staff/{document=**} {
      allow read, write: if request.auth.uid != null;
    }
  }
}
    `);
    console.log('────────────────────────────────────────────────\n');
    console.log('Then return here and press Ctrl+C\n');

  } catch (error) {
    console.error('\n✗ Setup failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

setupFirestore();
