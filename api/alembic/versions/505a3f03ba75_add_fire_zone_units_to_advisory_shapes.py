"""add fire zone units to advisory shapes

Revision ID: 505a3f03ba75
Revises: 8a05bc230ad7
Create Date: 2023-10-24 12:41:11.578847

"""
import json
from alembic import op
import geoalchemy2
import sqlalchemy as sa
from shapely import from_geojson
from app.utils.zone_units import get_zone_units_geojson
from sqlalchemy.orm.session import Session
from sqlalchemy.dialects.postgresql import insert
from shapely import wkb


# revision identifiers, used by Alembic.
revision = '505a3f03ba75'
down_revision = '8a05bc230ad7'
branch_labels = None
depends_on = None

shape_type_table = sa.Table('advisory_shape_types', sa.MetaData(),
                            sa.Column('id', sa.Integer),
                            sa.Column('name', sa.String))

shape_table = sa.Table('advisory_shapes', sa.MetaData(),
                       sa.Column('id', sa.Integer),
                       sa.Column('source_identifier', sa.String),
                       sa.Column('shape_type', sa.Integer),
                       sa.Column('geom', geoalchemy2.Geometry))


def upgrade():
    session = Session(bind=op.get_bind())

    statement = shape_type_table.insert().values(name='fire_zone_unit').returning(shape_type_table.c.id)
    result = session.execute(statement).fetchone()
    shape_type_id = result.id

    fire_zone_units = get_zone_units_geojson()
    for feature in fire_zone_units.get('features', []):
        properties = feature.get('properties', {})
        # Each zone unit is uniquely identified by an OBJECTID.
        object_id = properties.get('OBJECTID')
        geometry = feature.get('geometry', {})
        geom = from_geojson(json.dumps(geometry))

        insert_statement = insert(shape_table).values(
            source_identifier=object_id,
            shape_type=shape_type_id,
            geom=wkb.dumps(geom, hex=True, srid=3005))
        stmt = insert_statement.on_conflict_do_nothing(
            constraint="advisory_shapes_source_identifier_shape_type_key",
        )
        session.execute(stmt)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic ###
    session = Session(bind=op.get_bind())
    statement = shape_type_table.select().where(shape_type_table.c.name == 'fire_zone_unit')
    result = session.execute(statement).fetchone()
    shape_type_id = result.id

    session.execute(shape_table.delete().where(shape_table.c.shape_type == shape_type_id))
    session.execute(shape_type_table.delete().where(shape_type_table.c.name == 'fire_zone_unit'))
    # ### end Alembic commands ###