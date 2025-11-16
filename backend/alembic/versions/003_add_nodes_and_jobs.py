"""Add nodes and jobs tables

Revision ID: 003_add_nodes_jobs
Revises: 002_add_models
Create Date: 2024-01-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003_add_nodes_jobs'
down_revision = '002_add_models'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create jobstatus and jobtype enums (if not exists)
    op.execute("DO $$ BEGIN CREATE TYPE jobstatus AS ENUM ('PENDING', 'ASSIGNED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE jobtype AS ENUM ('TEST', 'FINETUNE', 'MERGE', 'QUANTIZE', 'INFERENCE'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # Create nodes table
    op.create_table(
        'nodes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('node_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_heartbeat', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resources', sa.JSON(), nullable=True),
        sa.Column('max_concurrent_jobs', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('gpu_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('total_jobs_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_jobs_failed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_nodes_id'), 'nodes', ['id'], unique=False)
    op.create_index(op.f('ix_nodes_node_id'), 'nodes', ['node_id'], unique=True)
    
    # Create jobs table
    op.create_table(
        'jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.String(), nullable=False),
        sa.Column('type', postgresql.ENUM('TEST', 'FINETUNE', 'MERGE', 'QUANTIZE', 'INFERENCE', name='jobtype', create_type=False), nullable=False, server_default='TEST'),
        sa.Column('node_id', sa.Integer(), nullable=True),
        sa.Column('status', postgresql.ENUM('PENDING', 'ASSIGNED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', name='jobstatus', create_type=False), nullable=False, server_default='PENDING'),
        sa.Column('config', sa.JSON(), nullable=False),
        sa.Column('input_files', sa.JSON(), nullable=True),
        sa.Column('output_files', sa.JSON(), nullable=True),
        sa.Column('docker_image', sa.String(), nullable=True),
        sa.Column('command', sa.JSON(), nullable=True),
        sa.Column('environment', sa.JSON(), nullable=True),
        sa.Column('progress', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('result', sa.JSON(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('output_cid', sa.String(), nullable=True),
        sa.Column('memory_limit', sa.String(), nullable=True),
        sa.Column('cpu_limit', sa.Float(), nullable=True),
        sa.Column('gpus', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['node_id'], ['nodes.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_jobs_id'), 'jobs', ['id'], unique=False)
    op.create_index(op.f('ix_jobs_job_id'), 'jobs', ['job_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_jobs_job_id'), table_name='jobs')
    op.drop_index(op.f('ix_jobs_id'), table_name='jobs')
    op.drop_table('jobs')
    op.drop_index(op.f('ix_nodes_node_id'), table_name='nodes')
    op.drop_index(op.f('ix_nodes_id'), table_name='nodes')
    op.drop_table('nodes')
    op.execute('DROP TYPE IF EXISTS jobstatus')
    op.execute('DROP TYPE IF EXISTS jobtype')

