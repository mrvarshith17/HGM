const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./firebase-db');
const {
  addLocalBooking,
  getLocalUserBookings,
  getLocalSalonBookings,
  getLocalBooking,
  updateLocalBooking,
  cancelLocalBooking,
} = require('../lib/local-booking-store');

const router = express.Router();

// Create booking
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    console.log('[Bookings] POST / received body:', JSON.stringify(req.body));
    const {
      userId,
      salonId,
      serviceId,
      services,
      customerName,
      customerEmail,
      customerPhone,
      appointmentDate,
      appointmentTime,
      notes,
    } = req.body;

    console.log('[Bookings] Extracted fields:', { userId, salonId, appointmentDate, appointmentTime });

    if (!userId || !salonId || !appointmentDate || !appointmentTime) {
      console.log('[Bookings] Validation failed - missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const bookingId = uuidv4();
    const selectedServices = Array.isArray(services)
      ? [...new Set(services.map(service => String(service).trim()).filter(Boolean))]
      : [];
    const bookingData = {
      bookingId,
      userId,
      salonId,
      serviceId: serviceId || selectedServices[0] || null,
      services: selectedServices,
      customerName: customerName || '',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      appointmentDate,
      appointmentTime,
      notes: notes || '',
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('bookings').doc(bookingId).set(bookingData);

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId,
      booking: bookingData,
    });
  } catch (error) {
    console.error('Create booking error:', error.message);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get user bookings
router.get('/user/:userId', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;
    const bookingsSnapshot = await db
      .collection('bookings')
      .where('userId', '==', userId)
      .orderBy('appointmentDate', 'desc')
      .get();

    const bookings = [];
    for (const doc of bookingsSnapshot.docs) {
      const bookingData = doc.data();
      const salonDoc = await db.collection('salons').doc(bookingData.salonId).get();
      const salonData = salonDoc.data() || {};
      bookings.push({
        id: doc.id,
        ...bookingData,
        salon: {
          ...salonData,
          services: Array.isArray(salonData.services) ? salonData.services : [],
        },
      });
    }

    res.json(bookings);
  } catch (error) {
    console.error('Get user bookings error:', error.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get salon bookings (for salon owner)
router.get('/salon/:salonId', async (req, res) => {
  try {
    const db = getDb();
    const { salonId } = req.params;
    const bookingsSnapshot = await db
      .collection('bookings')
      .where('salonId', '==', salonId)
      .orderBy('appointmentDate', 'asc')
      .get();

    const bookings = [];
    for (const doc of bookingsSnapshot.docs) {
      const bookingData = doc.data();
      const userDoc = await db.collection('users').doc(bookingData.userId).get();
      bookings.push({
        id: doc.id,
        ...bookingData,
        user: userDoc.data(),
      });
    }

    res.json(bookings);
  } catch (error) {
    console.error('Get salon bookings error:', error.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get single booking
router.get('/:bookingId', async (req, res) => {
  try {
    const db = getDb();
    const { bookingId } = req.params;
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ id: bookingDoc.id, ...bookingDoc.data() });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update booking status
router.put('/:bookingId', async (req, res) => {
  try {
    const db = getDb();
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.collection('bookings').doc(bookingId).update({
      status,
      updatedAt: new Date(),
    });

    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Update booking error:', error.message);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// Cancel booking
router.post('/:bookingId/cancel', async (req, res) => {
  try {
    const db = getDb();
    const { bookingId } = req.params;

    await db.collection('bookings').doc(bookingId).update({
      status: 'cancelled',
      updatedAt: new Date(),
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error.message);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

module.exports = router;
