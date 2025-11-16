from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.group import GroupRole

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

class GroupCreate(GroupBase):
    pass

class GroupResponse(GroupBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class Group(GroupResponse):
    pass

class GroupMembershipBase(BaseModel):
    role: GroupRole = GroupRole.MEMBER

class GroupMembershipCreate(GroupMembershipBase):
    user_id: int

class GroupMembershipResponse(GroupMembershipBase):
    id: int
    group_id: int
    user_id: int
    joined_at: datetime
    
    class Config:
        from_attributes = True

class GroupMembership(GroupMembershipResponse):
    pass

class GroupWithMembers(GroupResponse):
    members: List[GroupMembershipResponse] = []

