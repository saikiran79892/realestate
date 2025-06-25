import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import {CalendarIcon, MapPinIcon, MessageSquareIcon, CheckCircle, XCircle } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

function SellerAppointments() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/seller/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      toast.error(error.message || 'Error loading appointments');
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/seller/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }

      toast.success(`Appointment status updated to ${newStatus}`);
      fetchAppointments();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error && appointments.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Appointments</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={fetchAppointments}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer theme="colored" position="bottom-right" />
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-slate-800 mb-6"
      >
        My Appointments
      </motion.h1>

      {appointments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center p-10 bg-white rounded-xl shadow-md"
        >
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No Appointments Found</h2>
          <p className="text-gray-500">You currently have no scheduled appointments. Buyers will contact you for property visits.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((appointment) => (
            <motion.div
              key={appointment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow"
            >
              {}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-slate-800 mb-3">Property Details</h2>
                <div className="relative h-40 mb-3 rounded-lg overflow-hidden">
                  <img 
                    src={appointment.property?.imageUrl} 
                    alt={appointment.property?.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <span className="font-medium">Title:</span> {appointment.property?.title || 'N/A'}
                </p>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <span className="font-medium">Price:</span> ${appointment.property?.price || 'N/A'}
                </p>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <span className="font-medium">Address:</span> {appointment.property?.address || 'N/A'}
                </p>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <span className="font-medium">Details:</span> {appointment.property?.beds || 'N/A'} beds, {appointment.property?.baths || 'N/A'} baths, {appointment.property?.sqft || 'N/A'} sqft
                </p>
              </div>

              {}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 mb-3">Buyer Details</h3>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <span className="font-medium">Name:</span> {appointment.buyer?.name || 'N/A'}
                </p>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <span className="font-medium">Email:</span> {appointment.buyer?.email || 'N/A'}
                </p>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <span className="font-medium">Phone:</span> {appointment.buyer?.phoneNumber || 'N/A'}
                </p>
              </div>

              {}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 mb-3">Appointment Details</h3>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-indigo-500" />
                  <span className="font-medium">Place:</span> {appointment.placeToVisit || 'N/A'}
                </p>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-indigo-500" />
                  <span className="font-medium">Date:</span> {new Date(appointment.date).toLocaleDateString() || 'N/A'}
                </p>
                <p className="text-gray-600 text-sm flex items-center gap-2 line-clamp-2">
                  <MessageSquareIcon className="h-4 w-4 text-indigo-500" />
                  <span className="font-medium">Message:</span> {appointment.message || 'No message provided'}
                </p>
              </div>

              {}
              <div className="mb-4">
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <span className={`px-3 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                {appointment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(appointment._id, 'accepted')}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(appointment._id, 'rejected')}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {appointment.status === 'accepted' && (
                  <button
                    onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Mark as Completed
                  </button>
                )}
                {appointment.status === 'rejected' && (
                  <button
                    onClick={() => handleStatusUpdate(appointment._id, 'pending')}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Reconsider
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerAppointments;