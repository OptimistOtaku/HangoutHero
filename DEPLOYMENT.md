# Vercel Deployment Guide

## Quick Deploy Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository

3. **Configure Project Settings**
   - Framework Preset: **Other**
   - Root Directory: **./** (leave as default)
   - Build Command: `npm run build`
   - Output Directory: `dist/public`
   - Install Command: `npm install`

4. **Add Environment Variables**
   In the "Environment Variables" section, add:
   - `GEMINI_API_KEY` = `AIzaSyAJUNmvY8b81BxN61kpaVu8TfGAl93yteo` (or your own key)
   - `DATABASE_URL` = (optional, your PostgreSQL connection string)
   - `NODE_ENV` = `production`

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add GEMINI_API_KEY
   vercel env add DATABASE_URL  # optional
   vercel env add NODE_ENV
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Project Structure for Vercel

```
HangoutHero/
├── api/
│   └── index.ts          # Serverless function handler
├── client/               # React frontend
├── server/               # Express routes (used by api/index.ts)
├── vercel.json           # Vercel configuration
└── package.json
```

## Important Notes

1. **API Routes**: All `/api/*` requests are handled by `api/index.ts`
2. **Static Files**: Frontend is built to `dist/public` and served as static files
3. **Environment Variables**: Must be set in Vercel dashboard
4. **Build Process**: 
   - Frontend: `vite build` → outputs to `dist/public`
   - Backend: TypeScript is compiled by Vercel automatically

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure `npm run build` works locally first
- Check Vercel build logs for specific errors

### API Routes Not Working
- Verify `api/index.ts` exists
- Check that routes are properly registered
- Ensure environment variables are set

### Frontend Not Loading
- Verify `dist/public` contains built files
- Check `vercel.json` rewrites configuration
- Ensure `index.html` exists in output directory

## Post-Deployment

After deployment:
1. Test all API endpoints
2. Verify environment variables are working
3. Check that images load correctly
4. Test the full user flow (questionnaire → location → results)

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)
