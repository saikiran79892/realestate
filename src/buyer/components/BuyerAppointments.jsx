import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  CalendarIcon,
  MapPinIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  UserIcon,
} from '@heroicons/react/24/solid';

export function BuyerAppointments() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  
  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/buyer/appointments`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const data = await response.json();
        setAppointments(data || []);
      } catch (err) {
        toast.error(err.message || 'Error loading appointments');
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [API_URL]);

  
  const openDetailsModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  
  const getStatusIconAndColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'confirmed':
        return { icon: <CheckCircleIcon className="h-5 w-5 text-green-600" />, bgColor: 'bg-green-100', textColor: 'text-green-800' };
      case 'rejected':
        return { icon: <XCircleIcon className="h-5 w-5 text-red-600" />, bgColor: 'bg-red-100', textColor: 'text-red-800' };
      case 'completed':
        return { icon: <CheckCircleIcon className="h-5 w-5 text-blue-600" />, bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'pending':
      default:
        return { icon: <ExclamationCircleIcon className="h-5 w-5 text-yellow-600" />, bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
    }
  };

  
  const AppointmentModal = ({ appointment, onClose }) => {
    if (!appointment) return null;
    const { icon, bgColor, textColor } = getStatusIconAndColor(appointment.status);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-slate-800">Appointment Details</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Seller Information</h3>
                  <p className="text-slate-800">{appointment.seller?.name || 'Unknown Seller'}</p>
                  <p className="text-sm text-gray-500">{appointment.seller?.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Status</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${bgColor} ${textColor}`}>
                    {icon}
                    {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Pending'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Date</h3>
                  <p className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    {formatDate(appointment.date)}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Place to Visit</h3>
                  <p className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                    {appointment.placeToVisit || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Message to Seller</h3>
                <p className="text-gray-600 mt-1">{appointment.message || 'No message provided'}</p>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-100 text-gray-800 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Appointments</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">My Appointments</h1>

      {appointments.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl shadow-sm">
          <p className="text-lg text-gray-600">You have no scheduled appointments.</p>
          <Link
            to="/buyer"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Explore Properties
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {}
          <div className="hidden md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-4 text-left text-sm font-medium text-slate-700">Seller</th>
                  <th className="p-4 text-left text-sm font-medium text-slate-700">Date</th>
                  <th className="p-4 text-left text-sm font-medium text-slate-700">Place</th>
                  <th className="p-4 text-left text-sm font-medium text-slate-700">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => {
                  const { icon, bgColor, textColor } = getStatusIconAndColor(appointment.status);
                  return (
                    <tr key={appointment._id} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-slate-800">
                        {appointment.seller?.name || 'Unknown Seller'}
                        <div className="text-sm text-gray-500">{appointment.seller?.phoneNumber || 'N/A'}</div>
                      </td>
                      <td className="p-4 text-slate-800 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        {formatDate(appointment.date)}
                      </td>
                      <td className="p-4 text-slate-800">{appointment.placeToVisit || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${bgColor} ${textColor}`}>
                          {icon}
                          {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => openDetailsModal(appointment)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {}
          <div className="md:hidden space-y-4 p-4">
            {appointments.map((appointment) => {
              const { icon, bgColor, textColor } = getStatusIconAndColor(appointment.status);
              return (
                <motion.div
                  key={appointment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-slate-800">
                        {appointment.seller?.name || 'Unknown Seller'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {appointment.seller?.phoneNumber || 'N/A'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${bgColor} ${textColor}`}>
                      {icon}
                      {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Pending'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span>{formatDate(appointment.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="h-4 w-4 text-gray-500" />
                      <span>{appointment.placeToVisit || 'N/A'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openDetailsModal(appointment)}
                    className="block w-full text-center text-blue-600 hover:underline text-sm mt-3"
                  >
                    View Details
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {}
      {isModalOpen && selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={closeModal}
        />
      )}
    </div>
  );
}