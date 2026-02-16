"""add_is_public_to_book_lists

Revision ID: 8f72f9d7fd94
Revises: a1b2c3d4e5f6
Create Date: 2026-02-16 10:20:23.118812

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8f72f9d7fd94'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('book_lists', sa.Column('is_public', sa.Integer(), server_default='0', nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('book_lists', 'is_public')
