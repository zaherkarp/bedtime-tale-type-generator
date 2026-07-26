"""The raw / core / publish schema.

Revision ID: 0001_initial
Revises:
"""

from __future__ import annotations

from pathlib import Path

from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

SQL_DIR = Path(__file__).resolve().parents[1] / "sql"


def upgrade() -> None:
    op.execute((SQL_DIR / "0001_initial.sql").read_text(encoding="utf-8"))


def downgrade() -> None:
    # The publish alias and every versioned build schema go too; they are
    # rebuilt from core by `atukb publish`, never migrated.
    op.execute(
        """
        DO $$
        DECLARE s text;
        BEGIN
            FOR s IN
                SELECT nspname FROM pg_namespace
                 WHERE nspname = 'publish' OR nspname LIKE 'publish\\_v%'
            LOOP
                EXECUTE format('DROP SCHEMA %I CASCADE', s);
            END LOOP;
        END $$;
        """
    )
    op.execute("DROP SCHEMA IF EXISTS raw CASCADE")
    op.execute("DROP SCHEMA IF EXISTS core CASCADE")
