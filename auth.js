import express from "express";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import pool from "./db.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve('F:/KTaNE-CanSolve/can-solve-ktane/server/.env') });

const router = express.Router();

console.log('Environment Variables:');
console.log('CLIENT_ID:', process.env.CLIENT_ID ? 'Set' : 'Missing');
console.log('CLIENT_SECRET:', process.env.CLIENT_SECRET ? 'Set' : 'Missing');
console.log('CALLBACK_URL:', process.env.CALLBACK_URL ? 'Set' : 'Missing');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL ? 'Set' : 'Missing');
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Missing');

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.CALLBACK_URL) {
    const missingVars = [];
    if (!process.env.CLIENT_ID) missingVars.push('CLIENT_ID');
    if (!process.env.CLIENT_SECRET) missingVars.push('CLIENT_SECRET');
    if (!process.env.CALLBACK_URL) missingVars.push('CALLBACK_URL');
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    scope: ['identify', 'email', 'connections'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE discord_id = $1', [profile.id]);
        let user;

        if (result.rows.length > 0) {
            user = result.rows[0];
            await pool.query(
                'UPDATE users SET username = $1, email = $2 WHERE discord_id = $3',
                [profile.username, profile.email, profile.id]
            );
        } else {
            const newUser = await pool.query(
                'INSERT INTO users (discord_id, username, email) VALUES ($1, $2, $3) RETURNING *',
                [profile.id, profile.username, profile.email]
            );
            user = newUser.rows[0];
        }

        return done(null, { ...user, accessToken });
    } catch (error) {
        return done(error);
    }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect(`${process.env.FRONTEND_URL}/profile`);
    }
);

router.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ message: 'Logout failed' });
        res.redirect(process.env.FRONTEND_URL);
    });
});

export default router;