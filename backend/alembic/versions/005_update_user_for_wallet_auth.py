"""Update user model for wallet authentication

Revision ID: 005_update_user_wallet_auth
Revises: 004_add_wallets_payments_subscriptions
Create Date: 2024-01-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005_update_user_wallet_auth'
down_revision = '004_wallets_payments_subs'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make email, username, and hashed_password nullable for wallet-only users
    op.alter_column('users', 'email',
                    existing_type=sa.String(),
                    nullable=True)
    op.alter_column('users', 'username',
                    existing_type=sa.String(),
                    nullable=True)
    op.alter_column('users', 'hashed_password',
                    existing_type=sa.String(),
                    nullable=True)
    
    # Add auth_method column
    op.add_column('users', sa.Column('auth_method', sa.String(), nullable=False, server_default='email'))


def downgrade() -> None:
    # Remove auth_method column
    op.drop_column('users', 'auth_method')
    
    # Make columns non-nullable again (this might fail if there are wallet-only users)
    # In production, you'd need to handle this more carefully
    op.alter_column('users', 'hashed_password',
                    existing_type=sa.String(),
                    nullable=False)
    op.alter_column('users', 'username',
                    existing_type=sa.String(),
                    nullable=False)
    op.alter_column('users', 'email',
                    existing_type=sa.String(),
                    nullable=False)

