"""Add NFT shares and rewards tables

Revision ID: 007_add_nft_shares
Revises: 006_add_model_publishing
Create Date: 2024-01-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import NUMERIC

# revision identifiers, used by Alembic.
revision = '007_add_nft_shares'
down_revision = '006_add_model_publishing'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create nft_shares table
    op.create_table(
        'nft_shares',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('token_id', sa.Integer(), nullable=False),
        sa.Column('owner_wallet_address', sa.String(), nullable=False),
        sa.Column('owner_user_id', sa.Integer(), nullable=True),
        sa.Column('share_number', sa.Integer(), nullable=False),
        sa.Column('minted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('contract_address', sa.String(), nullable=False),
        sa.Column('tx_hash', sa.String(), nullable=True),
        sa.Column('block_number', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_nft_shares_id'), 'nft_shares', ['id'], unique=False)
    op.create_index(op.f('ix_nft_shares_token_id'), 'nft_shares', ['token_id'], unique=True)
    op.create_index(op.f('ix_nft_shares_owner_wallet_address'), 'nft_shares', ['owner_wallet_address'], unique=False)
    op.create_index(op.f('ix_nft_shares_owner_user_id'), 'nft_shares', ['owner_user_id'], unique=False)
    
    # Create nft_rewards table
    op.create_table(
        'nft_rewards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nft_share_id', sa.Integer(), nullable=False),
        sa.Column('period_year', sa.Integer(), nullable=False),
        sa.Column('period_month', sa.Integer(), nullable=False),
        sa.Column('reward_amount', NUMERIC(18, 8), nullable=False),
        sa.Column('reward_percentage', NUMERIC(5, 2), nullable=False),
        sa.Column('total_pool_amount', NUMERIC(18, 8), nullable=False),
        sa.Column('total_shares', sa.Integer(), nullable=False),
        sa.Column('payment_tx_hash', sa.String(), nullable=True),
        sa.Column('payment_status', sa.String(), server_default='pending', nullable=False),
        sa.Column('distributed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['nft_share_id'], ['nft_shares.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_nft_rewards_id'), 'nft_rewards', ['id'], unique=False)
    op.create_index(op.f('ix_nft_rewards_nft_share_id'), 'nft_rewards', ['nft_share_id'], unique=False)
    op.create_index(op.f('ix_nft_rewards_period_year'), 'nft_rewards', ['period_year'], unique=False)
    op.create_index(op.f('ix_nft_rewards_period_month'), 'nft_rewards', ['period_month'], unique=False)
    
    # Create nft_reward_pools table
    op.create_table(
        'nft_reward_pools',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('period_year', sa.Integer(), nullable=False),
        sa.Column('period_month', sa.Integer(), nullable=False),
        sa.Column('subscription_revenue_share', NUMERIC(18, 8), server_default='0', nullable=False),
        sa.Column('api_revenue_share', NUMERIC(18, 8), server_default='0', nullable=False),
        sa.Column('total_pool', NUMERIC(18, 8), server_default='0', nullable=False),
        sa.Column('total_shares', sa.Integer(), server_default='0', nullable=False),
        sa.Column('reward_per_share', NUMERIC(18, 8), server_default='0', nullable=False),
        sa.Column('is_distributed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('calculated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('distributed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('period_year', 'period_month', name='uq_nft_reward_pool_period')
    )
    op.create_index(op.f('ix_nft_reward_pools_id'), 'nft_reward_pools', ['id'], unique=False)
    op.create_index(op.f('ix_nft_reward_pools_period_year'), 'nft_reward_pools', ['period_year'], unique=False)
    op.create_index(op.f('ix_nft_reward_pools_period_month'), 'nft_reward_pools', ['period_month'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_nft_reward_pools_period_month'), table_name='nft_reward_pools')
    op.drop_index(op.f('ix_nft_reward_pools_period_year'), table_name='nft_reward_pools')
    op.drop_index(op.f('ix_nft_reward_pools_id'), table_name='nft_reward_pools')
    op.drop_table('nft_reward_pools')
    
    op.drop_index(op.f('ix_nft_rewards_period_month'), table_name='nft_rewards')
    op.drop_index(op.f('ix_nft_rewards_period_year'), table_name='nft_rewards')
    op.drop_index(op.f('ix_nft_rewards_nft_share_id'), table_name='nft_rewards')
    op.drop_index(op.f('ix_nft_rewards_id'), table_name='nft_rewards')
    op.drop_table('nft_rewards')
    
    op.drop_index(op.f('ix_nft_shares_owner_user_id'), table_name='nft_shares')
    op.drop_index(op.f('ix_nft_shares_owner_wallet_address'), table_name='nft_shares')
    op.drop_index(op.f('ix_nft_shares_token_id'), table_name='nft_shares')
    op.drop_index(op.f('ix_nft_shares_id'), table_name='nft_shares')
    op.drop_table('nft_shares')

