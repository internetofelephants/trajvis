# trajVis
Visualise, animate and create videos of animal movement data from GPS tags.

## Features
- Visualise data as lines and points (pickable)
- Switch individuals on and off
- Playback controls and range slider
- Record videos as mp4 files
- Graph showing cumulative distance
- Base maps from CARTO (light and dark) and Mapbox (satellite)

![](https://https://github.com/internetofelephants/trajvis/blob/main/website/trajVis_demo.gif)

## Usage
To begin, select a csv file containing movement data for a single or multiple individuals. The file must contain the following headers:
- species
- animal_id
- timestamp (date and time as YYYY-MM-DD HH:MM:SS)
- lon (longitude in decimal degrees)
- lat (latitude in decimal degrees)
- alt (altitude in meters, optional)

## Roadmap
- add a graph for altitude
- zoomable graph
- option to add polygons as shapefile or geojson
- add option to create popups
- allow sharing with data via link
- add 3D map

## Support
For help with usage, email support@internetofelephants.com
For reporting bugs, please open an issue.

## Contributing
Contributions are welcome! Please open an issue first or get in touch to discuss what you would like to change or how you would like to contribute.
