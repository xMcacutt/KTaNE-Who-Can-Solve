CREATE DATABASE ktanecansolve;

CREATE TABLE modules (
     id SERIAL PRIMARY KEY,
     module_id TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL,
     description TEXT,
     published DATE,
     developers TEXT[],
     defuser_difficulty TEXT,
     expert_difficulty TEXT,
     tags TEXT[]
);

CREATE TABLE user_module_scores (
  user_id VARCHAR(50) REFERENCES users(discord_id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES modules(module_id) ON DELETE CASCADE,
  defuser_confidence VARCHAR(50) DEFAULT 'Unknown',
  expert_confidence VARCHAR(50) DEFAULT 'Unknown',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, module_id)
);