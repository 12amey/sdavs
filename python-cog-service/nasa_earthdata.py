"""
NASA Earthdata API Client
Fetches real satellite imagery from NASA's Earth Observing System Data and Information System (EOSDIS)
"""

import requests
from requests.auth import HTTPBasicAuth
import os
from datetime import datetime, timedelta
import logging
from typing import Optional, Dict, List, Tuple
from dotenv import load_dotenv

load_dotenv()

class NASAEarthdataClient:
    """Client for NASA Earthdata API"""
    
    def __init__(self):
        load_dotenv()
        self.username = os.getenv('EARTHDATA_USERNAME')
        self.password = os.getenv('EARTHDATA_PASSWORD')
        self.base_url = os.getenv('EARTHDATA_URL', 'https://urs.earthdata.nasa.gov')
        
        if not self.username or not self.password:
            raise ValueError("NASA Earthdata credentials not configured. Please set EARTHDATA_USERNAME and EARTHDATA_PASSWORD")
        
        self.session = requests.Session()
        self.session.auth = HTTPBasicAuth(self.username, self.password)
        
        logger.info("NASA Earthdata client initialized")
    
    def search_imagery(
        self, 
        lat: float, 
        lng: float, 
        start_date: str, 
        end_date: Optional[str] = None,
        collection: str = "SENTINEL-2"
    ) -> List[Dict]:
        """
        Search for satellite imagery at given coordinates
        
        Args:
            lat: Latitude
            lng: Longitude
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD), defaults to today
            collection: Satellite collection (SENTINEL-2, LANDSAT-8, MODIS)
        
        Returns:
            List of available imagery metadata
        """
        if not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        # Create bounding box (0.1 degree buffer)
        bbox = f"{lng-0.1},{lat-0.1},{lng+0.1},{lat+0.1}"
        
        # CMR (Common Metadata Repository) search endpoint
        search_url = "https://cmr.earthdata.nasa.gov/search/granules.json"
        
        params = {
            'bounding_box': bbox,
            'temporal': f"{start_date}T00:00:00Z,{end_date}T23:59:59Z",
            'short_name': self._get_collection_shortname(collection),
            'page_size': 10,
            'sort_key': '-start_date'  # Most recent first
        }
        
        try:
            response = self.session.get(search_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            entries = data.get('feed', {}).get('entry', [])
            
            logger.info(f"Found {len(entries)} imagery results for {lat}, {lng}")
            
            return [self._parse_granule(entry) for entry in entries]
            
        except Exception as e:
            logger.error(f"Error searching NASA Earthdata: {str(e)}")
            return []
    
    def download_imagery(
        self, 
        granule_url: str, 
        output_path: str
    ) -> bool:
        """
        Download satellite imagery file
        
        Args:
            granule_url: URL to the granule data
            output_path: Local path to save the file
        
        Returns:
            True if successful, False otherwise
        """
        try:
            response = self.session.get(granule_url, stream=True)
            response.raise_for_status()
            
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            logger.info(f"Downloaded imagery to {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error downloading imagery: {str(e)}")
            return False
    
    def get_sentinel2_bands(
        self,
        lat: float,
        lng: float,
        date: str,
        bands: List[str] = None
    ) -> Dict[str, str]:
        """
        Get Sentinel-2 band URLs for specific location and date
        
        Args:
            lat: Latitude
            lng: Longitude
            date: Date (YYYY-MM-DD)
            bands: List of band names (e.g., ['B04', 'B08']). If None, returns all bands
        
        Returns:
            Dictionary mapping band names to download URLs
        """
        if bands is None:
            bands = ['B04', 'B08', 'B03', 'B02']  # Red, NIR, Green, Blue
        
        # Search for imagery
        imagery_list = self.search_imagery(lat, lng, date, date, "SENTINEL-2")
        
        if not imagery_list:
            logger.warning(f"No Sentinel-2 imagery found for {lat}, {lng} on {date}")
            return {}
        
        # Get the first (most recent) result
        granule = imagery_list[0]
        
        # Extract band URLs from granule
        band_urls = {}
        for band in bands:
            # This is simplified - actual implementation depends on NASA's data structure
            band_url = granule.get('data_links', {}).get(band)
            if band_url:
                band_urls[band] = band_url
        
        return band_urls
    
    def _get_collection_shortname(self, collection: str) -> str:
        """Map collection names to NASA shortnames"""
        collections = {
            'SENTINEL-2': 'S2_MSI_L2A',  # Sentinel-2 Level-2A
            'LANDSAT-8': 'LANDSAT_8_C1',
            'MODIS': 'MOD09GA',
            'VIIRS': 'VNP09GA'
        }
        return collections.get(collection, collection)
    
    def _parse_granule(self, entry: Dict) -> Dict:
        """Parse CMR granule entry into simplified format"""
        return {
            'id': entry.get('id'),
            'title': entry.get('title'),
            'start_time': entry.get('time_start'),
            'end_time': entry.get('time_end'),
            'cloud_cover': self._extract_cloud_cover(entry),
            'data_links': self._extract_data_links(entry),
            'bbox': entry.get('boxes', [''])[0] if entry.get('boxes') else None
        }
    
    def _extract_cloud_cover(self, entry: Dict) -> Optional[float]:
        """Extract cloud cover percentage from metadata"""
        # Sentinel-2/Landsat-8 usually have cloud cover in 'cloud_cover' or 'CLOUDY_PIXEL_PERCENTAGE'
        try:
            # Check common metadata fields
            for key in ['cloud_cover', 'cloudCover', 'CloudCover']:
                val = entry.get(key)
                if val is not None:
                    return float(val)
            
            # Check browse links or other description fields
            title = entry.get('title', '').upper()
            if 'CLOUD' in title and '%' in title:
                # Attempt to extract if in title
                import re
                match = re.search(r'(\d+(?:\.\d+)?)\s*%', title)
                if match:
                    return float(match.group(1))
                    
            return None
        except:
            return None
    
    def _extract_data_links(self, entry: Dict) -> Dict:
        """Extract download links for data files"""
        links = {}
        for link in entry.get('links', []):
            href = link.get('href')
            rel = link.get('rel')
            if href and rel == 'http://esipfed.org/ns/fedsearch/1.1/data#':
                links['data'] = href
        return links


# Example usage function
def fetch_latest_sentinel2(lat: float, lng: float, days_back: int = 30) -> Optional[Dict]:
    """
    Fetch latest Sentinel-2 imagery for a location
    
    Args:
        lat: Latitude
        lng: Longitude
        days_back: How many days back to search
    
    Returns:
        Dictionary with imagery metadata and band URLs
    """
    client = NASAEarthdataClient()
    
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
    
    results = client.search_imagery(lat, lng, start_date, end_date, "SENTINEL-2")
    
    if results:
        return results[0]  # Return most recent
    return None
