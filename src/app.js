import React, { Component } from 'react';
import './css/app.css';
import { hot } from 'react-hot-loader';
import Papa from 'papaparse';
import moment from 'moment';
import simplify from 'simplify-js';
import DeckGL, { WebMercatorViewport, FlyToInterpolator } from 'deck.gl';
import { BASEMAP } from '@deck.gl/carto'; //free Carto map - no access token required
import { StaticMap, MapContext, NavigationControl, ScaleControl } from 'react-map-gl';
import renderLayers from './layers.js';
import Graph from './graph.js';
import Slider from './slider.js';


const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

let mapView = {
  longitude: 0,
  latitude: 0,
  zoom: 2,
  bearing: 0,
  pitch: 15,
  maxPitch: 85
};

//colours for tracks and markers (length should be >= number of species/individuals)
const PALETTE = [[255, 0, 41], [102, 166, 30], [152, 78, 163], [0, 210, 213], [255, 127, 0], [175, 141, 0], [55, 126, 184], [127, 128, 205], [179, 233, 0], [196, 46, 96], [166, 86, 40], [247, 129, 191], [255, 0, 41], [102, 166, 30], [152, 78, 163], [0, 210, 213], [255, 127, 0], [175, 141, 0], [55, 126, 184], [127, 128, 205], [179, 233, 0], [196, 46, 96], [166, 86, 40], [247, 129, 191]];

// const fileName = 'https://dl.dropbox.com/s/htfuz9khwejyhnq/test_gps_data.csv';
let fileName = undefined;
let dataLoaded = false;

const species = []; //species for each individual to be plotted
const animalID = []; //unique identification/name of each individual
const datetimes = [[]]; //time stamps of each individual
const coords = [[]]; //coordinates for all tracks and markers
let ids = 0; //total number of individuals
const colour = []; //track colour for each species or individual
const colourHex = []; //for animal list background requires hex
let useColourHex = []; //copy of above for storing changes
const fontColour = []; //for animal list font colour
let useFontColour = []; //copy of above for storing changes
const r = 4; //marker radius
const w = 2; //track width
let minLon = 0;
let maxLon = 0;
let minLat = 0;
let maxLat = 0;
const distance = [[]];
let maxDist = 0; //for Y axis of graph
let plotData = [];
let seriesOpacity = [];
let minTimestamp = 0;
let uniqueTimes = []; //unique time stamps rounded to nearest interval
const timestamps = []; //unique time stamps as strings for display
let sampleInterval = 0;
let maxTime = 0; //for X axis of graph
let utsLength = 0; //for range slider steps (not using continous time)
const useDates = []; //values of slider ticks
const rsTicks = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]; //for position of ticks on slider
let tailLength = 0;
let speed = 1;
let t0 = 0; //starting time index for timeRange and sliderTime
let t = 0; //time index for drawTracks function (allows skipping time stamps with no data)
let timeRange = [0, 0]; //current and previous time stamp for tracks, markers and graph
let displayTime = [0, 0]; //current time for display
let sliderTime = [0, 0, 0];
const tracks = [];
let tracksOff = true;
const markers = [];
let markersLength = 0;
let hiddenIDs = [];

let playback = undefined;
let playbackState = 0; //for playback button text
let playbackType = 0; //for moving window playback
let maxfps = 60; //animation speed as frames per second, for drawTracks function
let interval = 1000/maxfps; //for drawTracks function
let now = Date.now(); //for drawTracks function
let then = Date.now(); //for drawTracks function
let delta = now - then; //for drawTracks function

//for video input and output variables and parameters
let recorder, stream, videoURL;
let recording = false;
const displayMediaOptions = {
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 60 }
  },
  audio: false
};
const mediaRecorderOptions = { mimeType : 'video/webm' };

