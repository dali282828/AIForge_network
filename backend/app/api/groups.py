from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.models.group import Group, GroupMembership, GroupRole
from app.schemas.group import (
    GroupCreate, GroupResponse, GroupMembershipCreate, 
    GroupMembershipResponse, GroupWithMembers
)
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group_data: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new group"""
    db_group = Group(
        name=group_data.name,
        description=group_data.description,
        is_public=group_data.is_public,
        owner_id=current_user.id
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Add owner as group member with OWNER role
    membership = GroupMembership(
        group_id=db_group.id,
        user_id=current_user.id,
        role=GroupRole.OWNER
    )
    db.add(membership)
    db.commit()
    
    return db_group

@router.get("", response_model=List[GroupResponse])
async def list_groups(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """List groups the user is a member of or public groups"""
    # Get groups where user is a member
    user_groups = db.query(Group).join(GroupMembership).filter(
        GroupMembership.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    # Also include public groups
    public_groups = db.query(Group).filter(
        Group.is_public == True,
        ~Group.id.in_([g.id for g in user_groups])
    ).offset(skip).limit(limit).all()
    
    return list(user_groups) + list(public_groups)

@router.get("/{group_id}", response_model=GroupWithMembers)
async def get_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get group details with members"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check access: must be member or public group
    if not group.is_public:
        membership = db.query(GroupMembership).filter(
            GroupMembership.group_id == group_id,
            GroupMembership.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this group"
            )
    
    # Get members with user info
    members = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id
    ).all()
    
    # Build members list with user info
    members_list = []
    for m in members:
        member_user = db.query(User).filter(User.id == m.user_id).first()
        member_dict = {
            "id": m.id,
            "group_id": m.group_id,
            "user_id": m.user_id,
            "role": m.role.value if m.role else None,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None,
            "user_email": member_user.email if member_user else None,
            "user_username": member_user.username if member_user else None,
            "user_full_name": member_user.full_name if member_user else None
        }
        members_list.append(member_dict)
    
    return {
        **group.__dict__,
        "members": members_list
    }

@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: int,
    group_data: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update group (only owner or admin)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check permissions
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in [GroupRole.OWNER, GroupRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can update groups"
        )
    
    group.name = group_data.name
    group.description = group_data.description
    group.is_public = group_data.is_public
    db.commit()
    db.refresh(group)
    
    return group

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete group (only owner)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is owner
    if group.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can delete the group"
        )
    
    db.delete(group)
    db.commit()
    return None

@router.post("/{group_id}/members", response_model=GroupMembershipResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    group_id: int,
    membership_data: GroupMembershipCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a member to a group (only owner or admin)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check permissions
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()
    
    if not membership or membership.role not in [GroupRole.OWNER, GroupRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners and admins can add members"
        )
    
    # Check if user exists
    user = db.query(User).filter(User.id == membership_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already a member
    existing = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == membership_data.user_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this group"
        )
    
    # Create membership
    new_membership = GroupMembership(
        group_id=group_id,
        user_id=membership_data.user_id,
        role=membership_data.role
    )
    db.add(new_membership)
    db.commit()
    db.refresh(new_membership)
    
    return new_membership

@router.get("/{group_id}/members", response_model=List[GroupMembershipResponse])
async def list_members(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List group members"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check access
    if not group.is_public:
        membership = db.query(GroupMembership).filter(
            GroupMembership.group_id == group_id,
            GroupMembership.user_id == current_user.id
        ).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this group"
            )
    
    members = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id
    ).all()
    
    # Build members list with user info
    members_list = []
    for m in members:
        member_user = db.query(User).filter(User.id == m.user_id).first()
        member_dict = {
            "id": m.id,
            "group_id": m.group_id,
            "user_id": m.user_id,
            "role": m.role.value if m.role else None,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None,
            "user_email": member_user.email if member_user else None,
            "user_username": member_user.username if member_user else None,
            "user_full_name": member_user.full_name if member_user else None
        }
        members_list.append(member_dict)
    
    return members_list

@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    group_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a member from a group (only owner or admin, or self-removal)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == user_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found"
        )
    
    # Check permissions: can remove if owner/admin, or if removing self
    if user_id != current_user.id:
        current_membership = db.query(GroupMembership).filter(
            GroupMembership.group_id == group_id,
            GroupMembership.user_id == current_user.id
        ).first()
        
        if not current_membership or current_membership.role not in [GroupRole.OWNER, GroupRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only owners and admins can remove other members"
            )
    
    # Prevent removing the owner
    if membership.role == GroupRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the group owner"
        )
    
    db.delete(membership)
    db.commit()
    return None

@router.patch("/{group_id}/members/{user_id}/role", response_model=GroupMembershipResponse)
async def update_member_role(
    group_id: int,
    user_id: int,
    new_role: GroupRole = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a member's role (only owner)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if current user is owner
    if group.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group owner can change member roles"
        )
    
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == user_id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found"
        )
    
    # Prevent changing owner role
    if membership.role == GroupRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change the owner's role"
        )
    
    # Prevent setting someone else as owner (use transfer_ownership instead)
    if new_role == GroupRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use transfer_ownership endpoint to change group owner"
        )
    
    membership.role = new_role
    db.commit()
    db.refresh(membership)
    
    return GroupMembershipResponse(**membership.__dict__)

@router.post("/{group_id}/transfer-ownership", response_model=GroupResponse)
async def transfer_ownership(
    group_id: int,
    new_owner_id: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Transfer group ownership to another member (only current owner)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if current user is owner
    if group.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the group owner can transfer ownership"
        )
    
    # Check if new owner is a member
    new_owner_membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == new_owner_id
    ).first()
    
    if not new_owner_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New owner must be a member of the group"
        )
    
    # Get old owner membership
    old_owner_membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()
    
    # Transfer ownership
    group.owner_id = new_owner_id
    old_owner_membership.role = GroupRole.ADMIN  # Old owner becomes admin
    new_owner_membership.role = GroupRole.OWNER  # New owner becomes owner
    
    db.commit()
    db.refresh(group)
    
    return group

@router.post("/{group_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_group(
    group_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a group (cannot leave if you're the owner)"""
    group = db.query(Group).filter(Group.id == group_id).first()
    
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    
    # Check if user is owner
    if group.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Group owner cannot leave. Transfer ownership first."
        )
    
    membership = db.query(GroupMembership).filter(
        GroupMembership.group_id == group_id,
        GroupMembership.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not a member of this group"
        )
    
    db.delete(membership)
    db.commit()
    return None

@router.get("/search/users")
async def search_users(
    query: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Search users by email or username (for inviting to groups)"""
    if len(query) < 2:
        return []
    
    users = db.query(User).filter(
        (User.email.ilike(f"%{query}%")) | (User.username.ilike(f"%{query}%")),
        User.is_active == True
    ).limit(limit).all()
    
    return [
        {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name
        }
        for user in users
    ]

