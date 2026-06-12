const express = require('express');
const { getDb } = require('./firebase-db');

const router = express.Router();

// Get user dashboard data
router.get('/user/:userId', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;

    // Get user info
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get upcoming bookings
    const bookingsSnapshot = await db
      .collection('bookings')
      .where('userId', '==', userId)
      .where('status', 'in', ['confirmed', 'pending'])
      .orderBy('appointmentDate', 'asc')
      .limit(5)
      .get();

    const bookings = [];
    for (const doc of bookingsSnapshot.docs) {
      const bookingData = doc.data();
      const salonDoc = await db.collection('salons').doc(bookingData.salonId).get();
      bookings.push({
        id: doc.id,
        ...bookingData,
        salon: salonDoc.data(),
      });
    }

    // Get past bookings (completed)
    const pastBookingsSnapshot = await db
      .collection('bookings')
      .where('userId', '==', userId)
      .where('status', '==', 'completed')
      .orderBy('appointmentDate', 'desc')
      .limit(5)
      .get();

    const pastBookings = [];
    for (const doc of pastBookingsSnapshot.docs) {
      pastBookings.push({ id: doc.id, ...doc.data() });
    }

    res.json({
      user: { id: userDoc.id, ...userDoc.data() },
      upcomingBookings: bookings,
      pastBookings,
      bookingCount: bookings.length + pastBookings.length,
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get salon dashboard data (for salon owner)
router.get('/salon/:salonId', async (req, res) => {
  try {
    const db = getDb();
    const { salonId } = req.params;

    // Get salon info
    const salonDoc = await db.collection('salons').doc(salonId).get();
    if (!salonDoc.exists) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookingsSnapshot = await db
      .collection('bookings')
      .where('salonId', '==', salonId)
      .where('appointmentDate', '>=', today.toISOString().split('T')[0])
      .where('appointmentDate', '<', tomorrow.toISOString().split('T')[0])
      .orderBy('appointmentTime', 'asc')
      .get();

    const todayBookings = [];
    for (const doc of todayBookingsSnapshot.docs) {
      const bookingData = doc.data();
      const userDoc = await db.collection('users').doc(bookingData.userId).get();
      todayBookings.push({
        id: doc.id,
        ...bookingData,
        user: userDoc.data(),
      });
    }

    // Get upcoming bookings (next 7 days)
    const upcomingBookingsSnapshot = await db
      .collection('bookings')
      .where('salonId', '==', salonId)
      .where('status', '==', 'confirmed')
      .orderBy('appointmentDate', 'asc')
      .limit(20)
      .get();

    const upcomingBookings = [];
    for (const doc of upcomingBookingsSnapshot.docs) {
      upcomingBookings.push({ id: doc.id, ...doc.data() });
    }

    // Get reviews
    const reviewsSnapshot = await db
      .collection('reviews')
      .where('salonId', '==', salonId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const reviews = [];
    reviewsSnapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });

    // Get revenue summary (placeholder - implement actual logic)
    const completedBookingsSnapshot = await db
      .collection('bookings')
      .where('salonId', '==', salonId)
      .where('status', '==', 'completed')
      .get();

    const stats = {
      totalBookings: todayBookings.length + upcomingBookings.length,
      todayBookings: todayBookings.length,
      totalCompleted: completedBookingsSnapshot.size,
      averageRating: salonDoc.data().rating || 0,
    };

    res.json({
      salon: { id: salonDoc.id, ...salonDoc.data() },
      todayBookings,
      upcomingBookings,
      reviews,
      stats,
    });
  } catch (error) {
    console.error('Get salon dashboard error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get analytics
router.get('/analytics/:salonId', async (req, res) => {
  try {
    const db = getDb();
    const { salonId } = req.params;

    const bookingsSnapshot = await db
      .collection('bookings')
      .where('salonId', '==', salonId)
      .get();

    let totalBookings = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;

    bookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      totalBookings++;
      if (booking.status === 'completed') completedBookings++;
      if (booking.status === 'cancelled') cancelledBookings++;
    });

    const analytics = {
      totalBookings,
      completedBookings,
      cancelledBookings,
      completionRate:
        totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(2) : 0,
      cancellationRate:
        totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(2) : 0,
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
