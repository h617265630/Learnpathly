from __future__ import annotations

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class AiPathSection(Base):
    """
    A section (stage/chapter) in an AI path project outline.
    """

    __tablename__ = "ai_path_sections"

    id = Column(Integer, primary_key=True, index=True)

    project_id = Column(Integer, ForeignKey("ai_path_projects.id", ondelete="CASCADE"), nullable=False, index=True)

    order_index = Column(Integer, nullable=False, default=0)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    learning_goals = Column(JSON, nullable=True)     # list[str]
    search_queries = Column(JSON, nullable=True)     # list[str]
    estimated_minutes = Column(Integer, nullable=True)

    # Optional: step2 content
    tutorial_md = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    project = relationship("AiPathProject", back_populates="sections")
    subnodes = relationship(
        "AiPathSubNode",
        back_populates="section",
        cascade="all, delete-orphan",
        order_by="AiPathSubNode.order_index",
    )

    __table_args__ = (
        UniqueConstraint("project_id", "order_index", name="uq_ai_path_sections_project_order"),
        Index("ix_ai_path_sections_project_order", "project_id", "order_index"),
    )

