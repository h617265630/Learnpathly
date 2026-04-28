"""Add structured content to AI path subnode details

Revision ID: 20260428_0001
Revises: 20260414_0001
Create Date: 2026-04-28
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20260428_0001"
down_revision = "20260414_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ai_path_subnode_details",
        sa.Column("structured_content", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("ai_path_subnode_details", "structured_content")
