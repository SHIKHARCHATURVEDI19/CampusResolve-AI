# CampusResolve AI - Smart Multi-Campus Grievance & Dispatch System

> 🚀 **Live Production Demo**: [https://campusresolveaiv12.vercel.app/](https://campusresolveaiv12.vercel.app/)

An AI-powered multi-tenant campus grievance management, deduplication, and automated worker load-balancing platform.

## Features
- **Reporter Identity Tracking**: Every complaint records the exact student profile (name, personal email, ID, role) who lodged it.
- **Personal Email OTP Verification**: 2-step verification code dispatch and verification.
- **Multi-Tenant Scoping**: College-wise isolation between institutions (Engineering, Medical, etc.).
- **AI Vector Deduplication**: Automatically detects reports within a 100m radius with >0.88 cosine similarity and consolidates them into parent incidents.
- **Dynamic Priority Scoring**:
  $$P = (S \times 0.4) + (F \times 0.3) + (I \times 0.2) + (T \times 0.1)$$
- **Least-Connections Worker Load Balancing**: Auto-assigns tickets to the least loaded department specialist.
- **High-Definition Satellite Hotspot Map**: Powered by Leaflet and Esri World Imagery.
- **Concerned Persons Directory**: Dedicated window for Admins to register and manage technicians.
- **Super Admin Window**: Chancellor-level panel to promote/demote College Admins.

---

## Deploy to Vercel (1-Click)

1. Push this repository to **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import your GitHub repository.
4. Leave build settings as default (Framework Preset: **Vite**).
5. (Optional) Add environment variables:
   - `OPENAI_API_KEY`: (Optional) If omitted, built-in heuristic/vector fallback runs automatically.
   - `SMTP_USER` & `SMTP_PASS`: (Optional) For sending live emails via personal Gmail.
6. Click **Deploy**. Your app and `/api` serverless backend are live instantly!

---

## Local Development
```bash
npm install
npm run dev
```
- Client runs on `http://127.0.0.1:5173`
- Backend API runs on `http://127.0.0.1:5000`
