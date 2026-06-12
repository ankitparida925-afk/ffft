import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [locationStatus, setLocationStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);

  // Automatically ask for location and poll every 30s
  useEffect(() => {
    captureLocation();
    
    const intervalId = setInterval(() => {
      captureLocation(true); // true indicates it's a background update
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  const captureLocation = (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
      setLocationStatus('Requesting GPS location...');
    }
    
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const token = localStorage.getItem('token');
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
          const response = await fetch(`${API_URL}/api/location`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save location to server');
          }

          setLocationStatus('Location successfully saved! Check-in complete. ✅');
          setLocationSaved(true);
        } catch (error) {
          setLocationStatus(error.message);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLocationStatus('Permission denied or unable to fetch location. ❌');
        setLoading(false);
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Employee Dashboard</h2>
        <p className="text-gray-600 mb-6">Welcome back, {user?.name}</p>
        
        <div className={`p-4 rounded-md mb-6 ${locationSaved ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
          <p className="font-semibold">{locationStatus || 'Waiting for location...'}</p>
        </div>

        {!locationSaved && (
          <button
            onClick={captureLocation}
            disabled={loading}
            className={`w-full font-bold py-3 px-4 rounded transition duration-200 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
            }`}
          >
            {loading ? 'Locating...' : 'Retry Check-in Location'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;