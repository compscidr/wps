""" Get stations (from wildfire one, or local - depending on configuration.)
"""
import os
from datetime import datetime
import math
import asyncio
import logging
import enum
from typing import List, Final
import json
from aiohttp.client import ClientSession
from sqlalchemy.engine.row import Row
from app.schemas.stations import (WeatherStation,
                                  GeoJsonWeatherStation,
                                  GeoJsonDetailedWeatherStation,
                                  WeatherStationProperties,
                                  WeatherVariables,
                                  DetailedWeatherStationProperties,
                                  WeatherStationGeometry)
import app.db.database
from app.db.crud.stations import get_noon_forecast_observation_union
from app.wildfire_one import wfwx_api
from app.wildfire_one.wfwx_api import get_auth_header, get_detailed_stations, get_station_data

logger = logging.getLogger(__name__)

dirname = os.path.dirname(__file__)
weather_stations_file_path = os.path.join(
    dirname, 'data/weather_stations.json')


class StationSourceEnum(enum.Enum):
    """ Station list sources.
    We currently have two sources for station listing, local json file, or wildfire one api.
    If the source is unspecified, configuration will govern which is used.
    """
    # Configuration wins:
    UNSPECIFIED = 'unspecified'
    # Use wildfire one as source, filtering on active stations:
    WILDFIRE_ONE = 'wildfire_one'
    # Use static file as source for testing purposes:
    TEST = 'test'


def _get_stations_local() -> List[WeatherStation]:
    """ Get list of stations from local json files.
    """
    logger.info('Using pre-generated json to retrieve station list')
    with open(weather_stations_file_path, encoding="utf-8") as weather_stations_file:
        json_data = json.load(weather_stations_file)
        results = []
        for station in json_data['weather_stations']:
            results.append(WeatherStation(**station))
        return results


def _set_weather_variables(station_properties: DetailedWeatherStationProperties, station_union: Row):
    """
    Helper function to set the observed and forecast values on the detailed weather station properties.
    """
    variable_names: Final = ('temperature', 'relative_humidity')
    # Iterate through variables (temp, r.h. etc. etc.)
    for variable_name in variable_names:
        # Get the variable (e.g. temp)
        value = getattr(station_union, variable_name)
        if not math.isnan(value):
            # Is this a forecast or an observation?
            record_type = getattr(station_union, 'record_type')
            weather_variables = getattr(station_properties, record_type, None)
            if weather_variables is None:
                # Make on if we don't have one yet.
                weather_variables = WeatherVariables()
                # Set it on the station_properties.
                setattr(station_properties, record_type, weather_variables)
            # Set the value (e.g. temp) on the weather variables (e.g. on observed)
            setattr(weather_variables, variable_name, value)


async def _get_detailed_stations(time_of_interest: datetime):
    """ Get a list of weather stations with details using a combination of static json and database
    records. """
    geojson_stations = []
    # this gets us a list of stations
    stations = await get_stations_asynchronously()
    with app.db.database.get_read_session_scope() as session:
        stations_detailed = get_noon_forecast_observation_union(session, time_of_interest)
        station_lookup = {}
        for station in stations:
            geojson_station = GeoJsonDetailedWeatherStation(properties=DetailedWeatherStationProperties(
                code=station.code,
                name=station.name,
                ecodivision_name=station.ecodivision_name,
                core_season=station.core_season),
                geometry=WeatherStationGeometry(coordinates=[station.long, station.lat]))
            station_lookup[station.code] = geojson_station
            geojson_stations.append(geojson_station)
        for station_union in stations_detailed:
            station = station_lookup.get(getattr(station_union, 'station_code'), None)
            if station:
                _set_weather_variables(station.properties, station_union)
    return geojson_stations


async def get_stations_by_codes(station_codes: List[int]) -> List[WeatherStation]:
    """Get a list of stations by code, from WFWX Fireweather API."""
    return await wfwx_api.get_stations_by_codes(station_codes)


async def get_stations_from_source(
        station_source: StationSourceEnum = StationSourceEnum.WILDFIRE_ONE) -> List[WeatherStation]:
    """ Get list of stations from some source (ideally WFWX Fireweather API)
    """
    if station_source == StationSourceEnum.UNSPECIFIED or station_source == StationSourceEnum.WILDFIRE_ONE:
        return await get_stations_asynchronously()
    # Get from local:
    return _get_stations_local()


async def fetch_detailed_stations_as_geojson(
        time_of_interest: datetime,
        station_source: StationSourceEnum) \
        -> List[GeoJsonDetailedWeatherStation]:
    """ Fetch a detailed list of stations. i.e. more than just the fire station name and code,
    throw some observations and forecast in the mix. """
    if station_source == StationSourceEnum.UNSPECIFIED or station_source == StationSourceEnum.WILDFIRE_ONE:
        # Get from wildfire one:
        logger.info('requesting detailed stations...')
        result = await get_detailed_stations(time_of_interest)
        logger.info('detailed stations loaded.')
        return result
    return await _get_detailed_stations(time_of_interest)


async def get_stations_as_geojson(
        station_source: StationSourceEnum = StationSourceEnum.UNSPECIFIED) -> List[GeoJsonWeatherStation]:
    """ Format stations to conform to GeoJson spec """
    geojson_stations = []
    stations = await get_stations_from_source(station_source)
    for station in stations:
        geojson_stations.append(
            GeoJsonWeatherStation(properties=WeatherStationProperties(
                code=station.code,
                name=station.name,
                ecodivision_name=station.ecodivision_name,
                core_season=station.core_season),
                geometry=WeatherStationGeometry(coordinates=[station.long, station.lat])))
    return geojson_stations


async def get_stations_asynchronously():
    """ Get list of stations asynchronously """
    async with ClientSession() as session:
        header = await get_auth_header(session)
        return await get_station_data(session, header)


def get_stations_synchronously(station_source: StationSourceEnum) -> List[WeatherStation]:
    """ Get list of stations - in a synchronous/blocking call.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    return loop.run_until_complete(get_stations_from_source(station_source))
