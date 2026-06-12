# HGM Deployment Guide

## Pre-Deployment Checklist

### Local Testing
- [ ] Run `pnpm install` successfully
- [ ] Backend starts: `node server.js` (Port 5000)
- [ ] Frontend starts: `pnpm dev` (Port 3000)
- [ ] User can register
- [ ] User can login
- [ ] Salon search works
- [ ] Can create a booking
- [ ] Dashboard displays correctly
- [ ] No console errors

### Environment Variables
- [ ] Add `REPLICATE_API_TOKEN_2` (from replicate.com)
- [ ] Add `GCP_API_KEY` (from Google Cloud)
- [ ] Verify `FIREBASE_PROJECT_ID=hgm-app-40d28`
- [ ] Check `NEXT_PUBLIC_API_URL` is set
- [ ] `.env.local` file is in `.gitignore`
- [ ] `firebase-key.json` is in `.gitignore`

### Code Quality
- [ ] No TypeScript errors: `pnpm build` succeeds
- [ ] No console warnings in dev mode
- [ ] API error handling tested
- [ ] Form validation works
- [ ] Responsive design checked

### Firebase Setup
- [ ] Firebase project created
- [ ] Firestore database initialized
- [ ] Firebase Authentication enabled
- [ ] Service account JSON downloaded
- [ ] Firestore rules configured (see below)

---

## Firebase Security Rules

Add these rules to your Firestore to secure data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read/write their own profile
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // Anyone can read salons, only owners can write
    match /salons/{salonId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.ownerId;
    }
    
    // Users can manage their own bookings
    match /bookings/{bookingId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == resource.data.userId || 
                      request.auth.uid == get(/databases/$(database)/documents/salons/$(resource.data.salonId)).data.ownerId);
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
    
    // Reviews
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    // Favorites
    match /favorites/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Hairstyle previews
    match /hairstyle_previews/{document=**} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
  }
}
```

Steps to add rules:
1. Go to Firebase Console → Firestore Database
2. Click "Rules" tab
3. Paste the rules above
4. Click "Publish"

---

## Deployment Options

### Option 1: Vercel (Recommended for Frontend)

#### Step 1: Prepare for Deployment
```bash
# Make sure everything builds
pnpm build

# Test production build locally
pnpm start

# Commit to git
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Connect to Vercel
1. Go to https://vercel.com
2. Sign in with GitHub/GitLab/Bitbucket
3. Click "New Project"
4. Select your repository
5. Framework: Next.js (auto-detected)
6. Click "Deploy"

#### Step 3: Add Environment Variables
In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add each variable:
   ```
   NEXT_PUBLIC_API_URL=<your_backend_url>
   NEXT_PUBLIC_FIREBASE_API_KEY=<key>
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=hgm-app-40d28
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<domain>
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<bucket>
   ```
3. Redeploy

#### Step 4: Configure Domain (Optional)
1. Go to Settings → Domains
2. Add your custom domain
3. Update DNS records (Vercel will provide)

### Option 2: Render (Backend Deployment)

#### Step 1: Create Web Service
1. Go to https://render.com
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Name: `hgm-backend`
6. Environment: Node
7. Build Command: `pnpm install`
8. Start Command: `node server.js`

#### Step 2: Add Environment Variables
In Render Dashboard:
1. Go to Web Service → Environment
2. Add variables:
   ```
   FIREBASE_PROJECT_ID=hgm-app-40d28
   REPLICATE_API_TOKEN_2=<key>
   GCP_API_KEY=<key>
   NODE_ENV=production
   PORT=5000
   ```
3. Deploy

#### Step 3: Update Frontend
Update `.env.local` with Render backend URL:
```
NEXT_PUBLIC_API_URL=https://hgm-backend.onrender.com/api
```

### Option 3: Railway (Backend Alternative)

#### Step 1: Deploy to Railway
1. Go to https://railway.app
2. Click "New Project"
3. Deploy from GitHub
4. Select your repository
5. Add environment variables

#### Step 2: Configure
1. Node version: 18+
2. Start command: `node server.js`
3. Port: 5000

---

## Production Checklist

