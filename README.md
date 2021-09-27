# trajVis
Visualise, animate and create videos of animal movement data from GPS tags.

https://internetofelephants.github.io/trajvis

## Features
- Visualise data as lines and points (pickable)
- Switch individuals on and off
- Playback controls and range slider
- Record videos (via the Screen Capture API)
- Graph showing cumulative distance
- Base maps from Mapbox (light, dark and satellite)

![GIF of trajVis demo 01](https://github.com/internetofelephants/trajvis/blob/main/website/trajVis_demo_01.gif)
Four spider monkeys (_Ateles geoffroyi_) on Barro Colorado Island, Panama. Data courtesy of Prof Meg Crofoot (University of Konstanz) and colleagues.

## Usage
To begin, select a csv file containing movement data for a single or multiple individuals. The file must contain the following headers:
- species
- animal_id
- timestamp (date and time as YYYY-MM-DD HH:MM:SS)
- lon (longitude in decimal degrees)
- lat (latitude in decimal degrees)
- alt (altitude in meters, optional)

![example of csv data](https://github.com/internetofelephants/trajvis/blob/main/website/sample_csv_file.png)

You can download a sample file with simulated data [here](https://raw.githubusercontent.com/internetofelephants/trajvis/main/website/simulated_data.csv).

![GIF of trajVis demo 02](https://github.com/internetofelephants/trajvis/blob/main/website/trajVis_demo_02.gif)

## Roadmap
- add a graph for altitude
- zoomable graph
- option to add polygons as shapefile or geojson
- add option to create popups
- hide/minimize UI during recording
- allow sharing with data via link
- add 3D support

## Support
For help with usage, email raff@internetofelephants.com

For reporting bugs, please open an issue.

## Contributing
Contributions are welcome! Please open an issue first or get in touch to discuss what you would like to change or how you would like to contribute.
