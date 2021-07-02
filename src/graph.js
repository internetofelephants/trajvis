import React from 'react';
import '../node_modules/react-vis/dist/style.css';
import { FlexibleWidthXYPlot, XAxis, YAxis, HorizontalGridLines, LineSeriesCanvas } from 'react-vis';
import moment from 'moment';

export default function Graph( {graphTitle, graphData, graphSeriesOpacity, maxTimeVal, graphMaxY, minTS, tsInterval, tsRange} ) {
  return (
    <div style={{width: '96%', height: '120px'}}>
      <div className='gTitleContainer'>
        <div className='gTitle'>{graphTitle}</div>
      </div>
      <FlexibleWidthXYPlot
        height={120}
        margin={{left: 60, bottom: 8, right: 60}}
        xDomain={[0, maxTimeVal]}
        yDomain={[0, graphMaxY]}
      >
        <HorizontalGridLines
          style={{stroke: '#505050'}}
          tickTotal={4}
        />
        <XAxis
          style={{line: {stroke: '#505050'}}}
          tickTotal={0}
        />
        <YAxis
          hideLine
          style={{text: {fill: '#8C8C8C', fontSize: '94%'}}}
          tickFormat={d => Math.round(d / 1000)}
          tickTotal={4}
          tickSizeInner={0}
          tickSizeOuter={0}
        />
        {graphData.map((props, i) => (
          <LineSeriesCanvas
            {...props}
            opacity={graphSeriesOpacity[i]}
            strokeWidth={1.8}
          />
        ))}
        <LineSeriesCanvas
          data={[{x:tsRange[0], y:0}, {x:tsRange[0], y:graphMaxY}]}
          color={'#FFFFFF'}
          opacity={0.6}
          strokeWidth={3}
        />
        <LineSeriesCanvas
          data={[{x:tsRange[1], y:0}, {x:tsRange[1], y:graphMaxY}]}
          color={'#FFFFFF'}
          opacity={0.6}
          strokeWidth={3}
        />
      </FlexibleWidthXYPlot>
    </div>
  );
}