### Before Going Live
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render/Railway
- [ ] All environment variables set correctly
- [ ] Firebase security rules deployed
- [ ] Database backups enabled
- [ ] HTTPS/SSL enabled
- [ ] Domain configured
- [ ] Email service configured (optional)
- [ ] Error monitoring (Sentry, LogRocket)
- [ ] Analytics setup (Google Analytics)

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure uptime monitoring (UptimeRobot)
- [ ] Enable Firebase analytics
- [ ] Set up backend logs (Render/Railway)

### Performance
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Optimize images
- [ ] Enable caching headers
- [ ] Test on 3G connection

### Security
- [ ] SSL certificate active
- [ ] Firestore rules deployed
- [ ] Env variables not in git
- [ ] firebase-key.json not in git
- [ ] API rate limiting enabled
- [ ] CORS properly configured

### Backups
- [ ] Daily Firebase backups
- [ ] Database exports scheduled
- [ ] Code backed up (GitHub)

---

## Environment Variables Reference

### Frontend (.env.local)
```env
# API URLs
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api

# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hgm-app-40d28
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hgm-app-40d28.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hgm-app-40d28.appspot.com

# Optional
NODE_ENV=production
```

### Backend (.env)
```env
# Firebase Admin
FIREBASE_PROJECT_ID=hgm-app-40d28

# External APIs
REPLICATE_API_TOKEN_2=<your_token>
GCP_API_KEY=<your_key>

# Server Config
PORT=5000
NODE_ENV=production
```

---

## Troubleshooting

### Issue: API not connecting
**Solution:**
- Check `NEXT_PUBLIC_API_URL` is correct
- Verify backend is running
- Check CORS configuration
- Verify firewall rules

### Issue: Firebase authentication failing
**Solution:**
- Verify Firebase credentials in .env
- Check Firebase project is active
- Enable Email/Password auth in Firebase
- Check Firestore rules

### Issue: Database not syncing
**Solution:**
- Verify Firestore connection
- Check database rules
- Ensure sufficient permissions
- Check network connectivity

### Issue: Slow performance
**Solution:**
- Add Firestore indexes
- Enable caching
- Optimize images
- Check database queries

---

## Scaling Considerations

### When Traffic Increases
1. **Database**: Firestore auto-scales (nothing to do)
2. **Frontend**: Vercel auto-scales (nothing to do)
3. **Backend**: 
   - Increase container size (Render/Railway)
   - Add horizontal scaling
   - Set up load balancer

### Optimization Tips
1. Add caching layer (Redis via Upstash)
2. Implement image CDN (Cloudinary)
3. Use database caching
4. Monitor and optimize queries

---

## Maintenance

### Regular Tasks
- [ ] Monitor error rates
- [ ] Check database size
- [ ] Update dependencies (quarterly)
- [ ] Review security rules
- [ ] Check performance metrics

### Monthly
- [ ] Review API usage
- [ ] Check error logs
- [ ] Test backup restoration
- [ ] Update documentation

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Cost analysis
- [ ] Feature updates

---

## Rollback Procedure

### If Deployment Fails

**Vercel:**
1. Go to Deployments
2. Click on last successful deployment
3. Click "Rollback to this deployment"

**Render/Railway:**
1. Go to Deployment History
2. Click on previous deployment
3. Click "Redeploy"

### If Database Issues
1. Firebase has automatic backups
2. Use Firebase Console to restore
3. Check Firestore restore options

---

## Support

### Getting Help
- Vercel: https://vercel.com/support
- Firebase: https://firebase.google.com/support
- Render: https://render.com/docs
- Railway: https://railway.app/docs

### Monitoring Services
- Sentry (Error tracking): https://sentry.io
- UptimeRobot (Monitoring): https://uptimerobot.com
- LogRocket (Session replay): https://logrocket.com

---

## Cost Estimation

### Vercel (Frontend)
- Free tier: Up to 100GB bandwidth/month
- Pro: $20/month + overage
- Enterprise: Custom pricing

### Render (Backend)
- Starter: Free (limited)
- Standard: $7/month per instance
- Scale as needed

### Firebase
- Firestore: Pay per read/write
- Auth: Free up to 100k auth ops
- Storage: ~$0.06 per GB stored

### Total Estimated: $50-100/month at launch

---

## Success Criteria

You're ready to launch when:
- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ Firebase rules deployed
- ✅ All env variables set
- ✅ Performance acceptable
- ✅ Security audit passed
- ✅ Domain configured
- ✅ Monitoring enabled

Happy deploying! 🚀
