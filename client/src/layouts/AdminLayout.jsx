import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // Protect Admin Route
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 p-4 md:p-8 overflow-y-auto h-full md:h-screen">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;