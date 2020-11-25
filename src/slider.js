import React from 'react';
import { Range } from 'react-range';

export default function Slider(props) {
  const {max, values, onChange} = props;
  return (
    <div className='rangeslider'>
      <Range
        step={1}
        min={0}
        max={props.max}
        values={props.values}
        onChange={props.onChange}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: '6px',
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.4)'
            }}
          >
            {children}
          </div>
        )}
        renderThumb={({ props }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: '22px',
              width: '22px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)'
            }}
          />
        )}
      />
    </div>
  );
}
