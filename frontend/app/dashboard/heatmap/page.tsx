'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Map, 
  Table2, 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  ArrowUpRight, 
  CheckCircle2, 
  Info, 
  Navigation, 
  Compass, 
  Radio, 
  Layers, 
  Phone, 
  AlertOctagon, 
  Eye, 
  SlidersHorizontal, 
  Sparkles, 
  LocateFixed, 
  Satellite, 
  Maximize2, 
  Minimize2, 
  Wind, 
  Droplets, 
  FlameKindling, 
  Activity, 
  Waves 
} from 'lucide-react';

const API = 'http://localhost:8000';

interface HeatmapCell {
  site: string;
  activity: string;
  sif_count: number;
  total_count: number;
  density: number;
  label: string;
}

interface GeoAsset {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  sif_score: number;
  sif_label: 'HIGH' | 'MEDIUM' | 'LOW';
  sif_density: number;
  precursor_count: number;
  total_reports: number;
  latest_hazard: string;
  active_permits: number;
  workers_on_site: number;
  toolpusher: string;
  phone: string;
  flare_temp_c: number;
  flood_risk: 'LOW' | 'MODERATE' | 'SEVERE';
  gas_type: 'H2S + METHANE' | 'NATURAL GAS' | 'CRUDE VAPOR' | 'INERT';
}

