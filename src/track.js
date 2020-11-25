import { TripsLayer } from 'deck.gl';

export function renderTracks(props) {
  const {data, trailLength, currentTime} = props;
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
      data,
      trailLength,
      currentTime
    })
  ];
}
