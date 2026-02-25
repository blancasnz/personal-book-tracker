"""One-time script to migrate data from SQLite to PostgreSQL.

Usage:
    cd backend && source venv/bin/activate
    python migrate_data.py

Safe to delete after migration is verified.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect

load_dotenv()

SQLITE_URL = "sqlite:///./books.db"
PG_URL = os.getenv("DATABASE_URL")

if not PG_URL:
    raise RuntimeError("DATABASE_URL not set in environment")

sqlite_engine = create_engine(SQLITE_URL)
pg_engine = create_engine(PG_URL)

# Tables to migrate in dependency order (parents before children)
TABLES = ["books", "book_lists", "book_list_items"]


def migrate():
    with sqlite_engine.connect() as src, pg_engine.connect() as dst:
        for table in TABLES:
            rows = src.execute(text(f"SELECT * FROM {table}")).mappings().all()
            if not rows:
                print(f"  {table}: 0 rows (skipped)")
                continue

            cols = list(rows[0].keys())
            placeholders = ", ".join(f":{c}" for c in cols)
            col_names = ", ".join(f'"{c}"' for c in cols)
            insert_sql = f'INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'

            dst.execute(text(insert_sql), [dict(r) for r in rows])
            dst.commit()
            print(f"  {table}: {len(rows)} rows migrated")

        # Reset PostgreSQL sequences so new inserts get correct IDs
        for table in TABLES:
            seq_name = f"{table}_id_seq"
            # Check if sequence exists
            result = dst.execute(
                text("SELECT 1 FROM pg_sequences WHERE sequencename = :seq"),
                {"seq": seq_name},
            ).fetchone()
            if result:
                dst.execute(
                    text(
                        f"SELECT setval('{seq_name}', COALESCE((SELECT MAX(id) FROM {table}), 1))"
                    )
                )
                dst.commit()
                print(f"  Reset sequence {seq_name}")

    print("\nDone! Verify with: psql bookapp -c 'SELECT count(*) FROM books;'")


if __name__ == "__main__":
    print("Migrating data from SQLite to PostgreSQL...\n")
    migrate()
