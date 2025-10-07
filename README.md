
# Live Polling System (React + Express + Socket.IO)

Two personas: **Teacher** and **Student**. Timed MCQ questions, live results, chat, participants view, and a separate **Poll History** page. Students enter their name via **Get Started**. If kicked, they are redirected to the **Kicked** page.

## Run locally

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd ../client
npm install
# echo "VITE_BACKEND_URL=http://localhost:5000" > .env
npm run dev
```

## Deploy
- Backend: Render/Railway/Heroku (enable WebSockets)
- Frontend: Netlify/Vercel with `VITE_BACKEND_URL` pointing to backend

## Features
- Role select → **Get Started** (name) → Student
- Teacher: ask timed question, live results, end early, participants list, **View Poll History** button
- Student: answer once per question, countdown, results after end
- **Kicked** notification & redirect
- **History** page (not persisted across restarts)
- Chat popup with **Participants** tab and “Kick out” (teacher only)