//sleep function for checkIfDataLoaded function
const sleep = (ms) => {
   return new Promise(resolve => setTimeout(resolve, ms));
}

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
// const interPoint = (lat1, lon1, lat2, lon2, f) => {
//   if (lat1 == lat2 && lon1 == lon2) {
//     return [lon1, lat1];
//   } else {
//     const p = 0.017453292519943295; // Math.PI / 180
//     const c = Math.cos;
//     const s = Math.sin;
//     //normalize proportion
//     f = Math.round(f * 100) / 100;
//     //convert lat and lon to radians
//     lat1 = lat1 * p;
//     lat2 = lat2 * p;
//     lon1 = lon1 * p;
//     lon2 = lon2 * p;
//     //calculate angular distance between locations
//     const dLat = lat2 - lat1;
//     const dLon = lon2 - lon1;
//     const a = s(dLat / 2) * s(dLat / 2) + c(lat1) * c(lat2) * s(dLon / 2) * s(dLon / 2);
//     const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     //calculate intermediate coordinates using proportion
//     const A = s((1 - f) * d) / s(d);
//     const B = s(f * d) / s(d);
//     const x = A * c(lat1) * c(lon1) + B * c(lat2) * c(lon2);
//     const y = A * c(lat1) * s(lon1) + B * c(lat2) * s(lon2);
//     const z = A * s(lat1) + B * s(lat2);
//     const lat3 = Math.atan2(z, Math.sqrt(x * x + y * y));
//     const lon3 = Math.atan2(y, x);
//     //return result as [lon, lat], normalising longitude to -180...+180
//     return [Math.round(((lon3 * 180 / Math.PI + 540) % 360 - 180) * 1000000) / 1000000, Math.round((lat3 * 180 / Math.PI) * 1000000) / 1000000];
//   }
// }

const createMarker = (newTime, i, j) => {
  newTime = Math.round((datetimes[i][j] - minTimestamp) / sampleInterval);
  let marker = {id:i,species:species[i],animal:animalID[i],colour:colour[i],radius:r,coordinates:coords[i][j],timestamps:newTime};
  markers.push(marker);
  return newTime;
}

const createTrack = (i, newDistance) => {
  let track = {id:i,species:species[i],animal:animalID[i],colour:colour[i],width:w,coordinates:coords[i],timestamps:datetimes[i]};
  tracks.push(track);
  //simplify graph data
  let simplified = simplify(distance[i], 50, true);
  let series = {key:i,data:simplified,color:rgbToHex(colour[i])};
  plotData.push(series);
  seriesOpacity.push(0.8);
  //animal list background and font colours
  colourHex.push(rgbToHex(colour[i]));
  fontColour.push('#FFFFFF');
  //find max distance for graph
  return maxDist = (newDistance > maxDist) ? newDistance : maxDist;
}

