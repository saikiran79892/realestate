import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import {
  UserCircleIcon,
  EnvelopeIcon, 
  IdentificationIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  KeyIcon,
  XMarkIcon,
  BuildingStorefrontIcon,
  PhoneIcon
} from '@heroicons/react/24/solid';


const getInitialsColor = (name) => {
  const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : parts[0][0].toUpperCase();
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
  });
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleModalClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export function SellerProfile() {
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    username: '', 
    email: '',
    phoneNumber: '',
  });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        toast.error('Authentication required.');
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/api/seller/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch profile data.');
        
        const data = await response.json();
        setProfileData(data);
        setFormData({ 
          name: data.name, 
          username: data.username, 
          email: data.email,
          phoneNumber: data.phoneNumber || '',
        });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [API_URL, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/seller/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile.');
      }

      setProfileData(data);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success('Profile updated successfully!');
      setActiveModal(null);

    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/seller/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password.');
      }

      toast.success('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveModal(null);

    } catch (error) {
      toast.error(error.message);
    }
  };

  
  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-lg animate-pulse">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
          <div className="space-y-3">
            <div className="h-6 bg-gray-300 rounded w-48"></div>
            <div className="h-4 bg-gray-300 rounded w-64"></div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-12 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!profileData) {
    return <p className="text-center text-red-500">Could not load profile data.</p>;
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-gray-200">
            <div className={`w-24 h-24 text-4xl font-bold rounded-full flex items-center justify-center text-white ${getInitialsColor(profileData.name)}`}>
              {getInitials(profileData.name)}
            </div>
            <div className="flex-grow text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-800">{profileData.name}</h1>
              <p className="text-gray-500">{profileData.email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveModal('edit')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition"
              >
                <PencilSquareIcon className="w-5 h-5" />
                Edit Profile
              </button>
              <button
                onClick={() => setActiveModal('password')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
              >
                <KeyIcon className="w-5 h-5" />
                Change Password
              </button>
            </div>
          </div>

          {}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-gray-500 flex items-center">
                <UserCircleIcon className="w-5 h-5 mr-2 text-emerald-500" />
                Full Name
              </label>
              <p className="text-lg text-gray-800 p-3 bg-gray-50 rounded-lg">{profileData.name}</p>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-gray-500 flex items-center">
                <IdentificationIcon className="w-5 h-5 mr-2 text-emerald-500" />
                Username
              </label>
              <p className="text-lg text-gray-800 p-3 bg-gray-50 rounded-lg">{profileData.username}</p>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-gray-500 flex items-center">
                <EnvelopeIcon className="w-5 h-5 mr-2 text-emerald-500" />
                Email Address
              </label>
              <p className="text-lg text-gray-800 p-3 bg-gray-50 rounded-lg">{profileData.email}</p>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-gray-500 flex items-center">
                <PhoneIcon className="w-5 h-5 mr-2 text-emerald-500" />
                Phone Number
              </label>
              <p className="text-lg text-gray-800 p-3 bg-gray-50 rounded-lg">{profileData.phoneNumber}</p>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-gray-500 flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2 text-emerald-500" />
                Role
              </label>
              <p className="text-lg text-gray-800 p-3 bg-gray-50 rounded-lg capitalize">{profileData.role}</p>
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-semibold text-gray-500 flex items-center">
                <CalendarDaysIcon className="w-5 h-5 mr-2 text-emerald-500" />
                Member Since
              </label>
              <p className="text-lg text-gray-800 p-3 bg-gray-50 rounded-lg">{formatDate(profileData.createdAt)}</p>
            </div>
          </div>

          {}
          <Modal 
            isOpen={activeModal === 'edit'} 
            onClose={() => setActiveModal(null)}
            title="Edit Profile"
          >
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  minLength={2}
                  maxLength={50}
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_-]+"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  pattern="^\+?[\d\s()-]{10,}$"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </Modal>

          {}
          <Modal
            isOpen={activeModal === 'password'}
            onClose={() => setActiveModal(null)}
            title="Change Password"
          >
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-emerald-500 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </>
  );
}