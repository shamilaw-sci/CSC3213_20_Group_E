import React,{useEffect} from 'react';import {useMap,useMapEvents} from 'react-leaflet';import L from 'leaflet';
const MapClickEvents = ({ locationMode, setFormData, setGpsActive, setBoundaryCoordinates }) => {
  useMapEvents({
    click(e) {
      if (locationMode === "point") {
        setFormData((prev) => ({
          ...prev,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        }));
        setGpsActive(false);
      } else if (locationMode === "boundary") {
        setBoundaryCoordinates((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
      }
    },
  });
  return null;
};
const customIcon = new L.Icon({
  iconUrl: "/__phase6_assets/marker-icon.png",
  shadowUrl: "/__phase6_assets/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
const identity=new WeakMap();let created=0,removed=0;
function MapObserver({onObservation}){const map=useMap();useEffect(()=>{if(!identity.has(map))identity.set(map,++created);const id=identity.get(map);const refresh=()=>onObservation({id,created,removed,alive:true,center:[map.getCenter().lat,map.getCenter().lng].map(n=>Number(n.toFixed(8))),zoom:map.getZoom()});const unload=()=>{removed++;onObservation({id,created,removed,alive:false});};map.on('moveend zoomend click',refresh);map.once('unload',unload);refresh();return()=>map.off('moveend zoomend click',refresh);},[map,onObservation]);return null;}
export {MapClickEvents,customIcon,MapObserver};