# AI Hairstyle Preview Feature

## Overview

The AI Hairstyle Preview feature allows users to visualize how they would look with different hairstyles before visiting a salon. Powered by Replicate's Stable Diffusion 3 model, the system generates high-quality previews of users with selected hairstyles.

## How It Works

### User Flow

1. **Upload Selfie** 📷
   - User navigates to the Hairstyle Preview page
   - Uploads a clear front-facing photo of themselves
   - Image is validated (PNG/JPG, <5MB)

2. **Select Hairstyle** ✂️
   - Choose from 8+ pre-defined hairstyle options:
     - Fade Cut
     - Buzz Cut
     - Pompadour
     - Undercut
     - Textured Crop
     - Beard Style
     - Long Waves
     - Bob Cut
   - Or provide custom description (e.g., "Long hair with bangs")

3. **Generate Preview** ✨
   - AI generates a portrait showing the user with the selected hairstyle
   - Process takes 30-60 seconds
   - Uses Stable Diffusion 3 model for high-quality results

4. **View & Share** 📸
   - Original photo displayed side-by-side with preview
   - User can download the preview image
   - Preview is automatically saved to user's profile
   - Can share with friends or stylist

## Technology Stack

### Backend
- **Replicate API** - AI image generation
- **Model**: `stability-ai/stable-diffusion-3-medium`
- **Database**: Firestore (stores preview history)
- **Next.js API Routes** - Backend endpoints

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Features

✅ **AI-Powered Generation**
- Uses advanced Stable Diffusion 3 model
- Professional quality results
- Optimized prompt engineering

✅ **Pre-defined Hairstyles**
- 8+ popular salon hairstyles
- Customizable descriptions
- Easy to use interface

✅ **Image Management**
- Upload validation (type, size)
- Base64 encoding for instant display
- Download generated previews

✅ **Database Storage**
- History of all generated previews
- User can view past generations
- Linked to user profile

✅ **User Experience**
- Step-by-step guidance
- Loading indicators
- Error handling & messages
- Tips for best results

## API Endpoints

### Generate Hairstyle Preview
```
POST /api/hairstyle-preview

Body:
{
  "hairstyleDescription": "short bob with layers",
  "imageUrl": "data:image/png;base64,...",
  "userId": "user123" (optional)
}

Response:
{
  "success": true,
  "images": ["https://..."],
  "description": "short bob with layers"
}
```

### Get User Previews
```
GET /api/hairstyle-preview/user/:userId

Response:
{
  "success": true,
  "previews": [
    {
      "id": "preview123",
      "userId": "user123",
      "originalImage": "data:image/...",
      "hairstyleDescription": "fade cut",
      "previewImage": "https://...",
      "createdAt": "2024-06-13T10:30:00Z"
    }
  ]
}
```

## Component Structure

### Pages
- **`app/hairstyle/page.tsx`** - Main hairstyle preview page
  - Displays step-by-step guide
  - Sidebar with tips and features
  - Integrates HairstylePreview component

### Components
- **`components/hairstyle-preview.tsx`** - Core preview component
  - Image upload handler
  - Hairstyle selection
  - API call to generate preview
  - Results display with download option

### Services
- **`lib/db-hairstyle-service.ts`** - Database operations
  - Save preview to DB
  - Get user's preview history
  - Delete previews

## Hairstyle Presets

The system includes 8 pre-defined hairstyles:

| Hairstyle | Description |
|-----------|-------------|
| Fade Cut | Short fade with sharp lines |
| Buzz Cut | Uniform short buzz cut |
| Pompadour | Classic pompadour with volume |
| Undercut | Modern undercut style |
| Textured Crop | Short textured crop |
| Beard Style | Full beard with styling |
| Long Waves | Long flowing wavy hair |
| Bob Cut | Classic bob with layers |

## Environment Variables

Required environment variable:

```
REPLICATE_API_TOKEN_2=r8_ZGJMq00O6yGr9oqxvvAMF9I5oIYEKlh00diH9
```

## Usage Examples

### Frontend - Component Usage
```typescript
import HairstylePreview from '@/components/hairstyle-preview'

export default function HairstylePage() {
  return <HairstylePreview />
}
```

### API - Generate Preview
```typescript
const response = await fetch('/api/hairstyle-preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    hairstyleDescription: 'fade cut',
    imageUrl: 'data:image/png;base64,...',
    userId: 'user123'
  }),
})

const data = await response.json()
console.log(data.images) // Array of generated image URLs
```

### Database - Get Previews
```typescript
import { getUserHairstylePreviews } from '@/lib/db-hairstyle-service'

const previews = await getUserHairstylePreviews('user123')
console.log(previews) // Array of saved previews
```

## Tips for Best Results

1. **Image Quality**
   - Use a clear, well-lit front-facing photo
   - Make sure your full face is visible
   - Avoid filters or heavy makeup
   - Use JPG or PNG format
   - File size under 5MB

2. **Hairstyle Description**
   - Be specific about the style
   - Mention key features (length, texture, color)
   - Use salon terminology for better results
   - Examples: "short textured fade", "long wavy with bangs"

3. **Timing**
   - Generation takes 30-60 seconds
   - Don't refresh page during generation
   - Be patient for best quality results

## Performance

- **Generation Time**: 30-60 seconds per preview
- **Image Resolution**: 512x512 pixels
- **Model Inference Steps**: 28
- **Guidance Scale**: 7.5 (optimal quality-speed tradeoff)

## Database Schema

### hairstyle_previews Collection
```
{
  previewId: string,
  userId: string,
  originalImage: string (base64 or URL),
  hairstyleDescription: string,
  previewImage: string (URL),
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Navigation Integration

The hairstyle preview feature is available:
- **Location**: Main navigation bar (customers only)
- **Link**: `/hairstyle`
- **Label**: `✨ Hairstyles`
- **Access**: Logged-in customers only

## Error Handling

The system handles:
- Missing or invalid images
- Unsupported file types
- File size violations
- API token misconfiguration
- Network errors
- Generation failures

## Future Enhancements

Potential improvements:
- [ ] Batch preview generation (multiple styles at once)
- [ ] AR try-on feature
- [ ] Integration with salon booking
- [ ] Sharing previews with stylists
- [ ] AI-suggested hairstyles based on face shape
- [ ] Hairstyle history with favorites
- [ ] Comparison slider between original and preview

## Troubleshooting

### "Replicate API token not configured"
- Check `.env.local` has `REPLICATE_API_TOKEN_2`
- Restart server after updating env

### "Generation failed"
- Ensure image is clear and well-lit
- Try with a different hairstyle description
- Check API token is valid

### Slow generation
- This is normal (30-60 seconds)
- Don't refresh page
- Be patient for results

### Preview not saving
- Check user is logged in
- Verify database permissions
- Check browser console for errors
