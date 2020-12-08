import { TripsLayer, ScatterplotLayer } from 'deck.gl';
import { DataFilterExtension } from '@deck.gl/extensions';

export function renderTracks(props) {
  const {trackData, trackTrail, trackTime, markerData, markerFilter, markerVisible} = props;
  return [
    new TripsLayer({
      id: 'track-layer',
      getPath: d => d.coordinates,
      getTimestamps: d => d.timestamps,
      getColor: d => d.colour,
      opacity: 0.2,
      widthMinPixels: 1.6,
      rounded: true,
      shadowEnabled: false,
      parameters: {
        depthTest: false
      },
      data: trackData,
      trailLength: trackTrail,
      currentTime: trackTime
    }),
    new ScatterplotLayer({
      id: 'point-layer',
      data: markerData,
      getPosition: d => d.coordinates,
      getRadius: 400,
      radiusMinPixels: 1,
      radiusMaxPixels: 4,
      getLineWidth: 1,
      getFillColor: d => d.colour,
      getLineColor: d => d.colour,
      getFilterValue: d => d.timestamps,
      filterRange: markerFilter,
      extensions: [new DataFilterExtension({filterSize: 1})],
      opacity: 0.2,
      stroked: true,
      filled: true,
      pickable: true,
      visible: markerVisible
    })
  ];
}
