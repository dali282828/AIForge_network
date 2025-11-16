"""Add models table

Revision ID: 002_add_models
Revises: 001_initial
Create Date: 2024-01-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_models'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create modellicense enum (if not exists)
    op.execute("DO $$ BEGIN CREATE TYPE modellicense AS ENUM ('OPEN', 'COMMERCIAL', 'RESTRICTED', 'CUSTOM'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # Create models table
    op.create_table(
        'models',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('version', sa.String(), nullable=False, server_default='1.0.0'),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('ipfs_cid', sa.String(), nullable=True),
        sa.Column('minio_path', sa.String(), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('file_format', sa.String(), nullable=True),
        sa.Column('license', postgresql.ENUM('OPEN', 'COMMERCIAL', 'RESTRICTED', 'CUSTOM', name='modellicense', create_type=False), nullable=False, server_default='OPEN'),
        sa.Column('license_text', sa.Text(), nullable=True),
        sa.Column('tags', sa.String(), nullable=True),
        sa.Column('is_encrypted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('encryption_key_hash', sa.String(), nullable=True),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('source_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_models_id'), 'models', ['id'], unique=False)
    op.create_index(op.f('ix_models_name'), 'models', ['name'], unique=False)
    op.create_index(op.f('ix_models_ipfs_cid'), 'models', ['ipfs_cid'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_models_ipfs_cid'), table_name='models')
    op.drop_index(op.f('ix_models_name'), table_name='models')
    op.drop_index(op.f('ix_models_id'), table_name='models')
    op.drop_table('models')
    op.execute('DROP TYPE IF EXISTS modellicense')