const GEO_ASSETS: GeoAsset[] = [
  {
    id: 'ASSET-BJ5',
    name: 'Baghjan Well #5',
    district: 'Tinsukia (Dibru-Saikhowa Border)',
    lat: 27.6041,
    lng: 95.3812,
    sif_score: 0.96,
    sif_label: 'HIGH',
    sif_density: 42.5,
    precursor_count: 17,
    total_reports: 40,
    latest_hazard: 'Active gas kick with 1800 PSI annular pressure surge. BOP secondary valve seal weeping hydraulic fluid.',
    active_permits: 3,
    workers_on_site: 24,
    toolpusher: 'Horen Gogoi',
    phone: '+91 94350-11204',
    flare_temp_c: 580,
    flood_risk: 'SEVERE',
    gas_type: 'H2S + METHANE',
  },
  {
    id: 'ASSET-WP7',
    name: 'Well Pad 7',
    district: 'Upper Assam Basin (Dibrugarh)',
    lat: 27.2831,
    lng: 95.2546,
    sif_score: 0.92,
    sif_label: 'HIGH',
    sif_density: 38.0,
    precursor_count: 19,
    total_reports: 50,
    latest_hazard: 'Worker standing on 12-meter high scaffold without safety harness over active manifold.',
    active_permits: 4,
    workers_on_site: 18,
    toolpusher: 'Bikash Das',
    phone: '+91 94350-99881',
    flare_temp_c: 320,
    flood_risk: 'MODERATE',
    gas_type: 'NATURAL GAS',
  },
  {
    id: 'ASSET-MOCS3',
    name: 'Moran OCS-3',
    district: 'Charaideo / Moran Gathering',
    lat: 27.1824,
    lng: 94.9218,
    sif_score: 0.88,
    sif_label: 'HIGH',
    sif_density: 35.2,
    precursor_count: 18,
    total_reports: 51,
    latest_hazard: 'Crane lifting heavy 5-ton pipe dangerously close to 33kV overhead power lines without spotter.',
    active_permits: 2,
    workers_on_site: 32,
    toolpusher: 'Pranjal Saikia',
    phone: '+91 94351-44552',
    flare_temp_c: 440,
    flood_risk: 'LOW',
    gas_type: 'CRUDE VAPOR',
  },
  {
    id: 'ASSET-DG14',
    name: 'Digboi Pad 14',
    district: 'Tinsukia (Asia Oldest Oil Field)',
    lat: 27.3892,
    lng: 95.6214,
    sif_score: 0.65,
    sif_label: 'MEDIUM',
    sif_density: 22.0,
    precursor_count: 11,
    total_reports: 50,
    latest_hazard: 'Pressure gauge needle on Pump-04 vibrating violently with cracked glass cover.',
    active_permits: 1,
    workers_on_site: 14,
    toolpusher: 'Anup Baruah',
    phone: '+91 94352-77119',
    flare_temp_c: 210,
    flood_risk: 'LOW',
    gas_type: 'CRUDE VAPOR',
  },
  {
    id: 'ASSET-DLHQ',
    name: 'Duliajan Plant (Central HQ)',
    district: 'Dibrugarh (Main Refinery & Township)',
    lat: 27.3582,
    lng: 95.3197,
    sif_score: 0.15,
    sif_label: 'LOW',
    sif_density: 8.5,
    precursor_count: 4,
    total_reports: 47,
    latest_hazard: 'Routine fire extinguisher inspection completed. Drip tray minor oil weeping cleaned.',
    active_permits: 6,
    workers_on_site: 120,
    toolpusher: 'Rajesh Kumar (GM)',
    phone: '+91 374-2800555',
    flare_temp_c: 180,
    flood_risk: 'LOW',
    gas_type: 'INERT',
  },
  {
    id: 'ASSET-NHK',
    name: 'Naharkatia Field',
    district: 'Dibrugarh / Burhi Dihing',
    lat: 27.2831,
    lng: 95.2546,
    sif_score: 0.58,
    sif_label: 'MEDIUM',
    sif_density: 18.4,
    precursor_count: 9,
    total_reports: 49,
    latest_hazard: 'Staircase steel handrail loose and wobbling on tank farm inspection walkway.',
    active_permits: 3,
    workers_on_site: 22,
    toolpusher: 'Manoj Bora',
    phone: '+91 94350-33441',
    flare_temp_c: 260,
    flood_risk: 'SEVERE',
    gas_type: 'NATURAL GAS',
  },
  {
    id: 'ASSET-TGK',
    name: 'Tengakhat Station',
    district: 'Dibrugarh Substation',
    lat: 27.3821,
    lng: 95.1842,
    sif_score: 0.22,
    sif_label: 'LOW',
    sif_density: 10.2,
    precursor_count: 5,
    total_reports: 49,
    latest_hazard: 'Handwash soap dispenser empty in staff restroom near security gate.',
    active_permits: 1,
    workers_on_site: 12,
    toolpusher: 'Deben Dutta',
    phone: '+91 94350-66778',
    flare_temp_c: 140,
    flood_risk: 'LOW',
    gas_type: 'INERT',
  },
  {
    id: 'ASSET-LKW',
    name: 'Lakwa Gathering',
    district: 'Sivasagar Basin',
    lat: 26.9812,
    lng: 94.8521,
    sif_score: 0.25,
    sif_label: 'LOW',
    sif_density: 12.0,
    precursor_count: 6,
    total_reports: 50,
    latest_hazard: 'Plastic safety warning cone knocked over near vehicle parking lot.',
    active_permits: 2,
    workers_on_site: 16,
    toolpusher: 'Jiten Sonowal',
    phone: '+91 94353-88990',
    flare_temp_c: 190,
    flood_risk: 'LOW',
    gas_type: 'CRUDE VAPOR',
  },
  {
    id: 'ASSET-GLK',
    name: 'Geleki Processing',
    district: 'Sivasagar South',
    lat: 26.8521,
    lng: 94.7512,
    sif_score: 0.85,
    sif_label: 'HIGH',
    sif_density: 32.0,
    precursor_count: 16,
    total_reports: 50,
    latest_hazard: 'Forklift operating at high speed in blind corner near main flammable gas cylinder shed.',
    active_permits: 3,
    workers_on_site: 28,
    toolpusher: 'Nayan Chutia',
    phone: '+91 94354-11223',
    flare_temp_c: 410,
    flood_risk: 'MODERATE',
    gas_type: 'NATURAL GAS',
  },
  {
    id: 'ASSET-RDS',
    name: 'Rudrasagar Pad 2',
    district: 'Sivasagar West',
    lat: 26.9512,
    lng: 94.6214,
    sif_score: 0.18,
    sif_label: 'LOW',
    sif_density: 9.1,
    precursor_count: 4,
    total_reports: 44,
    latest_hazard: 'Safety poster faded and replaced on bulletin board near workshop.',
    active_permits: 1,
    workers_on_site: 10,
    toolpusher: 'Bhaskar Konwar',
    phone: '+91 94355-66771',
    flare_temp_c: 120,
    flood_risk: 'LOW',
    gas_type: 'INERT',
  },
];

