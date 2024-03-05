""" Code relating to processing HFI GeoTIFF files, and storing resultant data.
"""
import logging
import os
from datetime import date, datetime
from time import perf_counter
import tempfile
from shapely import wkb, wkt
from shapely.validation import make_valid
from osgeo import ogr, osr
from app.auto_spatial_advisory.common import get_s3_key
from app.db.models.auto_spatial_advisory import ClassifiedHfi, HfiClassificationThreshold, RunTypeEnum
from app.db.database import get_async_read_session_scope, get_async_write_session_scope
from app.db.crud.auto_spatial_advisory import (
    save_hfi, get_hfi_classification_threshold, HfiClassificationThresholdEnum, save_run_parameters,
    get_run_parameters_id)
from app.auto_spatial_advisory.classify_hfi import classify_hfi
from app.auto_spatial_advisory.run_type import RunType
from app.geospatial import NAD83_BC_ALBERS
from app.auto_spatial_advisory.hfi_pmtiles import get_pmtiles_filepath
from app.utils.polygonize import polygonize_in_memory
from app.utils.pmtiles import tippecanoe_wrapper, write_geojson
from app.utils.s3 import get_client


logger = logging.getLogger(__name__)

HFI_PMTILES_PERMISSIONS = 'public-read'
HFI_PMTILES_MIN_ZOOM = 4
HFI_PMTILES_MAX_ZOOM = 11


class UnknownHFiClassification(Exception):
    """ Raised when the hfi classification is not one of the expected values. """


def get_threshold_from_hfi(feature: ogr.Feature, advisory: HfiClassificationThreshold, warning: HfiClassificationThreshold):
    """
    Parses the HFI id value (1 or 2) attributed to an ogr.Feature, and returns the id of the
    appropriate HfiClassificationThreshold record in the database.
    """
    hfi = feature.GetField(0)
    if hfi == 1:
        return advisory
    elif hfi == 2:
        return warning
    else:
        raise UnknownHFiClassification(f'unknown hfi value: {hfi}')


def create_model_object(feature: ogr.Feature,
                        advisory: HfiClassificationThreshold,
                        warning: HfiClassificationThreshold,
                        coordinate_transform: osr.CoordinateTransformation,
                        run_type: RunType,
                        run_datetime: datetime,
                        for_date: date) -> ClassifiedHfi:
    threshold = get_threshold_from_hfi(feature, advisory, warning)
    # https://gdal.org/api/python/osgeo.ogr.html#osgeo.ogr.Geometry
    geometry: ogr.Geometry = feature.GetGeometryRef()
    # Make sure the geometry is in EPSG:3005!
    geometry.Transform(coordinate_transform)
    # Would be very nice to go directly from the ogr.Geometry into the database,
    # but I can't figure out how to have the wkt output also include the fact that
    # the SRID is EPSG:3005. So we're doing this redundant step of creating a shapely
    # geometry from wkt, then dumping it back into wkb, with srid=3005.
    # NOTE: geometry.ExportToIsoWkb isn't consistent in it's return value between
    # different versions of gdal (bytearray vs. bytestring) - so we're opting for
    # wkt instead of wkb here for better compatibility.
    polygon = wkt.loads(geometry.ExportToIsoWkt())
    polygon = make_valid(polygon)
    return ClassifiedHfi(threshold=threshold.id,
                         run_type=RunTypeEnum(run_type.value),
                         run_datetime=run_datetime,
                         for_date=for_date,
                         geom=wkb.dumps(polygon,
                                        hex=True,
                                        srid=NAD83_BC_ALBERS))


async def process_hfi(run_type: RunType, run_date: date, run_datetime: datetime, for_date: date):
    """ Create a new hfi record for the given date.

    :param run_type: The type of run to process. (is it a forecast or actual run?)
    :param run_date: The date of the run to process. (when was the hfi file created?)
    :param for_date: The date of the hfi to process. (when is the hfi for?)
    """

    # Skip if we already have this run
    async with get_async_read_session_scope() as session:
        existing_run = await get_run_parameters_id(session, run_type, run_datetime, for_date)
        if existing_run is not None:
            logger.info(
                (
                    f'Skipping run, already processed for run_type:{run_type}'
                    f'run_datetime:{run_datetime},'
                    f'for_date:{for_date}'
                ))
            return

    logger.info('Processing HFI %s for run date: %s, for date: %s', run_type, run_date, for_date)
    perf_start = perf_counter()

    key = get_s3_key(run_type, run_date, for_date)
    logger.info(f'Key to HFI in object storage: {key}')
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_filename = os.path.join(temp_dir, 'classified.tif')
        classify_hfi(key, temp_filename)
        with polygonize_in_memory(temp_filename, 'hfi', 'hfi') as layer:

            # We need a geojson file to pass to tippecanoe
            temp_geojson = write_geojson(layer, temp_dir)

            pmtiles_filename = f'hfi{for_date.strftime("%Y%m%d")}.pmtiles'
            temp_pmtiles_filepath = os.path.join(temp_dir, pmtiles_filename)
            logger.info(f'Writing pmtiles -- {pmtiles_filename}')
            tippecanoe_wrapper(temp_geojson, temp_pmtiles_filepath,
                               min_zoom=HFI_PMTILES_MIN_ZOOM, max_zoom=HFI_PMTILES_MAX_ZOOM)

            async with get_client() as (client, bucket):
                key = get_pmtiles_filepath(run_date, run_type, pmtiles_filename)
                logger.info(f'Uploading file {pmtiles_filename} to {key}')

                await client.put_object(Bucket=bucket,
                                        Key=key,
                                        ACL=HFI_PMTILES_PERMISSIONS,  # We need these to be accessible to everyone
                                        Body=open(temp_pmtiles_filepath, 'rb'))
                logger.info('Done uploading file')

            spatial_reference: osr.SpatialReference = layer.GetSpatialRef()
            target_srs = osr.SpatialReference()
            target_srs.ImportFromEPSG(NAD83_BC_ALBERS)
            target_srs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
            coordinate_transform = osr.CoordinateTransformation(spatial_reference, target_srs)

            async with get_async_write_session_scope() as session:
                advisory = await get_hfi_classification_threshold(session, HfiClassificationThresholdEnum.ADVISORY)
                warning = await get_hfi_classification_threshold(session, HfiClassificationThresholdEnum.WARNING)

                logger.info('Writing HFI advisory zones to API database...')
                for i in range(layer.GetFeatureCount()):
                    # https://gdal.org/api/python/osgeo.ogr.html#osgeo.ogr.Feature
                    feature: ogr.Feature = layer.GetFeature(i)
                    obj = create_model_object(feature,
                                              advisory,
                                              warning,
                                              coordinate_transform,
                                              run_type,
                                              run_datetime,
                                              for_date)
                    await save_hfi(session, obj)

                # Store the unqiue combination of run type, run datetime and for date in the run_parameters table
                await save_run_parameters(session, run_type, run_datetime, for_date)

    perf_end = perf_counter()
    delta = perf_end - perf_start
    logger.info('%f delta count before and after processing HFI', delta)
