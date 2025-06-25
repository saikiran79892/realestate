import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { HomeIcon, UsersIcon } from '@heroicons/react/24/solid';

export function AdminHome() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUsers: 0,
    recentProperties: [],
    recentUsers: []
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/dashboard`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        toast.error('Error loading dashboard data');
        console.error(err);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-6">
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-full">
              <HomeIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Properties</h2>
          </div>
          <div className="p-6">
            {stats.recentProperties.length > 0 ? (
              <div className="space-y-4">
                {stats.recentProperties.map((property) => (
                  <div key={property._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{property.title}</p>
                      <p className="text-sm text-gray-500">{property.location}</p>
                    </div>
                    <p className="text-emerald-600 font-semibold">${property.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">No recent properties</p>
            )}
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
          </div>
          <div className="p-6">
            {stats.recentUsers.length > 0 ? (
              <div className="space-y-4">
                {stats.recentUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium capitalize rounded-full bg-gray-100 text-gray-800">
                      {user.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">No recent users</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