//open "file browswer window"...
//and load data from selected csv file for tracks and graph
const loadData = (e) => {
  fileName = e.target.files[0];
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
      const altitude = typeof(data.data[0].alt);
      let x = 0; //index of animal - corresponds to value in animal_id column in csv file
      let y = 0; //index within each animal feature
      let z = 0; //index for each line within csv file
      const _timestamps = []; //all time stamps as numbers
      const getAltitude = (z) => {
        if (altitude === 'undefined') {
          return 0;
        } else {
          let alt = Math.round(data.data[z].alt);
          if (Number.isFinite(alt)) {
            return alt;
          } else {
            return -1;
          }
        }
      }
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
      timeDiff.sort(function(a, b) { return a - b; });
      const timeDiffLength = timeDiff.length;
      if (timeDiffLength % 2 === 0) { //is even, use average of two middle numbers
        sampleInterval = (timeDiff[timeDiffLength / 2 - 1] + timeDiff[timeDiffLength / 2]) / 2;
      } else { //is odd, use middle number only
        sampleInterval = timeDiff[(timeDiffLength - 1) / 2];
      }
      //3. round unique time stamps to nearest multiple of sample interval and remove duplicates
      minTimestamp = uniqueTimestamps[0];
      utsLength = uniqueTimestamps.length - 1;
      for (let i = 0; i <= utsLength; i++) {
        uniqueTimestamps[i] = Math.round((uniqueTimestamps[i] - minTimestamp) / sampleInterval);
        if (uniqueTimestamps[i] !== uniqueTimestamps[i - 1]) {
          uniqueTimes.push(uniqueTimestamps[i]);
        }
      }
      utsLength = uniqueTimes.length - 1;
      maxTime = uniqueTimes[utsLength];

      //4. find expected sequence and check if interpolation is necessary
      //... method should work for continuous and non-continuous data
      const islands = []; //chunks of continuous time stamps, given the sample interval
      const gaps = []; //length of each gap between islands
      let startTimes = []; //start time of each island
      let _td = 1;
      for (let i = 1; i <= utsLength; i++) {
        if(uniqueTimes[i] - uniqueTimes[i - 1] === 1){
          _td++;
        } else {
          islands.push(_td);
          _td = 1;
          gaps.push((uniqueTimes[i] - uniqueTimes[i - 1]) - 1);
          startTimes.push(uniqueTimes[i]);
        }
      }
      //check if any missing values detected
      const gapsLength = gaps.length;
      if (gapsLength !== 0) {
        //find median length of islands, gaps and start times (for non-continuous data)
        const sTLength = startTimes.length;
        for (let i = 0; i < sTLength; i++) { //remove dates, keep time in seconds
          startTimes[i] = ((startTimes[i] * sampleInterval + minTimestamp) - Math.floor((startTimes[i] * sampleInterval + minTimestamp)/86400) * 86400) / sampleInterval;
        }
        islands.sort(function(a, b) { return a - b; });
        gaps.sort(function(a, b) { return a - b; });
        startTimes.sort(function(a, b) { return a - b; });
        let island = 0;
        let gap = 0;
        let startTime = 0;
        if (sTLength % 2 === 0) { //is even, use average of two middle numbers
          island = (islands[sTLength / 2 - 1] + islands[sTLength / 2]) / 2;
          gap = (gaps[sTLength / 2 - 1] + gaps[sTLength / 2]) / 2;
          startTime = (startTimes[sTLength / 2 - 1] + startTimes[sTLength / 2]) / 2;
        } else { //is odd, use middle number only
          island = islands[(sTLength - 1) / 2];
          gap = gaps[(sTLength - 1) / 2];
          startTime = startTimes[(sTLength - 1) / 2];
        }
        //get expected times...
        let expTimes = [];
        if ((island + gap) * sampleInterval === 86400) {//based on island, gap and maxTime
          let count = 0;
          let mgap = 0;
          let _val = 0;
          while (_val < maxTime) {
            for (let i = 0; i < island; i++) {
              _val = count + (gap * mgap);
              expTimes.push(_val);
              count++;
            }
            mgap++;
          }
          //check if first time stamp is equal to expected start time (median start time)
          const firstStartTime = (minTimestamp - Math.floor(minTimestamp/86400) * 86400) / sampleInterval;
          if (firstStartTime != startTime) {
            let newST = firstStartTime - startTime;
            expTimes.slice(newST);
            const newSTLength = newST.length;
            for (let i = 0; i < newSTLength; i++) {
              expTimes[i] = expTimes[i] - newST;
            }
          }
        } else {//based only on maxTime
          for (let i = 0; i < maxTime; i++) {
            expTimes.push(i);
          }
        }
        //update unique times
        uniqueTimes = [...expTimes];
        utsLength = uniqueTimes.length - 1;
      }

      //create array of time stamps for displaying in counter
      for (let i = 0; i <= utsLength; i++) {
        timestamps.push(moment.utc((uniqueTimes[i] * sampleInterval + minTimestamp) * 1000).format('YYYY MMM DD HH:mm'));
      }
      //get dates to display above range slider
      let nTicks = rsTicks.length - 1;
      let maxTimeSec = maxTime * sampleInterval;
      for (let i = 0; i <= nTicks; i++) {
        let j = Math.round(rsTicks[i] * utsLength);
        if (maxTimeSec <= 86400) {
          useDates.push(timestamps[j].slice(12));
        } else if (maxTimeSec <= 31536000) {
          useDates.push(timestamps[j].slice(5, 12));
        } else {
          useDates.push("'" + timestamps[j].slice(2, 9));
        }
      }

      //5. round time stamps per individual to nearest multiple of sample interval
      //... interpolate missing time stamps if necessary (based expected time stamps)
      //... calculate distance between subsequent non-interpolated locations (for graph)
      //... push markers, tracks and graph data to objects
      if (gapsLength === 0) {
        for (let i = 0; i < ids; i++) {
          let newTime = 0;
          let newDistance = 0;
          let prevDistance = 0;
          let dtLength = datetimes[i].length;
          for (let j = 0; j < dtLength; j++) {
            //push markers and return newTime
            newTime = createMarker(newTime, i, j);
            datetimes[i][j] = newTime;
            //distance
            if (j !== 0) {
              newDistance = calcDistance(coords[i][j - 1][1], coords[i][j - 1][0], coords[i][j][1], coords[i][j][0]) + prevDistance;
            }
            distance[i].push({x: newTime, y: newDistance});
            prevDistance = Number(newDistance);
          }
          //push tracks and graph data, and return max distance for graph
          maxDist = createTrack(i, newDistance);
        }
      } else {
        for (let i = 0; i < ids; i++) {
          let newTime = 0;
          let prevTime = 0;
          let tDiff = 0;
          let newCoords = [];
          let newDistance = 0;
          let prevDistance = 0;
          let j = 0;
          let newJ = 0;
          while (j < datetimes[i].length) {
            //push markers and return newTime
            newTime = createMarker(newTime, i, j);
            if (j !== 0) {
              //check if any missing datetimes and interpolate (plus coordinates)
              tDiff = newTime - prevTime;
              newJ = Number(j);
              if (tDiff > 1) {
                for (let k = 1; k < tDiff; k++) {
                  let iTime = prevTime + k;
                  if (uniqueTimes.indexOf(iTime, newJ - 1) > 0) { //for non-continuous sampling
                    datetimes[i].splice(newJ, 0, iTime);
                    // newCoords = interPoint(coords[i][newJ - 1][1], coords[i][newJ - 1][0], coords[i][newJ][1], coords[i][newJ][0], 1/(tDiff - (k - 1))); //interpolate
                    newCoords = [coords[i][newJ - 1][0], coords[i][newJ - 1][1]]; //repeat previous
                    newCoords.push(coords[i][newJ - 1][2]); //add altitude data
                    coords[i].splice(newJ, 0, newCoords);
                    newJ = newJ + 1;
                  }
                }
                datetimes[i][newJ] = newTime;
              } else {
                datetimes[i][j] = newTime;
              }
              newDistance = calcDistance(coords[i][j - 1][1], coords[i][j - 1][0], coords[i][j][1], coords[i][j][0]) + prevDistance;
              j = newJ + 1;
            } else {
              datetimes[i][j] = newTime;
              j = j + 1;
            }
            distance[i].push({x: newTime, y: newDistance});
            prevDistance = Number(newDistance);
            prevTime = Number(newTime);
          }
          //push tracks and graph data, and return max distance for graph
          maxDist = createTrack(i, newDistance);
        }
      }
      //order markers by timestamp instead of id for nicer look when plotted
      markers.sort((a, b) => a.timestamps - b.timestamps);
      markersLength = markers.length;
      displayTime = [timestamps[0], timestamps[0]];
      useColourHex.push(...colourHex);
      useFontColour.push(...fontColour);
      dataLoaded = true;
    }
  });
}


