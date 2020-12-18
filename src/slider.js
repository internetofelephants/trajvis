import React from 'react';
import { Range, getTrackBackground } from 'react-range';

export default function Slider(props) {
  const {sliderSteps, sliderValue, onChange} = props;
  return (
    <Range
      draggableTrack
      step={1}
      min={0}
      max={sliderSteps}
      values={sliderValue}
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
                  values: sliderValue,
                  colors: ['rgb(200, 200, 200)', 'rgb(0, 0, 0)', 'rgb(200, 200, 200)'],
                  min: 0,
                  max: sliderSteps
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
  );
}
