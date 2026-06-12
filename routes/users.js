const express = require('express');
const { getDb } = require('./firebase-db');

const router = express.Router();

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update user profile
router.put('/:userId', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    await db.collection('users').doc(userId).update(updateData);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get favorite salons
router.get('/:userId/favorites', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;
    const favoritesSnapshot = await db
      .collection('favorites')
      .where('userId', '==', userId)
      .get();

    const favorites = [];
    for (const doc of favoritesSnapshot.docs) {
      const favData = doc.data();
      const salonDoc = await db.collection('salons').doc(favData.salonId).get();
      favorites.push({
        id: doc.id,
        ...salonDoc.data(),
      });
    }

    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add favorite salon
router.post('/:userId/favorites', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;
    const { salonId } = req.body;

    if (!salonId) {
      return res.status(400).json({ error: 'Salon ID required' });
    }

    const docId = `${userId}_${salonId}`;
    await db.collection('favorites').doc(docId).set({
      userId,
      salonId,
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Favorite added successfully' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Remove favorite salon
router.delete('/:userId/favorites/:salonId', async (req, res) => {
  try {
    const db = getDb();
    const { userId, salonId } = req.params;
    const docId = `${userId}_${salonId}`;

    await db.collection('favorites').doc(docId).delete();

    res.json({ message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
