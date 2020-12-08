import React, { Component } from 'react';
import './app.css';
import { hot } from 'react-hot-loader';
import Papa from 'papaparse';
import moment from 'moment';
import DeckGL, { WebMercatorViewport, FlyToInterpolator } from 'deck.gl';
import { StaticMap } from 'react-map-gl';
import { renderTracks } from './track.js';
import Graph from './graph.js';
import Slider from './slider.js';


const INITIAL_MAP_VIEW = {
  longitude: 0,
  latitude: 0,
  zoom: 2,
  bearing: 0,
  pitch: 30
};

const MAPBOX_TOKEN = 'pk.eyJ1IjoicmFmZm1hcmVzIiwiYSI6ImNqOGYwdXd6YTE0ZnczMm1uMTF0NzZnbDYifQ.apQdLo_KQAc1jDQIKKTDHQ';

//colours for tracks and markers (length should be >= number of species/individuals)
const PALETTE = [[255, 0, 41], [55, 126, 184], [102, 166, 30], [152, 78, 163], [0, 210, 213], [255, 127, 0], [175, 141, 0], [127, 128, 205], [179, 233, 0], [196, 46, 96], [166, 86, 40], [247, 129, 191]];

// const fileName = 'https://dl.dropbox.com/s/htfuz9khwejyhnq/test_gps_data.csv';
let fileName = undefined;

const species = []; //species for each individual to be plotted
const animalID = []; //unique identification/name of each individual
const datetimes = [[]]; //time stamps of each individual
const coords = [[]]; //coordinates for all tracks and markers
let ids = 0; //total number of individuals
const colour = []; //track colour for each species or individual
let minLon = 0;
let maxLon = 0;
let minLat = 0;
let maxLat = 0;
const distance = [[]];
let maxDist = 0; //for Y axis of graph
let plotData = [];
let minTimestamp = 0;
const uniqueTimes = []; //unique time stamps rounded to nearest interval
const timestamps = []; //unique time stamps as strings for display
let sampleInterval = 0;
let maxTime = 0; //for X axis of graph (and range slider steps if using continuous time)
let utsLength = 0; //for range slider steps (not using continous time)
let tailLength = 0;
// let speed = Number(document.getElementById('speed-slider').value);
let speed = 1;
let t0 = 0; //starting time index for sliderTime and timeRange
let t = 0; //time index for drawTracks function (allows skipping time stamps with no data)
let cTime = 0; //current time for deck gl layers
let time0 = 0; //start time for calculating tailLength
let displayTime = 0; //current time for display
let sliderTime = [0, 0];
let timeRange = [0, 0];
const tracks = [];
const markers = [];

let playback = undefined;
let playbackState = 0; //for playback button text
let playbackType = 0; //for moving window playback
let maxfps = 60; //animation speed as frames per second, for drawTracks function
let interval = 1000/maxfps; //for drawTracks function
let now = Date.now(); //for drawTracks function
let then = Date.now(); //for drawTracks function
let delta = now - then; //for drawTracks function

//convert rgb to hex (hex required for graph)
const rgbToHex = (rgb) => '#' + rgb.map(x => {
  const hex = x.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}).join('')

//calculate distance between consecutive locations
//taken from: https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
const calcDistance = (lat1, lon1, lat2, lon2) => {
  const p = 0.017453292519943295; // Math.PI / 180
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))/2;
  return Math.round(12742 * Math.asin(Math.sqrt(a)) * 1000); // 2 * R; R = 6371 km; * 1000 for result in meters
}

