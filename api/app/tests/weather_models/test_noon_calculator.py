""" BDD tests for processing file from env. Canada. """
import logging
import datetime
from pytest_bdd import scenario, given, then, when
from app.weather_models.fetch.predictions import NoonInterpolator
from app.schemas.weather_models import WeatherModelPredictionValues
logger = logging.getLogger(__name__)

#pylint: disable=function-redefined,eval-used,redefined-outer-name,missing-function-docstring


@scenario('test_noon_calculator.feature', 'Calculate noon data',
          example_converters=dict(data=str, timestamp=str, temperature=float, relative_humidity=float, delta_precipitation=float))
def test_noon_calculator():
    """ BDD Scenario. """


@given('<data>')
def given_data(data):
    return {'data': eval(data)}


@when('processed')
def processed(given_data):
    interpolator = NoonInterpolator()
    for item in given_data['data']:
        timestamp = datetime.datetime.fromisoformat(item['datetime'])
        for key, value in item['values'].items():
            interpolator.update(key, value, timestamp)
    given_data['noon_value'] = interpolator.calculate_noon_value()


@then('<timestamp> <temperature> <relative_humidity> <delta_precipitation>')
def then(given_data: WeatherModelPredictionValues, timestamp: str, temperature: float,
         relative_humidity: float, delta_precipitation: float):
    assert given_data['noon_value'].datetime == datetime.datetime.fromisoformat(
        timestamp)
    assert given_data['noon_value'].temperature == temperature
    assert given_data['noon_value'].relative_humidity == relative_humidity
    assert given_data['noon_value'].delta_precipitation == delta_precipitation
