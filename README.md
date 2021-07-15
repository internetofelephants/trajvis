# trajVis
Visualise, animate and create videos of animal movement data from GPS tags.

## Features
- Visualise data as lines and points (pickable)
- Playback controls and range slider
- Record videos as mp4 files
- Graph showing cumulative distance
- Base maps from CARTO (light and dark) and Mapbox (satellite)

## Usage
To begin, select a csv file containing movement data for a single or multiple individuals. The file must contain the following headers:
- species
- animal_id
- timestamp (date and time as YYYY-MM-DD HH:MM:SS)
- lon (longitude in decimal degrees)
- lat (latitude in decimal degrees)
- alt (altitude in meters, optional)
