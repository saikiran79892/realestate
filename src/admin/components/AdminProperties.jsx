

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import { PlusCircle, Edit, Trash2, Search, Image as ImageIcon, Eye } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';


const PropertyTypeIcon = ({ type }) => {
  switch (type) {
    case 'house':
      return <span className="font-bold">H</span>;
    case 'land':
      return <span className="font-bold">L</span>;
    case 'apartment':
      return <span className="font-bold">A</span>;
    default:
      return <span className="font-bold">P</span>;
  }
};


const StatusBadge = ({ status }) => {
  const bgColor = status === 'approved' ? 'bg-green-100 text-green-800' : status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
  return (
    <span className={`text-xs ${bgColor} px-2.5 py-1 rounded-full flex items-center gap-1 w-fit`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};


function Modal({ isOpen, onClose, title, children, size = 'max-w-4xl' }) {
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
  <div>
    <label htmlFor={name} className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);


function PropertyForm({ initialData, onSubmit, onCancel }) {
  const emptyForm = {
    title: '',
    propertyType: 'house',
    price: '',
    address: '',
    imageUrl: '',
    beds: '',
    baths: '',
    sqft: '',
    landArea: '',
    zoning: '',
    floorNumber: '',
    totalFloors: '',
    status: 'approved', 
  };

  const [formData, setFormData] = useState(initialData || emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(initialData?.imageUrl || null);

  useEffect(() => {
    setFormData(initialData || emptyForm);
    setPhotoPreview(initialData?.imageUrl || null);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'imageUrl') {
      setPhotoPreview(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const dataToSubmit = { ...formData };
    if (dataToSubmit.propertyType !== 'house') {
      delete dataToSubmit.beds;
      delete dataToSubmit.baths;
      delete dataToSubmit.sqft;
    }
    if (dataToSubmit.propertyType !== 'land') {
      delete dataToSubmit.landArea;
      delete dataToSubmit.zoning;
    }
    if (dataToSubmit.propertyType !== 'apartment') {
      delete dataToSubmit.floorNumber;
      delete dataToSubmit.totalFloors;
    }
    try {
      await onSubmit(dataToSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDynamicFields = () => {
    switch (formData.propertyType) {
      case 'house':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField name="beds" label="Beds" type="number" value={formData.beds} onChange={handleChange} placeholder="Number of Beds" />
            <InputField name="baths" label="Baths" type="number" value={formData.baths} onChange={handleChange} placeholder="Number of Baths" />
            <InputField name="sqft" label="Square Feet" type="text" value={formData.sqft} onChange={handleChange} placeholder="e.g., 1,200" />
          </div>
        );
      case 'land':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField name="landArea" label="Land Area" type="text" value={formData.landArea} onChange={handleChange} placeholder="e.g., 2 Acres" />
            <InputField name="zoning" label="Zoning" type="text" value={formData.zoning} onChange={handleChange} placeholder="e.g., Residential" />
          </div>
        );
      case 'apartment':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField name="floorNumber" label="Floor Number" type="number" value={formData.floorNumber} onChange={handleChange} placeholder="Floor Number" />
            <InputField name="totalFloors" label="Total Floors" type="number" value={formData.totalFloors} onChange={handleChange} placeholder="Total Floors in Building" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3">
          <label className="text-sm font-medium text-slate-700 mb-2 block">Property Image</label>
          <div className="aspect-video w-full mb-5 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
            {photoPreview ? (
              <img src={photoPreview} alt="Property preview" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-12 h-12 text-slate-400" />
            )}
          </div>
          <InputField 
            name="imageUrl" 
            label="Image URL" 
            type="url" 
            value={formData.imageUrl} 
            onChange={handleChange} 
            placeholder="Enter image URL" 
          />
        </div>
        <div className="lg:w-2/3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField name="title" label="Property Title" value={formData.title} onChange={handleChange} placeholder="e.g., Modern Villa" />
            <InputField name="price" label="Price" value={formData.price} onChange={handleChange} placeholder="e.g., 500,000" />
          </div>
          <InputField name="address" label="Full Address" value={formData.address} onChange={handleChange} placeholder="e.g., 123 Main St, City" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Property Type</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="house">House</option>
                <option value="land">Land</option>
                <option value="apartment">Apartment</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          {renderDynamicFields()}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Property' : 'Create Property')}
        </button>
      </div>
    </form>
  );
}


export function AdminProperties() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/properties`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setProperties(data);
      setFilteredProperties(data);
      setError(null);
    } catch (err) {
      toast.error('Error loading properties.');
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    const filtered = properties.filter(prop =>
      prop.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProperties(filtered);
  }, [searchTerm, properties]);

  const openModal = (type, data = null) => {
    setModalState({ type, data });
  };

  const closeModal = () => {
    setModalState({ type: null, data: null });
  };

  const handleFormSubmit = async (formData) => {
    const method = modalState.type === 'edit' ? 'PUT' : 'POST';
    const endpoint = modalState.type === 'edit'
      ? `${API_URL}/api/admin/properties/${modalState.data?._id}`
      : `${API_URL}/api/admin/properties`;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData) 
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save property');
      }
      toast.success(`Property ${modalState.type === 'edit' ? 'updated' : 'created'} successfully!`);
      closeModal();
      fetchProperties();
    } catch (err) {
      toast.error(err.message || 'Failed to save property');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/properties/${modalState.data?._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) throw new Error('Failed to delete property');
      toast.success('Property deleted successfully.');
      fetchProperties();
      closeModal();
    } catch (err) {
      toast.error('Error deleting property.');
      console.error(err);
    }
  };

  if (error && !properties.length) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-red-600">Error Loading Properties</h2>
        <p className="text-slate-600 mt-2">{error}</p>
        <button
          onClick={() => fetchProperties()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <ToastContainer theme="colored" position="bottom-right" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold text-slate-800">Property Management</h2>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="search"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg"
              />
            </div>
            <button
              onClick={() => openModal('add')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
            >
              <PlusCircle size={20} /> Add Property
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-10">Loading properties...</p>
        ) : filteredProperties.length === 0 ? (
          <p className="text-center p-8 text-slate-500">No properties found for the current filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map(prop => (
              <motion.div
                key={prop._id}
                className="bg-white rounded-xl shadow-lg border overflow-hidden flex flex-col group"
              >
                <div className="relative">
                  <img
                    src={prop.imageUrl || `https://placehold.co/600x400/e2e8f0/475569?text=${encodeURIComponent(prop.title || 'Property')}`}
                    alt={prop.title || 'Property'}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openModal('edit', prop)}
                      className="bg-white/80 p-1.5 rounded-full text-blue-600 hover:bg-white"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => openModal('delete', prop)}
                      className="bg-white/80 p-1.5 rounded-full text-red-500 hover:bg-white"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(prop.createdBy?.name || 'User')}&background=random`}
                      alt={prop.createdBy?.name || 'User'}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{prop.createdBy?.name || 'Unknown User'}</p>
                      <p className="text-xs text-slate-500">{prop.createdBy?.email || 'No email'}</p>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{prop.title || 'Untitled Property'}</h3>
                  <p className="text-sm text-slate-500 mb-2">${parseInt(prop.price || 0).toLocaleString()}</p>
                  <p className="text-sm text-slate-600 mb-4 flex-grow line-clamp-2">{prop.address || 'No address provided'}</p>
                  <div className="mt-auto pt-4 border-t flex justify-between items-center">
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full hover:bg-indigo-200 transition-colors flex items-center gap-1 w-fit">
                      <PropertyTypeIcon type={prop.propertyType} />
                      {prop.propertyType?.charAt(0).toUpperCase() + (prop.propertyType?.slice(1) || 'Unknown')}
                    </span>
                    <StatusBadge status={prop.status || 'pending'} />
                  </div>
                  <button
                    onClick={() => openModal('details', prop)}
                    className="w-full mt-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {}
        <Modal
          isOpen={modalState.type === 'add' || modalState.type === 'edit'}
          onClose={closeModal}
          title={modalState.type === 'add' ? 'Create New Property' : 'Edit Property'}
        >
          <PropertyForm
            initialData={modalState.data}
            onSubmit={handleFormSubmit}
            onCancel={closeModal}
          />
        </Modal>

        {}
        <Modal
          isOpen={modalState.type === 'delete'}
          onClose={closeModal}
          title="Confirm Deletion"
          size="max-w-md"
        >
          <p className="my-4 text-slate-600">
            Are you sure you want to permanently delete the property <span className="font-bold">{modalState.data?.title || 'Untitled'}</span>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Yes, Delete</button>
          </div>
        </Modal>

        {}
        <Modal
          isOpen={modalState.type === 'details'}
          onClose={closeModal}
          title="Property Details"
        >
          {modalState.data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="flex gap-6 mb-6">
                  <div className="w-64 h-40 rounded-lg overflow-hidden bg-slate-100 shadow">
                    <img
                      src={modalState.data.imageUrl || `https://placehold.co/600x400/e2e8f0/475569?text=${encodeURIComponent(modalState.data.title || 'Property')}`}
                      alt={modalState.data.title || 'Property'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{modalState.data.title || 'Untitled Property'}</h3>
                    <p className="text-slate-500">${parseInt(modalState.data.price || 0).toLocaleString()}</p>
                    <div className="mt-4 flex gap-3">
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full hover:bg-indigo-200 transition-colors flex items-center gap-1 w-fit">
                        <PropertyTypeIcon type={modalState.data.propertyType} />
                        {modalState.data.propertyType?.charAt(0).toUpperCase() + (modalState.data.propertyType?.slice(1) || 'Unknown')}
                      </span>
                      <StatusBadge status={modalState.data.status || 'pending'} />
                    </div>
                  </div>
                </div>
                <p className="text-slate-700">{modalState.data.address || 'No address provided'}</p>
                <h4 className="font-bold mt-6 mb-2">Additional Details</h4>
                <ul className="space-y-2 p-1">
                  {modalState.data.propertyType === 'house' && (
                    <>
                      <li className="flex justify-between p-2 bg-slate-50 rounded">
                        <span>Beds</span><span>{modalState.data.beds || 'N/A'}</span>
                      </li>
                      <li className="flex justify-between p-2 bg-slate-50 rounded">
                        <span>Baths</span><span>{modalState.data.baths || 'N/A'}</span>
                      </li>
                      <li className="flex justify-between p-2 bg-slate-50 rounded">
                        <span>Square Feet</span><span>{modalState.data.sqft || 'N/A'}</span>
                      </li>
                    </>
                  )}
                  {modalState.data.propertyType === 'land' && (
                    <>
                      <li className="flex justify-between p-2 bg-slate-50 rounded">
                        <span>Land Area</span><span>{modalState.data.landArea || 'N/A'}</span>
                      </li>
                      <li className="flex justify-between p-2 bg-slate-50 rounded">
                        <span>Zoning</span><span>{modalState.data.zoning || 'N/A'}</span>
                      </li>
                    </>
                  )}
                  {modalState.data.propertyType === 'apartment' && (
                    <>
                      <li className="flex justify-between p-2 bg-slate-50 rounded">
                        <span>Floor Number</span><span>{modalState.data.floorNumber || 'N/A'}</span>
                      </li>
                      <li className="flex justify-between p-2 bg-slate-50 rounded">
                        <span>Total Floors</span><span>{modalState.data.totalFloors || 'N/A'}</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
        </Modal>
      </motion.div>
    </>
  );
}