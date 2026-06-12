const express = require('express');
const Replicate = require('replicate');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./firebase-db');

const router = express.Router();
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN_2,
});

// Generate hairstyle preview
router.post('/preview', async (req, res) => {
  try {
    const db = getDb();
    const { userId, imageUrl, hairstyleDescription } = req.body;

    if (!imageUrl || !hairstyleDescription) {
      return res.status(400).json({
        error: 'Image URL and hairstyle description required',
      });
    }

    // Call Replicate API for image generation
    const output = await replicate.run(
      'stability-ai/stable-diffusion:ac732df83cea7fff18b51f1b8feed8ffaeb6f47e4378e50fc034497371c3cb65',
      {
        input: {
          prompt: `Professional hairstyle: ${hairstyleDescription}. High quality photo.`,
          image: imageUrl,
          guidance_scale: 7.5,
          num_outputs: 1,
        },
      }
    );

    const previewId = uuidv4();
    const previewData = {
      previewId,
      userId,
      originalImage: imageUrl,
      hairstyleDescription,
      previewImage: output[0] || null,
      createdAt: new Date(),
    };

    await db.collection('hairstyle_previews').doc(previewId).set(previewData);

    res.status(201).json({
      message: 'Hairstyle preview generated successfully',
      preview: previewData,
    });
  } catch (error) {
    console.error('Hairstyle preview error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user hairstyle previews
router.get('/user/:userId', async (req, res) => {
  try {
    const db = getDb();
    const { userId } = req.params;
    const previewsSnapshot = await db
      .collection('hairstyle_previews')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const previews = [];
    previewsSnapshot.forEach((doc) => {
      previews.push({ id: doc.id, ...doc.data() });
    });

    res.json(previews);
  } catch (error) {
    console.error('Get previews error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get popular hairstyle styles
router.get('/styles/popular', async (req, res) => {
  try {
    const styles = [
      {
        id: '1',
        name: 'Bob Cut',
        description: 'Classic shoulder-length cut with layers',
        image: 'bob-cut',
      },
      {
        id: '2',
        name: 'Undercut',
        description: 'Modern style with short sides and longer top',
        image: 'undercut',
      },
      {
        id: '3',
        name: 'Long Waves',
        description: 'Flowing waves for a romantic look',
        image: 'long-waves',
      },
      {
        id: '4',
        name: 'Pixie Cut',
        description: 'Short and chic for a bold statement',
        image: 'pixie-cut',
      },
      {
        id: '5',
        name: 'Braids',
        description: 'Intricate braiding styles for elegance',
        image: 'braids',
      },
      {
        id: '6',
        name: 'Mohawk',
        description: 'Edgy and modern with styled center strip',
        image: 'mohawk',
      },
    ];

    res.json(styles);
  } catch (error) {
    console.error('Get styles error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
