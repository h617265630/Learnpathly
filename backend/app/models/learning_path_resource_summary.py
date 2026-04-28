from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base


class LearningPathResourceSummary(Base):
    __tablename__ = "learning_path_resource_summaries"

    id = Column(Integer, primary_key=True, index=True)
    learning_path_id = Column(
        Integer,
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    path_item_id = Column(
        Integer,
        ForeignKey("path_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resource_id = Column(
        Integer,
        ForeignKey("resources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    topic = Column(Text, nullable=False)
    title = Column(Text, nullable=True)
    url = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    key_points = Column(JSON, nullable=True)
    resource_type = Column(String(32), nullable=True)
    platform = Column(String(80), nullable=True)
    learning_stage = Column(String(100), nullable=True)
    estimated_minutes = Column(Integer, nullable=True)
    image = Column(Text, nullable=True)
    generated_by = Column(String(80), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    learning_path = relationship("LearningPath")
    path_item = relationship("PathItem")
    resource = relationship("Resource")

    __table_args__ = (
        UniqueConstraint(
            "learning_path_id",
            "path_item_id",
            "resource_id",
            name="uq_learning_path_resource_summary_link",
        ),
    )
