import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <div className="w-64 bg-white h-screen text-gray-800 flex flex-col border-r border-gray-200 shadow-sm font-sans">
      <div className="p-5 text-2xl font-bold border-b border-gray-100 flex items-center text-gray-900">
        <span className="text-pink-600 mr-2">✦</span> Admin Panel
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <Link to="/admin" className="block py-3 px-4 text-lg font-semibold hover:bg-pink-50 hover:text-pink-600 rounded-md transition-colors duration-200">Dashboard</Link>
        <Link to="/admin/users" className="block py-3 px-4 text-lg font-semibold hover:bg-pink-50 hover:text-pink-600 rounded-md transition-colors duration-200">Users</Link>
        <Link to="/admin/map" className="block py-3 px-4 text-lg font-semibold hover:bg-pink-50 hover:text-pink-600 rounded-md transition-colors duration-200">Live Map</Link>
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={logout} 
          className="w-full bg-white border border-pink-200 text-pink-600 py-2.5 text-sm font-semibold rounded-md hover:bg-pink-50 transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;