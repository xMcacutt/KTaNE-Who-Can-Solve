import express, { json } from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import authRouter from "./auth.js";
import missionRouter from "./routes/missions.js";
import moduleRouter from "./routes/modules.js";
import scoreRouter from "./routes/scores.js";
import practiceRouter from "./routes/practice.js";
import leaderboardRouter from "./routes/leaderboard.js";
import userRouter from "./routes/users.js";
import { refreshModules } from "./moduleLoader.js";
import { refreshBombs } from "./bombLoader.js";
import ogMetaRouter from "./routes/ogMeta.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve('F:/KTaNE-CanSolve/can-solve-ktane/server/.env') });

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

const authMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

app.use('/auth', authRouter);
app.use('/missions', missionRouter);
app.use('/modules', moduleRouter);
app.use('/scores', scoreRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/users', userRouter);
app.use('/practice', practiceRouter);
app.use("/profile", ogMetaRouter); 

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
  refreshModules();
  refreshBombs();
  setInterval(refreshModules, 1800000);
});