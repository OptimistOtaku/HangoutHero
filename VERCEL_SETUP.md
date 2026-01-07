# Vercel Deployment - Quick Start

## ✅ What's Been Set Up

1. **Vercel Configuration** (`vercel.json`)
   - Build command: `npm run build`
   - Output directory: `dist/public`
   - API routes rewrites configured

2. **Serverless Function** (`api/index.ts`)
   - Handles all `/api/*` requests
   - Includes all API endpoints (generate, save, retrieve)
   - Uses Express for routing

3. **Environment Variables Needed**
   - `GEMINI_API_KEY` - Your Google Gemini API key
   - `DATABASE_URL` - (Optional) PostgreSQL connection string
   - `NODE_ENV` - Set to `production`

## 🚀 Deploy Now

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Deploy on Vercel

**Option A: Via Dashboard (Easiest)**
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework: **Other**
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
5. Add Environment Variables:
   - `GEMINI_API_KEY` = `AIzaSyAJUNmvY8b81BxN61kpaVu8TfGAl93yteo`
   - `NODE_ENV` = `production`
6. Click "Deploy"

**Option B: Via CLI**
```bash
npm i -g vercel
vercel login
vercel
# Follow prompts, add env vars when asked
vercel --prod
```

## 📝 Post-Deployment Checklist

- [ ] Test homepage loads
- [ ] Test questionnaire flow
- [ ] Test itinerary generation
- [ ] Test save functionality
- [ ] Verify images load correctly
- [ ] Check API endpoints in browser console

## 🔧 Troubleshooting

**Build fails?**
- Run `npm run build` locally first to check for errors
- Check Vercel build logs

**API not working?**
- Verify `api/index.ts` exists
- Check environment variables are set
- Look at Vercel function logs

**Frontend not loading?**
- Verify `dist/public` has files after build
- Check `vercel.json` rewrites

## 📚 More Info

See `DEPLOYMENT.md` for detailed deployment guide.
