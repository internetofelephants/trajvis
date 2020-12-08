import React from 'react';
import '../node_modules/react-vis/dist/style.css';
import {
  FlexibleWidthXYPlot,
  XAxis,
  YAxis,
  HorizontalGridLines,
  MarkSeriesCanvas
} from 'react-vis';
import moment from 'moment';

export default function Graph( {graphVisible, graphData, maxTimeVal, graphMaxY, minTS, tsInterval} ) {
  return (
    <div className='graph' style={{visibility: graphVisible}}>
      <FlexibleWidthXYPlot
        height={140}
        xDomain={[0, maxTimeVal]}
        yDomain={[0, graphMaxY]}
      >
        <HorizontalGridLines />
        <XAxis tickFormat={d => moment.utc((d * tsInterval + minTS) * 1000).format('YYYY-MM-DD')} />
        <YAxis tickFormat={d => Math.round(d / 10) / 100} />
        {graphData.map(props => (
          <MarkSeriesCanvas {...props} />
        ))}
      </FlexibleWidthXYPlot>
    </div>
  );
}
