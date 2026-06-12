const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
const SALONS_FILE = path.join(DATA_DIR, 'salons.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

async function readLocalSalons() {
  await ensureDataDir();
  try {
    const fileContents = await fs.readFile(SALONS_FILE, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    return [];
  }
}

async function writeLocalSalons(salons) {
  await ensureDataDir();
  try {
    await fs.writeFile(SALONS_FILE, JSON.stringify(salons, null, 2));
  } catch (error) {
    console.error('Error writing salons file:', error);
    throw error;
  }
}

async function addLocalSalon(salonData) {
  const salons = await readLocalSalons();
  const newSalon = {
    id: salonData.id || uuidv4(),
    ...salonData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  salons.push(newSalon);
  await writeLocalSalons(salons);
  return newSalon;
}

async function getLocalSalon(salonId) {
  const salons = await readLocalSalons();
  return salons.find(s => s.id === salonId);
}

async function getLocalSalonsByOwner(ownerId) {
  const salons = await readLocalSalons();
  return salons.filter(s => s.ownerId === ownerId);
}

async function updateLocalSalon(salonId, updateData) {
  const salons = await readLocalSalons();
  const index = salons.findIndex(s => s.id === salonId);
  
  if (index === -1) {
    throw new Error('Salon not found');
  }
  
  salons[index] = {
    ...salons[index],
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  
  await writeLocalSalons(salons);
  return salons[index];
}

async function deleteLocalSalon(salonId) {
  const salons = await readLocalSalons();
  const filtered = salons.filter(s => s.id !== salonId);
  await writeLocalSalons(filtered);
}

module.exports = {
  readLocalSalons,
  writeLocalSalons,
  addLocalSalon,
  getLocalSalon,
  getLocalSalonsByOwner,
  updateLocalSalon,
  deleteLocalSalon,
};
