import { TripsLayer, ScatterplotLayer } from 'deck.gl';
import { DataFilterExtension } from '@deck.gl/extensions';

export default function renderLayers(props) {
  const {trackData, trackTrail, tsRange, trackOpacity, trackVisible, markerData, changeProps, markerOpacity, markerVisible} = props;
  return [
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
      capRounded: true,
      jointRounded: true,
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