class App extends Component {

  state = {
    viewport: mapView,
    // baseMap: 'http://localhost:3650/api/maps/basic/style.json',
    baseMap: BASEMAP.POSITRON, //free Carto map - no access token required
    animals: [],
    animalListBGCol: [],
    animalListCol: [],
    trackData: [],
    trackTrail: 0,
    trackOpacity: 0.26,
    trackVisible: false,
    markerData: [],
    tsRange: timeRange,
    markerOpacity: 0.16,
    markerVisible: true,
    changeProps: false,
    counterTime: '',
    counterColour: 'rgb(0, 0, 0)',
    counterShadow: '0 0 20px rgb(255, 255, 255)',
    sliderDates: [],
    sliderValue: [0, 0, 0],
    sliderSteps: 10,
    sliderTicks: [],
    maxTimeVal: 0,
    graphVisible: 'hidden',
    graphTitle: 'dist (km)',
    graphData: [],
    graphSeriesOpacity: [],
    graphMaxY: 0,
    playButton: 'play',
    playTypeButton: 'winOff',
    playbackSpeed: speed,
    recordButton: 'recOff',
    markerButton: 'markersOff',
    trackButton:'tracksOn',
    graphButton: 'graphOff',
    fileInputDisplay: 'flex',
    fileInputDisabled: false,
    controlsDisplay: 'none'
  };

  callLoadData = (e) => {
    this.setState({ fileInputDisabled: true });
    loadData(e);
    this.checkIfDataLoaded();
  }

  checkIfDataLoaded = async () => {
    while (dataLoaded === false) {
      await sleep(1000);
    }
    this.flyToData();
  }

