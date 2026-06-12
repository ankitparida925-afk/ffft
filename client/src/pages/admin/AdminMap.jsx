import { useState, useEffect, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in me
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in meters
};

const getColorFromId = (id) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const createCustomIcon = (color) => {
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" style="filter: drop-shadow(1px 2px 3px rgba(0,0,0,0.4));"><path fill="${color}" stroke="white" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: svgIcon,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

const AdminMap = () => {
  const [locations, setLocations] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchLocations();
    const intervalId = setInterval(() => {
      fetchLocations();
    }, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/location`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (err) {
      console.error('Failed to fetch locations', err);
    }
  };

  // 1. Filter for today's locations and ignore admins
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLocations = locations.filter(loc => {
    if (!loc.user || loc.user.role === 'admin') return false;
    const locDate = new Date(loc.createdAt).toISOString().split('T')[0];
    return locDate === todayStr;
  });

  // 2. Group by employee
  const groupedLocations = todayLocations.reduce((acc, loc) => {
    const userId = loc.user._id;
    if (!acc[userId]) acc[userId] = [];
    acc[userId].push(loc);
    return acc;
  }, {});

  // 3. Process each employee's daily route
  const processedRoutes = Object.keys(groupedLocations).map(userId => {
    const history = groupedLocations[userId];
    history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    const filteredHistory = history.reduce((acc, currentLoc) => {
      if (acc.length === 0) {
        acc.push({...currentLoc, _isStop: false, _duration: 0});
      } else {
        const lastLoc = acc[acc.length - 1];
        const dist = calculateDistance(
          lastLoc.latitude, lastLoc.longitude,
          currentLoc.latitude, currentLoc.longitude
        );
        if (dist >= 50) {
          acc.push({...currentLoc, _isStop: false, _duration: 0});
        } else {
          const timeSpentMs = new Date(currentLoc.createdAt) - new Date(lastLoc.createdAt);
          lastLoc._duration = timeSpentMs;
          if (timeSpentMs >= 5 * 60 * 1000) {
            lastLoc._isStop = true;
          }
        }
      }
      return acc;
    }, []);
    
    return {
      userId,
      user: history[0].user,
      route: filteredHistory
    };
  });

  // For the dropdown
  const activeUsers = processedRoutes.map(pr => pr.user);
  
  // Filter visible routes based on selection
  const visibleRoutes = selectedEmployeeId === 'all' 
    ? processedRoutes 
    : processedRoutes.filter(pr => pr.userId === selectedEmployeeId);

  return (
    <div className="h-[75vh] w-full max-w-7xl mx-auto mt-6 relative rounded-2xl overflow-hidden shadow-xl border border-gray-200">
      
      {/* Dropdown UI */}
      <div className="absolute top-4 right-16 z-[1000] bg-white rounded-md shadow-md p-2 border border-gray-200">
        <label htmlFor="employeeFilter" className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Track Employee:</label>
        <select 
          id="employeeFilter"
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
          className="text-sm border-none focus:ring-0 bg-transparent cursor-pointer font-medium text-gray-800"
        >
          <option value="all">All Employees</option>
          {activeUsers.map(u => (
            <option key={u._id} value={u._id}>{u.name}</option>
          ))}
        </select>
      </div>

      <div className="absolute bottom-6 right-6 z-[1000]">
        <Link 
          to="/admin" 
          className="bg-white/90 backdrop-blur-sm hover:bg-pink-50 text-pink-600 font-bold py-2 px-4 rounded shadow-sm transition duration-200 border border-pink-100"
        >
          &larr; Back
        </Link>
      </div>
      <MapContainer 
        center={[20.5937, 78.9629]} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite Map">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {visibleRoutes.map((employeeData) => {
          const { route, user, userId } = employeeData;
          if (route.length === 0) return null;
          
          const userColor = getColorFromId(userId);
          const liveLoc = route[route.length - 1]; // The current live head
          
          return (
            <Fragment key={userId}>
              {/* Draw the continuous route line */}
              {route.length > 1 && (
                <Polyline 
                  positions={route.map(loc => [loc.latitude, loc.longitude])}
                  pathOptions={{ color: userColor, weight: 4, opacity: 0.6 }}
                />
              )}

              {/* Mark any Stops (>= 5 minutes) */}
              {route.map((loc, index) => {
                if (loc._isStop && index !== route.length - 1) { // Don't mark the live head as a stop
                  const minutes = Math.floor(loc._duration / 60000);
                  return (
                    <Marker 
                      key={`stop-${loc._id}`}
                      position={[loc.latitude, loc.longitude]}
                      icon={createCustomIcon('#F59E0B')} // Amber/Yellow for stops
                    >
                      <Popup>
                        <strong>Stop Detected</strong><br/>
                        Stayed for approx. {minutes} minutes<br/>
                        Arrived: {new Date(loc.createdAt).toLocaleTimeString()}
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}

              {/* Mark the Live Head (Current Location) */}
              <Circle 
                center={[liveLoc.latitude, liveLoc.longitude]}
                radius={50}
                pathOptions={{
                  color: userColor,
                  fillColor: userColor,
                  fillOpacity: 0.15,
                  weight: 2
                }}
              />
              <Marker 
                position={[liveLoc.latitude, liveLoc.longitude]}
                icon={createCustomIcon(userColor)}
              >
                <Popup>
                  <strong>{user.name}</strong><br />
                  Status: Live 🟢<br />
                  Last ping: {new Date(liveLoc.createdAt).toLocaleTimeString()}
                </Popup>
              </Marker>
            </Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default AdminMap;
