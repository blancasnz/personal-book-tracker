"""add_award_year_to_book_list_items

Revision ID: 2f79dfdc1372
Revises: 8f72f9d7fd94
Create Date: 2026-02-23 18:32:14.145094

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2f79dfdc1372'
down_revision: Union[str, Sequence[str], None] = '8f72f9d7fd94'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('book_list_items', sa.Column('award_year', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('book_list_items', 'award_year')