//interpolate missing coordinates
//take from: https://stackoverflow.com/questions/52323353/calculate-the-point-between-two-coordinates-based-on-a-percentage-spherically
const interPoint = (lat1, lon1, lat2, lon2, f) => {
  if (lat1 == lat2 && lon1 == lon2) {
    return [lon1, lat1];
  } else {
    const p = 0.017453292519943295; // Math.PI / 180
    const c = Math.cos;
    const s = Math.sin;
    //normalize proportion
    f = Math.round(f * 100) / 100;
    //convert lat and lon to radians
    lat1 = lat1 * p;
    lat2 = lat2 * p;
    lon1 = lon1 * p;
    lon2 = lon2 * p;
    //calculate angular distance between locations
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = s(dLat / 2) * s(dLat / 2) + c(lat1) * c(lat2) * s(dLon / 2) * s(dLon / 2);
    const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //calculate intermediate coordinates using proportion
    const A = s((1 - f) * d) / s(d);
    const B = s(f * d) / s(d);
    const x = A * c(lat1) * c(lon1) + B * c(lat2) * c(lon2);
    const y = A * c(lat1) * s(lon1) + B * c(lat2) * s(lon2);
    const z = A * s(lat1) + B * s(lat2);
    const lat3 = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon3 = Math.atan2(y, x);
    //return result as [lon, lat], normalising longitude to -180...+180
    return [Math.round(((lon3 * 180 / Math.PI + 540) % 360 - 180) * 1000000) / 1000000, Math.round((lat3 * 180 / Math.PI) * 1000000) / 1000000];
  }
}

