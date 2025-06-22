import { Pool } from 'pg';

const pool = new Pool({
    user: "postgres",
    password: "Wh3r3thelight!s",
    host: "localhost",
    port: 5432,
    database: "ktanecansolve"
})

export default pool;