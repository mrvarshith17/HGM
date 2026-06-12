const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./firebase-db');
const {
  readLocalSalons,
  addLocalSalon,
  getLocalSalon,
  getLocalSalonsByOwner,
  updateLocalSalon,
  deleteLocalSalon,
} = require('../lib/local-salon-store');

const router = express.Router();

// Helper to check if error is Firestore not found
function isFirestoreError(error) {
  return error?.code === 5 || error?.message?.includes('NOT_FOUND') || error?.message?.includes('firestore');
}

// Get all salons or filter by ownerId
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { ownerId } = req.query;

    let query = db.collection('salons');
    if (ownerId) {
      query = query.where('ownerId', '==', ownerId);
    }

    const snapshot = await query.get();
    const salons = [];
    snapshot.forEach(doc => {
      const salonData = doc.data();
      // Ensure rating and reviewCount always exist
      salons.push({
        id: doc.id,
        ...salonData,
        rating: salonData.rating || 0,
        reviewCount: salonData.reviewCount || 0,
      });
    });

    res.json(salons);
  } catch (error) {
    console.error('Get salons error (trying local fallback):', error.message);
    
    // Fallback to local storage
    try {
      const allSalons = await readLocalSalons();
      const { ownerId } = req.query;
      const filtered = ownerId
        ? allSalons.filter(s => s.ownerId === ownerId)
        : allSalons;
      
      // Ensure rating and reviewCount always exist
      const withDefaults = filtered.map(s => ({
        ...s,
        rating: s.rating || 0,
        reviewCount: s.reviewCount || 0,
      }));
      
      res.json(withDefaults);
    } catch (fallbackError) {
      console.error('Local fallback error:', fallbackError);
      res.status(500).json({ error: 'Failed to fetch salons' });
    }
  }
});

// Create new salon
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const { ownerId, name, address, phone, description, email, city, services, operatingHours, profilePicture } = req.body;

    if (!ownerId || !name || !address || !phone || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const salonId = uuidv4();
    const now = new Date();
    const salonServices = Array.isArray(services)
      ? [...new Set(services.map(service => String(service).trim()).filter(Boolean))]
      : [];

    await db.collection('salons').doc(salonId).set({
      ownerId,
      name,
      address,
      phone,
      description,
      email: email || '',
      city: city || '',
      rating: 0,
      reviewCount: 0,
      services: salonServices,
      profilePicture: profilePicture || '',
      operatingHours: operatingHours || {},
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json({ id: salonId, message: 'Salon created successfully' });
  } catch (error) {
    console.error('Create salon error (trying local fallback):', error.message);
    
    // Fallback to local storage
    try {
      const { ownerId, name, address, phone, description, email, city, services, operatingHours, profilePicture } = req.body;
      
      if (!ownerId || !name || !address || !phone || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const salonId = uuidv4();
      const salonServices = Array.isArray(services)
        ? [...new Set(services.map(service => String(service).trim()).filter(Boolean))]
        : [];

      const newSalon = await addLocalSalon({
        id: salonId,
        ownerId,
        name,
        address,
        phone,
        description,
        email: email || '',
        city: city || '',
        rating: 0,
        reviewCount: 0,
        services: salonServices,
        profilePicture: profilePicture || '',
        operatingHours: operatingHours || {},
      });

      res.status(201).json({ id: newSalon.id, message: 'Salon created successfully (local)' });
    } catch (fallbackError) {
      console.error('Local fallback error:', fallbackError);
      res.status(500).json({ error: 'Failed to create salon' });
    }
  }
});

// Get specific salon
router.get('/:salonId', async (req, res) => {
  try {
    const db = getDb();
    const { salonId } = req.params;

    const salonDoc = await db.collection('salons').doc(salonId).get();

    if (!salonDoc.exists) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    res.json({ id: salonDoc.id, ...salonDoc.data() });
  } catch (error) {
    console.error('Get salon error (trying local fallback):', error.message);
    
    // Fallback to local storage
    try {
      const { salonId } = req.params;
      const salon = await getLocalSalon(salonId);
      
      if (!salon) {
        return res.status(404).json({ error: 'Salon not found' });
      }
      
      res.json(salon);
    } catch (fallbackError) {
      console.error('Local fallback error:', fallbackError);
      res.status(500).json({ error: 'Failed to fetch salon' });
    }
  }
});

// Update salon
router.put('/:salonId', async (req, res) => {
  try {
    const db = getDb();
    const { salonId } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    await db.collection('salons').doc(salonId).update(updateData);

    res.json({ message: 'Salon updated successfully' });
  } catch (error) {
    console.error('Update salon error (trying local fallback):', error.message);
    
    // Fallback to local storage
    try {
      const { salonId } = req.params;
      const updateData = { ...req.body, updatedAt: new Date() };
      
      await updateLocalSalon(salonId, updateData);
      res.json({ message: 'Salon updated successfully (local)' });
    } catch (fallbackError) {
      console.error('Local fallback error:', fallbackError);
      res.status(500).json({ error: 'Failed to update salon' });
    }
  }
});

// Delete salon
router.delete('/:salonId', async (req, res) => {
  try {
    const db = getDb();
    const { salonId } = req.params;

    await db.collection('salons').doc(salonId).delete();

    res.json({ message: 'Salon deleted successfully' });
  } catch (error) {
    console.error('Delete salon error (trying local fallback):', error.message);
    
    // Fallback to local storage
    try {
      const { salonId } = req.params;
      await deleteLocalSalon(salonId);
      res.json({ message: 'Salon deleted successfully (local)' });
    } catch (fallbackError) {
      console.error('Local fallback error:', fallbackError);
      res.status(500).json({ error: 'Failed to delete salon' });
    }
  }
});

module.exports = router;
