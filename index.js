import express, { json } from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import pool from "./db.js";
import { refreshModules } from "./moduleLoader.js";
import authRouter from "./auth.js";
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

app.get("/modules", async (req, res) => {
    try {
      const search = req.query.search?.toLowerCase() || "";
      let result;
  
      if (search) {
        const query = `
          SELECT *
          FROM modules
          WHERE
            LOWER(name) LIKE $1
            OR LOWER(description) LIKE $1
            OR EXISTS (
              SELECT 1 FROM unnest(tags) tag
              WHERE LOWER(tag) LIKE $1
            )
          ORDER BY name ASC
        `;
        result = await pool.query(query, [`%${search}%`]);
      } else {
        result = await pool.query("SELECT * FROM modules ORDER BY name ASC");
      }
  
      res.json(result.rows);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  });
  
  app.get("/modules/:module_name", async (req, res) => {
    try {
      const { module_name } = req.params;
      const result = await pool.query("SELECT * FROM modules WHERE name = $1", [module_name]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Module not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server error");
    }
  });
  
  app.get("/api/scores", authMiddleware, async (req, res) => {
    try {
      const userId = req.user.discord_id;
      const scores = await pool.query(
        "SELECT module_id, defuser_confidence, expert_confidence FROM user_module_scores WHERE user_id = $1",
        [userId]
      );
      res.json(scores.rows);
    } catch (error) {
      console.error("Error fetching scores:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post("/api/scores/:moduleId", authMiddleware, async (req, res) => {
    try {
      const { moduleId } = req.params;
      const { defuserConfidence, expertConfidence } = req.body;
      const userId = req.user.discord_id;
  
      const validScores = [
        "Unknown",
        "Attempted",
        "Solved",
        "Confident",
        "Very Confident",
        "Avoid",
      ];
      if (!validScores.includes(defuserConfidence) || !validScores.includes(expertConfidence)) {
        return res.status(400).json({ error: "Invalid confidence level" });
      }
  
      await pool.query(
        `
        INSERT INTO user_module_scores (user_id, module_id, defuser_confidence, expert_confidence, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, module_id)
        DO UPDATE SET defuser_confidence = $3, expert_confidence = $4, updated_at = CURRENT_TIMESTAMP
        `,
        [userId, moduleId, defuserConfidence, expertConfidence]
      );
      res.status(200).json({ message: "Score updated" });
    } catch (error) {
      console.error("Error updating score:", error.message);
      res.status(500).json({ message: "Server error" });
    }
  });

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
    refreshModules();
    setInterval(refreshModules, 1800000);
});