import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <div className="w-full md:w-64 bg-white md:h-screen text-gray-800 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 shadow-sm font-sans flex-shrink-0">
      <div className="p-4 md:p-5 text-xl md:text-2xl font-bold border-b border-gray-100 flex items-center text-gray-900 justify-between">
        <div><span className="text-pink-600 mr-2">✦</span> Admin Panel</div>
        {/* Mobile Logout Button */}
        <button onClick={logout} className="md:hidden text-sm text-pink-600 border border-pink-200 px-3 py-1 rounded hover:bg-pink-50">Logout</button>
      </div>
      <nav className="p-2 md:p-4 md:flex-1 md:space-y-2 overflow-x-auto overflow-y-hidden md:overflow-y-auto flex flex-row md:flex-col space-x-2 md:space-x-0 whitespace-nowrap">
        <Link to="/admin" className="inline-block md:block py-2 px-3 md:py-3 md:px-4 text-sm md:text-lg font-semibold hover:bg-pink-50 hover:text-pink-600 rounded-md transition-colors duration-200">Dashboard</Link>
        <Link to="/admin/users" className="inline-block md:block py-2 px-3 md:py-3 md:px-4 text-sm md:text-lg font-semibold hover:bg-pink-50 hover:text-pink-600 rounded-md transition-colors duration-200">Users</Link>
        <Link to="/admin/map" className="inline-block md:block py-2 px-3 md:py-3 md:px-4 text-sm md:text-lg font-semibold hover:bg-pink-50 hover:text-pink-600 rounded-md transition-colors duration-200">Live Map</Link>
      </nav>
      <div className="p-4 border-t border-gray-100 hidden md:block">
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