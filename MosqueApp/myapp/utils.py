import math
from functools import lru_cache
import pytesseract
from PIL import Image
from .models import Mosque
import pdfplumber
import re
import requests
import json








GRID_SIZE = 0.2

def get_grid(lat, lon, grid=GRID_SIZE):
    # Simple O(1) function, not much to optimize here other than pre-computing inverse grid if desired.
    # Already efficient as-is.
    grid_lat = int(lat // grid)
    grid_lon = int(lon // grid)
    return grid_lat, grid_lon

@lru_cache(maxsize=10000)  # Cache results for up to 10k distinct coordinate sets
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dLat = lat2_rad - lat1_rad
    dLon = lon2_rad - lon1_rad

    sin_dLat = math.sin(dLat / 2)
    sin_dLon = math.sin(dLon / 2)

    a = sin_dLat * sin_dLat + math.cos(lat1_rad) * math.cos(lat2_rad) * sin_dLon * sin_dLon
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def approx_distance(lat1, lon1, lat2, lon2):
    """
    Approximate distance using equirectangular approximation.
    Faster than haversine but less accurate over long distances.
    """
    R = 6371.0
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)

    x = dLon * math.cos((lat1_rad + lat2_rad) / 2)
    y = dLat
    return R * math.sqrt(x * x + y * y)

# Optional: Vectorized version using NumPy for bulk calculations
try:
    import numpy as np

    def haversine_vectorized(lat1, lon1, lats, lons):
        """
        Compute distances from a single origin (lat1, lon1) to multiple destinations (lats, lons) using NumPy arrays.
        lats and lons should be numpy arrays of the same length.
        """
        R = 6371.0
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lats_rad = np.radians(lats)
        lons_rad = np.radians(lons)

        dLat = lats_rad - lat1_rad
        dLon = lons_rad - lon1_rad

        sin_dLat = np.sin(dLat / 2)
        sin_dLon = np.sin(dLon / 2)

        a = sin_dLat**2 + np.cos(lat1_rad) * np.cos(lats_rad) * sin_dLon**2
        c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))

        return R * c

except ImportError:
    # NumPy not available, just ignore or provide a warning if desired.
    pass

import json
import pdfplumber
import re
import requests
from io import BytesIO

class MosqueUtil:
    LLM_URL = "http://localhost:11434/api/generate"

    @staticmethod
    def extract_text_from_pdf(file):
        """Extracts text from an uploaded PDF file using OCR."""
        try:
            file_data = BytesIO(file.read())  # Convert Django file to BytesIO
            text = ""
            with pdfplumber.open(file_data) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise ValueError(f"Error reading verification document: {str(e)}")

    @staticmethod
    def extract_key_fields(text):
        """Extracts EIN, 501(c)(3) mention, Mosque Name, and Address."""
        key_fields = {
            "EIN": re.search(r"\d{2}-\d{7}", text),  # EIN pattern XX-XXXXXXX
            "501(c)(3)": "501(c)(3)" in text,  # Check if 501(c)(3) mention exists
            "Mosque Name": re.search(r"(Mosque|Islamic Center|Masjid)[:\s]*(\w+.*)", text),
            "Address": re.search(r"(\d{1,5} \w+ (Street|St|Avenue|Ave|Road|Rd))", text)
        }
        return {k: v.group(0) if v else None for k, v in key_fields.items()}

    @staticmethod
    def verify_with_llm(extracted_fields):  
        """Uses Phi-2 LLM (self-hosted) to verify the non-profit document."""
        prompt = f"""
        You are an expert in IRS non-profit verification.

        EIN: {extracted_fields['EIN']}
        501(c)(3) Mentioned: {extracted_fields['501(c)(3)']}
        Mosque Name: {extracted_fields['Mosque Name']}
        Address: {extracted_fields['Address']}

        Based on this information, return a JSON response in this format:
        {{
            "valid": true or false,
            "reason": "Explanation for the decision."
        }}
        """

        response = requests.post(
            MosqueUtil.LLM_URL,
            json={"model": "microsoft/phi-2", "prompt": prompt, "stream": False}
        )

        try:
            return json.loads(response.json()["response"])  # Convert LLM output to JSON
        except Exception:
            return {"valid": False, "reason": "Invalid LLM response"}

    @staticmethod
    def verify_mosque(file):
        """Full verification pipeline with proper error handling."""
        try:
            text = MosqueUtil.extract_text_from_pdf(file)
            extracted_fields = MosqueUtil.extract_key_fields(text)
            verification_result = MosqueUtil.verify_with_llm(extracted_fields)

            # ✅ FIXED: Ensure `verification_result` always contains `valid`
            if not isinstance(verification_result, dict) or "valid" not in verification_result:
                return {
                    "error": "Invalid LLM response format",
                    "fields": extracted_fields,
                    "verification_result": {"valid": False, "reason": "LLM response was not structured correctly"}
                }

            return {
                "fields": extracted_fields,
                "verification_result": verification_result
            }

        except Exception as e:
            return {
                "error": f"Failed to process verification document: {str(e)}",
                "verification_result": {"valid": False, "reason": "Internal processing error"}
            }
