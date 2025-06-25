
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export function SellerHome() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    approvedProperties: 0,
    pendingProperties: 0,
    rejectedProperties: 0,
    totalAppointments: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullname, setFullname] = useState('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/seller/dashboard-stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch stats');
        }
        
        const data = await response.json();
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data received from server');
        }
        
        setStats(data);
        const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/seller/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const profileData = await profileResponse.json();
        setFullname(profileData.name || '');
        setError(null);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setError(error.message || 'Failed to load dashboard statistics');
        toast.error(error.message || 'Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 p-4 rounded-xl">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome, {fullname}!</h2>
      <p className="text-gray-600 mb-6">Manage your properties and track your sales from here.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Total Properties</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalProperties}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Approved Properties</h3>
          <p className="text-3xl font-bold text-green-600">{stats.approvedProperties}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-700">Total Appointments</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.totalAppointments}</p>
        </div>
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h3>
        {stats.recentActivity?.length > 0 ? (
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">{activity.title}</h4>
                  <p className="text-sm text-gray-500">
                    Status: <span className={`font-medium ${
                      activity.status === 'approved' ? 'text-green-600' :
                      activity.status === 'pending' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>{activity.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{new Date(activity.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No recent activity to display.</p>
        )}
      </div>
    </div>
  );
}