"""Data migration for default hfi ready states

Revision ID: 52c8a568364e
Revises: baa3e0182740
Create Date: 2022-05-17 16:25:12.209993

"""
import uuid
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm.session import Session
from sqlalchemy.dialects import postgresql

from app.utils.time import get_utc_now


# revision identifiers, used by Alembic.
revision = '52c8a568364e'
down_revision = 'baa3e0182740'
branch_labels = None
depends_on = None


hfi_request_table = sa.Table('hfi_request', sa.MetaData(),
                             sa.Column('id', sa.Integer),
                             sa.Column('fire_centre_id', sa.Integer),
                             sa.Column('prep_start_day', sa.Date),
                             sa.Column('prep_end_day', sa.Date),
                             sa.Column('create_timestamp', sa.TIMESTAMP(timezone=True)),
                             sa.Column('create_user', sa.String()),
                             sa.Column('request', sa.JSON()))

hfi_ready_table = sa.Table('hfi_ready', sa.MetaData(),
                           sa.Column('id', postgresql.UUID(as_uuid=True)),
                           sa.Column('hfi_request_id', sa.Integer),
                           sa.Column('planning_area_id', sa.Integer),
                           sa.Column('ready', sa.Boolean),
                           sa.Column('create_timestamp', sa.TIMESTAMP(timezone=True)),
                           sa.Column('create_user', sa.String()),
                           sa.Column('update_timestamp', sa.TIMESTAMP(timezone=True)),
                           sa.Column('update_user', sa.String()))

fire_centres_table = sa.Table('fire_centres', sa.MetaData(),
                              sa.Column('id', sa.Integer),
                              sa.Column('name', sa.String))


planning_areas_table = sa.Table('planning_areas', sa.MetaData(),
                                sa.Column('id', sa.Integer),
                                sa.Column('name', sa.String),
                                sa.Column('fire_centre_id', sa.Integer),
                                sa.Column('order_of_appearance_in_list', sa.Integer))


def upgrade():
    # ### commands auto generated by Alembic ###
    session = Session(bind=op.get_bind())
    res = session.query(hfi_request_table.c.id, planning_areas_table.c.id)\
        .join(hfi_request_table, hfi_request_table.c.fire_centre_id == planning_areas_table.c.fire_centre_id)
    hfi_ready_records = []
    now = get_utc_now()
    for hfi_request_id, planning_area_id in res:
        hfi_ready_records.append(
            {
                'id': uuid.uuid4(),
                'hfi_request_id': hfi_request_id,
                'planning_area_id': planning_area_id,
                'ready': False,
                'create_timestamp': now,
                'create_user': 'system',
                'update_timestamp': now,
                'update_user': 'system',
            })

    op.bulk_insert(hfi_ready_table, hfi_ready_records)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic ###
    session = Session(bind=op.get_bind())
    session.query(hfi_ready_table).delete()
    session.commit()
    # ### end Alembic commands ###