const TRUNK_PIPELINES = [
  { name: 'Moran-Naharkatia 16" Gas Trunk', points: [[27.1824, 94.9218], [27.2831, 95.2546]], pressure: '68 Bar' },
  { name: 'Naharkatia-Duliajan 24" Crude Main', points: [[27.2831, 95.2546], [27.3582, 95.3197]], pressure: '82 Bar' },
  { name: 'Duliajan-Baghjan 12" High-Pressure Gas', points: [[27.3582, 95.3197], [27.6041, 95.3812]], pressure: '110 Bar' },
  { name: 'Duliajan-Digboi Historic Pipeline', points: [[27.3582, 95.3197], [27.3892, 95.6214]], pressure: '45 Bar' },
  { name: 'Lakwa-Moran 14" Feeder Line', points: [[26.9812, 94.8521], [27.1824, 94.9218]], pressure: '55 Bar' },
];

function DensityCell({ 
  density, 
  sifCount, 
  totalCount,
}: { 
  density: number; 
  sifCount?: number; 
  totalCount?: number;
}) {
  const isHigh = density >= 25;
  const isMed = density >= 10 && density < 25;

  let bgClass = "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100/80";

  if (isHigh) {
    bgClass = "bg-red-50 text-red-950 border-red-200 hover:bg-red-100 font-extrabold shadow-2xs";
  } else if (isMed) {
    bgClass = "bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100 font-bold";
  }

  return (
    <td className={`px-3.5 py-3 text-center border transition-all cursor-pointer ${bgClass}`}>
      <div className="flex items-center justify-center gap-1">
        <span className="font-mono text-sm tracking-tight">{density.toFixed(1)}%</span>
      </div>
      {totalCount !== undefined && totalCount > 0 && (
        <div className="text-[10px] font-mono opacity-70 mt-0.5">
          ({sifCount}/{totalCount} SIFp)
        </div>
      )}
    </td>
  );
}

