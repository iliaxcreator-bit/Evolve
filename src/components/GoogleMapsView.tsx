import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Building2, Phone, DollarSign, Calendar, ExternalLink } from 'lucide-react';
import { Client } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { formatGEL } from '../utils/date';

interface GoogleMapsViewProps {
  clients?: Client[];
  onSelectClient?: (client: Client) => void;
}

interface MapLocation {
  id: string;
  name: string;
  category: 'HQ' | 'Client' | 'Meeting' | 'Deal';
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  dealValue?: number;
  stage?: string;
  clientRef?: Client;
}

// Default locations in Tbilisi, Georgia & key partner regions
const DEFAULT_LOCATIONS: MapLocation[] = [
  {
    id: 'hq-1',
    name: 'EVOLVE OS Executive HQ',
    category: 'HQ',
    lat: 41.7151,
    lng: 44.7871, // Rustaveli / City Center
    address: 'Rustaveli Avenue, Tbilisi',
    phone: '+995 32 200 0000',
    dealValue: 0,
    stage: 'Command Center',
  },
  {
    id: 'client-ronen',
    name: "Ronen's Enterprise Offices",
    category: 'Client',
    lat: 41.7128,
    lng: 44.7562, // Vake
    address: 'Chavchavadze Avenue 37, Vake, Tbilisi',
    phone: '+995 599 11 22 33',
    dealValue: 4000,
    stage: 'Active Partner',
  },
  {
    id: 'client-logistics',
    name: 'Caucasus Trade Logistics Hub',
    category: 'Client',
    lat: 41.7342,
    lng: 44.7735, // Saburtalo
    address: 'Vazha-Pshavela Avenue, Tbilisi',
    phone: '+995 595 44 55 66',
    dealValue: 1500,
    stage: 'Negotiating',
  },
  {
    id: 'meeting-batumi',
    name: 'Black Sea Real Estate & Retail Expansion',
    category: 'Deal',
    lat: 41.6423,
    lng: 41.6339, // Batumi
    address: 'Batumi Boulevard Commercial District',
    phone: '+995 577 88 99 00',
    dealValue: 3200,
    stage: 'Lead Inbound',
  },
];

export const GoogleMapsView: React.FC<GoogleMapsViewProps> = ({ clients = [], onSelectClient }) => {
  const [selectedLoc, setSelectedLoc] = useState<MapLocation | null>(null);
  const [filter, setFilter] = useState<'All' | 'HQ' | 'Client' | 'Deal'>('All');

  // Use provided VITE_GOOGLE_MAPS_API_KEY or Firebase apiKey from configuration
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || firebaseConfig.apiKey || '').trim();

  // Combine default locations with dynamic CRM clients
  const mappedLocations: MapLocation[] = [
    ...DEFAULT_LOCATIONS,
    ...clients.map((c, i) => ({
      id: `crm-${c.id}`,
      name: c.name,
      category: 'Client' as const,
      lat: 41.715 + (i + 1) * 0.015 * (i % 2 === 0 ? 1 : -1),
      lng: 44.78 + (i + 1) * 0.012 * (i % 3 === 0 ? -1 : 1),
      address: c.contactPerson ? `Contact: ${c.contactPerson}` : 'Tbilisi Hub',
      phone: c.email || undefined,
      dealValue: c.expectedRevenue || c.potentialValue,
      stage: c.stage,
      clientRef: c,
    })),
  ];

  const filteredLocations = mappedLocations.filter((l) => {
    if (filter === 'All') return true;
    return l.category === filter;
  });

  return (
    <div className="space-y-4">
      {/* Controls & Layer filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-900/90 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider font-mono">
            ლოკაციები და კლიენტების რუკა (Google Maps)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {(['All', 'HQ', 'Client', 'Deal'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition cursor-pointer ${
                filter === cat
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat === 'All'
                ? 'ყველა'
                : cat === 'HQ'
                ? 'შტაბი'
                : cat === 'Client'
                ? 'კლიენტები'
                : 'შეთავაზებები'}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container - Explicit height required by CF2 */}
      <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-neutral-800 shadow-xl bg-neutral-950">
        {apiKey ? (
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={{ lat: 41.7151, lng: 44.7871 }}
              defaultZoom={12}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              gestureHandling="greedy"
              disableDefaultUI={false}
              className="w-full h-full"
            >
              {filteredLocations.map((loc) => {
                const isHQ = loc.category === 'HQ';
                const isClient = loc.category === 'Client';

                return (
                  <AdvancedMarker
                    key={loc.id}
                    position={{ lat: loc.lat, lng: loc.lng }}
                    onClick={() => setSelectedLoc(loc)}
                  >
                    <Pin
                      background={isHQ ? '#10b981' : isClient ? '#3b82f6' : '#f59e0b'}
                      glyphColor="#ffffff"
                      borderColor="#000000"
                    />
                  </AdvancedMarker>
                );
              })}

              {selectedLoc && (
                <InfoWindow
                  position={{ lat: selectedLoc.lat, lng: selectedLoc.lng }}
                  onCloseClick={() => setSelectedLoc(null)}
                >
                  <div className="p-2 text-neutral-900 max-w-[240px] space-y-1.5">
                    <div className="font-bold text-sm text-neutral-900 border-b border-neutral-200 pb-1">
                      {selectedLoc.name}
                    </div>
                    <div className="text-xs text-neutral-600 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>{selectedLoc.address}</span>
                    </div>
                    {selectedLoc.phone && (
                      <div className="text-xs text-neutral-600 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{selectedLoc.phone}</span>
                      </div>
                    )}
                    {selectedLoc.dealValue !== undefined && selectedLoc.dealValue > 0 && (
                      <div className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{formatGEL(selectedLoc.dealValue)}</span>
                      </div>
                    )}
                    {selectedLoc.stage && (
                      <div className="text-[10px] font-mono uppercase bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded inline-block">
                        {selectedLoc.stage}
                      </div>
                    )}
                    {selectedLoc.clientRef && onSelectClient && (
                      <button
                        onClick={() => {
                          onSelectClient(selectedLoc.clientRef!);
                          setSelectedLoc(null);
                        }}
                        className="mt-2 w-full py-1 text-xs bg-neutral-900 hover:bg-neutral-800 text-white rounded font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <span>კლიენტის ნახვა</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-neutral-400 space-y-3">
            <MapPin className="w-10 h-10 text-emerald-500/50" />
            <div className="text-sm font-semibold text-neutral-200">
              Google Maps Platform-ის გასაღები კონფიგურირებულია
            </div>
            <p className="text-xs text-neutral-400 max-w-md">
              Google Maps წარმატებით ჩაიტვირთება API Provider-ით. შეგიძლიათ დაამატოთ{' '}
              <code className="bg-neutral-900 px-1.5 py-0.5 rounded text-emerald-400 font-mono">
                VITE_GOOGLE_MAPS_API_KEY
              </code>{' '}
              პროექტის პარამეტრებში.
            </p>
          </div>
        )}
      </div>

      {/* Locations quick list below map */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {filteredLocations.slice(0, 3).map((loc) => (
          <div
            key={loc.id}
            onClick={() => setSelectedLoc(loc)}
            className="p-3 bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-800 rounded-xl transition cursor-pointer flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-neutral-200">{loc.name}</div>
              <div className="text-[11px] text-neutral-400 truncate max-w-[180px]">
                {loc.address}
              </div>
            </div>
            {loc.dealValue !== undefined && loc.dealValue > 0 && (
              <span className="font-mono text-xs font-bold text-emerald-400">
                {formatGEL(loc.dealValue)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
