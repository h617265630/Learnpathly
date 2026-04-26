from __future__ import annotations

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class AiPathProject(Base):
    """
    Persisted AI generation project (one run for one topic + preference set).

    This is the "draft workspace" for admin bulk generation:
      project -> sections -> subnodes
    """

    __tablename__ = "ai_path_projects"

    id = Column(Integer, primary_key=True, index=True)

    # Optional owner. For now ai-path endpoints are public; keep nullable.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    topic = Column(String(500), nullable=False, index=True)
    level = Column(String(50), nullable=False, default="intermediate")
    learning_depth = Column(String(50), nullable=False, default="standard")
    content_type = Column(String(50), nullable=False, default="mixed")
    practical_ratio = Column(String(50), nullable=False, default="balanced")
    resource_count = Column(String(50), nullable=False, default="standard")

    status = Column(String(30), nullable=False, default="outline_generated")  # step1/step2/... or your own states

    outline_overview = Column(Text, nullable=True)
    total_duration_hours = Column(Float, nullable=True)

    # Raw payloads to make debugging / re-rendering easy.
    raw_outline_json = Column(JSON, nullable=True)
    raw_result_json = Column(JSON, nullable=True)

    error = Column(Text, nullable=True)

    # Optional: when a project is published into the public learning_paths table.
    published_learning_path_id = Column(
        Integer,
        ForeignKey("learning_paths.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # relationships
    sections = relationship(
        "AiPathSection",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="AiPathSection.order_index",
    )

    __table_args__ = (
        Index("ix_ai_path_projects_topic_level", "topic", "level"),
        Index("ix_ai_path_projects_status", "status"),
    )

