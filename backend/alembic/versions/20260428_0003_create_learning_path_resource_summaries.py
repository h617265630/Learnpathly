"""create learning path resource summaries

Revision ID: 20260428_0003
Revises: 20260428_0002
Create Date: 2026-04-28
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260428_0003"
down_revision = "20260428_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "learning_path_resource_summaries",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("learning_path_id", sa.Integer(), nullable=False),
        sa.Column("path_item_id", sa.Integer(), nullable=False),
        sa.Column("resource_id", sa.Integer(), nullable=False),
        sa.Column("topic", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=True),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("key_points", sa.JSON(), nullable=True),
        sa.Column("resource_type", sa.String(length=32), nullable=True),
        sa.Column("platform", sa.String(length=80), nullable=True),
        sa.Column("learning_stage", sa.String(length=100), nullable=True),
        sa.Column("estimated_minutes", sa.Integer(), nullable=True),
        sa.Column("image", sa.Text(), nullable=True),
        sa.Column("generated_by", sa.String(length=80), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.ForeignKeyConstraint(["learning_path_id"], ["learning_paths.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["path_item_id"], ["path_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resource_id"], ["resources.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "learning_path_id",
            "path_item_id",
            "resource_id",
            name="uq_learning_path_resource_summary_link",
        ),
    )
    op.create_index(
        "ix_lprs_learning_path_id",
        "learning_path_resource_summaries",
        ["learning_path_id"],
        unique=False,
    )
    op.create_index(
        "ix_lprs_path_item_id",
        "learning_path_resource_summaries",
        ["path_item_id"],
        unique=False,
    )
    op.create_index(
        "ix_lprs_resource_id",
        "learning_path_resource_summaries",
        ["resource_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_lprs_resource_id", table_name="learning_path_resource_summaries")
    op.drop_index("ix_lprs_path_item_id", table_name="learning_path_resource_summaries")
    op.drop_index("ix_lprs_learning_path_id", table_name="learning_path_resource_summaries")
    op.drop_table("learning_path_resource_summaries")