//open "file browswer window"...
//and load data from selected csv file for tracks and graph
const loadData = (event) => {
  fileName = event.target.files[0];
  Papa.parse(fileName, {
    download: false,
    delimeter: ',',
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
    complete: function(data) {
      //extract full coordinate and time stamp lists and add to corresponding variables
      const dataLength = data.data.length;
      let lon = 0;
      let lat = 0;
      let x = 0; //index of animal - corresponds to value in animal_id column in csv file
      let y = 0; //index within each animal feature
      let z = 0; //index for each line within csv file
      const _timestamps = []; //all time stamps as numbers
      // const getAltitude = typeof(data.data[0].alt) !== undefined ? z => Math.round(data.data[z].alt) : z => 0;
      const getAltitude = z => 0;
      //for bounding box and zooming into data
      minLon = data.data[0].lon;
      maxLon = data.data[0].lon;
      minLat = data.data[0].lat;
      maxLat = data.data[0].lat;
      //loop through data
      while (z < dataLength) {
        lon = data.data[z].lon;
        lat = data.data[z].lat;
        if (Number.isFinite(lon) && Number.isFinite(lat)) {
          coords[x].push([Math.round(lon * 1000000) / 1000000, Math.round(lat * 1000000) / 1000000, getAltitude(z)]);
          minLon = (lon < minLon) ? lon : minLon;
          maxLon = (lon > maxLon) ? lon : maxLon;
          minLat = (lat < minLat) ? lat : minLat;
          maxLat = (lat > maxLat) ? lat : maxLat;
          datetimes[x].push(moment.utc(data.data[z].timestamp.substring(0, 19), 'YYYY-MM-DD HH:mm:ss').unix()); //time stamps per individual
          _timestamps.push(moment.utc(data.data[z].timestamp.substring(0, 19), 'YYYY-MM-DD HH:mm:ss').unix()); //all time stamps
        }
        y++;
        //end of data or next individual
        if (z + 1 === dataLength) {
          species.push(data.data[z].species);
          animalID.push(data.data[z].animal_id);
          break;
        } else if (data.data[z].animal_id !== data.data[z + 1].animal_id) {
          species.push(data.data[z].species);
          animalID.push(data.data[z].animal_id);
          x = x + 1;
          coords.push([]);
          datetimes.push([]);
          distance.push([]);
          y = 0;
        }
        z++;
      }
      //number of individuals: for number of tracks, and drawTracks and timeSlider functions
      ids = animalID.length;
      //define the track colour for each species or individual if only 1 species
      const uniqueSpecies = [...new Set(species)];
      const uniqueSpeciesCount = uniqueSpecies.length
      if (colour[0] === undefined) {
        x = 0;
        y = 0;
        while (x < ids) {
          colour.push(PALETTE[y]);
          x++;
          if (uniqueSpeciesCount === 1 || species[x] !== species[x - 1]) {
            y = y + 1;
          }
        }
      }
      //normalise time stamps...
      //1. remove duplicated time stamps and sort min to max
      const uniqueTimestamps = [...new Set(_timestamps)];
      uniqueTimestamps.sort(function(a, b) {
        return a - b;
      });
      //2. find sampling interval
      //based on median of difference (in seconds) between consecutive locations
      const timeDiff = [];
      let j = 0;
      const maxIndex = uniqueTimestamps.length - 1;
      for (let i = 0; i < maxIndex; i++) {
        let _timeDiff = uniqueTimestamps[i + 1] - uniqueTimestamps[j];
        //if difference > 59 secs and < 3 hrs, add to timediff variable (for locations recorded in bursts and when there are on/off times)
        if (_timeDiff > 59) {
          j = i + 1;
          // if (_timeDiff <= (3 * 3600)) {
            timeDiff.push(_timeDiff);
          // }
        }
      }
      timeDiff.sort(function(a, b) {
        return a - b;
      });
      const timeDiffLength = timeDiff.length;
      if (timeDiffLength % 2 === 0) { //is even
        //average of two middle numbers
        sampleInterval = (timeDiff[timeDiffLength / 2 - 1] + timeDiff[timeDiffLength / 2]) / 2;
      } else { //is odd
        //middle number only
        sampleInterval = timeDiff[(timeDiffLength - 1) / 2];
      }
      //3. round unique time stamps to nearest multiple of sample interval and remove duplicates
      minTimestamp = uniqueTimestamps[0];
      utsLength = uniqueTimestamps.length - 1;
      for (let i = 0; i <= utsLength; i++) {
        uniqueTimestamps[i] = Math.round((uniqueTimestamps[i] - minTimestamp) / sampleInterval);
        if (uniqueTimestamps[i] !== uniqueTimestamps[i - 1]) {
          uniqueTimes.push(uniqueTimestamps[i]);
          timestamps.push(moment.utc((uniqueTimestamps[i] * sampleInterval + minTimestamp) * 1000).format('YYYY-MM-DD HH:mm:ss')); //for displaying time stamps
        }
      }
      maxTime = uniqueTimestamps[uniqueTimestamps.length - 1];
      utsLength = uniqueTimestamps.length - 1;
      //4. round time stamps per individual to nearest multiple of sample interval
      //... interpolate missing data (based on time stamps that exist in data)
      //... calculate distance between subsequent non-interpolated locations (for graph)
      //... push markers, tracks and graph data to objects
      for (let i = 0; i < ids; i++) {
        let newTime = 0;
        let prevTime = 0;
        let tDiff = 0;
        let newCoords = [];
        let newDistance = 0;
        let j = 0;
        let newJ = 0;
        while (j < datetimes[i].length) {
          newTime = Math.round((datetimes[i][j] - minTimestamp) / sampleInterval);
          //push markers with no interpolation
          let marker = {id:i,species:species[i],animal:animalID[i],colour:colour[i],coordinates:coords[i][j],timestamps:newTime};
          markers.push(marker);
          if (j !== 0) {
            //check if any missing data based on datetimes and interpolate
            tDiff = newTime - prevTime;
            newJ = Number(j);
            if (tDiff > 1) {
              for (let k = 1; k < tDiff; k++) {
                let iTime = prevTime + k;
                if (uniqueTimes.indexOf(iTime, newJ - 1) > 0) { //for non-continuous sampling
                  datetimes[i].splice(newJ, 0, iTime);
                  newCoords = interPoint(coords[i][newJ - 1][1], coords[i][newJ - 1][0], coords[i][newJ][1], coords[i][newJ][0], 1/(tDiff - (k - 1)));
                  newCoords.push(coords[i][newJ - 1][2]); //add altitude data
                  coords[i].splice(newJ, 0, newCoords);
                  newJ = newJ + 1;
                }
              }
              datetimes[i][newJ] = newTime;
            } else {
              datetimes[i][j] = newTime;
            }
            newDistance = calcDistance(coords[i][j - 1][1], coords[i][j - 1][0], coords[i][j][1], coords[i][j][0]);
            maxDist = (newDistance > maxDist) ? newDistance : maxDist;
            j = newJ + 1;
          } else {
            datetimes[i][j] = newTime;
            j = j + 1;
          }
          distance[i].push({x: newTime, y: newDistance});
          prevTime = Number(newTime);
        }
        //create track data...
        let track = {id:i,species:species[i],animal:animalID[i],colour:colour[i],coordinates:coords[i],timestamps:datetimes[i]};
        tracks.push(track);
        //create plot data...
        let series = {key:i,data:[],color:rgbToHex(colour[i]),size:3};
        if (datetimes[i][0] === 0) {
          series.data = [distance[i][0]];
        }
        plotData.push(series);
      }
      displayTime = timestamps[0];
    }
  });
}


