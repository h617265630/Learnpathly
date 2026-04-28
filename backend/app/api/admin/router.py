import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List

from app.api.ai_path.router import (
    AiPathGenerateRequest,
    AiPathGenerateResponse,
    _generate_ai_path_outline_response,
)
from app.core.deps import get_db_dep, get_current_user
from app.models.rbac.user import User
from app.models.category import Category
from app.api.admin.schemas import (
    AdminStatsResponse,
    AdminUserListResponse,
    AdminLearningPathListResponse,
    AdminResourceListResponse,
    AdminAnalyticsResponse,
)
from app.curd.admin_curd import AdminCURD
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


def require_superuser(current_user: User = Depends(get_current_user)):
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return current_user


def audit_admin_action(current_user: User, action: str, **metadata):
    """Log sensitive admin operations until a DB-backed audit table is added."""
    logger.info(
        "admin_action user_id=%s username=%s action=%s metadata=%s",
        current_user.id,
        current_user.username,
        action,
        metadata,
    )


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """Get dashboard statistics - superuser only"""
    return AdminCURD.get_stats(db)


@router.get("/users", response_model=AdminUserListResponse)
async def get_admin_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_superuser: Optional[bool] = None,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """Get paginated user list with filters"""
    users, total = AdminCURD.get_users(
        db,
        skip=skip,
        limit=limit,
        search=search,
        is_active=is_active,
        is_superuser=is_superuser,
    )
    return AdminUserListResponse(users=users, total=total, skip=skip, limit=limit)


@router.patch("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """Toggle user active status"""
    user = AdminCURD.toggle_user_status(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    audit_admin_action(
        current_user,
        "toggle_user_status",
        target_user_id=user_id,
        is_active=bool(user.is_active),
    )
    return {"message": "User status updated", "is_active": user.is_active}


@router.patch("/users/{user_id}/toggle-superuser")
async def toggle_superuser_status(
    user_id: int,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """Toggle user superuser status - superuser only"""
    if current_user.id == user_id:
        raise HTTPException(
            status_code=400, detail="Cannot modify your own superuser status"
        )
    user = AdminCURD.toggle_superuser_status(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    audit_admin_action(
        current_user,
        "toggle_superuser_status",
        target_user_id=user_id,
        is_superuser=bool(user.is_superuser),
    )
    return {
        "message": "User superuser status updated",
        "is_superuser": user.is_superuser,
    }


@router.get("/learning-paths", response_model=AdminLearningPathListResponse)
async def get_admin_learning_paths(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """Get all learning paths for admin"""
    paths, total = AdminCURD.get_learning_paths(db, skip=skip, limit=limit)
    return AdminLearningPathListResponse(paths=paths, total=total)


@router.delete("/learning-paths/{path_id}")
async def delete_learning_path(
    path_id: int,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """Delete a learning path - superuser only"""
    success = AdminCURD.delete_learning_path(db, path_id)
    if not success:
        raise HTTPException(status_code=404, detail="Learning path not found")
    audit_admin_action(current_user, "delete_learning_path", path_id=path_id)
    return {"message": "Learning path deleted"}


@router.get("/resources", response_model=AdminResourceListResponse)
async def get_admin_resources(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """Get all resources for admin"""
    resources, total = AdminCURD.get_resources(db, skip=skip, limit=limit)
    return AdminResourceListResponse(resources=resources, total=total)


@router.delete("/resources/{resource_id}")
async def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """Delete a resource - superuser only"""
    success = AdminCURD.delete_resource(db, resource_id)
    if not success:
        raise HTTPException(status_code=404, detail="Resource not found")
    audit_admin_action(current_user, "delete_resource", resource_id=resource_id)
    return {"message": "Resource deleted"}


@router.get("/analytics", response_model=AdminAnalyticsResponse)
async def get_admin_analytics(
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """Get analytics data for charts"""
    return AdminCURD.get_analytics(db, days=days)


@router.post("/ai-path/generate-outline", response_model=AiPathGenerateResponse)
async def generate_admin_ai_path_outline(
    payload: AiPathGenerateRequest,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """Generate and save an AI outline from the admin console - superuser only."""
    response = await _generate_ai_path_outline_response(payload, db)
    audit_admin_action(
        current_user,
        "generate_ai_path_outline",
        project_id=response.project_id,
        query=payload.query[:200],
    )
    return response


# ── Category Management ─────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str]
    is_system: bool
    owner_user_id: Optional[int]
    level: int
    is_leaf: bool

    class Config:
        from_attributes = True


@router.get("/categories", response_model=List[CategoryResponse])
async def list_all_categories(
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """List all categories (system + user) - superuser only"""
    categories = db.query(Category).order_by(
        Category.is_system.desc(), Category.name.asc()
    ).all()
    return categories


@router.post("/categories", response_model=CategoryResponse)
async def create_system_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """Create a system category - superuser only"""
    name = (payload.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="name is required")

    code = (payload.code or "").strip().lower()
    if not code:
        code = name.lower().replace(" ", "_").replace("-", "_")

    # Check for duplicate code
    existing = db.query(Category).filter(Category.code == code).first()
    if existing:
        raise HTTPException(status_code=409, detail="Category code already exists")

    category = Category(
        name=name,
        code=code,
        description=payload.description,
        is_system=True,  # Admin creates system category
        owner_user_id=None,
        level=0,
        is_leaf=True,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    audit_admin_action(current_user, "create_category", category_id=category.id, code=code)
    return category


@router.delete("/categories/{category_id}")
async def delete_system_category(
    category_id: int,
    db: Session = Depends(get_db_dep),
    current_user: User = Depends(require_superuser),
):
    """Delete a system category - superuser only. Cannot delete categories with resources."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if not category.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete user categories via admin")

    # Check if category has resources or learning paths
    if hasattr(category, 'resources') and category.resources:
        raise HTTPException(status_code=400, detail="Cannot delete category with associated resources")
    if hasattr(category, 'learning_paths') and category.learning_paths:
        raise HTTPException(status_code=400, detail="Cannot delete category with associated learning paths")

    db.delete(category)
    db.commit()
    audit_admin_action(current_user, "delete_category", category_id=category_id)
    return {"message": "Category deleted"}
