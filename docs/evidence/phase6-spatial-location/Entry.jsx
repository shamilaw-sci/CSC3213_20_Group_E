import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {LazyMotion,domAnimation,m} from 'framer-motion';import {AlertCircle} from 'lucide-react';import BeforePanel from 'virtual:phase6-before';import AfterPanel from 'virtual:phase6-after';import '/src/index.css';import '/src/components/layout/Navbar.css';import 'leaflet/dist/leaflet.css';
const params=new URLSearchParams(location.search),state=params.get('state')||'point';
const vertices=[[7.29,80.63],[7.292,80.634],[7.288,80.635]];
function Feedback({message}){return <>{message.text && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-3 shadow-lg ${
              message.type === "success"
                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                : message.type === "info" ? "bg-blue-950/60 text-blue-300 border border-blue-500/40"
                : "bg-red-950/60 text-red-300 border border-red-500/40"
            }`}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}</>;}
function Fixture(){const [formData,setFormData]=useState(()=>({...{
    listingType: "Sale",
    address: "",
    type: "House",
    title: "",
    description: "",
    price: "",
    pricePeriod: "Month",
    district: "",
    city: "",
    contactNumber: "",
    bedrooms: "",
    bathrooms: "",
    landSize: "",
    houseSize: "",
    latitude: 7.8731,
    longitude: 80.7718,
  },city:state==='blank'?'':' Synthetic town ',address:state==='blank'?'':' Synthetic address ',latitude:7.2906,longitude:80.6337}));const [locationMode,setLocationMode]=useState(state.startsWith('boundary')?'boundary':'point');const [boundaryCoordinates,setBoundaryCoordinates]=useState(()=>state==='boundary-partial'?vertices.slice(0,2):state==='boundary-closed'?[vertices[0],vertices[1],vertices[0]]:state==='boundary-valid'?vertices:state==='boundary-closedvalid'?[...vertices,vertices[0]]:[]);const [gpsActive,setGpsActive]=useState(state==='gps');const [currentStep,setCurrentStep]=useState(2);const [message,setMessage]=useState({type:'',text:''});const [observation,setObservation]=useState({});const [lastAlert,setLastAlert]=useState('');const images=[];
Object.defineProperty(navigator,'geolocation',{configurable:true,value:params.get('gps')==='unsupported'?undefined:{getCurrentPosition(success,failure){if(params.get('gps')==='failure')failure({code:1});else success({coords:{latitude:6.9,longitude:79.8}});}}});window.alert=text=>setLastAlert(text);
const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
const handleGetGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setGpsActive(true);
        setLocationMode("point");
        setBoundaryCoordinates([]);
      },
      () => {
        alert("Unable to retrieve GPS coordinates. Please select on map.");
        setGpsActive(false);
      }
    );
  };
const validateStep = (step) => {
    if (step === 1) {
      if (!formData.title.trim()) {
        setMessage({ type: "error", text: "Please enter a descriptive property title." });
        return false;
      }
      if (!formData.price || Number(formData.price) <= 0) {
        setMessage({ type: "error", text: "Please provide a valid asking price." });
        return false;
      }
      if (!formData.district) {
        setMessage({ type: "error", text: "Please select the property district." });
        return false;
      }
    } else if (step === 2) {
      if (!formData.city?.trim() && !formData.address?.trim()) {
        setMessage({ type: "error", text: "Please specify the town or street address." });
        return false;
      }
      if (locationMode === "boundary") {
        let distinctPoints = boundaryCoordinates.length;
        if (distinctPoints > 0) {
          const first = boundaryCoordinates[0];
          const last = boundaryCoordinates[boundaryCoordinates.length - 1];
          if (first[0] === last[0] && first[1] === last[1]) {
            distinctPoints -= 1;
          }
        }
        if (distinctPoints < 3) {
          setMessage({ type: "error", text: "Please click at least 3 distinct points on the map to define the boundary." });
          return false;
        }
      }
    } else if (step === 3) {
      if (images.length === 0) {
        setMessage({ type: "error", text: "Please upload at least 1 photograph of your property." });
        return false;
      }
    }
    setMessage({ type: "", text: "" });
    return true;
  };
const nextStep = (e) => {
    if (e) e.preventDefault();
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
const prevStep = (e) => {
    if (e) e.preventDefault();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
const Panel=params.get('version')==='after'?AfterPanel:BeforePanel;const props={formData,setFormData,handleChange,locationMode,setLocationMode,boundaryCoordinates,setBoundaryCoordinates,gpsActive,setGpsActive,handleGetGPS,prevStep,nextStep,setObservation};
return <LazyMotion features={domAnimation}><div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16 selection:bg-blue-600 selection:text-white"><Feedback message={message}/><div id="step-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">{currentStep===2?<Panel {...props}/>:<p>Synthetic step {currentStep}; map unmounted</p>}</div><aside aria-label="Private verification observer" className="mt-4 text-xs"><pre id="map-probe">{JSON.stringify(observation)}</pre><p id="form-probe">{JSON.stringify({city:formData.city,address:formData.address,latitude:formData.latitude,longitude:formData.longitude,locationMode,gpsActive,boundaryCoordinates,currentStep,lastAlert})}</p><button type="button" onClick={()=>setCurrentStep(2)}>Return to Spatial Location</button></aside></div></LazyMotion>;}
createRoot(document.getElementById('fixture')).render(<Fixture/>);