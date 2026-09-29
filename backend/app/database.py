import sqlite3
import json
import os
from typing import List, Dict, Any, Optional

DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "ses_matcher.db"))

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Engineers Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS engineers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        age INTEGER,
        title TEXT NOT NULL,
        experience_years REAL,
        skills TEXT, -- JSON array
        nearest_station TEXT,
        remote_pref TEXT,
        available_from TEXT,
        min_rate INTEGER,
        max_rate INTEGER,
        notes TEXT,
        resume_text TEXT,
        resume_filename TEXT,
        source TEXT DEFAULT 'spreadsheet',
        email_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Projects Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        client_company TEXT,
        required_skills TEXT, -- JSON array
        preferred_skills TEXT, -- JSON array
        location TEXT,
        remote_pref TEXT,
        start_date TEXT,
        min_rate INTEGER,
        max_rate INTEGER,
        payment_terms TEXT,
        interview_count TEXT,
        raw_text TEXT,
        source TEXT DEFAULT 'spreadsheet',
        email_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Emails Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT,
        subject TEXT NOT NULL,
        sender TEXT NOT NULL,
        date TEXT,
        body TEXT NOT NULL,
        category TEXT DEFAULT 'unknown', -- 'project', 'engineer', 'other'
        is_parsed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Proposals Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        engineer_id INTEGER,
        project_id INTEGER,
        subject TEXT,
        body TEXT,
        match_score INTEGER,
        status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'rejected'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (engineer_id) REFERENCES engineers (id),
        FOREIGN KEY (project_id) REFERENCES projects (id)
    )
    ''')

    conn.commit()
    conn.close()

def row_to_dict(row) -> Dict[str, Any]:
    if not row:
        return {}
    d = dict(row)
    # Parse json fields
    for field in ['skills', 'required_skills', 'preferred_skills']:
        if field in d and isinstance(d[field], str):
            try:
                d[field] = json.loads(d[field])
            except Exception:
                d[field] = [s.strip() for s in d[field].split(',') if s.strip()]
        elif field in d and d[field] is None:
            d[field] = []
    return d
