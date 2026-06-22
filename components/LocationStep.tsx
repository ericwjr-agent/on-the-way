'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { LocationData } from '@/lib/types';

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

interface Props {
  onNext: (location: LocationData) => void;
}

export default function LocationStep({ onNext }: Props) {
  const [address,   setAddress]   = useState('');
  const [isHighway, setIsHighway] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [geoError,  setGeoError]  = useState('');
  const [mapsReady, setMapsReady] = useState(false);
  const inputRef     = useRef<HTMLInputElement>(null);
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const latRef       = useRef<number>(0);
  const lngRef       = useRef<number>(0);

  // Load Google Maps JS API once
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (typeof window === 'undefined') return;
    if (window.google?.maps) { setMapsReady(true); return; }
    if (document.getElementById('google-maps-script')) return;

    window.initGoogleMaps = () => setMapsReady(true);
    const script = document.createElement('script');
    script.id    = 'google-maps-script';
    script.src   = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=initGoogleMaps`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Attach Places Autocomplete
  useEffect(() => {
    if (!mapsReady || !inputRef.current || !window.google) return;
    autocomplete.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'us' },
      fields: ['formatted_address', 'geometry'],
    });
    autocomplete.current.addListener('place_changed', () => {
      const place = autocomplete.current?.getPlace();
      if (place?.formatted_address) setAddress(place.formatted_address);
      if (place?.geometry?.location) {
        latRef.current = place.geometry.location.lat();
        lngRef.current = place.geometry.location.lng();
      }
    });
  }, [mapsReady]);

  // Use device location → reverse geocode via Maps JS Geocoder
  const handleGeolocate = useCallback(() => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        latRef.current = latitude;
        lngRef.current = longitude;

        if (!window.google) {
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          setLoading(false);
          return;
        }
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
          setLoading(false);
          if (status === 'OK' && results?.[0]) {
            setAddress(results[0].formatted_address);
          } else {
            setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          }
        });
      },
      () => {
        setGeoError('Location access denied. Please enter your address manually.');
        setLoading(false);
      }
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || isHighway) return;
    onNext({ address: address.trim(), lat: latRef.current, lng: lngRef.current, isHighway });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Your current location</label>
        <input
          ref={inputRef}
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your address…"
          className="input-brand"
          required
        />
      </div>

      <button
        type="button"
        onClick={handleGeolocate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 border border-gray-700 text-gray-300
                   hover:border-brand-cyan hover:text-brand-cyan py-3 rounded-xl transition-all text-sm font-medium"
      >
        {loading ? <span className="spinner" /> : <span>📍</span>}
        {loading ? 'Getting your location…' : 'Use My Current Location'}
      </button>

      {geoError && <p className="text-red-400 text-sm">{geoError}</p>}

      {/* Highway checkbox */}
      <div
        onClick={() => setIsHighway(!isHighway)}
        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors
          ${isHighway ? 'border-red-500/60 bg-red-900/20' : 'border-gray-700 hover:border-gray-600'}`}
      >
        <div className={`w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
          ${isHighway ? 'bg-red-500 border-red-500' : 'border-gray-600'}`}>
          {isHighway && <span className="text-white text-xs">✓</span>}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-200">I am currently on a highway</p>
          <p className="text-xs text-gray-500 mt-0.5">We only service local roads for safety</p>
        </div>
      </div>

      {isHighway && (
        <div className="p-4 bg-red-900/20 border border-red-800/40 rounded-xl text-red-400 text-sm">
          <p className="font-semibold mb-1">⚠️ Highway locations not supported</p>
          <p>For your safety, please exit the highway and call us once safely pulled over on a local road.</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!address.trim() || isHighway || loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        Get My Quote
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  );
}
