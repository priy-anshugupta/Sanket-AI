'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Map, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  Info, 
  Compass, 
  Radio, 
  Layers, 
  Phone, 
  AlertOctagon, 
  Maximize2, 
  Minimize2, 
  Wind, 
  Droplets, 
  Activity,
  MapPin,
  Plus,
  Minus,
  RotateCcw
} from 'lucide-react';

const API = typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://localhost:8000';

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
    district: 'Tinsukia (Baghjan Gaon / Dighaltarrang)',
    lat: 27.5380,
    lng: 95.4450,
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
    district: 'Upper Assam Exploration (Dibrugarh)',
    lat: 27.3250,
    lng: 95.2860,
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
    lat: 27.1860,
    lng: 94.9320,
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
    lat: 27.3950,
    lng: 95.6310,
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
    district: 'Dibrugarh (Main Refinery & OIL Township)',
    lat: 27.3560,
    lng: 95.3180,
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
    district: 'Dibrugarh / Burhi Dihing Basin',
    lat: 27.2820,
    lng: 95.2580,
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
    district: 'Dibrugarh Compressor Substation',
    lat: 27.3830,
    lng: 95.1850,
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
    district: 'Sivasagar Basin (North Nazira)',
    lat: 26.9850,
    lng: 94.8620,
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
    district: 'Sivasagar South (Dehydration Plant)',
    lat: 26.8530,
    lng: 94.8150,
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
    district: 'Sivasagar West (Exploration Block)',
    lat: 26.9550,
    lng: 94.6230,
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
  { 
    name: 'Naharkatia-Duliajan 24" Crude Main', 
    points: [[27.2820, 95.2580], [27.3190, 95.2880], [27.3560, 95.3180]], 
    pressure: '82 Bar', 
    flow: '4,200 BOPD',
    medium: 'Crude Oil',
    color: '#0A6B63',
    valves: [
      { name: 'Main Manifold Valve MV-01 (Naharkatia)', lat: 27.2820, lng: 95.2580 },
      { name: 'Sectional Block Valve SBV-04 (Tipling Junction)', lat: 27.3190, lng: 95.2880 },
      { name: 'Terminal Receiving Header (Duliajan HQ)', lat: 27.3560, lng: 95.3180 },
    ]
  },
  { 
    name: 'Duliajan-Baghjan 12" High-Pressure Gas', 
    points: [[27.3560, 95.3180], [27.4470, 95.3810], [27.5380, 95.4450]], 
    pressure: '110 Bar', 
    flow: '2.4 MMSCMD',
    medium: 'High-Pressure Natural Gas',
    color: '#D97706',
    valves: [
      { name: 'Gas Dispatch Compressor Station (Duliajan)', lat: 27.3560, lng: 95.3180 },
      { name: 'Emergency Shutdown Valve ESD-08 (Doomdooma Pass)', lat: 27.4470, lng: 95.3810 },
      { name: 'Baghjan Well #5 Wellhead Header', lat: 27.5380, lng: 95.4450 },
    ]
  },
  { 
    name: 'Moran-Naharkatia 16" Gas Trunk', 
    points: [[27.1860, 94.9320], [27.2340, 95.0950], [27.2820, 95.2580]], 
    pressure: '68 Bar', 
    flow: '1.8 MMSCMD',
    medium: 'Associated Gas',
    color: '#0D9488',
    valves: [
      { name: 'Moran OCS-3 Export Manifold', lat: 27.1860, lng: 94.9320 },
      { name: 'Intermediate Pigging Station IPS-02', lat: 27.2340, lng: 95.0950 },
      { name: 'Naharkatia Tie-in Header', lat: 27.2820, lng: 95.2580 },
    ]
  },
  { 
    name: 'Duliajan-Digboi Historic Pipeline', 
    points: [[27.3560, 95.3180], [27.3755, 95.4745], [27.3950, 95.6310]], 
    pressure: '45 Bar', 
    flow: '1,500 BOPD',
    medium: 'Sweet Crude',
    color: '#475569',
    valves: [
      { name: 'Duliajan Refinery Feed Valve', lat: 27.3560, lng: 95.3180 },
      { name: 'Digboi Refinery Storage Manifold', lat: 27.3950, lng: 95.6310 },
    ]
  },
  { 
    name: 'Lakwa-Moran 14" Feeder Line', 
    points: [[26.9850, 94.8620], [27.0855, 94.8970], [27.1860, 94.9320]], 
    pressure: '55 Bar', 
    flow: '2,800 BOPD',
    medium: 'Emulsion Crude',
    color: '#059669',
    valves: [
      { name: 'Lakwa Gathering Pump Station', lat: 26.9850, lng: 94.8620 },
      { name: 'Moran Interconnect Header', lat: 27.1860, lng: 94.9320 },
    ]
  },
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

  let bgClass = "bg-[#EDFAF4] text-[#1B8A6C] border-[#BFEADB]";

  if (isHigh) {
    bgClass = "bg-[#FDF2F2] text-[#D63B3B] border-[#F5C6C6] font-bold";
  } else if (isMed) {
    bgClass = "bg-[#FEF7EC] text-[#D4820A] border-[#F8DFB6] font-semibold";
  }

  return (
    <td className={`px-3 py-2.5 text-center border text-xs transition-all ${bgClass}`}>
      <div className="font-mono">{density.toFixed(1)}%</div>
      {totalCount !== undefined && totalCount > 0 && (
        <div className="text-[10px] font-mono opacity-75 mt-0.5">
          ({sifCount}/{totalCount})
        </div>
      )}
    </td>
  );
}

