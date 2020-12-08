import React from 'react';
import { Range, getTrackBackground } from 'react-range';

export default function Slider(props) {
  const {max, values, onChange} = props;
  return (
    <div
      className='rangeslider'
      style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}
    >
      <Range
        draggableTrack
        step={1}
        min={0}
        max={props.max}
        values={props.values}
        onChange={props.onChange}
        renderTrack={({ props, children }) => (
          <div
            onMouseDown={props.onMouseDown}
            onTouchStart={props.onTouchStart}
            style={{
              ...props.style,
              height: '36px',
              display: 'flex',
              width: '90%'
            }}
          >
            <div
              ref={props.ref}
              style={{
                ...props.style,
                height: '6px',
                width: '100%',
                borderRadius: '4px',
                background: getTrackBackground({
                    values: values,
                    colors: ['rgb(200, 200, 200)', 'rgb(0, 0, 0)', 'rgb(200, 200, 200)'],
                    min: 0,
                    max: max
                  }),
                alignSelf: 'center'
              }}
            >
              {children}
            </div>
          </div>
        )}
        renderThumb={({ props, isDragged }) => (
          <div
            {...props}
            style={{
              ...props.style,
              height: '22px',
              width: '22px',
              borderRadius: '4px',
              backgroundColor: 'rgb(255, 255, 255)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0px 2px 6px rgb(170, 170, 170)'
            }}
          >
            <div
              style={{
                height: '12px',
                width: '5px',
                borderRadius: '4px',
                backgroundColor: isDragged ? 'rgb(0, 0, 0)' : 'rgb(200, 200, 200)'
              }}
            />
          </div>
        )}
      />
    </div>
  );
}
