# ClaimVault

- `frontend/` React 18 + Vite
- `backend/` Node.js + Express 5 + Mongoose, JWT auth
- `database/` MongoDB 7 (docker-compose.yml)

No demo or seed data: every account starts empty.

## Change the database link
Edit one line in `backend/.env`: `MONGODB_URI=...` (local MongoDB or MongoDB Atlas). Restart `npm run dev`.

## Run
1. `npm run setup`  (installs everything, once)
2. Database: either run `npm run db` (needs Docker), or put your MongoDB Atlas link in `backend/.env`
3. `npm run dev`  (API on :5000, app on :5173, opens your browser)

Production: `npm run build`, then `npm start` (everything on :5000).
