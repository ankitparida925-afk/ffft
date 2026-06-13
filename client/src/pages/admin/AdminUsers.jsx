import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
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

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const AdminUsers = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryEmployeeId, setSelectedHistoryEmployeeId] = useState(null);
  const [historyDateFilter, setHistoryDateFilter] = useState('');

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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employee locations');
      }

      const data = await response.json();
      setLocations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const latestLocations = Object.values(
    locations.reduce((acc, loc) => {
      if (!loc.user || loc.user.role === 'admin') return acc;
      const userId = loc.user._id;
      if (!acc[userId] || new Date(loc.createdAt) > new Date(acc[userId].createdAt)) {
        acc[userId] = loc;
      }
      return acc;
    }, {})
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Employee Directory</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">All Employees</h3>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading employee data...</div>
        ) : latestLocations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No employees found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time (Local)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {latestLocations.map((loc) => (
                  <tr key={loc._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{loc.user?.name || 'Unknown User'}</div>
                      <div className="text-sm text-gray-500">{loc.user?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {loc.user?.isActive ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Lat: {loc.latitude.toFixed(4)}<br/>
                      Lng: {loc.longitude.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(loc.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedEmployeeId(loc.user._id);
                          setIsModalOpen(true);
                        }}
                        className="p-2 bg-pink-50 border border-pink-200 rounded-md shadow-sm hover:bg-pink-100 hover:shadow-md transition-all duration-200 group focus:outline-none"
                        title="View Live Map"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-pink-600 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </button>

                      <button 
                        onClick={() => {
                          setSelectedHistoryEmployeeId(loc.user._id);
                          setIsHistoryModalOpen(true);
                        }}
                        className="p-2 bg-blue-50 border border-blue-200 rounded-md shadow-sm hover:bg-blue-100 hover:shadow-md transition-all duration-200 group focus:outline-none"
                        title="View Location History"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Live Map Modal */}
      {isModalOpen && selectedEmployeeId && (() => {
        const liveLoc = latestLocations.find(l => l.user._id === selectedEmployeeId);
        if (!liveLoc) return null;

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                  Live Location: {liveLoc.user.name}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-red-500 text-3xl font-bold leading-none transition-colors"
                >
                  &times;
                </button>
              </div>
              <div className="h-[65vh] w-full bg-gray-100 relative z-0">
                <MapContainer 
                  center={[liveLoc.latitude, liveLoc.longitude]} 
                  zoom={16} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterMap lat={liveLoc.latitude} lng={liveLoc.longitude} />
                  <Marker 
                    position={[liveLoc.latitude, liveLoc.longitude]}
                    icon={createCustomIcon(getColorFromId(liveLoc.user?._id || liveLoc._id))}
                  >
                    <Popup>
                      <strong>{liveLoc.user.name}</strong><br/>
                      Last ping: {new Date(liveLoc.createdAt).toLocaleTimeString()}
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Location History Modal */}
      {isHistoryModalOpen && selectedHistoryEmployeeId && (() => {
        // Find all locations for this employee, optionally filtered by date, sorted by oldest to newest
        let employeeHistory = locations
          .filter(l => l.user && l.user._id === selectedHistoryEmployeeId);
          
        if (historyDateFilter) {
          employeeHistory = employeeHistory.filter(l => {
            const locDate = new Date(l.createdAt).toISOString().split('T')[0];
            return locDate === historyDateFilter;
          });
        }
          
        employeeHistory.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Spatial Filter & Stop Detection
        const filteredHistory = employeeHistory.reduce((acc, currentLoc) => {
          if (acc.length === 0) {
            acc.push({...currentLoc, _isStop: false, _duration: 0}); // Always keep the first point
          } else {
            const lastLoc = acc[acc.length - 1];
            const dist = calculateDistance(
              lastLoc.latitude, lastLoc.longitude,
              currentLoc.latitude, currentLoc.longitude
            );
            
            if (dist >= 50) {
              // Moved more than 50m, so it's a new significant point
              acc.push({...currentLoc, _isStop: false, _duration: 0});
            } else {
              // Stayed within 50m. Calculate time spent here.
              const timeSpentMs = new Date(currentLoc.createdAt) - new Date(lastLoc.createdAt);
              lastLoc._duration = timeSpentMs;
              
              // If time spent is >= 5 minutes (300,000 ms), mark it as a stop
              if (timeSpentMs >= 5 * 60 * 1000) {
                lastLoc._isStop = true;
              }
            }
          }
          return acc;
        }, []);
          
        // We still want to know who the user is even if there's no history for the selected date
        // So let's find the user info from the unfiltered history if necessary
        const unfilteredHistory = locations.filter(l => l.user && l.user._id === selectedHistoryEmployeeId);
        if (unfilteredHistory.length === 0) return null;
        
        const userInfo = unfilteredHistory[0].user;
        const userColor = getColorFromId(userInfo._id);

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 flex-wrap gap-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Location History: {userInfo.name} ({filteredHistory.length} significant points)
                </h3>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label htmlFor="historyDate" className="text-sm font-medium text-gray-600">Filter Date:</label>
                    <input 
                      type="date" 
                      id="historyDate"
                      value={historyDateFilter}
                      onChange={(e) => setHistoryDateFilter(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {historyDateFilter && (
                      <button 
                        onClick={() => setHistoryDateFilter('')}
                        className="text-xs text-gray-500 hover:text-red-500 underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      setIsHistoryModalOpen(false);
                      setHistoryDateFilter('');
                    }}
                    className="text-gray-400 hover:text-red-500 text-3xl font-bold leading-none transition-colors"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="h-[65vh] w-full bg-gray-100 relative z-0 flex items-center justify-center">
                {filteredHistory.length > 0 ? (
                  <MapContainer 
                    center={[filteredHistory[filteredHistory.length - 1].latitude, filteredHistory[filteredHistory.length - 1].longitude]} 
                    zoom={14} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RecenterMap 
                      lat={filteredHistory[filteredHistory.length - 1].latitude} 
                      lng={filteredHistory[filteredHistory.length - 1].longitude} 
                    />
                    
                    {/* Draw the continuous route line */}
                    <Polyline 
                      positions={filteredHistory.map(loc => [loc.latitude, loc.longitude])}
                      pathOptions={{ color: userColor, weight: 5, opacity: 0.8 }}
                    />

                    {/* Mark any Stops (>= 5 minutes) */}
                    {filteredHistory.map((loc, index) => {
                      if (loc._isStop && index !== 0 && index !== filteredHistory.length - 1) {
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
                    
                    {/* Mark the Start of the journey */}
                    <Marker 
                      position={[filteredHistory[0].latitude, filteredHistory[0].longitude]}
                      icon={createCustomIcon('#10B981')} // Green for start
                    >
                      <Popup>
                        <strong>Start Location</strong><br/>
                        {new Date(filteredHistory[0].createdAt).toLocaleString()}
                      </Popup>
                    </Marker>

                    {/* Mark the End of the journey (if they have moved) */}
                    {filteredHistory.length > 1 && (
                      <Marker 
                        position={[filteredHistory[filteredHistory.length - 1].latitude, filteredHistory[filteredHistory.length - 1].longitude]}
                        icon={createCustomIcon('#EF4444')} // Red for end
                      >
                        <Popup>
                          <strong>End Location</strong><br/>
                          {new Date(filteredHistory[filteredHistory.length - 1].createdAt).toLocaleString()}
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                ) : (
                  <div className="text-gray-500 text-lg flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No location data found for this date.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default AdminUsers;
