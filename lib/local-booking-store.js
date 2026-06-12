const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

async function readLocalBookings() {
  await ensureDataDir();
  try {
    const fileContents = await fs.readFile(BOOKINGS_FILE, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    return [];
  }
}

async function writeLocalBookings(bookings) {
  await ensureDataDir();
  try {
    await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
  } catch (error) {
    console.error('Error writing bookings file:', error);
    throw error;
  }
}

async function addLocalBooking(bookingData) {
  const bookings = await readLocalBookings();
  const newBooking = {
    ...bookingData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  bookings.push(newBooking);
  await writeLocalBookings(bookings);
  return newBooking;
}

async function getLocalUserBookings(userId) {
  const bookings = await readLocalBookings();
  return bookings.filter(b => b.userId === userId).sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
}

async function getLocalSalonBookings(salonId) {
  const bookings = await readLocalBookings();
  return bookings.filter(b => b.salonId === salonId).sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
}

async function getLocalBooking(bookingId) {
  const bookings = await readLocalBookings();
  return bookings.find(b => b.bookingId === bookingId);
}

async function updateLocalBooking(bookingId, updateData) {
  const bookings = await readLocalBookings();
  const index = bookings.findIndex(b => b.bookingId === bookingId);
  
  if (index === -1) {
    throw new Error('Booking not found');
  }
  
  bookings[index] = {
    ...bookings[index],
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  
  await writeLocalBookings(bookings);
  return bookings[index];
}

async function cancelLocalBooking(bookingId) {
  return updateLocalBooking(bookingId, { status: 'cancelled' });
}

module.exports = {
  readLocalBookings,
  writeLocalBookings,
  addLocalBooking,
  getLocalUserBookings,
  getLocalSalonBookings,
  getLocalBooking,
  updateLocalBooking,
  cancelLocalBooking,
};
