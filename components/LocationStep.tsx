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
  const inputRef    = useRef<HTMLInputElement>(null);
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || document.getElementById('google-maps-script')) {
      setMapsReady(true);
      return;
    }
    window.initGoogleMaps = () => setMapsReady(true);
    const script = document.createElement('script');
    script.id  = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Init autocomplete once maps are ready
  useEffect(() => {
    if (!mapsReady || !inputRef.current || !window.google) return;
    autocomplete.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'us' },
      fields: ['formatted_address', 'geometry'],
    });
    autocomplete.current.addListener('place_changed', () => {
      const place = autocomplete.current?.getPlace();
      if (place?.formatted_address) {
        setAddress(place.formatted_address);
      }
    });
  }, [mapsReady]);

  const handleGeolocate = useCallback(() => {
    setGeoError('');
    setLoading(true);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );
          const data = await res.json();
          const addr = data.results?.[0]?.formatted_address ?? `${latitude}, ${longitude}`;
          setAddress(addr);
        } catch {
          setGeoError('Could not reverse geocode your location.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setGeoError('Location access denied. Please enter your address manually.');
        setLoading(false);
      }
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    if (isHighway) return;

    // Get lat/lng from autocomplete or default to 0,0 (will be resolved server-side)
    const place = autocomplete.current?.getPlace();
    const lat   = place?.geometry?.location?.lat() ?? 0;
    const lng   = place?.geometry?.location?.lng() ?? 0;

    onNext({ address: address.trim(), lat, lng, isHighway });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Your current location
        </label>
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

      {/* Use My Location */}
      <button
        type="button"
        onClick={handleGeolocate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 border border-gray-700
                   text-gray-300 hover:border-brand-cyan hover:text-brand-cyan
                   py-3 rounded-xl transition-all duration-200 text-sm font-medium"
      >
        {loading ? <span className="spinner" /> : <span>📍</span>}
        {loading ? 'Getting your location…' : 'Use My Current Location'}
      </button>

      {geoError && (
        <p className="text-red-400 text-sm">{geoError}</p>
      )}

      {/* Highway check */}
      <div
        className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer
          ${isHighway ? 'border-red-500/60 bg-red-900/20' : 'border-gray-700 hover:border-gray-600'}`}
        onClick={() => setIsHighway(!isHighway)}
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
          <p>For your safety, we can only service local roads. Please exit the highway and call us when you're safely pulled over.</p>
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
