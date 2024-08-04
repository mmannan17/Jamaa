import math


GRID_SIZE = 0.2 

def get_grid(lat,lon,grid=GRID_SIZE):

    grid_lat= int(lat//grid)
    grid_lon= int(lon//grid)

    return grid_lat,grid_lon


def haversine(lat1, lon1, lat2, lon2):
    R = 6371  
    dLat = math.radians(lat2 - lat1)  
    dLon = math.radians(lon2 - lon1)  
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c  
    return distance


