"""Add wallets, payments, subscriptions, and API services tables

Revision ID: 004_add_wallets_payments_subscriptions
Revises: 003_add_nodes_jobs
Create Date: 2024-01-04 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import NUMERIC

# revision identifiers, used by Alembic.
revision = '004_wallets_payments_subs'
down_revision = '003_add_nodes_jobs'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enums (if not exists)
    op.execute("DO $$ BEGIN CREATE TYPE walletnetwork AS ENUM ('ETHEREUM', 'TRON'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE wallettype AS ENUM ('METAMASK', 'TRONLINK'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE paymentstatus AS ENUM ('PENDING', 'CONFIRMING', 'CONFIRMED', 'FAILED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE paymenttype AS ENUM ('SUBSCRIPTION', 'JOB', 'MODEL_PURCHASE', 'API_SUBSCRIPTION', 'API_USAGE'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE subscriptionplan AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE subscriptionstatus AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING', 'PAST_DUE'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    op.execute("DO $$ BEGIN CREATE TYPE pricingtype AS ENUM ('SUBSCRIPTION', 'PAY_PER_REQUEST', 'HYBRID'); EXCEPTION WHEN duplicate_object THEN null; END $$;")
    
    # Create user_wallets table
    op.create_table(
        'user_wallets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('wallet_address', sa.String(), nullable=False),
        sa.Column('network', postgresql.ENUM('ETHEREUM', 'TRON', name='walletnetwork', create_type=False), nullable=False),
        sa.Column('wallet_type', postgresql.ENUM('METAMASK', 'TRONLINK', name='wallettype', create_type=False), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('verification_signature', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_wallets_id'), 'user_wallets', ['id'], unique=False)
    op.create_index(op.f('ix_user_wallets_user_id'), 'user_wallets', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_wallets_wallet_address'), 'user_wallets', ['wallet_address'], unique=False)
    
    # Create admin_wallets table
    op.create_table(
        'admin_wallets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('wallet_address', sa.String(), nullable=False),
        sa.Column('network', postgresql.ENUM('ETHEREUM', 'TRON', name='walletnetwork', create_type=False), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('added_by', sa.Integer(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['added_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('wallet_address')
    )
    op.create_index(op.f('ix_admin_wallets_id'), 'admin_wallets', ['id'], unique=False)
    op.create_index(op.f('ix_admin_wallets_wallet_address'), 'admin_wallets', ['wallet_address'], unique=False)
    
    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('plan_type', postgresql.ENUM('FREE', 'BASIC', 'PRO', 'ENTERPRISE', name='subscriptionplan', create_type=False), nullable=False),
        sa.Column('price', NUMERIC(10, 2), nullable=False),
        sa.Column('currency', sa.String(), nullable=False, server_default='USDT'),
        sa.Column('status', postgresql.ENUM('ACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING', 'PAST_DUE', name='subscriptionstatus', create_type=False), nullable=False, server_default='PENDING'),
        sa.Column('auto_renew', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('request_limit', sa.Integer(), nullable=True),
        sa.Column('requests_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_payment_id', sa.Integer(), nullable=True),
        sa.Column('next_billing_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_subscriptions_id'), 'subscriptions', ['id'], unique=False)
    op.create_index(op.f('ix_subscriptions_user_id'), 'subscriptions', ['user_id'], unique=False)
    op.create_index(op.f('ix_subscriptions_plan_type'), 'subscriptions', ['plan_type'], unique=False)
    op.create_index(op.f('ix_subscriptions_status'), 'subscriptions', ['status'], unique=False)
    op.create_index(op.f('ix_subscriptions_expires_at'), 'subscriptions', ['expires_at'], unique=False)
    
    # Create payments table
    op.create_table(
        'payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('payment_type', postgresql.ENUM('SUBSCRIPTION', 'JOB', 'MODEL_PURCHASE', 'API_SUBSCRIPTION', 'API_USAGE', name='paymenttype', create_type=False), nullable=False),
        sa.Column('status', postgresql.ENUM('PENDING', 'CONFIRMING', 'CONFIRMED', 'FAILED', 'CANCELLED', name='paymentstatus', create_type=False), nullable=False, server_default='PENDING'),
        sa.Column('amount', NUMERIC(18, 8), nullable=False),
        sa.Column('currency', sa.String(), nullable=False, server_default='USDT'),
        sa.Column('network', sa.String(), nullable=False),
        sa.Column('platform_fee_percent', NUMERIC(5, 4), nullable=False, server_default='0.0'),
        sa.Column('platform_fee_amount', NUMERIC(18, 8), nullable=False, server_default='0.0'),
        sa.Column('net_amount', NUMERIC(18, 8), nullable=False),
        sa.Column('from_wallet_id', sa.Integer(), nullable=False),
        sa.Column('from_address', sa.String(), nullable=False),
        sa.Column('to_address', sa.String(), nullable=False),
        sa.Column('tx_hash', sa.String(), nullable=True),
        sa.Column('block_number', sa.Integer(), nullable=True),
        sa.Column('block_hash', sa.String(), nullable=True),
        sa.Column('confirmations', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('required_confirmations', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('subscription_id', sa.Integer(), nullable=True),
        sa.Column('job_id', sa.Integer(), nullable=True),
        sa.Column('model_id', sa.Integer(), nullable=True),
        sa.Column('api_subscription_id', sa.Integer(), nullable=True),
        sa.Column('payment_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['from_wallet_id'], ['user_wallets.id'], ),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], ),
        sa.ForeignKeyConstraint(['job_id'], ['jobs.id'], ),
        sa.ForeignKeyConstraint(['model_id'], ['models.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_payments_id'), 'payments', ['id'], unique=False)
    op.create_index(op.f('ix_payments_payment_type'), 'payments', ['payment_type'], unique=False)
    op.create_index(op.f('ix_payments_status'), 'payments', ['status'], unique=False)
    op.create_index(op.f('ix_payments_tx_hash'), 'payments', ['tx_hash'], unique=True)
    op.create_index(op.f('ix_payments_from_address'), 'payments', ['from_address'], unique=False)
    op.create_index(op.f('ix_payments_to_address'), 'payments', ['to_address'], unique=False)
    op.create_index(op.f('ix_payments_created_at'), 'payments', ['created_at'], unique=False)
    
    # Create api_services table
    op.create_table(
        'api_services',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('api_endpoint', sa.String(), nullable=False),
        sa.Column('api_key_prefix', sa.String(), nullable=False),
        sa.Column('pricing_type', postgresql.ENUM('SUBSCRIPTION', 'PAY_PER_REQUEST', 'HYBRID', name='pricingtype', create_type=False), nullable=False, server_default='SUBSCRIPTION'),
        sa.Column('subscription_price', NUMERIC(10, 2), nullable=True),
        sa.Column('price_per_request', NUMERIC(10, 6), nullable=True),
        sa.Column('price_per_token', NUMERIC(10, 8), nullable=True),
        sa.Column('rate_limit_per_minute', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('rate_limit_per_hour', sa.Integer(), nullable=False, server_default='1000'),
        sa.Column('rate_limit_per_day', sa.Integer(), nullable=False, server_default='10000'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('total_requests', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_revenue', NUMERIC(18, 8), nullable=False, server_default='0.0'),
        sa.Column('total_subscribers', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['model_id'], ['models.id'], ),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_api_services_id'), 'api_services', ['id'], unique=False)
    op.create_index(op.f('ix_api_services_name'), 'api_services', ['name'], unique=False)
    op.create_index(op.f('ix_api_services_model_id'), 'api_services', ['model_id'], unique=False)
    op.create_index(op.f('ix_api_services_owner_id'), 'api_services', ['owner_id'], unique=False)
    op.create_index(op.f('ix_api_services_is_active'), 'api_services', ['is_active'], unique=False)
    
    # Create api_subscriptions table
    op.create_table(
        'api_subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('service_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('api_key', sa.String(), nullable=False),
        sa.Column('api_key_hash', sa.String(), nullable=False),
        sa.Column('subscription_type', postgresql.ENUM('SUBSCRIPTION', 'PAY_PER_REQUEST', 'HYBRID', name='pricingtype', create_type=False), nullable=False),
        sa.Column('credits_remaining', NUMERIC(18, 8), nullable=False, server_default='0.0'),
        sa.Column('monthly_limit', sa.Integer(), nullable=True),
        sa.Column('requests_used_this_month', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_reset_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_payment_id', sa.Integer(), nullable=True),
        sa.Column('next_billing_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('total_requests', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_spent', NUMERIC(18, 8), nullable=False, server_default='0.0'),
        sa.Column('purchased_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['service_id'], ['api_services.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('api_key')
    )
    op.create_index(op.f('ix_api_subscriptions_id'), 'api_subscriptions', ['id'], unique=False)
    op.create_index(op.f('ix_api_subscriptions_service_id'), 'api_subscriptions', ['service_id'], unique=False)
    op.create_index(op.f('ix_api_subscriptions_user_id'), 'api_subscriptions', ['user_id'], unique=False)
    op.create_index(op.f('ix_api_subscriptions_api_key'), 'api_subscriptions', ['api_key'], unique=True)
    op.create_index(op.f('ix_api_subscriptions_is_active'), 'api_subscriptions', ['is_active'], unique=False)
    
    # Create api_requests table
    op.create_table(
        'api_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subscription_id', sa.Integer(), nullable=False),
        sa.Column('service_id', sa.Integer(), nullable=False),
        sa.Column('request_data', sa.Text(), nullable=True),
        sa.Column('response_data', sa.Text(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('input_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('output_tokens', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('cost', NUMERIC(18, 8), nullable=False, server_default='0.0'),
        sa.Column('status', sa.String(), nullable=False, server_default='success'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['subscription_id'], ['api_subscriptions.id'], ),
        sa.ForeignKeyConstraint(['service_id'], ['api_services.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_api_requests_id'), 'api_requests', ['id'], unique=False)
    op.create_index(op.f('ix_api_requests_subscription_id'), 'api_requests', ['subscription_id'], unique=False)
    op.create_index(op.f('ix_api_requests_service_id'), 'api_requests', ['service_id'], unique=False)
    op.create_index(op.f('ix_api_requests_created_at'), 'api_requests', ['created_at'], unique=False)
    
    # Add foreign key for api_subscription_id in payments table
    op.create_foreign_key('fk_payments_api_subscription', 'payments', 'api_subscriptions', ['api_subscription_id'], ['id'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('api_requests')
    op.drop_table('api_subscriptions')
    op.drop_table('api_services')
    op.drop_table('payments')
    op.drop_table('subscriptions')
    op.drop_table('admin_wallets')
    op.drop_table('user_wallets')
    
    # Drop enums
    op.execute("DROP TYPE IF EXISTS pricingtype")
    op.execute("DROP TYPE IF EXISTS subscriptionstatus")
    op.execute("DROP TYPE IF EXISTS subscriptionplan")
    op.execute("DROP TYPE IF EXISTS paymenttype")
    op.execute("DROP TYPE IF EXISTS paymentstatus")
    op.execute("DROP TYPE IF EXISTS wallettype")
    op.execute("DROP TYPE IF EXISTS walletnetwork")

