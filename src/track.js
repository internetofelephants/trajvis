import { TripsLayer, ScatterplotLayer } from 'deck.gl';
// import { BitmapLayer, TripsLayer, ScatterplotLayer } from 'deck.gl';
import { DataFilterExtension } from '@deck.gl/extensions';

export default function renderTracks(props) {
  const {trackData, trackTrail, trackTime, trackFilter, trackVisible, markerData, markerFilter, markerVisible} = props;
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
      currentTime: trackTime,
      getPath: d => d.coordinates,
      getTimestamps: d => d.timestamps,
      getColor: d => d.colour,
      opacity: 0.2,
      getFilterValue: d => d.id,
      filterRange: trackFilter,
      extensions: [new DataFilterExtension({filterSize: 1})],
      widthMinPixels: 2,
      rounded: true,
      shadowEnabled: false,
      visible: trackVisible,
      parameters: {
        depthTest: false
      }
    }),
    new ScatterplotLayer({
      id: 'marker-layer',
      data: markerData,
      getPosition: d => d.coordinates,
      getRadius: 400,
      radiusMinPixels: 1,
      radiusMaxPixels: 4,
      lineWidthMinPixels: 0.4,
      lineWidthMaxPixels: 2,
      getFillColor: d => d.colour,
      getLineColor: d => d.colour,
      getFilterValue: d => [d.timestamps, d.id],
      filterRange: markerFilter,
      extensions: [new DataFilterExtension({filterSize: 2})],
      opacity: 0.16,
      stroked: true,
      filled: true,
      pickable: true,
      visible: markerVisible,
      parameters: {
        depthTest: false
      }
    })
  ];
}
