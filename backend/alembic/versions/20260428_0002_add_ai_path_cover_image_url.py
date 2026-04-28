"""add ai path cover image url

Revision ID: 20260428_0002
Revises: 20260428_0001
Create Date: 2026-04-28
"""

from alembic import op
import sqlalchemy as sa


revision = "20260428_0002"
down_revision = "20260428_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "ai_path_projects",
        sa.Column("cover_image_url", sa.String(length=2048), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("ai_path_projects", "cover_image_url")
