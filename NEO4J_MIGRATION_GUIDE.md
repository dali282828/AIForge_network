# 🔄 Neo4j Migration Guide

This guide explains the migration from PostgreSQL to Neo4j.

## 📋 Overview

The backend is being migrated from PostgreSQL (SQLAlchemy) to Neo4j (graph database). This is a **major refactoring** that affects:

- All database models
- All API endpoints
- All queries (SQL → Cypher)
- Database connection logic

## 🎯 Why Neo4j?

Neo4j is a graph database that excels at:
- **Relationship-heavy data** (users, groups, memberships, models)
- **Complex queries** (finding connections, recommendations)
- **Social network features** (perfect for collaborative platforms)

## 🔧 Changes Made

### 1. Database Driver
- **Removed:** SQLAlchemy, PostgreSQL driver
- **Added:** Neo4j Python driver

### 2. Connection
- **Old:** SQLAlchemy engine with sessions
- **New:** Neo4j driver with sessions

### 3. Models
- **Old:** SQLAlchemy ORM models (tables)
- **New:** Neo4j nodes and relationships

### 4. Queries
- **Old:** SQL queries via SQLAlchemy
- **New:** Cypher queries

## 📊 Data Model Conversion

### PostgreSQL → Neo4j

| PostgreSQL | Neo4j |
|------------|-------|
| Table | Node Label |
| Row | Node |
| Foreign Key | Relationship |
| Join Table | Relationship with properties |

### Example: User Model

**PostgreSQL (SQLAlchemy):**
```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String)
    username = Column(String)
```

**Neo4j (Cypher):**
```cypher
CREATE (u:User {
    id: $id,
    email: $email,
    username: $username,
    created_at: datetime()
})
```

### Example: Relationships

**PostgreSQL:**
```python
group_id = Column(Integer, ForeignKey("groups.id"))
```

**Neo4j:**
```cypher
MATCH (u:User {id: $user_id})
MATCH (g:Group {id: $group_id})
CREATE (u)-[:MEMBER_OF {role: $role, joined_at: datetime()}]->(g)
```

## 🔌 Connection Setup

### Environment Variables

```bash
# Neo4j Connection
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j
```

### Free Neo4j Options

1. **Neo4j Aura Free** (Cloud)
   - URL: [https://neo4j.com/cloud/aura/](https://neo4j.com/cloud/aura/)
   - Free tier: 50K nodes, 175K relationships
   - No credit card required

2. **Neo4j Desktop** (Local)
   - Download: [https://neo4j.com/download/](https://neo4j.com/download/)
   - Free for development
   - Runs locally

3. **Neo4j Sandbox** (Temporary)
   - URL: [https://neo4j.com/sandbox/](https://neo4j.com/sandbox/)
   - Free 3-day instances
   - Good for testing

## 📝 Migration Status

### ✅ Completed
- [x] Neo4j driver added
- [x] Database connection module created
- [x] Config updated

### 🚧 In Progress
- [ ] User model conversion
- [ ] Group model conversion
- [ ] API endpoints update

### ⏳ Pending
- [ ] All other models
- [ ] All API endpoints
- [ ] Migration scripts
- [ ] Testing

## 🚀 Next Steps

1. **Set up Neo4j** (choose one):
   - Neo4j Aura Free (cloud)
   - Neo4j Desktop (local)

2. **Update environment variables** in Vercel

3. **Test connection** with health check

4. **Migrate models** one by one

5. **Update API endpoints** to use Cypher

## 📚 Resources

- [Neo4j Python Driver Docs](https://neo4j.com/docs/python-manual/current/)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/current/)
- [Neo4j Aura Free](https://neo4j.com/cloud/aura/)

---

**Note:** This is a work in progress. The migration will be completed incrementally.