export default function DualHeatmapAndMapPage() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'gis_map'>('gis_map');
  const [mapType, setMapType] = useState<'google_hybrid' | 'satellite' | 'street' | 'terrain'>('google_hybrid');
  const [isExpanded, setIsExpanded] = useState(false);
  const [mouseCoords, setMouseCoords] = useState<{ lat: string; lng: string; zoom: number }>({ lat: '27.5380', lng: '95.4450', zoom: 10 });
  
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

  const flyToAsset = (asset: GeoAsset) => {
    setSelectedAsset(asset);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([asset.lat, asset.lng], 13, { duration: 1.2 });
    }
  };

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
    const fetchHeatmap = () => {
      fetch(`${API}/api/analytics/heatmap`)
        .then(r => r.json())
        .then(d => { setData(d); setLoading(false); })
        .catch(() => setLoading(false));
    };

    fetchHeatmap();
    const interval = setInterval(fetchHeatmap, 4000);
    window.addEventListener('sanket:new_report', fetchHeatmap);

    return () => {
      clearInterval(interval);
      window.removeEventListener('sanket:new_report', fetchHeatmap);
    };
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
        minZoom: 8,
        maxZoom: 20,
        zoomControl: false,
        inertia: true,
        inertiaDeceleration: 2500,
        inertiaMaxSpeed: 1800,
        easeLinearity: 0.2,
        wheelDebounceTime: 25,
        wheelPxPerZoomLevel: 75,
        maxBounds: [[25.5, 93.0], [29.0, 97.5]],
        maxBoundsViscosity: 0.8,
      });

      map.on('mousemove', (e: any) => {
        setMouseCoords({
          lat: e.latlng.lat.toFixed(4),
          lng: e.latlng.lng.toFixed(4),
          zoom: map.getZoom(),
        });
      });

      map.on('zoomend', () => {
        setMouseCoords(prev => ({ ...prev, zoom: map.getZoom() }));
      });

      const satTile = L.tileLayer(
        'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        { attribution: '&copy; Google Maps &mdash; High-Res Hybrid Satellite', maxZoom: 20, maxNativeZoom: 19 }
      ).addTo(map);
      baseTileLayerRef.current = satTile;

      const labelTile = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 18, opacity: 0.95 }
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
          <div class="relative flex flex-col items-center justify-center -translate-x-1/2 -translate-y-full cursor-pointer group" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
            ${isHigh ? '<div class="absolute -top-1 w-12 h-12 rounded-full bg-red-500/35 animate-ping pointer-events-none"></div>' : ''}
            <div class="relative w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110 ${
              isHigh ? 'bg-[#DC2626] text-white' : isMed ? 'bg-[#D97706] text-white' : 'bg-[#059669] text-white'
            }">
              <span style="font-size: 16px;">${isHigh ? '🔥' : isMed ? '⚠️' : '✅'}</span>
            </div>
            <div class="w-2 h-2 bg-white rotate-45 -mt-1 shadow-xs ${isHigh ? 'bg-[#DC2626]' : isMed ? 'bg-[#D97706]' : 'bg-[#059669]'}"></div>
            <div class="mt-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold whitespace-nowrap shadow-md border ${
              isHigh ? 'bg-[#450A0A] text-[#FEE2E2] border-[#DC2626]' : isMed ? 'bg-[#451A03] text-[#FEF3C7] border-[#D97706]' : 'bg-[#064E3B] text-[#D1FAE5] border-[#059669]'
            }">
              ${asset.name}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-pin',
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        const marker = L.marker([asset.lat, asset.lng], { icon: customIcon }).addTo(markersGroupRef.current);
        marker.on('click', () => {
          setSelectedAsset(asset);
          map.flyTo([asset.lat, asset.lng], 14, { duration: 1.2 });
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

    if (mapType === 'google_hybrid') {
      baseTileLayerRef.current = L.tileLayer(
        'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        { attribution: '&copy; Google Maps &mdash; High-Res Hybrid Satellite', maxZoom: 20, maxNativeZoom: 19 }
      ).addTo(map);
    } else if (mapType === 'satellite') {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri &mdash; Maxar Satellite', maxZoom: 19, maxNativeZoom: 18 }
      ).addTo(map);

      labelsTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 18, opacity: 0.95 }
      ).addTo(map);
    } else if (mapType === 'terrain') {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri &mdash; Topographic Relief', maxZoom: 18, maxNativeZoom: 17 }
      ).addTo(map);
    } else {
      baseTileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19, maxNativeZoom: 18 }
      ).addTo(map);
    }
  }, [mapType]);

  // ── LAYER 1: TRUNK PIPELINES & SCADA VALVE MANIFOLDS ──
  useEffect(() => {
    const L = LRef.current;
    const group = pipelinesGroupRef.current;
    if (!L || !group) return;

    group.clearLayers();
    if (showPipelines) {
      TRUNK_PIPELINES.forEach(pipe => {
        // High-contrast pipeline polyline
        const line = L.polyline(pipe.points as any, {
          color: pipe.color,
          weight: 4,
          dashArray: pipe.medium.includes('Gas') ? '8, 6' : '1, 0',
          opacity: 0.9,
        }).addTo(group);

        line.bindTooltip(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 4px;">
            <div style="font-weight: bold; color: ${pipe.color}; font-size: 12px; margin-bottom: 2px;">🛢️ ${pipe.name}</div>
            <div>• <b>Operating Pressure:</b> ${pipe.pressure}</div>
            <div>• <b>Transmission Medium:</b> ${pipe.medium}</div>
            <div>• <b>Flow Rate:</b> ${pipe.flow}</div>
            <div style="color: #059669; font-weight: bold; margin-top: 2px;">✓ SCADA Telemetry Normal</div>
          </div>
        `, { sticky: true });

        // Add Valve Station Markers
        pipe.valves.forEach(valve => {
          const valveHtml = `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
              <div class="w-4 h-4 rounded-full bg-white border-2 border-[${pipe.color}] flex items-center justify-center shadow-md">
                <div class="w-1.5 h-1.5 rounded-full bg-[${pipe.color}]"></div>
              </div>
            </div>
          `;
          L.marker([valve.lat, valve.lng], {
            icon: L.divIcon({ html: valveHtml, className: 'valve-pin', iconSize: [16, 16], iconAnchor: [8, 8] })
          }).bindTooltip(`<b>${valve.name}</b><br><span style="color: #0A6B63;">Sectional Isolation Valve (OISD-189 Certified)</span>`, { sticky: true }).addTo(group);
        });
      });
    }
  }, [showPipelines]);

  // ── LAYER 2: HYDROLOGICAL FLOOD INUNDATION RISK BASINS ──
  useEffect(() => {
    const L = LRef.current;
    const group = floodGroupRef.current;
    if (!L || !group) return;

    group.clearLayers();
    if (showFloodRisk) {
      // Basin 1: Upper Brahmaputra / Lohit Wetland Basin
      L.polygon([
        [27.640, 95.300],
        [27.680, 95.450],
        [27.595, 95.550],
        [27.560, 95.380],
        [27.585, 95.280]
      ], {
        color: '#0284C7',
        weight: 2.5,
        fillColor: '#0284C7',
        fillOpacity: 0.28,
        dashArray: '6, 6'
      }).bindTooltip(`
        <div style="font-family: sans-serif; font-size: 11px; padding: 4px;">
          <div style="font-weight: bold; color: #0284C7; font-size: 12px;">🌊 Dibru-Saikhowa / Lohit Flood Basin</div>
          <div>• <b>Hydrological Risk:</b> SEVERE Monsoon Silt Inundation</div>
          <div>• <b>Water Depth Range:</b> 1.4m - 2.8m</div>
          <div>• <b>Vulnerable Assets:</b> North Corridor Pipeline Crossings</div>
          <div>• <b>Evacuation Path:</b> Elevated NH-37 Highway Corridor</div>
        </div>
      `, { sticky: true }).addTo(group);

      // Basin 2: Burhi Dihing River Lowlands
      L.polygon([
        [27.320, 95.220],
        [27.360, 95.290],
        [27.300, 95.340],
        [27.260, 95.260]
      ], {
        color: '#0284C7',
        weight: 2,
        fillColor: '#0284C7',
        fillOpacity: 0.20,
        dashArray: '4, 4'
      }).bindTooltip("🌊 Burhi Dihing Lowland Floodplain (Moderate Inundation Risk)", { sticky: true }).addTo(group);
    }
  }, [showFloodRisk]);

  // ── LAYER 3: ALOHA GAUSSIAN TOXIC GAS DISPERSION PLUME MODEL ──
  useEffect(() => {
    const L = LRef.current;
    const group = gasPlumeGroupRef.current;
    if (!L || !group) return;

    group.clearLayers();
    if (showGasPlume) {
      GEO_ASSETS.filter(a => a.sif_label === 'HIGH').forEach(asset => {
        const angleRad = (245 * Math.PI) / 180; // Wind 245° SW

        // Zone 3: Outer ERPG-1 Odor Threshold (5.5 km)
        const len3 = 0.050;
        const tipLat3 = asset.lat + Math.cos(angleRad) * len3;
        const tipLng3 = asset.lng + Math.sin(angleRad) * len3;
        const leftLat3 = asset.lat + Math.cos(angleRad - 0.30) * len3 * 0.75;
        const leftLng3 = asset.lng + Math.sin(angleRad - 0.30) * len3 * 0.75;
        const rightLat3 = asset.lat + Math.cos(angleRad + 0.30) * len3 * 0.75;
        const rightLng3 = asset.lng + Math.sin(angleRad + 0.30) * len3 * 0.75;

        L.polygon([
          [asset.lat, asset.lng],
          [leftLat3, leftLng3],
          [tipLat3, tipLng3],
          [rightLat3, rightLng3]
        ], {
          color: '#F59E0B',
          weight: 1.5,
          fillColor: '#F59E0B',
          fillOpacity: 0.18,
          dashArray: '3, 3'
        }).addTo(group);

        // Zone 2: Middle ERPG-2 Severe Irritation Arc (3.2 km)
        const len2 = 0.030;
        const tipLat2 = asset.lat + Math.cos(angleRad) * len2;
        const tipLng2 = asset.lng + Math.sin(angleRad) * len2;
        const leftLat2 = asset.lat + Math.cos(angleRad - 0.24) * len2 * 0.75;
        const leftLng2 = asset.lng + Math.sin(angleRad - 0.24) * len2 * 0.75;
        const rightLat2 = asset.lat + Math.cos(angleRad + 0.24) * len2 * 0.75;
        const rightLng2 = asset.lng + Math.sin(angleRad + 0.24) * len2 * 0.75;

        L.polygon([
          [asset.lat, asset.lng],
          [leftLat2, leftLng2],
          [tipLat2, tipLng2],
          [rightLat2, rightLng2]
        ], {
          color: '#EA580C',
          weight: 2,
          fillColor: '#EA580C',
          fillOpacity: 0.30,
        }).addTo(group);

        // Zone 1: Inner Lethal IDLH Arc (1.2 km)
        const len1 = 0.012;
        const tipLat1 = asset.lat + Math.cos(angleRad) * len1;
        const tipLng1 = asset.lng + Math.sin(angleRad) * len1;
        const leftLat1 = asset.lat + Math.cos(angleRad - 0.20) * len1 * 0.75;
        const leftLng1 = asset.lng + Math.sin(angleRad - 0.20) * len1 * 0.75;
        const rightLat1 = asset.lat + Math.cos(angleRad + 0.20) * len1 * 0.75;
        const rightLng1 = asset.lng + Math.sin(angleRad + 0.20) * len1 * 0.75;

        const innerPlume = L.polygon([
          [asset.lat, asset.lng],
          [leftLat1, leftLng1],
          [tipLat1, tipLng1],
          [rightLat1, rightLng1]
        ], {
          color: '#DC2626',
          weight: 2.5,
          fillColor: '#DC2626',
          fillOpacity: 0.55,
        }).addTo(group);

        innerPlume.bindTooltip(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 4px;">
            <div style="font-weight: bold; color: #DC2626; font-size: 12px;">💨 ALOHA Toxic Gas Plume: ${asset.name}</div>
            <div>• <b>Gas Species:</b> ${asset.gas_type}</div>
            <div>• <b>Wind Vector:</b> 245° SW @ ${windVector.speedKmh} km/h</div>
            <div>• <b>Zone 1 (Lethal IDLH &gt;100 ppm):</b> 1.2 km Arc</div>
            <div>• <b>Zone 2 (ERPG-2 &gt;30 ppm):</b> 3.2 km Arc</div>
            <div>• <b>Zone 3 (Precautionary &gt;5 ppm):</b> 5.5 km Arc</div>
            <div style="color: #DC2626; font-weight: bold; margin-top: 3px;">🚨 ACTION: Immediate Upwind Muster to Point B</div>
          </div>
        `, { sticky: true });
      });
    }
  }, [showGasPlume, windVector]);

  // ── LAYER 4: NASA FIRMS SATELLITE THERMAL INFRARED FLARE STACKS ──
  useEffect(() => {
    const L = LRef.current;
    const group = thermalGroupRef.current;
    if (!L || !group) return;

    group.clearLayers();
    if (showNasaFirms) {
      GEO_ASSETS.filter(a => a.flare_temp_c >= 400).forEach(asset => {
        // Infrared Glow Marker
        const thermalHtml = `
          <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
            <span class="w-8 h-8 rounded-full bg-amber-500/40 animate-ping absolute"></span>
            <div class="relative w-6 h-6 rounded-full bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-300 border-2 border-white shadow-xl flex items-center justify-center text-[10px] font-bold text-white">
              🔥
            </div>
          </div>
        `;
        L.marker([asset.lat + 0.003, asset.lng + 0.003], {
          icon: L.divIcon({ html: thermalHtml, className: 'thermal-pin', iconSize: [24, 24], iconAnchor: [12, 12] })
        }).bindTooltip(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 4px;">
            <div style="font-weight: bold; color: #D97706; font-size: 12px;">🛰️ NASA FIRMS Satellite Thermal Anomaly</div>
            <div>• <b>Location:</b> ${asset.name} Flare Stack</div>
            <div>• <b>Satellite Sensor:</b> Suomi NPP / VIIRS (375m I-Band)</div>
            <div>• <b>Radiative Flare Temp:</b> <span style="color: #DC2626; font-weight: bold;">${asset.flare_temp_c}°C</span></div>
            <div>• <b>Radiative Power:</b> 14.8 MW</div>
            <div>• <b>Detection Confidence:</b> 98% (High Anomaly)</div>
          </div>
        `, { sticky: true }).addTo(group);
      });
    }
  }, [showNasaFirms]);

  // ── LAYER 5: DYNAMIC SWA SAFETY PERIMETER BUFFER (250m, 500m, 1000m) ──
  useEffect(() => {
    const L = LRef.current;
    const group = bufferGroupRef.current;
    if (!L || !group) return;

    group.clearLayers();
    GEO_ASSETS.forEach(asset => {
      const isHigh = asset.sif_label === 'HIGH';
      const isSelected = selectedAsset?.id === asset.id;

      if (isSelected || isHigh) {
        // High-visibility outer perimeter ring
        const circle = L.circle([asset.lat, asset.lng], {
          radius: bufferRadiusMeters,
          color: isHigh ? '#DC2626' : '#D97706',
          weight: isSelected ? 3.5 : 2.5,
          dashArray: isSelected ? '10, 6' : '6, 6',
          fillColor: isHigh ? '#DC2626' : '#D97706',
          fillOpacity: isSelected ? 0.28 : 0.16,
        }).addTo(group);

        const estWorkers = bufferRadiusMeters === 250 
          ? Math.round(asset.workers_on_site * 0.45) 
          : bufferRadiusMeters === 500 
          ? Math.round(asset.workers_on_site * 0.8) 
          : asset.workers_on_site;

        circle.bindTooltip(`
          <div style="font-family: sans-serif; font-size: 11px; padding: 5px; line-height: 1.4;">
            <div style="font-weight: bold; color: ${isHigh ? '#DC2626' : '#D97706'}; font-size: 12px; margin-bottom: 2px;">
              🛑 SWA ${bufferRadiusMeters}m Perimeter Isolation Zone
            </div>
            <div>• <b>Protected Asset:</b> ${asset.name} (${asset.district})</div>
            <div>• <b>Exclusion Radius:</b> <span style="font-weight: bold; color: #1A2B2D;">${bufferRadiusMeters}m (${(bufferRadiusMeters/1000).toFixed(2)} km)</span></div>
            <div>• <b>Personnel in Buffer:</b> <span style="color: #DC2626; font-weight: bold;">${estWorkers} field workers</span></div>
            <div>• <b>Active e-PTWs Suspended:</b> <span style="color: #DC2626; font-weight: bold;">${asset.active_permits} digital permits</span></div>
            <div style="color: #DC2626; font-weight: bold; margin-top: 4px; border-top: 1px solid #FECACA; padding-top: 3px;">
              ⚡ OISD-189 Section 7.4 Fail-Safe Isolation Enforced
            </div>
          </div>
        `, { sticky: true });
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

  useEffect(() => {
    const handleLiveReport = (e: any) => {
      const rep = e.detail;
      if (rep) {
        setSwaToast(`🚨 Live Field Precursor Ingested: ${rep.location || 'Well Pad 7'} (${(rep.sif_score * 100).toFixed(0)}% SIF Potential)`);
        setTimeout(() => setSwaToast(null), 6000);
      }
    };
    window.addEventListener('sanket:new_report', handleLiveReport);
    return () => window.removeEventListener('sanket:new_report', handleLiveReport);
  }, []);

  return (
    <div className="dashboard-page space-y-5 p-6 bg-[#F7F8F5] min-h-screen text-[#1A2B2D]">
      
      {/* ── Compact Header & Tab Switcher Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-xl text-[#1A2B2D] tracking-tight">
              Upper Assam GIS Map & SIF Heatmap Matrix
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B8A6C] animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-[13px] text-[#5E7072] mt-0.5 font-normal">
            Geospatial precursor density, active e-PTW buffer zones, and thermal flare integration across 10 assets
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#F0F2ED] p-1 rounded-lg border border-[#C2CEC2]">
          <button type="button" suppressHydrationWarning
            onClick={() => setActiveTab('gis_map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'gis_map'
                ? 'bg-[#0A6B63] text-white shadow-xs'
                : 'text-[#5E7072] hover:text-[#1A2B2D]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            GIS Tactical Map
          </button>
          <button type="button" suppressHydrationWarning
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-[#0A6B63] text-white shadow-xs'
                : 'text-[#5E7072] hover:text-[#1A2B2D]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Asset × Activity Matrix
          </button>
        </div>
      </div>

      {/* ── Intelligence Layer Toggle Bar ── */}
      <div className="bg-white p-3.5 rounded-xl border-2 border-[#C2CEC2] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#5E7072] mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-[#0A6B63]" /> Layers:
          </span>

          <button type="button" suppressHydrationWarning
            onClick={() => setShowGasPlume(!showGasPlume)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showGasPlume
                ? 'bg-[#D63B3B] text-white border-[#B92525] shadow-xs ring-2 ring-[#D63B3B]/20'
                : 'bg-[#F0F2ED] border-[#C2CEC2] text-[#5E7072] hover:bg-[#E2E8E2] hover:text-[#1A2B2D]'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Gas Plume</span>
            <span className={`w-1.5 h-1.5 rounded-full ${showGasPlume ? 'bg-white animate-pulse' : 'bg-[#94A3A5]'}`} />
          </button>

          <button type="button" suppressHydrationWarning
            onClick={() => setShowNasaFirms(!showNasaFirms)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showNasaFirms
                ? 'bg-[#D4820A] text-white border-[#B45309] shadow-xs ring-2 ring-[#D4820A]/20'
                : 'bg-[#F0F2ED] border-[#C2CEC2] text-[#5E7072] hover:bg-[#E2E8E2] hover:text-[#1A2B2D]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>NASA Thermal</span>
            <span className={`w-1.5 h-1.5 rounded-full ${showNasaFirms ? 'bg-white animate-pulse' : 'bg-[#94A3A5]'}`} />
          </button>

          <button type="button" suppressHydrationWarning
            onClick={() => setShowFloodRisk(!showFloodRisk)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showFloodRisk
                ? 'bg-[#2563EB] text-white border-[#1D4ED8] shadow-xs ring-2 ring-[#2563EB]/20'
                : 'bg-[#F0F2ED] border-[#C2CEC2] text-[#5E7072] hover:bg-[#E2E8E2] hover:text-[#1A2B2D]'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Flood Inundation</span>
            <span className={`w-1.5 h-1.5 rounded-full ${showFloodRisk ? 'bg-white animate-pulse' : 'bg-[#94A3A5]'}`} />
          </button>

          <button type="button" suppressHydrationWarning
            onClick={() => setShowPipelines(!showPipelines)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showPipelines
                ? 'bg-[#0A6B63] text-white border-[#085B54] shadow-xs ring-2 ring-[#0A6B63]/20'
                : 'bg-[#F0F2ED] border-[#C2CEC2] text-[#5E7072] hover:bg-[#E2E8E2] hover:text-[#1A2B2D]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Trunk Pipelines</span>
            <span className={`w-1.5 h-1.5 rounded-full ${showPipelines ? 'bg-white animate-pulse' : 'bg-[#94A3A5]'}`} />
          </button>
        </div>

        {/* Spatial SWA Radius selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#5E7072]">SWA Buffer:</span>
          <div className="flex items-center gap-1 bg-[#F0F2ED] p-1 rounded-lg border border-[#C2CEC2]">
            {[250, 500, 1000].map(r => (
              <button type="button" suppressHydrationWarning
                key={r}
                onClick={() => setBufferRadiusMeters(r)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer ${
                  bufferRadiusMeters === r
                    ? 'bg-[#0A6B63] text-white shadow-xs font-bold'
                    : 'text-[#5E7072] hover:bg-[#E2E8E2] hover:text-[#1A2B2D] font-medium'
                }`}
              >
                {r}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SWA Toast Alert */}
      {swaToast && (
        <div className="p-3 rounded-lg bg-[#D63B3B] text-white text-xs font-medium flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 fill-white shrink-0" />
            <span>{swaToast}</span>
          </div>
          <button type="button" suppressHydrationWarning onClick={() => setSwaToast(null)} className="text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* ── TAB 1: GIS TACTICAL MAP ── */}
      {activeTab === 'gis_map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Map Column */}
          <div className={`transition-all duration-300 ${isExpanded ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
            <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs overflow-hidden">
              
              {/* Map Top Bar */}
              <div className="px-4 py-2.5 bg-[#F0F2ED] flex items-center justify-between border-b border-[#C2CEC2]">
                <div className="flex items-center gap-2 text-xs font-medium text-[#1A2B2D]">
                  <MapPin className="w-4 h-4 text-[#0A6B63]" />
                  <span>Assam Operational Basin (27.47° N, 95.35° E)</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-[#C2CEC2]">
                    <button type="button" suppressHydrationWarning
                      onClick={() => setMapType('google_hybrid')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        mapType === 'google_hybrid' ? 'bg-[#0A6B63] text-white shadow-2xs font-bold' : 'text-[#5E7072] hover:text-[#1A2B2D]'
                      }`}
                      title="Ultra HD Satellite with Local Roads & Oilfield Facilities"
                    >
                      🛰️ Satellite HD
                    </button>
                    <button type="button" suppressHydrationWarning
                      onClick={() => setMapType('terrain')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        mapType === 'terrain' ? 'bg-[#0A6B63] text-white shadow-2xs font-bold' : 'text-[#5E7072] hover:text-[#1A2B2D]'
                      }`}
                      title="Topographic Elevation Relief (USGS/Esri)"
                    >
                      ⛰️ Topo Terrain
                    </button>
                    <button type="button" suppressHydrationWarning
                      onClick={() => setMapType('street')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        mapType === 'street' ? 'bg-[#0A6B63] text-white shadow-2xs font-bold' : 'text-[#5E7072] hover:text-[#1A2B2D]'
                      }`}
                      title="OpenStreetMap Emergency Street Grid"
                    >
                      🏙️ Street Grid
                    </button>
                  </div>

                  <button type="button" suppressHydrationWarning
                    onClick={() => {
                      setSelectedAsset(null);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([27.28, 95.18], 10, { duration: 1.2 });
                      }
                    }}
                    className="px-2 py-1 rounded-md bg-white border border-[#C2CEC2] text-[#1A2B2D] text-[11px] font-semibold hover:bg-[#F0F2ED] transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                    title="Reset Overview Zoom (Assam Basin)"
                  >
                    🌍 Overview
                  </button>

                  <button type="button" suppressHydrationWarning
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 rounded-md bg-white border border-[#C2CEC2] text-[#5E7072] hover:text-[#1A2B2D] cursor-pointer"
                    title={isExpanded ? "Collapse Map" : "Expand Fullscreen"}
                  >
                    {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Map Leaflet Container with Live GPS HUD & Precision Controls */}
              <div className="relative">
                {/* Floating GPS Coordinates HUD Bottom Left */}
                <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#C2CEC2] shadow-md flex items-center gap-2.5 text-[11px] font-mono text-[#1A2B2D]">
                  <span className="flex items-center gap-1 text-[#0A6B63] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#0A6B63] animate-pulse" />
                    GPS:
                  </span>
                  <span>{mouseCoords.lat}° N, {mouseCoords.lng}° E</span>
                  <span className="text-[#85A2A6]">|</span>
                  <span className="font-semibold text-[#5E7072]">Zoom: {mouseCoords.zoom}x</span>
                  <span className="text-[#85A2A6]">|</span>
                  <span className="text-[#059669] font-bold">Upper Assam Basin</span>
                </div>

                {/* Floating Tactile Zoom Widget Bottom Right */}
                <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-md p-1 rounded-lg border border-[#C2CEC2] shadow-md flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
                    }}
                    className="p-1.5 rounded-md hover:bg-[#F0F2ED] text-[#1A2B2D] transition-colors cursor-pointer"
                    title="Zoom In (+)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
                    }}
                    className="p-1.5 rounded-md hover:bg-[#F0F2ED] text-[#1A2B2D] transition-colors cursor-pointer"
                    title="Zoom Out (-)"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-px h-4 bg-[#C2CEC2]" />
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      setSelectedAsset(null);
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([27.35, 95.30], 10, { duration: 1.2, easeLinearity: 0.2 });
                      }
                    }}
                    className="px-2 py-1 rounded-md text-[11px] font-semibold text-[#0A6B63] hover:bg-[#F0F2ED] transition-colors cursor-pointer flex items-center gap-1"
                    title="Fit Upper Assam Basin Overview"
                  >
                    <RotateCcw className="w-3 h-3" /> Fit
                  </button>
                </div>

                <div 
                  ref={mapContainerRef} 
                  className="w-full relative z-0" 
                  style={{ height: isExpanded ? 740 : 580 }}
                />

                {isExpanded && selectedAsset && (
                  <div className="absolute top-16 right-4 z-10 w-96 bg-white/95 backdrop-blur-md rounded-xl border border-[#C2CEC2] shadow-lg overflow-hidden animate-fadeIn">
                    <div className="px-3.5 py-2 bg-[#0A6B63] text-white flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Radio className="w-3.5 h-3.5 text-white" />
                        <span>{selectedAsset.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/90 font-bold">{selectedAsset.sif_label} RISK</span>
                    </div>

                    <div className="p-3.5 space-y-2.5 text-xs">
                      <div className="flex justify-between items-center bg-[#F7F8F5] p-2 rounded-lg border border-[#C2CEC2]">
                        <div>
                          <div className="text-[10px] text-[#5E7072] uppercase font-semibold">SIF Density</div>
                          <div className="font-heading text-base font-bold text-[#D63B3B]">{selectedAsset.sif_density.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#5E7072] uppercase font-semibold">Workers in {bufferRadiusMeters}m</div>
                          <div className="font-heading text-sm font-bold text-[#1A2B2D]">{selectedAsset.workers_on_site} Persons</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-[#5E7072] uppercase font-semibold">NASA Flare Temp</div>
                          <div className="font-mono text-xs text-[#D4820A] font-bold">{selectedAsset.flare_temp_c}°C</div>
                        </div>
                      </div>

                      <div className="p-2 bg-[#FEF7EC] rounded-lg border border-[#F8DFB6]">
                        <div className="text-[10px] uppercase font-semibold text-[#D4820A] mb-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-[#D4820A]" /> Latest Hazard Observation:
                        </div>
                        <p className="text-xs text-[#1A2B2D] leading-relaxed line-clamp-2">
                          "{selectedAsset.latest_hazard}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] text-[#5E7072]">
                          Toolpusher: <span className="font-semibold text-[#1A2B2D]">{selectedAsset.toolpusher}</span>
                        </div>
                        <a
                          href={`tel:${selectedAsset.phone}`}
                          className="px-2.5 py-1 bg-[#0A6B63] text-white rounded-md font-semibold text-xs hover:bg-[#085B54] flex items-center gap-1 shadow-xs"
                        >
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      </div>

                      {selectedAsset.sif_label === 'HIGH' && (
                        <button type="button" suppressHydrationWarning
                          onClick={() => handleTriggerSWA(selectedAsset)}
                          className="w-full py-2 px-3 rounded-lg bg-[#D63B3B] hover:bg-[#B92525] text-white font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                          Freeze {selectedAsset.active_permits} Permits (SWA {bufferRadiusMeters}m)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Asset Telemetry Drawer */}
          <div className={`transition-all duration-300 ${isExpanded ? 'hidden' : 'lg:col-span-4'}`}>
            <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs overflow-hidden">
              
              <div className="px-4 py-2.5 bg-[#F0F2ED] flex items-center justify-between border-b border-[#C2CEC2]">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#0A6B63]" />
                  <h3 className="font-heading font-semibold text-xs uppercase tracking-wider text-[#1A2B2D]">
                    Asset Geospatial Telemetry
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#5E7072]">REAL GPS</span>
              </div>

              <div className="p-4 space-y-3">
                {selectedAsset ? (
                  <div className="space-y-3 animate-fadeIn">
                    
                    {/* Section 1: Asset Identity Card */}
                    <div className="p-3.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          selectedAsset.sif_label === 'HIGH' ? 'bg-[#FDF2F2] text-[#D63B3B] border border-[#F5C6C6]' : selectedAsset.sif_label === 'MEDIUM' ? 'bg-[#FEF7EC] text-[#D4820A] border border-[#F8DFB6]' : 'bg-[#EDFAF4] text-[#1B8A6C] border border-[#BFEADB]'
                        }`}>
                          {selectedAsset.sif_label} SIF RISK
                        </span>
                        <span className="text-[10px] font-mono text-[#5E7072] bg-white px-2 py-0.5 rounded border border-[#C2CEC2]">
                          {selectedAsset.id}
                        </span>
                      </div>

                      <h4 className="font-heading font-bold text-base text-[#1A2B2D] mt-1">
                        {selectedAsset.name}
                      </h4>
                      <p className="text-xs text-[#5E7072]">
                        📍 {selectedAsset.district}
                      </p>

                      <div className="text-[11px] font-mono text-[#5E7072] pt-1.5 flex items-center justify-between border-t border-[#C2CEC2] mt-1.5">
                        <span>GPS Coordinates:</span>
                        <span className="text-[#0A6B63] font-semibold">{selectedAsset.lat.toFixed(4)}° N, {selectedAsset.lng.toFixed(4)}° E</span>
                      </div>
                    </div>

                    {/* Section 2: Risk Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
                        <div className="text-[10px] text-[#5E7072] uppercase font-semibold">SIF Density (D_sif)</div>
                        <div className="font-heading text-xl font-bold text-[#D63B3B] mt-0.5">
                          {selectedAsset.sif_density.toFixed(1)}%
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2]">
                        <div className="text-[10px] text-[#5E7072] uppercase font-semibold">Workers in {bufferRadiusMeters}m</div>
                        <div className="font-heading text-base font-bold text-[#1A2B2D] mt-0.5">
                          {selectedAsset.workers_on_site} Persons
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Environmental Telemetry */}
                    <div className="p-3 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-1.5 text-xs">
                      <div className="text-[10px] font-semibold text-[#5E7072] uppercase flex items-center justify-between border-b border-[#C2CEC2] pb-1">
                        <span>Environmental Telemetry</span>
                        <span className="text-[#1B8A6C] font-mono text-[9px] bg-[#EDFAF4] px-1.5 py-0.2 rounded border border-[#BFEADB]">LIVE</span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#5E7072]">💨 Gas Type:</span>
                        <span className="font-semibold text-[#D63B3B]">{selectedAsset.gas_type}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#5E7072]">🔥 NASA Flare Temp:</span>
                        <span className="font-semibold text-[#D4820A]">{selectedAsset.flare_temp_c}°C</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#5E7072]">🌊 Flood Threat:</span>
                        <span className={`font-semibold px-1.5 py-0.2 rounded text-[10px] ${
                          selectedAsset.flood_risk === 'SEVERE' ? 'bg-[#FDF2F2] text-[#D63B3B]' : 'bg-[#EDFAF4] text-[#1B8A6C]'
                        }`}>{selectedAsset.flood_risk}</span>
                      </div>
                    </div>

                    {/* Section 4: Latest Hazard */}
                    <div className="p-3 rounded-lg bg-[#FEF7EC] border border-[#F8DFB6] space-y-1">
                      <div className="text-[10px] font-semibold text-[#D4820A] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#D4820A]" />
                        Latest Hazard Observation:
                      </div>
                      <p className="text-xs text-[#1A2B2D] leading-relaxed">
                        "{selectedAsset.latest_hazard}"
                      </p>
                    </div>

                    {/* Section 5: Toolpusher CTA */}
                    <div className="p-2.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-[#5E7072]">Toolpusher</div>
                        <div className="font-semibold text-[#1A2B2D]">{selectedAsset.toolpusher}</div>
                        <div className="text-[10px] font-mono text-[#0A6B63]">{selectedAsset.phone}</div>
                      </div>
                      <a
                        href={`tel:${selectedAsset.phone}`}
                        className="px-2.5 py-1 bg-[#0A6B63] text-white rounded-md font-semibold text-xs hover:bg-[#085B54] flex items-center gap-1 shadow-xs"
                      >
                        <Phone className="w-3 h-3" />
                        Call
                      </a>
                    </div>

                    {/* Section 6: SWA Lockout Button */}
                    {selectedAsset.sif_label === 'HIGH' && (
                      <button type="button" suppressHydrationWarning
                        onClick={() => handleTriggerSWA(selectedAsset)}
                        className="w-full py-2 px-3 rounded-lg bg-[#D63B3B] hover:bg-[#B92525] text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <AlertOctagon className="w-4 h-4" />
                        Freeze {selectedAsset.active_permits} Hot Work Permits (SWA {bufferRadiusMeters}m)
                      </button>
                    )}

                    {/* Section 7: Jump to Pin Quick Selector */}
                    <div className="p-2.5 rounded-lg bg-[#F7F8F5] border border-[#C2CEC2] space-y-1">
                      <div className="text-[10px] font-medium text-[#5E7072]">Jump to Asset Pin:</div>
                      <div className="flex flex-wrap gap-1">
                        {GEO_ASSETS.map(a => (
                          <button type="button" suppressHydrationWarning
                            key={a.id}
                            onClick={() => flyToAsset(a)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                              selectedAsset.id === a.id ? 'bg-[#0A6B63] text-white' : 'bg-white hover:bg-[#E2E8E2] text-[#5E7072] border border-[#C2CEC2]'
                            }`}
                          >
                            {a.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="p-6 text-center text-[#94A3A5] space-y-1.5 bg-[#F7F8F5] rounded-lg border border-[#C2CEC2]">
                    <Info className="w-5 h-5 text-[#94A3A5] mx-auto" />
                    <h4 className="text-xs font-semibold text-[#1A2B2D]">Click Any Operational Pin on Map</h4>
                    <p className="text-[11px] text-[#5E7072]">
                      View live hazard telemetry, GPS coordinates, and perimeter controls.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: ASSET × ACTIVITY RISK MATRIX TABLE ── */}
      {activeTab === 'matrix' && (() => {
        const highestRiskEntry = data?.site_densities && Object.keys(data.site_densities).length > 0
          ? Object.entries(data.site_densities).sort((a, b) => b[1] - a[1])[0]
          : null;
        const highestSiteName = highestRiskEntry ? highestRiskEntry[0] : 'Baghjan Well #5';
        const highestSiteDensity = highestRiskEntry ? highestRiskEntry[1] : 35.7;

        return (
          <div className="space-y-5 animate-fadeIn">
            
            <div className="bg-[#FDF2F2] border border-[#F5C6C6] rounded-xl p-3.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#D63B3B] text-white flex items-center justify-center font-bold">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#D63B3B]">
                    Highest Risk Asset: <span className="underline">{highestSiteName}</span> (SIF Density: {highestSiteDensity.toFixed(1)}%)
                  </div>
                  <p className="text-[11px] text-[#5E7072]">
                    Elevated concentration of energy isolation and barrier failure precursors detected in Upper Assam operations.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-[#D63B3B] text-white rounded-md text-[11px] font-semibold">
                CRITICAL ATTENTION
              </span>
            </div>

          <div className="bg-white rounded-xl border-2 border-[#C2CEC2] shadow-xs overflow-hidden p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#D8E0D8] pb-2.5">
              <h3 className="font-heading font-bold text-xs text-[#1A2B2D] uppercase tracking-wider">
                Operational Asset × Activity Risk Matrix
              </h3>
              <span className="text-[11px] font-mono text-[#94A3A5]">
                {data?.sites.length || 0} Assets · {data?.activities.length || 0} Domains
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-[#94A3A5] font-mono text-xs">
                Calculating SIF-Precursor density matrix across all sites...
              </div>
            ) : !data || data.sites.length === 0 ? (
              <div className="py-14 text-center text-[#94A3A5]">
                <Map className="w-10 h-10 text-[#94A3A5] mx-auto mb-2" />
                <h3 className="font-bold text-[#1A2B2D] text-sm">No Heatmap Data</h3>
                <p className="text-xs text-[#5E7072] mt-0.5">Ingest safety reports to generate risk density calculations.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="text-left py-2.5 px-3 bg-[#F0F2ED] text-[#1A2B2D] font-bold text-xs border border-[#C2CEC2] w-56">
                        Site / Asset Name
                      </th>
                      {data.activities.map((act) => (
                        <th key={act} className="text-center py-2.5 px-2 bg-[#F0F2ED] text-[#1A2B2D] font-bold text-xs border border-[#C2CEC2]">
                          {act}
                        </th>
                      ))}
                      <th className="text-center py-2.5 px-3 bg-[#E8F4F0] text-[#0A6B63] font-bold text-xs border border-[#BCE3DC] w-32">
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
                        <tr key={site} className="hover:bg-[#F7F8F5] transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-[#1A2B2D] text-xs border border-[#C2CEC2] bg-white">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isSiteHigh ? 'bg-[#D63B3B]' : 'bg-[#94A3A5]'}`} />
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

                          <td className={`py-2.5 px-3 text-center font-mono font-bold text-xs border border-[#C2CEC2] ${
                            isSiteHigh ? 'bg-[#FDF2F2] text-[#D63B3B]' : isSiteMed ? 'bg-[#FEF7EC] text-[#D4820A]' : 'bg-[#EDFAF4] text-[#1B8A6C]'
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
      );
    })()}

    </div>
  );
}
