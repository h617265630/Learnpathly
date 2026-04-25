from __future__ import annotations

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class AiPathSubNode(Base):
    """
    A knowledge point (sub-node) under a section.
    """

    __tablename__ = "ai_path_subnodes"

    id = Column(Integer, primary_key=True, index=True)

    section_id = Column(Integer, ForeignKey("ai_path_sections.id", ondelete="CASCADE"), nullable=False, index=True)

    order_index = Column(Integer, nullable=False, default=0)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    key_points = Column(JSON, nullable=True)         # list[str]
    practical_exercise = Column(Text, nullable=True)
    search_keywords = Column(JSON, nullable=True)    # list[str]

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    section = relationship("AiPathSection", back_populates="subnodes")

    __table_args__ = (
        UniqueConstraint("section_id", "order_index", name="uq_ai_path_subnodes_section_order"),
        Index("ix_ai_path_subnodes_section_order", "section_id", "order_index"),
        Index("ix_ai_path_subnodes_title", "title"),
    )