class App extends Component {

  state = {
    mapView: INITIAL_MAP_VIEW,
    baseMap: 'mapbox://styles/mapbox/light-v9',
    trackData: [],
    trackTrail: 0,
    trackTime: 0,
    markerData: [],
    markerFilter: [0, 0],
    markerVisible: true,
    counterTime: '',
    sliderValue: [0, 0],
    sliderSteps: 10,
    maxTimeVal: 0,
    graphVisible: 'hidden',
    graphData: [],
    graphMaxY: 0,
    minTS: 0,
    tsInterval: 0,
    playButton: 'play',
    playTypeButton: 'all',
    playbackSpeed: speed
  };

  flyToData = () => {
    let w = window.innerWidth;
    let h = window.innerHeight;
    const { longitude, latitude, zoom } = new WebMercatorViewport({ width: w, height: h }).fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: {top: 10, bottom: 200, left: 10, right: 10} });
    const NEW_MAP_VIEW = {
      longitude,
      latitude,
      zoom,
      bearing: 0,
      pitch: 30,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator()
    };
    this.setState({
      mapView: NEW_MAP_VIEW,
      trackData: tracks,
      trackTrail: tailLength,
      trackTime: cTime,
      markerData: markers,
      markerFilter: timeRange,
      counterTime: displayTime,
      sliderValue: sliderTime,
      sliderSteps: utsLength,
      maxTimeVal: maxTime,
      graphData: plotData,
      graphMaxY: maxDist,
      minTS: minTimestamp,
      tsInterval: sampleInterval
    });
  }

  toggleMapStyle = () => {
    if (this.state.baseMap === 'mapbox://styles/mapbox/light-v9') {
      this.setState({ baseMap: 'mapbox://styles/mapbox/satellite-v9' });
    } else {
      this.setState({ baseMap: 'mapbox://styles/mapbox/light-v9' });
    }
  }

  startPlotting = () => {
    if (playbackState === 0) {
      this.setState({ playButton: 'stop' });
      playbackState = 1;
      this.drawTracks();
    } else if (playbackState === 1) {
      playbackState = 0;
      cancelAnimationFrame(playback);
      this.setState({ playButton: 'play' });
    }
  }

  playSpeed = () => {
    if (speed === 16) {
      speed = 1;
    } else {
      speed = speed * 2;
    }
    this.setState({ playbackSpeed: speed });
  }

  playType = () => {
    if (playbackType === 0) {
      playbackType = 1;
      this.setState({ playTypeButton: 'window' });
    } else {
      playbackType = 0;
      this.setState({ playTypeButton: 'all' });
    }
  }

  markerVisibility = () => {
    if (this.state.markerVisible === true) {
      this.setState({ markerVisible: false });
    } else {
      this.setState({ markerVisible: true });
    }
  }

  graphVisibility = () => {
    if (this.state.graphVisible === 'visible') {
      this.setState({ graphVisible: 'hidden' });
    } else {
      this.setState({ graphVisible: 'visible' });
    }
  }

  // componentDidMount() {
  //   this.loadData();
  // }
  // componentWillUnmount() {
  // }

  drawTracks = () => {
    playback = requestAnimationFrame(this.drawTracks);
    now = Date.now();
    delta = now - then;
    if (delta > interval) {
      t = t + speed;
      cTime = uniqueTimes[t];
      if (cTime <= maxTime) {
        if (playbackType === 1) {
          t0 = t0 + speed;
        }
        time0 = uniqueTimes[t0];
        tailLength = cTime - time0;
        timeRange = [time0, cTime];
        sliderTime = [t0, t];
        displayTime = timestamps[t];
        for (let i = 0; i < ids; i++) {
          let j = distance[i].findIndex(d => d.x === cTime); //skips interpolated time stamps
          if (j >= 0) {
            plotData[i].data = [distance[i][j]];
            //for LineSeries plots use...
            // plotData[i].data.push(distance[i][t]);
          } else {
            plotData[i].data = [];
          }
        }
        this.setState({
          trackTime: cTime,
          trackTrail: tailLength,
          markerFilter: timeRange,
          counterTime: displayTime,
          sliderValue: sliderTime,
          graphData: plotData
        });
      } else {
        playbackState = -1;
        cancelAnimationFrame(playback);
        this.setState({ playButton: 'replay' });
      }
    }
    then = now - (delta % interval);
  }

  rangeSlider = (sliderValue) => {
    if (playbackState === 1) {
      playbackState = 0;
      cancelAnimationFrame(playback);
      this.setState({ playButton: 'play' });
    }
    this.setState({ sliderValue });
    t0 = sliderValue[0];
    t = sliderValue[1];
    time0 = uniqueTimes[t0];
    cTime = uniqueTimes[t];
    tailLength = cTime - time0;
    timeRange = [time0, cTime];
    sliderTime = [t0, t];
    displayTime = timestamps[t];
    for (let i = 0; i < ids; i++) {
      let j = distance[i].findIndex(d => d.x === cTime); //skips interpolated time stamps
      if (j >= 0) {
        plotData[i].data = [distance[i][j]];
        //for LineSeries plots use...
        // plotData[i].data.push(distance[i][t]);
      } else {
        plotData[i].data = [];
      }
      // }
    }
    this.setState({
      trackTime: cTime,
      trackTrail: tailLength,
      markerFilter: timeRange,
      counterTime: displayTime,
      graphData: plotData
    });
  }


  render() {
    const {counterTime, sliderSteps, sliderValue, mapView, baseMap, playButton, playbackSpeed, playTypeButton} = this.state;

    return (
      <div>
        <DeckGL
          layers={renderTracks({...this.state})}
          getTooltip={({object}) => object && `${object.species}\n${object.animal}\n${moment.utc((object.timestamps * sampleInterval + minTimestamp) * 1000).format('YYYY-MM-DD HH:mm:ss')}`}
          initialViewState={mapView}
          controller={true}
        >
          <StaticMap
            mapboxApiAccessToken={MAPBOX_TOKEN}
            mapStyle={baseMap}
          >
          </StaticMap>
        </DeckGL>
        <div className='counter'>
          <h2>{counterTime}</h2>
        </div>
        <Graph {...this.state} />
        <div className='buttons'>
          <input type='file' onChange={loadData} />
          <button style={{width: '60px'}} onClick={this.flyToData}>fly</button>
          <button style={{width: '60px'}} onClick={this.startPlotting}>{playButton}</button>
          <button style={{width: '60px'}} onClick={this.playSpeed}>x{playbackSpeed}</button>
          <button style={{width: '60px'}} onClick={this.playType}>{playTypeButton}</button>
          <button style={{width: '60px'}} onClick={this.markerVisibility}>points</button>
          <button style={{width: '60px'}} onClick={this.graphVisibility}>graph</button>
          <button style={{width: '60px'}} onClick={this.toggleMapStyle}>map</button>
        </div>
        <Slider
          max={sliderSteps}
          values={sliderValue}
          onChange={this.rangeSlider}
        >
        </Slider>
      </div>
    );
  }
}

export default hot(module)(App);
