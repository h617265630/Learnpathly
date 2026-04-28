from __future__ import annotations

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class AiPathSubNodeDetail(Base):
    """
    Strongly-linked Step 2.5 detail content for a sub-node.

    Unlike ai_path_subnode_detail_cache, this table uses subnode_id as a real
    foreign key, so a project can be loaded as:
      project -> sections -> subnodes -> details
    """

    __tablename__ = "ai_path_subnode_details"

    id = Column(Integer, primary_key=True, index=True)
    subnode_id = Column(
        Integer,
        ForeignKey("ai_path_subnodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    detail_level = Column(String(20), nullable=False, default="detailed")

    detailed_content = Column(Text, nullable=True)
    code_examples = Column(JSON, nullable=True)  # list[str]
    structured_content = Column(JSON, nullable=True)
    raw_json = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    subnode = relationship("AiPathSubNode", back_populates="details")

    __table_args__ = (
        UniqueConstraint("subnode_id", "detail_level", name="uq_ai_path_subnode_details_level"),
        Index("ix_ai_path_subnode_details_lookup", "subnode_id", "detail_level"),
    )
