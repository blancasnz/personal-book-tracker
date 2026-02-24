"""add_rank_to_book_list_items

Revision ID: 037e1bd86d28
Revises: 2f79dfdc1372
Create Date: 2026-02-23 18:46:26.242165

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '037e1bd86d28'
down_revision: Union[str, Sequence[str], None] = '2f79dfdc1372'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('book_list_items', sa.Column('rank', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('book_list_items', 'rank')
