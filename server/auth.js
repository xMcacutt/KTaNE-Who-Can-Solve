import express from "express";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import pool from "./db.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve('./.env') });

const router = express.Router();

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
    scope: ['identify', 'connections'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE discord_id = $1', [profile.id]);
        let user;

       if (result.rows.length > 0) {
            user = result.rows[0];
            await pool.query(
                'UPDATE users SET username = $1, avatar = $2 WHERE discord_id = $3',
                [profile.username, profile.avatar, profile.id]
            );
        } else {
            const newUser = await pool.query(
                'INSERT INTO users (discord_id, username, avatar) VALUES ($1, $2, $3) RETURNING *',
                [profile.id, profile.username, profile.avatar]
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

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.status(500).json({ error: 'Session destroy failed' });
            }
            res.clearCookie('connect.sid', { path: '/' });
            res.status(200).json({ message: 'Logged out' });
        });
    });
});

export default router;