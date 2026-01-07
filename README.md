# HangoutHero

An AI-powered itinerary planning web application that creates personalized day plans for Indian cities based on user preferences and location.

## Features

- 🤖 **AI-Powered Planning**: Uses Google Gemini AI to generate personalized itineraries
- 📍 **Location-Based**: Supports multiple Indian cities (Delhi, Noida, Jaipur, Mussoorie, etc.)
- 🎨 **Scrapbook Theme**: Beautiful scrapbook-inspired UI with animations
- 💾 **Save Itineraries**: Save and retrieve your favorite plans
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Express.js, TypeScript
- **AI**: Google Gemini API
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key (optional, has fallback)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd HangoutHero
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=your_postgresql_connection_string (optional)
NODE_ENV=development
```

4. Run the development server
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

## Deployment on Vercel

### Prerequisites
- Vercel account
- GitHub repository (recommended)

### Steps

1. **Install Vercel CLI** (optional, for CLI deployment)
```bash
npm i -g vercel
```

2. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `GEMINI_API_KEY`: Your Google Gemini API key
     - `DATABASE_URL`: Your PostgreSQL connection string (optional)
     - `NODE_ENV`: `production`
   - Click "Deploy"

3. **Deploy via CLI**
```bash
vercel login
vercel
```

### Environment Variables for Vercel

Add these in your Vercel project settings:

- `GEMINI_API_KEY` - Your Google Gemini API key
- `DATABASE_URL` - PostgreSQL connection string (optional, uses in-memory storage if not provided)
- `NODE_ENV` - Set to `production`

## Project Structure

```
HangoutHero/
├── client/          # React frontend
│   ├── src/
│   │   ├── pages/   # Route components
│   │   ├── components/ # UI components
│   │   └── lib/     # Utilities
├── server/          # Express backend
│   ├── routes.ts    # API endpoints
│   ├── storage.ts   # Data persistence
│   └── db.ts        # Database connection
├── shared/          # Shared TypeScript schemas
├── api/             # Vercel serverless functions
└── vercel.json      # Vercel configuration
```

## API Endpoints

- `POST /api/generate-itinerary` - Generate a new itinerary
- `POST /api/save-itinerary` - Save an itinerary
- `GET /api/itinerary/:id` - Get a saved itinerary
- `GET /api/itineraries` - Get all saved itineraries

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Type check
npm run check

# Database migrations (if using PostgreSQL)
npm run db:push
```

## License

MIT
