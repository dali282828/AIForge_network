"""Add infrastructure investment tables

Revision ID: 008_add_infrastructure_investment
Revises: 007_add_nft_shares
Create Date: 2024-01-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import NUMERIC, JSON

# revision identifiers, used by Alembic.
revision = '008_infrastructure'
down_revision = '007_add_nft_shares'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create infrastructureprovider enum
    op.execute("DO $$ BEGIN CREATE TYPE infrastructureprovider AS ENUM ('aws', 'vultr', 'gcp', 'runpod', 'vast_ai', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # Create infrastructuretype enum
    op.execute("DO $$ BEGIN CREATE TYPE infrastructuretype AS ENUM ('gpu', 'cpu', 'both'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # Create infrastructurstatus enum
    op.execute("DO $$ BEGIN CREATE TYPE infrastructurstatus AS ENUM ('pending', 'active', 'inactive', 'suspended'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # Create infrastructure_investments table
    op.create_table(
        'infrastructure_investments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('investor_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=True),
        sa.Column('provider', postgresql.ENUM('aws', 'vultr', 'gcp', 'runpod', 'vast_ai', 'other', name='infrastructureprovider', create_type=False), nullable=False),
        sa.Column('infrastructure_type', postgresql.ENUM('gpu', 'cpu', 'both', name='infrastructuretype', create_type=False), nullable=False),
        sa.Column('resource_specs', JSON, nullable=False),
        sa.Column('connection_info', JSON, nullable=True),
        sa.Column('status', postgresql.ENUM('pending', 'active', 'inactive', 'suspended', name='infrastructurstatus', create_type=False), server_default='pending', nullable=False),
        sa.Column('allocated_to_model_id', sa.Integer(), nullable=True),
        sa.Column('allocated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_earnings', NUMERIC(18, 8), server_default='0', nullable=False),
        sa.Column('last_payout_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['investor_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ),
        sa.ForeignKeyConstraint(['allocated_to_model_id'], ['models.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_infrastructure_investments_id'), 'infrastructure_investments', ['id'], unique=False)
    op.create_index(op.f('ix_infrastructure_investments_investor_id'), 'infrastructure_investments', ['investor_id'], unique=False)
    op.create_index(op.f('ix_infrastructure_investments_group_id'), 'infrastructure_investments', ['group_id'], unique=False)
    op.create_index(op.f('ix_infrastructure_investments_allocated_to_model_id'), 'infrastructure_investments', ['allocated_to_model_id'], unique=False)
    
    # Create infrastructure_usage table
    op.create_table(
        'infrastructure_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('investment_id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('job_id', sa.Integer(), nullable=True),
        sa.Column('period_year', sa.Integer(), nullable=False),
        sa.Column('period_month', sa.Integer(), nullable=False),
        sa.Column('hours_used', NUMERIC(10, 2), server_default='0', nullable=False),
        sa.Column('requests_processed', sa.Integer(), server_default='0', nullable=False),
        sa.Column('tokens_processed', sa.Integer(), server_default='0', nullable=False),
        sa.Column('earnings', NUMERIC(18, 8), server_default='0', nullable=False),
        sa.Column('earnings_rate', NUMERIC(10, 4), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['investment_id'], ['infrastructure_investments.id'], ),
        sa.ForeignKeyConstraint(['model_id'], ['models.id'], ),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_infrastructure_usage_id'), 'infrastructure_usage', ['id'], unique=False)
    op.create_index(op.f('ix_infrastructure_usage_investment_id'), 'infrastructure_usage', ['investment_id'], unique=False)
    op.create_index(op.f('ix_infrastructure_usage_model_id'), 'infrastructure_usage', ['model_id'], unique=False)
    op.create_index(op.f('ix_infrastructure_usage_job_id'), 'infrastructure_usage', ['job_id'], unique=False)
    op.create_index(op.f('ix_infrastructure_usage_period_year'), 'infrastructure_usage', ['period_year'], unique=False)
    op.create_index(op.f('ix_infrastructure_usage_period_month'), 'infrastructure_usage', ['period_month'], unique=False)
    
    # Create infrastructure_payouts table
    op.create_table(
        'infrastructure_payouts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('investment_id', sa.Integer(), nullable=False),
        sa.Column('period_year', sa.Integer(), nullable=False),
        sa.Column('period_month', sa.Integer(), nullable=False),
        sa.Column('amount', NUMERIC(18, 8), nullable=False),
        sa.Column('currency', sa.String(), server_default='USDT', nullable=False),
        sa.Column('payment_tx_hash', sa.String(), nullable=True),
        sa.Column('payment_status', sa.String(), server_default='pending', nullable=False),
        sa.Column('to_wallet_address', sa.String(), nullable=False),
        sa.Column('network', sa.String(), server_default='tron', nullable=False),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['investment_id'], ['infrastructure_investments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_infrastructure_payouts_id'), 'infrastructure_payouts', ['id'], unique=False)
    op.create_index(op.f('ix_infrastructure_payouts_investment_id'), 'infrastructure_payouts', ['investment_id'], unique=False)
    op.create_index(op.f('ix_infrastructure_payouts_period_year'), 'infrastructure_payouts', ['period_year'], unique=False)
    op.create_index(op.f('ix_infrastructure_payouts_period_month'), 'infrastructure_payouts', ['period_month'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_infrastructure_payouts_period_month'), table_name='infrastructure_payouts')
    op.drop_index(op.f('ix_infrastructure_payouts_period_year'), table_name='infrastructure_payouts')
    op.drop_index(op.f('ix_infrastructure_payouts_investment_id'), table_name='infrastructure_payouts')
    op.drop_index(op.f('ix_infrastructure_payouts_id'), table_name='infrastructure_payouts')
    op.drop_table('infrastructure_payouts')
    
    op.drop_index(op.f('ix_infrastructure_usage_period_month'), table_name='infrastructure_usage')
    op.drop_index(op.f('ix_infrastructure_usage_period_year'), table_name='infrastructure_usage')
    op.drop_index(op.f('ix_infrastructure_usage_job_id'), table_name='infrastructure_usage')
    op.drop_index(op.f('ix_infrastructure_usage_model_id'), table_name='infrastructure_usage')
    op.drop_index(op.f('ix_infrastructure_usage_investment_id'), table_name='infrastructure_usage')
    op.drop_index(op.f('ix_infrastructure_usage_id'), table_name='infrastructure_usage')
    op.drop_table('infrastructure_usage')
    
    op.drop_index(op.f('ix_infrastructure_investments_allocated_to_model_id'), table_name='infrastructure_investments')
    op.drop_index(op.f('ix_infrastructure_investments_group_id'), table_name='infrastructure_investments')
    op.drop_index(op.f('ix_infrastructure_investments_investor_id'), table_name='infrastructure_investments')
    op.drop_index(op.f('ix_infrastructure_investments_id'), table_name='infrastructure_investments')
    op.drop_table('infrastructure_investments')
    
    op.execute("DROP TYPE IF EXISTS infrastructurstatus")
    op.execute("DROP TYPE IF EXISTS infrastructuretype")
    op.execute("DROP TYPE IF EXISTS infrastructureprovider")

