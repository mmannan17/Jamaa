import math


GRID_SIZE = 0.2 

def get_grid(lat,lon,grid=GRID_SIZE):

    grid_lat= int(lat//grid)
    grid_lon= int(lon//grid)

    return grid_lat,grid_lon

