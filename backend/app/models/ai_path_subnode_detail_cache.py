from __future__ import annotations

from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, UniqueConstraint, Index
from sqlalchemy.sql import func

from app.db.database import Base


class AiPathSubNodeDetailCache(Base):
    """
    DB-backed cache for Step 2.5 (sub-node detail) results.

    Frontend currently calls /ai-path/subnode-detail with titles (no IDs),
    so we key by an md5 "cache_key" of:
      topic|section_title|subnode_title|detail_level
    """

    __tablename__ = "ai_path_subnode_detail_cache"

    id = Column(Integer, primary_key=True, index=True)

    cache_key = Column(String(64), nullable=False)
    topic = Column(String(500), nullable=False, index=True)
    section_title = Column(String(500), nullable=False)
    subnode_title = Column(String(500), nullable=False)
    detail_level = Column(String(20), nullable=False, default="detailed")  # concise | detailed

    # raw result + commonly-used fields
    detailed_content = Column(Text, nullable=True)
    code_examples = Column(JSON, nullable=True)  # list[str]
    raw_json = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    __table_args__ = (
        UniqueConstraint("cache_key", name="uq_ai_path_subnode_detail_cache_key"),
        Index("ix_ai_path_subnode_detail_lookup", "topic", "section_title", "subnode_title", "detail_level"),
    )

