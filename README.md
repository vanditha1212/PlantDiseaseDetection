# AgriCare AI — Smart Plant Disease Detection & Farmer Assistance

AgriCare AI is a full-stack AI-powered agricultural web application that enables farmers to upload or capture plant photographs, receive structured Google Gemini Vision disease analyses and treatment plans in **English**, **Kannada (ಕನ್ನಡ)**, and **Hindi (हिन्दी)**, download PDF reports, browse a verified 10-crop disease encyclopedia, and read practical farming guides.

## Architecture & Technology Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, Recharts, jsPDF, Lucide Icons
- **Backend:** Express.js REST API (`server.ts`) with Multer image upload validation (`JPG`, `JPEG`, `PNG`, max `8 MB`), bcryptjs password hashing, JWT authentication, and Firebase Admin token verification
- **AI Engine:** Google Gemini API (`@google/genai`, `gemini-4-hydrogen` multimodal vision with strict structured JSON schema)
- **Database:** Cloud SQL for PostgreSQL managed via Drizzle ORM (`src/db/schema.ts`, `src/db/index.ts`)
  - Tables: `users`, `disease_reports`, `disease_library`, `farming_tips`, `admin`

## Required Software

- Node.js `v22+`
- npm `v10+`
- PostgreSQL / Google Cloud SQL instance
- Google Gemini API Key

## Installation Steps

```bash
npm install
```

## Environment Variable Setup

Configure the following environment variables (see `.env.example`):

- `GEMINI_API_KEY`: Server-side Google Gemini API key (never exposed to browser code)
- `JWT_SECRET`: Secret used to sign farmer and administrator JWT sessions
- `SQL_HOST`: Cloud SQL Auth Proxy socket path or PostgreSQL host
- `SQL_DB_NAME`: Database name
- `SQL_USER` / `SQL_PASSWORD`: Application database credentials (read/write)
- `SQL_ADMIN_USER` / `SQL_ADMIN_PASSWORD`: Admin credentials for Drizzle Kit schema migrations

## Database Setup

Push the Drizzle PostgreSQL schema to Cloud SQL:

```bash
npx drizzle-kit push --config=src/db/drizzle.config.ts
```

Reference agricultural data (15 verified diseases across 10 major crops, 12 farming tips across 6 categories, and a demo admin account `admin@agricare.ai` / `Admin@123`) is automatically initialized on first request.

## Running the Application

Development (full-stack Express API + Vite middleware on port 3000):

```bash
npm run dev
```

Production build & start:

```bash
npm run build
NODE_ENV=production npm start
```

## Key REST API Endpoints

- `POST /api/auth/register` — Register a farmer account (hashed password + JWT)
- `POST /api/auth/login` — Authenticate farmer with email & password
- `POST /api/auth/google-sync` — Synchronize Google Sign-In user via Firebase Auth
- `GET /api/auth/profile` & `PUT /api/auth/profile` — Fetch/update farmer profile & stats
- `POST /api/disease/analyze` — Analyze uploaded/captured plant image using Gemini Vision and persist report
- `GET /api/disease/reports`, `GET /api/disease/reports/:id`, `PATCH /api/disease/reports/:id/save`, `DELETE /api/disease/reports/:id` — Manage farmer diagnosis history
- `GET /api/disease/library` — Search and filter verified crop diseases
- `GET /api/farming/tips` — Search and filter practical farming advice
- `POST /api/admin/login`, `GET /api/admin/dashboard`, `GET /api/admin/reports`, `GET /api/admin/users`, `POST/PUT/DELETE /api/admin/library`, `POST/DELETE /api/admin/tips` — Admin analytics and content management

## Safety & Agronomy Notice

All AI-generated plant disease assessments are preliminary. Farmers are advised to verify critical treatment decisions and exact approved chemical dosages with local agricultural extension officers or Krishi Vigyan Kendra (KVK) specialists.
