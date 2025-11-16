"""
Helper functions for Neo4j operations
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

def generate_id() -> str:
    """Generate a unique ID for Neo4j nodes"""
    return str(uuid.uuid4())

def node_to_dict(record, node_alias: str = "n") -> Optional[Dict[str, Any]]:
    """
    Convert Neo4j record node to dictionary
    """
    if node_alias not in record:
        return None
    
    node = record[node_alias]
    return dict(node)

def relationship_to_dict(record, rel_alias: str = "r") -> Optional[Dict[str, Any]]:
    """
    Convert Neo4j record relationship to dictionary
    """
    if rel_alias not in record:
        return None
    
    rel = record[rel_alias]
    return {
        "type": rel.type,
        "properties": dict(rel)
    }

def create_user_node(session, user_data: Dict[str, Any]) -> str:
    """
    Create a User node in Neo4j
    Returns the user ID
    """
    user_id = generate_id()
    query = """
    CREATE (u:User {
        id: $id,
        email: $email,
        username: $username,
        full_name: $full_name,
        hashed_password: $hashed_password,
        is_active: $is_active,
        is_verified: $is_verified,
        auth_method: $auth_method,
        created_at: datetime(),
        updated_at: datetime()
    })
    RETURN u.id as id
    """
    
    result = session.run(query, {
        "id": user_id,
        "email": user_data.get("email"),
        "username": user_data.get("username"),
        "full_name": user_data.get("full_name"),
        "hashed_password": user_data.get("hashed_password"),
        "is_active": user_data.get("is_active", True),
        "is_verified": user_data.get("is_verified", False),
        "auth_method": user_data.get("auth_method", "email")
    })
    
    return result.single()["id"]

def get_user_by_email(session, email: str) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    query = """
    MATCH (u:User {email: $email})
    RETURN u
    """
    result = session.run(query, {"email": email})
    record = result.single()
    if record:
        return dict(record["u"])
    return None

def get_user_by_username(session, username: str) -> Optional[Dict[str, Any]]:
    """Get user by username"""
    query = """
    MATCH (u:User {username: $username})
    RETURN u
    """
    result = session.run(query, {"username": username})
    record = result.single()
    if record:
        return dict(record["u"])
    return None

def get_user_by_id(session, user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    query = """
    MATCH (u:User {id: $id})
    RETURN u
    """
    result = session.run(query, {"id": user_id})
    record = result.single()
    if record:
        return dict(record["u"])
    return None

def create_group_node(session, group_data: Dict[str, Any]) -> str:
    """
    Create a Group node in Neo4j
    Returns the group ID
    """
    group_id = generate_id()
    query = """
    CREATE (g:Group {
        id: $id,
        name: $name,
        description: $description,
        is_public: $is_public,
        created_at: datetime(),
        updated_at: datetime()
    })
    RETURN g.id as id
    """
    
    result = session.run(query, {
        "id": group_id,
        "name": group_data.get("name"),
        "description": group_data.get("description"),
        "is_public": group_data.get("is_public", False)
    })
    
    return result.single()["id"]

def create_membership_relationship(session, user_id: str, group_id: str, role: str = "member"):
    """
    Create MEMBER_OF relationship between User and Group
    """
    query = """
    MATCH (u:User {id: $user_id})
    MATCH (g:Group {id: $group_id})
    CREATE (u)-[r:MEMBER_OF {
        role: $role,
        joined_at: datetime()
    }]->(g)
    RETURN r
    """
    
    session.run(query, {
        "user_id": user_id,
        "group_id": group_id,
        "role": role
    })

def get_user_groups(session, user_id: str) -> List[Dict[str, Any]]:
    """Get all groups a user is a member of"""
    query = """
    MATCH (u:User {id: $user_id})-[r:MEMBER_OF]->(g:Group)
    RETURN g, r.role as role, r.joined_at as joined_at
    """
    
    result = session.run(query, {"user_id": user_id})
    groups = []
    for record in result:
        group = dict(record["g"])
        group["role"] = record["role"]
        group["joined_at"] = record["joined_at"]
        groups.append(group)
    
    return groups

