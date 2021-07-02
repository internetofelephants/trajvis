import React from 'react';
import { Range, getTrackBackground } from 'react-range';

export default function Slider(props) {
  const {sliderSteps, sliderValue, onChange, sliderTicks} = props;
  return (
    <div className='rangeSlider'>
      <Range
        draggableTrack={false}
        allowOverlap={true}
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
              display: 'flex',
              width: '96%',
              height: '100%'
            }}
          >
            {sliderTicks.map((p, index) => (
              <div className='sliderTick' key={index}
                style={{ left: p*100 + '%' }} />
            ))}
            <div
              ref={props.ref}
              style={{
                ...props.style,
                width: '100%',
                height: '6px',
                background: getTrackBackground({
                    values: sliderValue,
                    colors: ['rgb(80, 80, 80)', 'rgb(220, 220, 220)', 'rgb(220, 220, 220)', 'rgb(80, 80, 80)'],
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
              borderRadius: '50%',
              backgroundColor: 'rgb(220, 220, 220)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0px 2px 6px rgba(255, 255, 255, 0.2)'
            }}
          >
            <div
              style={{
                height: '8px',
                width: '8px',
                borderRadius: '50%',
                backgroundColor: isDragged ? 'rgb(220, 220, 220)' : 'rgb(80, 80, 80)'
              }}
            />
          </div>
        )}
      />
    </div>
  );
}
