import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  // Filter out any Admin accounts (we only want to track Employees), then group by LATEST check-in
  const latestLocations = Object.values(
    locations.reduce((acc, loc) => {
      // Ignore if no user, or if the user is an admin
      if (!loc.user || loc.user.role === 'admin') return acc;
      
      const userId = loc.user._id;
      
      // If we haven't tracked this user yet, or if this check-in is newer than the saved one
      if (!acc[userId] || new Date(loc.createdAt) > new Date(acc[userId].createdAt)) {
        acc[userId] = loc;
      }
      return acc;
    }, {})
  );

  // Calculate "Active" users (Unique employees who checked in within the last 24 hours)
  const activeUsersCount = latestLocations.filter(
    (loc) => new Date() - new Date(loc.createdAt) < 24 * 60 * 60 * 1000
  ).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h2 className="text-gray-500 text-sm font-medium uppercase">Welcome back</h2>
          <p className="text-xl font-bold text-gray-800 mt-1">{user?.name}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h2 className="text-gray-500 text-sm font-medium uppercase">Active Employees (Last 24h)</h2>
          <p className="text-3xl font-bold text-gray-800 mt-1">{activeUsersCount}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden p-8 text-center border border-gray-200">
        <h3 className="text-xl font-medium text-gray-800 mb-2">Detailed Tracking</h3>
        <p className="text-gray-600 mb-6">The employee location table and history tracking have been moved to the dedicated Users Directory.</p>
        <Link 
          to="/admin/users" 
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 shadow-md transition-all duration-200"
        >
          Open Employee Directory
        </Link>
      </div>

    </div>
  );
};

export default AdminDashboard;