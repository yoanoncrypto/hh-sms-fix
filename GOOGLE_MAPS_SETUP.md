# Google Maps Setup Guide

## Getting Your Google Maps API Key

1. **Go to Google Cloud Console**

   - Visit: https://console.cloud.google.com/
   - Create a new project or select an existing one

2. **Enable Required APIs**

   - Go to "APIs & Services" > "Library"
   - Search for and enable:
     - "Maps JavaScript API"
     - "Places API" (required for autocomplete search)
     - "Geocoding API" (required for reverse geocoding)

3. **Create API Key**

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

4. **Set Up Environment Variable**

   - Create a `.env` file in your project root
   - Add: `VITE_GOOGLE_MAPS_API_KEY=your_api_key_here`
   - Replace `your_api_key_here` with your actual API key

5. **Restrict API Key (Recommended)**
   - In Google Cloud Console, click on your API key
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domain (e.g., `localhost:5173/*` for development)
   - Under "API restrictions", select "Restrict key"
   - Select:
     - "Maps JavaScript API"
     - "Places API"
     - "Geocoding API"

## Features

### Campaign Location Picker

- **Autocomplete Search**: Search for locations using Google Places API
- **Interactive Map**: Click or drag marker to set exact location
- **Reverse Geocoding**: Automatically get address from map coordinates
- **Coordinate Display**: Shows precise latitude and longitude
- **Form Integration**: Seamlessly integrates with campaign creation form

### Map Features

- **Navigation Controls**: Zoom and pan controls
- **Draggable Marker**: Move marker to adjust location
- **Responsive Design**: Works on all screen sizes
- **API Key Validation**: Shows helpful error if API key is missing

## Customization

You can customize the map by modifying:

- `center`: Change the default location
- `zoom`: Adjust the zoom level
- `darkMapStyle`: Modify the dark theme colors
- `options`: Add/remove map controls
