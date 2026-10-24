# ClaimVault

- `frontend/` React 18 + Vite
- `backend/` Node.js + Express 5 + Mongoose, JWT auth
- `database/` MongoDB 7 (docker-compose.yml)

No demo or seed data: every account starts empty.

## Create the `.env` file
`backend/.env` holds your database link and secrets, so it is not on GitHub or in the download. Create it once:

```
npm run env
```

This copies `backend/.env.example` to `backend/.env`. Open it and set:

```
MONGODB_URI=your database link
JWT_SECRET=a long random string
PORT=5000
```

Put real values only in `backend/.env`, never in `.env.example` (that file is uploaded to GitHub).

## Change the database link
Edit one line in `backend/.env`: `MONGODB_URI=...` (local MongoDB or MongoDB Atlas). Restart `npm run dev`.

## Run
1. `npm run setup`  (installs everything, once)
2. `npm run env`  (creates `backend/.env`, then fill it in)
3. Database: either run `npm run db` (needs Docker), or put your MongoDB Atlas link in `backend/.env`
4. `npm run dev`  (API on :5000, app on :5173, opens your browser)

Production: `npm run build`, then `npm start` (everything on :5000).
