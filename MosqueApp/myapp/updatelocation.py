## This file handles the address to longitude,latitude conversion to then use as the coordinates for the grid components so that when a user needs suggested mosques we can cache
# results for quick and easy access



import os

from dotenv import load_dotenv
import requests
from urllib.parse import quote_plus

load_dotenv()

API=os.getenv('GEO_API')


def get_location(address):
      
    encoded_address = quote_plus(address)  
    url = f'https://api.geoapify.com/v1/geocode/search?text={encoded_address}&apiKey={API}'
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Response Data: {data}")  
        if 'features' in data and data['features']:
            location = data['features'][0]['geometry']['coordinates']
            return location[1], location[0]  
        else:
            print("Features not found in response.") 
            return None, None
    else:
        print(f"Error: {response.status_code}, {response.text}")  
        return None, None