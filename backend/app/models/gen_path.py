from __future__ import annotations

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class GenPathProject(Base):
    """
    A "step-by-step generation" learning path project (gen_path pipeline).

    This is a parallel workflow to ai_path_projects:
      step1 outline -> step2 tutorial -> step3 resources -> step4 summary

    Kept separate from AiPathProject on purpose: gen_path is driven by the
    raw-text step endpoints in app/api/gen_path/router.py, while ai_path is
    driven by the sub-node pipeline.
    """

    __tablename__ = "gen_path_projects"

    id = Column(String(36), primary_key=True)  # uuid4 string, see gen_path_curd
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    topic = Column(String(500), nullable=False, index=True)
    level = Column(String(50), nullable=False, default="intermediate")
    learning_depth = Column(String(50), nullable=False, default="standard")
    content_type = Column(String(50), nullable=False, default="mixed")
    practical_ratio = Column(String(50), nullable=False, default="balanced")

    outline_json = Column(JSON, nullable=True)
    final_summary = Column(Text, nullable=True)
    github_projects_json = Column(JSON, nullable=True)

    status = Column(String(20), nullable=False, default="step1")  # step1/step2/step3/step4/done

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    sections = relationship(
        "GenPathSection",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="GenPathSection.order_index",
    )

    __table_args__ = (
        Index("ix_gen_path_projects_status", "status"),
    )


class GenPathSection(Base):
    """A section (chapter) of a gen_path project."""

    __tablename__ = "gen_path_sections"

    id = Column(String(36), primary_key=True)
    project_id = Column(String(36), ForeignKey("gen_path_projects.id", ondelete="CASCADE"), nullable=False, index=True)

    order_index = Column(Integer, nullable=False, default=0)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    learning_goals_json = Column(JSON, nullable=True)   # list[str]
    search_queries_json = Column(JSON, nullable=True)   # list[str]

    tutorial_md = Column(Text, nullable=True)            # Step 2 output

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    project = relationship("GenPathProject", back_populates="sections")
    resources = relationship(
        "GenPathSectionResource",
        back_populates="section",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("project_id", "order_index", name="uq_gen_path_sections_project_order"),
    )


class GenPathSectionResource(Base):
    """A resource attached to a gen_path section."""

    __tablename__ = "gen_path_section_resources"

    id = Column(String(36), primary_key=True)
    section_id = Column(String(36), ForeignKey("gen_path_sections.id", ondelete="CASCADE"), nullable=False, index=True)

    resource_json = Column(JSON, nullable=False)
    added_by = Column(String(20), nullable=False, default="ai")  # 'ai' | 'user'

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    section = relationship("GenPathSection", back_populates="resources")
