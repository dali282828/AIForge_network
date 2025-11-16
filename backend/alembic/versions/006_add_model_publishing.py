"""Add model publishing and revenue distribution tables

Revision ID: 006_add_model_publishing
Revises: 005_update_user_wallet_auth
Create Date: 2024-01-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import NUMERIC

# revision identifiers, used by Alembic.
revision = '006_add_model_publishing'
down_revision = '005_update_user_wallet_auth'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create publishingstatus enum
    op.execute("DO $$ BEGIN CREATE TYPE publishingstatus AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PUBLISHED', 'LISTING_EXPIRED', 'SUSPENDED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # Create model_publishing table
    op.create_table(
        'model_publishing',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('status', postgresql.ENUM('DRAFT', 'PENDING_PAYMENT', 'PUBLISHED', 'LISTING_EXPIRED', 'SUSPENDED', name='publishingstatus', create_type=False), nullable=False, server_default='DRAFT'),
        sa.Column('publishing_fee_paid', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('publishing_fee_payment_id', sa.Integer(), nullable=True),
        sa.Column('publishing_fee_amount', NUMERIC(10, 2), nullable=False, server_default='5.00'),
        sa.Column('listing_fee_amount', NUMERIC(10, 2), nullable=False, server_default='2.00'),
        sa.Column('listing_fee_paid_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_listing_payment_id', sa.Integer(), nullable=True),
        sa.Column('next_listing_payment_due', sa.DateTime(timezone=True), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('listing_expired_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['model_id'], ['models.id'], ),
        sa.ForeignKeyConstraint(['publishing_fee_payment_id'], ['payments.id'], ),
        sa.ForeignKeyConstraint(['last_listing_payment_id'], ['payments.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('model_id')
    )
    op.create_index(op.f('ix_model_publishing_id'), 'model_publishing', ['id'], unique=False)
    op.create_index(op.f('ix_model_publishing_model_id'), 'model_publishing', ['model_id'], unique=True)
    op.create_index(op.f('ix_model_publishing_status'), 'model_publishing', ['status'], unique=False)
    
    # Create group_revenue_splits table
    op.create_table(
        'group_revenue_splits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('group_id', sa.Integer(), nullable=False),
        sa.Column('split_config', sa.String(), nullable=False),
        sa.Column('min_percentage_per_member', NUMERIC(5, 2), nullable=False, server_default='5.00'),
        sa.Column('usage_bonus_percent', NUMERIC(5, 2), nullable=False, server_default='0.00'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['model_id'], ['models.id'], ),
        sa.ForeignKeyConstraint(['group_id'], ['groups.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_group_revenue_splits_id'), 'group_revenue_splits', ['id'], unique=False)
    op.create_index(op.f('ix_group_revenue_splits_model_id'), 'group_revenue_splits', ['model_id'], unique=False)
    op.create_index(op.f('ix_group_revenue_splits_group_id'), 'group_revenue_splits', ['group_id'], unique=False)
    
    # Create revenue_distributions table
    op.create_table(
        'revenue_distributions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('period_year', sa.Integer(), nullable=False),
        sa.Column('period_month', sa.Integer(), nullable=False),
        sa.Column('total_revenue', NUMERIC(18, 8), nullable=False),
        sa.Column('platform_fee', NUMERIC(18, 8), nullable=False),
        sa.Column('model_pool', NUMERIC(18, 8), nullable=False),
        sa.Column('distribution_details', sa.String(), nullable=False),
        sa.Column('is_distributed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('distributed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['model_id'], ['models.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_revenue_distributions_id'), 'revenue_distributions', ['id'], unique=False)
    op.create_index(op.f('ix_revenue_distributions_model_id'), 'revenue_distributions', ['model_id'], unique=False)
    op.create_index(op.f('ix_revenue_distributions_period_year'), 'revenue_distributions', ['period_year'], unique=False)
    op.create_index(op.f('ix_revenue_distributions_period_month'), 'revenue_distributions', ['period_month'], unique=False)


def downgrade() -> None:
    op.drop_table('revenue_distributions')
    op.drop_table('group_revenue_splits')
    op.drop_table('model_publishing')
    op.execute("DROP TYPE IF EXISTS publishingstatus")

