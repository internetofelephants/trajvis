import { TripsLayer, ScatterplotLayer } from 'deck.gl';
// import { BitmapLayer, TripsLayer, ScatterplotLayer } from 'deck.gl';
import { DataFilterExtension } from '@deck.gl/extensions';

export default function renderLayers(props) {
  const {trackData, trackTrail, tsRange, trackOpacity, trackVisible, markerData, changeProps, markerOpacity, markerVisible} = props;
  return [
    // new BitmapLayer({
    //   id: 'bitmap-layer',
    //   bounds: [-122.5190, 37.7045, -122.355, 37.829],
    //   image: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/sf-districts.png'
    // }),
    new TripsLayer({
      id: 'track-layer',
      data: trackData,
      trailLength: trackTrail,
      currentTime: tsRange[1],
      getPath: d => d.coordinates,
      getTimestamps: d => d.timestamps,
      getColor: d => d.colour,
      opacity: trackOpacity,
      widthUnits: 'pixels',
      getWidth: changeProps ? d => d.width : d => d.width,
      updateTriggers: {
        getWidth: [changeProps]
      },
      rounded: true,
      shadowEnabled: false,
      visible: trackVisible
    }),
    new ScatterplotLayer({
      id: 'marker-layer',
      data: markerData,
      getPosition: d => d.coordinates,
      radiusUnits: 'pixels',
      getRadius: changeProps ? d => d.radius : d => d.radius,
      updateTriggers: {
        getRadius: [changeProps]
      },
      // radiusMinPixels: 0,
      // radiusMaxPixels: 5,
      filled: true,
      stroked: false,
      opacity: markerOpacity,
      getFillColor: d => d.colour,
      getFilterValue: d => [d.timestamps],
      filterRange: tsRange,
      extensions: [new DataFilterExtension({filterSize: 1})],
      pickable: true,
      visible: markerVisible
    })
  ];
}
