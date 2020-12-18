import React from 'react';
import '../node_modules/react-vis/dist/style.css';
import {
  FlexibleWidthXYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  LineSeriesCanvas
} from 'react-vis';
import moment from 'moment';

export default function Graph( {graphData, maxTimeVal, graphMaxY, minTS, tsInterval, trackTime0, trackTime} ) {
  return (
    <FlexibleWidthXYPlot
      height={140}
      margin={{left: 50, right: 25}}
      xDomain={[0, maxTimeVal]}
      yDomain={[0, graphMaxY]}
    >
      <HorizontalGridLines />
      <XAxis
        tickFormat={d => moment.utc((d * tsInterval + minTS) * 1000).format('YYYY-MM-DD')}
        tickTotal={12}
        tickSizeInner={0}
      />
      <YAxis
        tickFormat={d => Math.round(d / 1000)}
        tickTotal={4}
        tickSizeInner={0}
      />
      {graphData.map(props => (
        <LineSeriesCanvas
          {...props}
          opacity={0.6}
          strokeWidth={1.6}
        />
      ))}
      <LineSeriesCanvas
        data={[{x:trackTime0, y:0}, {x:trackTime0, y:graphMaxY}]}
        color={'#ffffff'}
        opacity={0.4}
        strokeWidth={3}
      />
      <LineSeriesCanvas
        data={[{x:trackTime, y:0}, {x:trackTime, y:graphMaxY}]}
        color={'#ffffff'}
        opacity={0.4}
        strokeWidth={3}
      />
    </FlexibleWidthXYPlot>
  );
}
