# tasks.py

from celery import shared_task
from .models import Mosque
from .utils import get_grid
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

@shared_task
def refresh_cache():
    logger.info("Starting cache refresh")

    mosques = Mosque.objects.all()
    grids = set()

    for mosque in mosques:
        grid_lat, grid_lon = get_grid(mosque.lat, mosque.lon)
        grids.add((grid_lat, grid_lon))

    for grid_lat, grid_lon in grids:
        cache_key = f'grid_{grid_lat}_{grid_lon}'
        mosques_in_grid = list(Mosque.objects.filter(
            grid_cell_lat=grid_lat,
            grid_cell_lon=grid_lon
        ).only('id', 'mosquename', 'address'))
        cache.set(cache_key, mosques_in_grid, timeout=86400)
        logger.info(f"Cache refreshed for key: {cache_key}")

    logger.info("Cache refresh completed")