  flyToData = () => {
    const _viewport = new WebMercatorViewport(this.state.viewport);
    const { longitude, latitude, zoom } = _viewport.fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: {top: -390, bottom: -210, left: -700, right: -700} });
    mapView = {
      ...this.state.viewport,
      longitude,
      latitude,
      zoom,
      transitionDuration: 3500,
      transitionInterpolator: new FlyToInterpolator()
    };
    this.setState({
      viewport: mapView,
      animals: animalID,
      animalListBGCol: colourHex,
      animalListCol: fontColour,
      trackData: tracks,
      markerData: markers,
      tsRange: timeRange,
      counterTime: displayTime[0] + ' to ' + displayTime[1],
      sliderDates: useDates,
      sliderSteps: utsLength,
      sliderTicks: rsTicks,
      maxTimeVal: maxTime,
      graphData: plotData,
      graphMaxY: maxDist,
      graphSeriesOpacity: seriesOpacity,
      fileInputDisplay: 'none',
      controlsDisplay: 'flex'
    });
  }

  startPlotting = () => {
    if (playbackState === 1) {
      playbackState = 0;
      cancelAnimationFrame(playback);
      this.setState({ playButton: 'play' });
    } else {
      if (playbackState === -1) {
        if (playbackType === 0) {
          t = 0 - speed;
          t0 = 0;
        } else {
          t = t - (t0 + speed);
          t0 = 0 - speed;
        }
      }
      this.setState({ playButton: 'pause' });
      playbackState = 1;
      this.drawTracks();
    }
  }

  playSpeed = () => {
    if (speed === 32) {
      speed = 1;
    } else {
      speed = speed * 2;
    }
    this.setState({ playbackSpeed: speed });
  }

  playType = () => {
    if (playbackType === 0) {
      playbackType = 1;
      this.setState({ playTypeButton: 'winOn' });
    } else {
      playbackType = 0;
      this.setState({ playTypeButton: 'winOff' });
    }
  }

  startRecording = async () => {
    stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    recorder = new MediaRecorder(stream, mediaRecorderOptions);
    this.setState({ recordButton: 'recOn' });
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const completeBlob = new Blob(chunks, { type: chunks[0].type });
      videoURL = URL.createObjectURL(completeBlob);
      const videoLink = document.createElement('a');
      videoLink.href = videoURL;
      videoLink.download = 'trajVisRecording.mp4';
      videoLink.click(); //opens the "Save As" dialogue window
    };

    recorder.start();
  }

  recordScreen = () => {
    if (recording !== true) {
      recording = true;
      this.startRecording();
    } else {
      recording = false;
      recorder.stop();
      this.setState({ recordButton: 'recOff' });
      stream.getVideoTracks()[0].stop();
      URL.revokeObjectURL(videoURL);
      if (playbackState === 1) {
        playbackState = 0;
        cancelAnimationFrame(playback);
        this.setState({ playButton: 'play' });
      }
    }
  }

  toggleMapStyle = () => {
    if (this.state.baseMap === BASEMAP.POSITRON) {
      this.setState({
        baseMap: BASEMAP.DARK_MATTER,
        counterColour: 'rgb(255, 255, 255)',
        counterShadow: '0 0 20px rgb(0, 0, 0)'
      });
    } else if (this.state.baseMap === BASEMAP.DARK_MATTER) {
      this.setState({
        baseMap: 'mapbox://styles/mapbox/satellite-v9?optimize=true',
        trackOpacity: 0.9,
        markerOpacity: 0.3
      });
    } else {
      this.setState({
        baseMap: BASEMAP.POSITRON,
        counterColour: 'rgb(0, 0, 0)',
        counterShadow: '0 0 20px rgb(255, 255, 255)',
        trackOpacity: 0.26,
        markerOpacity: 0.16
      });
    }
  }

  graphVisibility = () => {
    if (this.state.graphVisible === 'visible') {
      this.setState({
        graphVisible: 'hidden',
        graphButton: 'graphOff'
      });
    } else {
      this.setState({
        graphVisible: 'visible',
        graphButton: 'graphOn'
      });
    }
  }

  markerVisibility = () => {
    if (this.state.markerVisible === true) {
      this.setState({
        markerVisible: false,
        markerButton: 'markersOff'
      });
    } else {
      this.setState({
        markerVisible: true,
        markerButton: 'markersOn'
      });
    }
  }

  trackVisibility = () => {
    if (this.state.trackVisible === true) {
      this.setState({
        trackVisible: false,
        trackButton: 'tracksOff'
      });
    } else {
      this.setState({
        trackVisible: true,
        trackButton: 'tracksOn'
      });
    }
  }

  toggleAnimals = (e) => {
    let selectedID = Number(e.target.getAttribute('id'));
    let selectedIndex = hiddenIDs.indexOf(selectedID);
    if (selectedIndex >= 0) {
      hiddenIDs.splice(selectedIndex, 1);
      tracks[selectedID].width = w; //change width back to default
      for (let i = 0; i < markersLength; i++) {
          if (markers[i].id === selectedID) {
            markers[i].radius = r; //change radius back to default
          };
      }
      seriesOpacity[selectedID] = 0.8;
      useColourHex[selectedID] = colourHex[selectedID];
      useFontColour[selectedID] = '#FFFFFF';
    } else {
      hiddenIDs.push(selectedID);
      tracks[selectedID].width = 0; //change width to 0
      for (let i = 0; i < markersLength; i++) {
          if (markers[i].id === selectedID) {
            markers[i].radius = 0; //change radius to 0
          };
      }
      seriesOpacity[selectedID] = 0;
      useColourHex[selectedID] = '#FFFFFF';
      useFontColour[selectedID] = '#808080';
    }
    this.setState({
      changeProps: !this.state.changeProps,
      graphSeriesOpacity: seriesOpacity,
      animalListBGCol: useColourHex,
      animalListCol: useFontColour
    });
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
      if (playbackType === 1) {
        t0 = t0 + speed;
      }
      t = t + speed;
      if (t > utsLength) {
        if (playbackType === 1) {
          t0 = t0 - (t - utsLength);
        }
        t = utsLength;
        playbackState = -1;
        cancelAnimationFrame(playback);
        this.setState({ playButton: 'replay' });
      }
      timeRange = [uniqueTimes[t0], uniqueTimes[t]];
      tailLength = timeRange[1] - timeRange[0];
      sliderTime = [t0, (t0 + (t - t0)/2), t];
      displayTime = [timestamps[t0], timestamps[t]];
      this.setState({
        trackTrail: tailLength,
        tsRange: timeRange,
        counterTime: displayTime[0] + ' to ' + displayTime[1],
        sliderValue: sliderTime
      });
      if (tracksOff === true) {
        if (tailLength !== 0) {
          tracksOff = false;
          this.setState({
            trackVisible: true,
            markerVisible: false
          });
        }
      }
    }
    then = now - (delta % interval);
  }

  rangeSlider = (sliderValue) => {
    if (playbackState === 1) {
      cancelAnimationFrame(playback);
    }
    if (sliderValue[2] === utsLength) {
      playbackState = -1;
      this.setState({ playButton: 'replay' });
    } else {
      playbackState = 0;
      this.setState({ playButton: 'play' });
    }
    this.setState({ sliderValue });
    if (sliderValue[1] != sliderTime[1]) {
      let tDiff = Math.round((t - sliderTime[1]) - (t - sliderValue[1]));
      let _t0 = t0 + tDiff;
      let _t = t + tDiff;
      if (_t0 >= 0 && _t < utsLength) {
        t0 = _t0;
        t = _t;
        sliderTime = [t0, sliderValue[1], t];
      } else if (_t0 < 0) {
        t = t - t0;
        t0 = 0;
        sliderTime = [t0, (t0 + (t - t0)/2), t];
      } else if (_t > utsLength) {
        t0 = t0 + (utsLength - t);
        t = utsLength;
        sliderTime = [t0, (t0 + (t - t0)/2), t];
      }
    } else if (sliderValue[2] < sliderValue[0] && sliderValue[2] < t) {
      t0 = sliderValue[2];
      t = sliderValue[2];
      sliderTime = [t, t, t];
    } else if (sliderValue[0] > sliderValue[2] && sliderValue[0] > t0) {
      t0 = sliderValue[0];
      t = sliderValue[0];
      sliderTime = [t0, t0, t0];
    } else {
      t0 = sliderValue[0];
      t = sliderValue[2];
      sliderTime = [t0, (t0 + (t - t0)/2), t];
    }
    this.setState({ sliderValue: sliderTime });
    timeRange = [uniqueTimes[t0], uniqueTimes[t]];
    tailLength = timeRange[1] - timeRange[0];
    displayTime = [timestamps[t0], timestamps[t]];
    this.setState({
      trackTrail: tailLength,
      tsRange: timeRange,
      counterTime: displayTime[0] + ' to ' + displayTime[1]
    });
    if (tailLength === 0) {
      if (this.state.trackVisible === true && this.state.markerVisible === false) {
        tracksOff = true;
        this.setState({
          trackVisible: false,
          markerVisible: true
        });
      }
    }
    if (tracksOff === true) {
      if (tailLength !== 0) {
        tracksOff = false;
        this.setState({
          trackVisible: true,
          markerVisible: false
        });
      }
    }
  }

  render() {
    const {viewport, baseMap, animals, animalListBGCol, animalListCol, counterTime, counterColour, counterShadow, sliderDates, playButton, playbackSpeed, playTypeButton, recordButton, markerButton, trackButton, graphVisible, graphButton, fileInputDisplay, fileInputDisabled, controlsDisplay} = this.state;

    return (
      <div id='map'>
        <DeckGL
          initialViewState={viewport}
          controller={true}
          layers={renderLayers({...this.state})}
          getTooltip={({object}) => object && `species: ${object.species}\n tag: ${object.animal}\n ts: ${moment.utc((object.timestamps * sampleInterval + minTimestamp) * 1000).format('YYYY-MM-DD HH:mm')}\n altitude: ${object.coordinates[2]}`}
          ContextProvider={MapContext.Provider}
          parameters={{
            depthTest: false
          }}
        >
          <StaticMap
            mapboxApiAccessToken={MAPBOX_TOKEN}
            mapStyle={baseMap}
          >
          </StaticMap>
          <div className='zoomButton'>
            <NavigationControl/>
          </div>
          <div className='scaleBar'>
            <ScaleControl/>
          </div>
        </DeckGL>
        <div className='centerDiv' style={{display: fileInputDisplay}}>
          <div className='welcomeBox'>
            <p>trajVis: Visualise, animate and create videos of animal movement data on an interactive map.</p>
            <p>To begin, select a csv file containing movement data for a single or multiple individuals.</p>
            <p>File must contain the following headers: species, animal_id, timestamp [as YYYY-MM-DD HH:MM:SS], lon, lat, and (optional) alt</p>
            <div className='fileInput'>
              <label className='customFileInput'>
                <input id='defaultFileInput' type='file' onChange={this.callLoadData} disabled={fileInputDisabled} />
              </label>
            <div className='ioeLogoBig'>
              <a href='https://www.internetofelephants.com/' target='_blank'></a>
            </div>
            </div>
          </div>
        </div>
        <div className='counter' style={{color: counterColour, textShadow: counterShadow}}>
          <p>{counterTime}</p>
        </div>
        <div className='playbackOptions' style={{display: controlsDisplay}}>
          <button title='play/pause/replay' id={playButton} className='button' onClick={this.startPlotting}></button>
          <button title='playback speed' className='button' onClick={this.playSpeed}>x{playbackSpeed}</button>
          <button title='time window' id={playTypeButton} className='button' onClick={this.playType}></button>
          <button title='record' id={recordButton} className='button' onClick={this.recordScreen}></button>
          <button title='markers' id={markerButton} className='button' onClick={this.markerVisibility}></button>
          <button title='tracks' id={trackButton} className='button' onClick={this.trackVisibility}></button>
          <button title='graph' id={graphButton} className='button' onClick={this.graphVisibility}></button>
          <button title='map styles' id='mapIcon' className='button' onClick={this.toggleMapStyle}></button>
        </div>
        <div className='ioeLogoSmall' style={{display: controlsDisplay}}>
          <a href='https://www.internetofelephants.com/' target='_blank'></a>
        </div>
        <div className='timeControls' style={{display: controlsDisplay}}>
          <div className='rsDates'>
            {sliderDates.map((d, index) => (
              <div className='rsDate' key={index}>{d}</div>
            ))}
          </div>
          <Slider {...this.state} onChange={this.rangeSlider} />
        </div>
        <div className='graph' style={{visibility: graphVisible}}>
          <Graph {...this.state} />
        </div>
        <ul className='animalList'>
          {animals.map((name, index) => (
            <li className='animalListItem' key={index} id={index} onClick={this.toggleAnimals} style={{background: animalListBGCol[index], color: animalListCol[index]}}>{name}</li>
          ))}
        </ul>
      </div>
    );
  }
}

export default hot(module)(App);
// export default App;
