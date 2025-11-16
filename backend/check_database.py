#!/usr/bin/env python3
"""
Quick script to check database connection and encoding
"""
import sys
import psycopg2
from psycopg2 import sql

def check_database():
    try:
        # Try to connect
        print("Attempting to connect to database...")
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            database="aiforge",
            user="aiforge",
            password="aiforge"
        )
        
        print("✅ Connection successful!")
        
        # Check encoding
        cur = conn.cursor()
        cur.execute("SHOW server_encoding;")
        encoding = cur.fetchone()[0]
        print(f"Database encoding: {encoding}")
        
        if encoding.lower() != 'utf8':
            print("⚠️  Warning: Database encoding is not UTF-8")
            print("   Please recreate database with UTF-8 encoding")
        else:
            print("✅ Encoding is correct (UTF-8)")
        
        # Check if database exists and is accessible
        cur.execute("SELECT version();")
        version = cur.fetchone()[0]
        print(f"PostgreSQL version: {version.split(',')[0]}")
        
        cur.close()
        conn.close()
        return True
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection failed: {e}")
        print("\nPossible issues:")
        print("1. PostgreSQL service is not running")
        print("2. Database 'aiforge' does not exist")
        print("3. User 'aiforge' does not exist or wrong password")
        print("4. Wrong host/port")
        return False
    except UnicodeDecodeError as e:
        print(f"❌ Encoding error: {e}")
        print("\nDatabase has encoding issues.")
        print("Solution: Recreate database with UTF-8 encoding")
        print("See fix_database_encoding.sql for SQL commands")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("AIForge Network - Database Connection Check")
    print("=" * 60)
    print()
    
    success = check_database()
    
    print()
    print("=" * 60)
    if success:
        print("✅ Database is ready for migrations!")
        sys.exit(0)
    else:
        print("❌ Database needs to be fixed before migrations")
        sys.exit(1)

