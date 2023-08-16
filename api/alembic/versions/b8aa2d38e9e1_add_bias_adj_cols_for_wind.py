"""Add bias adj cols for wind

Revision ID: b8aa2d38e9e1
Revises: 4916cd5313de
Create Date: 2023-08-10 14:25:49.259998

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b8aa2d38e9e1'
down_revision = '4916cd5313de'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic ###
    op.create_index(op.f('ix_morecast_forecast_precip'), 'morecast_forecast', ['precip'], unique=False)
    op.create_index(op.f('ix_morecast_forecast_temp'), 'morecast_forecast', ['temp'], unique=False)
    op.create_index(op.f('ix_morecast_forecast_wind_speed'), 'morecast_forecast', ['wind_speed'], unique=False)
    op.add_column('weather_station_model_predictions', sa.Column('bias_adjusted_wdir', sa.Float(), nullable=True))
    op.add_column('weather_station_model_predictions', sa.Column('bias_adjusted_wind_speed', sa.Float(), nullable=True))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic ###
    op.drop_column('weather_station_model_predictions', 'bias_adjusted_wind_speed')
    op.drop_column('weather_station_model_predictions', 'bias_adjusted_wdir')
    op.drop_index(op.f('ix_morecast_forecast_wind_speed'), table_name='morecast_forecast')
    op.drop_index(op.f('ix_morecast_forecast_temp'), table_name='morecast_forecast')
    op.drop_index(op.f('ix_morecast_forecast_precip'), table_name='morecast_forecast')
    # ### end Alembic commands ###