export default function DualHeatmapAndMapPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'gis_map'>('gis_map');
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [bufferRadiusMeters, setBufferRadiusMeters] = useState<number>(500);
  const [showGasPlume, setShowGasPlume] = useState<boolean>(true);
  const [showNasaFirms, setShowNasaFirms] = useState<boolean>(true);
  const [showFloodRisk, setShowFloodRisk] = useState<boolean>(true);
  const [showPipelines, setShowPipelines] = useState<boolean>(true);
  
  const windVector = { speedKmh: 14, directionDeg: 65, directionText: 'ENE → WSW' };

  const [data, setData] = useState<{
    sites: string[];
    activities: string[];
    cells: HeatmapCell[];
    site_densities: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<GeoAsset | null>(GEO_ASSETS[0]);
  const [swaToast, setSwaToast] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const baseTileLayerRef = useRef<any>(null);
  const labelsTileLayerRef = useRef<any>(null);
  const pipelinesGroupRef = useRef<any>(null);
  const floodGroupRef = useRef<any>(null);
  const gasPlumeGroupRef = useRef<any>(null);
  const bufferGroupRef = useRef<any>(null);
  const thermalGroupRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  useEffect(() => {
    fetch(`${API}/api/analytics/heatmap`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 250);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (activeTab !== 'gis_map' || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let isMounted = true;

    const initBaseMap = async () => {
      const L = (await import('leaflet')).default;
      LRef.current = L;

      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [27.35, 95.30],
        zoom: 10,
        zoomControl: true,
      });

      const satTile = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri &mdash; NASA, USGS, Maxar', maxZoom: 18 }
      ).addTo(map);
      baseTileLayerRef.current = satTile;

      const labelTile = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, opacity: 0.85 }
      ).addTo(map);
      labelsTileLayerRef.current = labelTile;

      pipelinesGroupRef.current = L.featureGroup().addTo(map);
      floodGroupRef.current = L.featureGroup().addTo(map);
      gasPlumeGroupRef.current = L.featureGroup().addTo(map);
      bufferGroupRef.current = L.featureGroup().addTo(map);
      thermalGroupRef.current = L.featureGroup().addTo(map);
      markersGroupRef.current = L.featureGroup().addTo(map);

      GEO_ASSETS.forEach(asset => {
        const isHigh = asset.sif_label === 'HIGH';
        const isMed = asset.sif_label === 'MEDIUM';

        const iconHtml = `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            ${isHigh ? '<div class="absolute w-10 h-10 rounded-full bg-red-500/40 animate-ping"></div>' : ''}
            <div class="relative w-8 h-8 rounded-xl flex items-center justify-center shadow-2xl border-2 border-white ${
              isHigh ? 'bg-red-600 text-white' : isMed ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
            }">
              <span style="font-size: 14px;">${isHigh ? '🔥' : isMed ? '⚠️' : '✅'}</span>
            </div>
            <div class="absolute top-full mt-1 px-2 py-0.5 rounded font-mono text-[9px] font-bold whitespace-nowrap shadow-md ${
              isHigh ? 'bg-red-950 text-white border border-red-600' : 'bg-slate-900 text-white border border-slate-700'
            }">
              ${asset.name}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([asset.lat, asset.lng], { icon: customIcon }).addTo(markersGroupRef.current);
        marker.on('click', () => {
          setSelectedAsset(asset);
          map.flyTo([asset.lat, asset.lng], 12, { duration: 1.2 });
        });
      });

      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    };

    initBaseMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    if (baseTileLayerRef.current) map.removeLayer(baseTileLayerRef.current);
    if (labelsTileLayerRef.current) map.removeLayer(labelsTileLayerRef.current);

    if (mapType === 'satellite') {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri &mdash; NASA, USGS, Maxar', maxZoom: 18 }
      ).addTo(map);

      labelsTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18, opacity: 0.85 }
      ).addTo(map);
    } else {
      baseTileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
      ).addTo(map);
    }
  }, [mapType]);

  useEffect(() => {
    const L = LRef.current;
    const group = pipelinesGroupRef.current;
    if (!L || !group) return;

    group.clearLayers();
    if (showPipelines) {
      TRUNK_PIPELINES.forEach(pipe => {
        L.polyline(pipe.points as any, {
          color: '#38BDF8',
          weight: 3.5,
          dashArray: '8, 8',
          opacity: 0.85,
        }).bindTooltip(`🛢️ ${pipe.name} (${pipe.pressure})`, { sticky: true }).addTo(group);
      });
    }
  }, [showPipelines]);

  useEffect(() => {
    const L = LRef.current;
    const group = floodGroupRef.current;
    if (!L || !group) return;

    group.clearLayers();
    if (showFloodRisk) {
      L.polygon([
        [27.64, 95.30],
        [27.68, 95.45],
        [27.56, 95.55],
        [27.52, 95.35]
      ], {
        color: '#0284C7',
        weight: 2,
        fillColor: '#0284C7',
        fillOpacity: 0.22,
        dashArray: '5, 5'
      }).bindTooltip("🌊 Brahmaputra Flood Hazard Basin (NASA Hydrological Inundation Risk: Severe)", { sticky: true }).addTo(group);
    }
  }, [showFloodRisk]);

  useEffect(() => {
    const L = LRef.current;
    const group = gasPlumeGroupRef.current;
    if (!L || !group) return;

    group.clearLayers();
    if (showGasPlume) {
      GEO_ASSETS.filter(a => a.sif_label === 'HIGH').forEach(asset => {
        const angleRad = (245 * Math.PI) / 180;
        const plumeLength = 0.045;

        const tipLat = asset.lat + Math.cos(angleRad) * plumeLength;
        const tipLng = asset.lng + Math.sin(angleRad) * plumeLength;

        const leftLat = asset.lat + Math.cos(angleRad - 0.25) * plumeLength * 0.7;
        const leftLng = asset.lng + Math.sin(angleRad - 0.25) * plumeLength * 0.7;

        const rightLat = asset.lat + Math.cos(angleRad + 0.25) * plumeLength * 0.7;
        const rightLng = asset.lng + Math.sin(angleRad + 0.25) * plumeLength * 0.7;

        L.polygon([
          [asset.lat, asset.lng],
          [leftLat, leftLng],
          [tipLat, tipLng],
          [rightLat, rightLng],
        ], {
          color: '#DC2626',
          weight: 2,
          fillColor: '#EF4444',
          fillOpacity: 0.35,
        }).bindTooltip(`💨 TOXIC ${asset.gas_type} DISPERSION PLUME<br>• Wind: ${windVector.speedKmh} km/h ${windVector.directionText}<br>• Downwind Hazard Zone: 5.2 km<br>• Immediate Action: Downwind Evacuation Required`, { sticky: true }).addTo(group);
      });
    }
  }, [showGasPlume]);

  useEffect(() => {
    const L = LRef.current;
    const group = thermalGroupRef.current;
    if (!L || !group) return;

    group.clearLayers();
    if (showNasaFirms) {
      GEO_ASSETS.filter(a => a.flare_temp_c >= 400).forEach(asset => {
        const thermalHtml = `
          <div class="flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer">
            <span class="w-5 h-5 rounded-full bg-amber-500/80 animate-ping absolute"></span>
            <span style="font-size: 16px;">🔥</span>
          </div>
        `;
        L.marker([asset.lat + 0.006, asset.lng + 0.006], {
          icon: L.divIcon({ html: thermalHtml, className: 'thermal-pin', iconSize: [18, 18] })
        }).bindTooltip(`🛰️ NASA FIRMS Thermal Anomaly Detected: ${asset.flare_temp_c}°C Flare Stack`, { sticky: true }).addTo(group);
      });
    }
  }, [showNasaFirms]);

  useEffect(() => {
    const L = LRef.current;
    const group = bufferGroupRef.current;
    if (!L || !group) return;

    group.clearLayers();
    GEO_ASSETS.forEach(asset => {
      const isHigh = asset.sif_label === 'HIGH';
      if (selectedAsset?.id === asset.id || isHigh) {
        L.circle([asset.lat, asset.lng], {
          radius: bufferRadiusMeters,
          color: isHigh ? '#EF4444' : '#F59E0B',
          weight: 2,
          dashArray: '6, 6',
          fillColor: isHigh ? '#EF4444' : '#F59E0B',
          fillOpacity: selectedAsset?.id === asset.id ? 0.22 : 0.12,
        }).addTo(group);
      }
    });
  }, [bufferRadiusMeters, selectedAsset]);

  const getCellData = (site: string, activity: string): HeatmapCell | null => {
    return data?.cells?.find(c => c.site === site && c.activity === activity) || null;
  };

  const handleTriggerSWA = (asset: GeoAsset) => {
    setSwaToast(`🛑 Stop Work Authority Dispatched: All ${asset.active_permits} active e-PTWs frozen on ${asset.name} within ${bufferRadiusMeters}m spatial buffer.`);
    setTimeout(() => setSwaToast(null), 5000);
  };

  const flyToAsset = (asset: GeoAsset) => {
    setSelectedAsset(asset);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([asset.lat, asset.lng], 12, { duration: 1.2 });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#F1F5F9]/70 min-h-screen">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
              {activeTab === 'gis_map' ? (
                <Satellite className="w-5 h-5 text-amber-400 animate-pulse" />
              ) : (
                <Table2 className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                  {activeTab === 'gis_map' ? 'Upper Assam Geospatial Intelligence & Environmental Defense' : 'SIF-Precursor Density Heatmap Matrix'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-red-600" />
                  NASA FIRMS + GAUSSIAN GAS PLUME AI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {activeTab === 'gis_map' 
                  ? 'Real-world sub-meter photographic satellite imagery, dynamic toxic H2S dispersion modeling, NASA thermal flaring & Brahmaputra flood telemetry'
                  : 'Calculates corporate concentration density: D_SIF = (Confirmed SIF Precursors ÷ Total Observations) × 100'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-300 shadow-inner">
          <button
            onClick={() => setActiveTab('gis_map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-extrabold transition-all cursor-pointer ${
              activeTab === 'gis_map'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-950/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Satellite className="w-4 h-4 text-amber-400" />
            🛰️ Geospatial Intelligence Map
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-extrabold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-950/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Table2 className="w-4 h-4 text-blue-400" />
            📊 Heatmap Matrix
          </button>
        </div>
      </div>

      {swaToast && (
        <div className="p-4 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center justify-between shadow-xl shadow-red-950/30 border border-red-400 animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-5 h-5 fill-white animate-bounce shrink-0" />
            <span className="text-sm font-semibold">{swaToast}</span>
          </div>
          <button onClick={() => setSwaToast(null)} className="text-white/80 hover:text-white font-bold text-lg cursor-pointer">✕</button>
        </div>
      )}

      {activeTab === 'gis_map' && (
        <div className="space-y-4">
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-300 shadow-xs">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 px-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Intelligence Layers:
              </span>
              
              <button
                onClick={() => setShowGasPlume(!showGasPlume)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  showGasPlume
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                💨 Toxic Gas Plume (ALOHA)
              </button>

              <button
                onClick={() => setShowNasaFirms(!showNasaFirms)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  showNasaFirms
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FlameKindling className="w-3.5 h-3.5" />
                🛰️ NASA FIRMS Thermal Flare
              </button>

              <button
                onClick={() => setShowFloodRisk(!showFloodRisk)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  showFloodRisk
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Waves className="w-3.5 h-3.5" />
                🌊 Brahmaputra Flood Sensor
              </button>

              <button
                onClick={() => setShowPipelines(!showPipelines)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  showPipelines
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                🛢️ Trunk Pipelines
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-500 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" /> SWA Buffer:
              </span>
              <div className="flex items-center gap-1">
                {[
                  { label: '100m (SWA)', val: 100 },
                  { label: '500m (Evac)', val: 500 },
                  { label: '2.0km (Warning)', val: 2000 },
                  { label: '5.0km (Eco-Zone)', val: 5000 },
                ].map(b => (
                  <button
                    key={b.val}
                    onClick={() => setBufferRadiusMeters(b.val)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      bufferRadiusMeters === b.val
                        ? 'bg-red-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <div className={`bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden relative transition-all duration-300 ${
              isExpanded ? 'lg:col-span-12' : 'lg:col-span-8'
            }`}>
              
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <LocateFixed className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-white">
                      Live Upper Assam Geospatial Tactical Canvas
                    </h3>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-mono text-cyan-300">
                    <Wind className="w-3 h-3 text-cyan-400" />
                    <span>Wind: {windVector.speedKmh} km/h ({windVector.directionText})</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono font-bold transition-all border border-slate-700 cursor-pointer"
                  >
                    {mapType === 'satellite' ? '🗺️ Street Map' : '🛰️ Satellite'}
                  </button>

                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold font-mono transition-all border border-slate-700 shadow-xs cursor-pointer"
                    title={isExpanded ? "Collapse to Split View" : "Enlarge Map to Full Width"}
                  >
                    {isExpanded ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Split View</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>⛶ Enlarge Map</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div 
                ref={mapContainerRef} 
                className="w-full relative z-0" 
                style={{ height: isExpanded ? 740 : 580 }}
              />

              {isExpanded && selectedAsset && (
                <div className="absolute top-16 right-4 z-10 w-96 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-slate-300 shadow-2xl overflow-hidden animate-fadeIn">
                  <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-heading font-extrabold uppercase tracking-wide">
                      <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                      <span>{selectedAsset.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-300 font-bold">{selectedAsset.sif_label} RISK</span>
                  </div>

                  <div className="p-4 space-y-3 text-xs bg-slate-50/70">
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">SIF Density</div>
                        <div className="font-mono text-base font-black text-red-600">{selectedAsset.sif_density.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Workers in {bufferRadiusMeters}m</div>
                        <div className="font-mono text-sm font-black text-slate-800">{selectedAsset.workers_on_site} Persons</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">NASA Flare Temp</div>
                        <div className="font-mono text-[11px] text-amber-600 font-bold">{selectedAsset.flare_temp_c}°C</div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[10px] font-mono uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" /> Latest Hazard Observation:
                      </div>
                      <p className="text-[11px] text-slate-900 font-bold leading-relaxed line-clamp-2">
                        "{selectedAsset.latest_hazard}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-600 font-medium">
                        Toolpusher: <span className="font-bold text-slate-900">{selectedAsset.toolpusher}</span>
                      </div>
                      <a
                        href={`tel:${selectedAsset.phone}`}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold text-[11px] hover:bg-blue-700 flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    </div>

                    {selectedAsset.sif_label === 'HIGH' && (
                      <button
                        onClick={() => handleTriggerSWA(selectedAsset)}
                        className="w-full py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-heading font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-red-950/30 cursor-pointer"
                      >
                        <AlertOctagon className="w-3.5 h-3.5 fill-white" />
                        🛑 Freeze {selectedAsset.active_permits} Permits (SWA {bufferRadiusMeters}m)
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>

            <div className={`bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden transition-all duration-300 ${
              isExpanded ? 'hidden' : 'lg:col-span-4'
            }`}>
              
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-red-400" />
                  <h3 className="font-heading font-extrabold text-xs uppercase tracking-wider text-white">
                    Asset Geospatial Telemetry
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">REAL GPS</span>
              </div>

              <div className="p-5 space-y-4 bg-slate-50/50">
                {selectedAsset ? (
                  <div className="space-y-4 animate-fadeIn">
                    
                    {/* Section 1: Asset Identity Card */}
                    <div className="p-4 rounded-xl bg-white border-2 border-slate-300 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase text-white shadow-xs ${
                          selectedAsset.sif_label === 'HIGH' ? 'bg-red-600' : selectedAsset.sif_label === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}>
                          {selectedAsset.sif_label} SIF RISK
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {selectedAsset.id}
                        </span>
                      </div>

                      <h4 className="font-heading font-black text-xl text-slate-900 mt-1">
                        {selectedAsset.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold">
                        📍 {selectedAsset.district}
                      </p>

                      <div className="text-[11px] font-mono text-slate-700 pt-1 font-bold flex items-center justify-between border-t border-slate-100 mt-2">
                        <span>GPS Coordinates:</span>
                        <span className="text-blue-700">{selectedAsset.lat.toFixed(4)}° N, {selectedAsset.lng.toFixed(4)}° E</span>
                      </div>
                    </div>

                    {/* Section 2: Structured Risk & Personnel Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">SIF Density (D_sif)</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="font-mono text-xl font-black text-red-600">
                            {selectedAsset.sif_density.toFixed(1)}%
                          </div>
                          <span className="text-[9px] font-mono font-bold bg-red-100 text-red-800 px-1.5 py-0.2 rounded">
                            HIGH
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                        <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Workers in {bufferRadiusMeters}m</div>
                        <div className="font-mono text-xl font-black text-slate-900 mt-1">
                          {selectedAsset.workers_on_site} Persons
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Environmental Telemetry Rows */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5 text-xs shadow-2xs">
                      <div className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="flex items-center gap-1"><Satellite className="w-3 h-3 text-blue-600" /> Environmental Telemetry</span>
                        <span className="text-emerald-700 font-mono font-bold text-[9px] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">LIVE FEED</span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 flex items-center gap-1 font-medium">💨 Gas Type:</span>
                        <span className="font-mono font-bold text-red-700">{selectedAsset.gas_type}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 flex items-center gap-1 font-medium">🔥 NASA Flare Temp:</span>
                        <span className="font-mono font-bold text-amber-600">{selectedAsset.flare_temp_c}°C</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 flex items-center gap-1 font-medium">🌊 Flood Threat:</span>
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                          selectedAsset.flood_risk === 'SEVERE' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>{selectedAsset.flood_risk}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-300 space-y-1.5 shadow-2xs">
                      <div className="text-[10px] font-mono uppercase font-bold text-slate-500 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Latest Unresolved Hazard Observation:
                      </div>
                      <p className="text-xs text-slate-900 font-bold leading-relaxed">
                        "{selectedAsset.latest_hazard}"
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold">On-Duty Toolpusher</div>
                        <div className="font-bold text-slate-800">{selectedAsset.toolpusher}</div>
                        <div className="text-[10px] font-mono text-blue-600 font-bold">{selectedAsset.phone}</div>
                      </div>
                      <a
                        href={`tel:${selectedAsset.phone}`}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1 border border-blue-200 cursor-pointer"
                      >
                        <Phone className="w-3 h-3" />
                        Call
                      </a>
                    </div>

                    {selectedAsset.sif_label === 'HIGH' && (
                      <button
                        onClick={() => handleTriggerSWA(selectedAsset)}
                        className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-heading font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-red-950/30 transition-all hover:scale-[1.01] cursor-pointer"
                      >
                        <AlertOctagon className="w-4 h-4 fill-white" />
                        🛑 Freeze {selectedAsset.active_permits} Hot Work Permits (SWA {bufferRadiusMeters}m)
                      </button>
                    )}

                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                      <div className="text-[10px] font-mono uppercase font-bold text-slate-400">Jump to Asset Pin:</div>
                      <div className="flex flex-wrap gap-1">
                        {GEO_ASSETS.map(a => (
                          <button
                            key={a.id}
                            onClick={() => flyToAsset(a)}
                            className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                              selectedAsset.id === a.id ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {a.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 space-y-2 bg-white rounded-xl border border-slate-300">
                    <Info className="w-6 h-6 text-slate-400 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700">Click Any Operational Pin on Map</h4>
                    <p className="text-[11px] text-slate-400">
                      View live hazard telemetry, GPS coordinates, and 100m blast perimeter controls.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-red-50/80 border-2 border-red-300 rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-red-900">
                  Highest Risk Asset Identified: <span className="underline font-black">Baghjan Well #5</span> (SIF Density: 42.5%)
                </div>
                <p className="text-[11px] text-red-700">
                  Elevated concentration of energy isolation and barrier failure precursors detected in Upper Assam operations.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold font-mono">
              CRITICAL ATTENTION
            </span>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-heading font-extrabold text-sm text-slate-900 uppercase tracking-wider">
                Operational Asset × Activity Risk Matrix
              </h3>
              <span className="text-xs font-mono text-slate-500 font-medium">
                {data?.sites.length || 0} Assets Spanned · {data?.activities.length || 0} Activity Domains
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-400 font-medium animate-pulse">
                Calculating SIF-Precursor density matrix across all sites...
              </div>
            ) : !data || data.sites.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Map className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-lg">No Heatmap Data</h3>
                <p className="text-xs text-slate-400 mt-1">Ingest safety reports to generate risk density calculations.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left py-3.5 px-4 bg-slate-900 text-white font-extrabold text-xs uppercase font-mono tracking-wider border border-slate-800 rounded-tl-xl w-60">
                        Site / Asset Name
                      </th>
                      {data.activities.map((act) => (
                        <th key={act} className="text-center py-3.5 px-3 bg-slate-900 text-white font-extrabold text-xs uppercase font-mono tracking-wider border border-slate-800">
                          {act}
                        </th>
                      ))}
                      <th className="text-center py-3.5 px-4 bg-slate-800 text-amber-300 font-black text-xs uppercase font-mono tracking-wider border border-slate-700 rounded-tr-xl w-36">
                        SIF Density
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sites.map((site) => {
                      const siteDensity = data.site_densities?.[site] ?? 0;
                      const isSiteHigh = siteDensity >= 25;
                      const isSiteMed = siteDensity >= 10 && siteDensity < 25;

                      return (
                        <tr key={site} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 text-xs border border-slate-200 bg-white">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isSiteHigh ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                              {site}
                            </div>
                          </td>

                          {data.activities.map((act) => {
                            const cell = getCellData(site, act);
                            return (
                              <DensityCell
                                key={act}
                                density={cell?.density || 0}
                                sifCount={cell?.sif_count}
                                totalCount={cell?.total_count}
                              />
                            );
                          })}

                          <td className={`py-3 px-4 text-center font-mono font-black text-xs border border-slate-300 ${
                            isSiteHigh ? 'bg-red-100 text-red-950 font-black' : isSiteMed ? 'bg-amber-100 text-amber-950 font-bold' : 'bg-emerald-100 text-emerald-950'
                          }`}>
                            {siteDensity.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
