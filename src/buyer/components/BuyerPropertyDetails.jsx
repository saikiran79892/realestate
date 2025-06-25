import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  XMarkIcon,
  UserIcon,
  KeyIcon,
  StarIcon,
  HomeIcon,
} from '@heroicons/react/24/solid';


function Modal({ isOpen, onClose, title, children, size = 'max-w-md' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-2xl shadow-xl w-full ${size} m-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white p-6 border-b z-10">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl absolute top-4 right-4">×</button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}


const InputField = ({ name, label, type, value, onChange, placeholder, required = true }) => (
  <div className="mb-4">
    <label htmlFor={name} className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>
    {type === 'textarea' ? (
      <textarea
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows="3"
        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    ) : (
      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    )}
  </div>
);


const PropertyTypeIcon = ({ type }) => {
  switch (type) {
    case 'house':
      return <BuildingOffice2Icon className="h-5 w-5 text-blue-600" />;
    case 'land':
      return <MapPinIcon className="h-5 w-5 text-blue-600" />;
    case 'apartment':
      return <BuildingOffice2Icon className="h-5 w-5 text-blue-600" />;
    default:
      return <BuildingOffice2Icon className="h-5 w-5 text-blue-600" />;
  }
};

export function BuyerPropertyDetails() {
  const { id } = useParams(); 
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [property, setProperty] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    date: '',
    placeToVisit: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInterested, setIsInterested] = useState(false); 
  const [hasExistingAppointment, setHasExistingAppointment] = useState(false); 
  const [appointmentLoading, setAppointmentLoading] = useState(false); 

  
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/buyer/properties/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch property details');
        const data = await response.json();
        setProperty(data.property);
        setCreator(data.creator); 
        
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && data.property.interested && data.property.interested.includes(user._id)) {
          setIsInterested(true);
        }
      } catch (err) {
        toast.error(err.message || 'Error loading property details');
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const checkExistingAppointment = async () => {
      setAppointmentLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/api/buyer/appointments?propertyId=${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const data = await response.json();
        
        if (data.appointments && data.appointments.length > 0) {
          setHasExistingAppointment(true);
        }
      } catch (err) {
        toast.error(err.message || 'Error checking existing appointments');
      } finally {
        setAppointmentLoading(false);
      }
    };

    fetchPropertyDetails();
    checkExistingAppointment();
  }, [id, API_URL]);

  
  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm(prev => ({ ...prev, [name]: value }));
  };

  
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/buyer/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: property._id,
          sellerId: property.createdBy._id,
          date: appointmentForm.date,
          placeToVisit: appointmentForm.placeToVisit,
          message: appointmentForm.message,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to schedule appointment');
      }
      toast.success('Appointment scheduled successfully! Awaiting seller confirmation.');
      setAppointmentForm({ date: '', placeToVisit: '', message: '' });
      setIsAppointmentModalOpen(false);
      setHasExistingAppointment(true); 
    } catch (err) {
      toast.error(err.message || 'Failed to schedule appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const handleInterestedToggle = async () => {
    try {
      const token = localStorage.getItem('token');
      const action = isInterested ? 'unmark' : 'mark';
      const response = await fetch(`${API_URL}/api/buyer/properties/${id}/interested`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error('Failed to update interest status');
      setIsInterested(!isInterested);
      toast.success(isInterested ? 'Removed from interested list' : 'Marked as interested');
    } catch (err) {
      toast.error(err.message || 'Failed to update interest status');
    }
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

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Property</h1>
        <p className="text-gray-600 mb-6">{error || 'Property not found'}</p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  
  const propertyStatus = property.status || 'Available';

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden"
      >
        {}
        <div className="relative">
          <img
            src={property.imageUrl}
            alt={property.title}
            className="w-full h-64 md:h-96 object-cover"
            onError={(e) => e.target.src = "https://placehold.co/1200x400/e2e8f0/475569?text=Error"}
          />
          <div className="absolute bottom-0 left-0 p-4 bg-gradient-to-t from-black/80 to-transparent w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{property.title}</h1>
            <p className="text-cyan-100 text-sm flex items-center gap-2">
              <MapPinIcon className="h-4 w-4" /> {property.address}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <p className="text-2xl font-bold text-blue-600">${parseInt(property.price || 0).toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <PropertyTypeIcon type={property.propertyType} />
                  {property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                  {propertyStatus.charAt(0).toUpperCase() + propertyStatus.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={handleInterestedToggle}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isInterested ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <StarIcon className={`h-5 w-5 ${isInterested ? 'fill-current' : ''}`} />
                {isInterested ? 'Interested' : 'Mark Interested'}
              </button>
              <button
                onClick={() => setIsAppointmentModalOpen(true)}
                disabled={hasExistingAppointment || appointmentLoading}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  hasExistingAppointment || appointmentLoading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-cyan-600 text-white hover:bg-cyan-700'
                }`}
              >
                {appointmentLoading ? 'Checking...' : hasExistingAppointment ? 'Appointment Scheduled' : 'Schedule Appointment'}
              </button>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Property Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <HomeIcon className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Beds</p>
                    <p className="font-medium">{property.beds || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <KeyIcon className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Baths</p>
                    <p className="font-medium">{property.baths || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <BuildingOffice2Icon className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Square Feet</p>
                    <p className="font-medium">{property.sqft || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Contact Seller</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold bg-blue-500">
                    {creator ? getInitials(creator.name) : '??'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{creator?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{creator?.email || 'N/A'}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">Phone: {creator?.phoneNumber || 'N/A'}</p>
                <p className="text-sm text-gray-500">Posted on: {new Date(property.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {}
      <Modal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        title="Schedule an Appointment"
      >
        {hasExistingAppointment ? (
          <div className="text-center">
            <p className="text-lg text-gray-700 mb-6">You have already scheduled an appointment for this property.</p>
            <button
              onClick={() => setIsAppointmentModalOpen(false)}
              className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleAppointmentSubmit} className="space-y-4">
            <InputField
              name="date"
              label="Preferred Date"
              type="date"
              value={appointmentForm.date}
              onChange={handleAppointmentChange}
              placeholder="Select a date"
            />
            <InputField
              name="placeToVisit"
              label="Place to Visit"
              type="text"
              value={appointmentForm.placeToVisit}
              onChange={handleAppointmentChange}
              placeholder="Enter meeting place (e.g., property location)"
            />
            <InputField
              name="message"
              label="Message to Seller"
              type="textarea"
              value={appointmentForm.message}
              onChange={handleAppointmentChange}
              placeholder="Briefly explain your interest or any questions"
            />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setIsAppointmentModalOpen(false)} className="px-6 py-2 bg-slate-100 rounded-lg hover:bg-slate-200">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-cyan-600 text-white rounded-lg disabled:opacity-50">
                {isSubmitting ? 'Scheduling...' : 'Schedule Appointment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}


const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
};