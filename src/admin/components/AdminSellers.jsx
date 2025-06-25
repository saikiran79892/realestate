

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import { PlusCircle, Edit, Trash2, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';


function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}


function Modal({ isOpen, onClose, title, children, size = 'max-w-4xl' }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`bg-white rounded-2xl shadow-xl w-full ${size} m-auto flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 bg-white p-6 border-b rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl absolute top-4 right-4">×</button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
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
      value={value || ''} 
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);


function SellerForm({ initialData, onSubmit, onCancel }) {
  const emptyForm = { name: '', email: '', username: '', phoneNumber: '', password: '' };
  const [formData, setFormData] = useState(initialData ? { ...initialData, password: '' } : emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData(initialData ? { ...initialData, password: '' } : emptyForm);
  }, [initialData]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const dataToSubmit = { ...formData };
    if (initialData && !dataToSubmit.password) {
      delete dataToSubmit.password;
    }
    await onSubmit(dataToSubmit);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField name="name" label="Full Name" type="text" value={formData.name} onChange={handleChange} placeholder="e.g., John Doe" />
        <InputField name="username" label="Username" type="text" value={formData.username} onChange={handleChange} placeholder="e.g., johndoe" />
        <InputField name="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} placeholder="e.g., john@example.com" />
        <InputField name="phoneNumber" label="Phone Number" type="text" value={formData.phoneNumber} onChange={handleChange} placeholder="e.g., +1234567890" />
      </div>
      <InputField 
        name="password" 
        label={initialData ? "New Password (optional)" : "Password"}
        type="password" 
        value={formData.password} 
        onChange={handleChange} 
        placeholder={initialData ? "Leave blank to keep current password" : "Min. 6 characters"}
        required={!initialData} 
      />
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="px-6 py-2 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Seller' : 'Create Seller')}
        </button>
      </div>
    </form>
  );
}


function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-center items-center gap-2 mt-8">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-md bg-white border disabled:opacity-50"><ChevronLeft size={20} /></button>
            <span className="text-slate-700">Page {currentPage} of {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-md bg-white border disabled:opacity-50"><ChevronRight size={20} /></button>
        </div>
    );
}


export default function AdminSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [error, setError] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearchTerm = useDebounce(searchInput, 500);
  
  const [sellerProperties, setSellerProperties] = useState([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const TOKEN = localStorage.getItem('token');
  const LIMIT_PER_PAGE = 9;

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: LIMIT_PER_PAGE,
      });
      if (debouncedSearchTerm) {
        params.set('search', debouncedSearchTerm);
      }
      
      const response = await fetch(`${API_URL}/api/admin/sellers?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: 'Failed to fetch sellers' }));
        throw new Error(errData.message);
      }
      
      const result = await response.json();
      console.log("API Response:", result); 
      
      
      setSellers(result?.data || []);
      setTotalPages(result?.totalPages || 1);

    } catch (err) {
      toast.error(err.message || 'Error loading sellers.');
      setError(err.message);
      setSellers([]); 
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, API_URL, TOKEN]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const openModal = async (type, data = null) => {
    setModalState({ type, data });
    if (type === 'details' && data?._id) {
        setIsDetailsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/seller/properties/${data._id}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) throw new Error('Failed to fetch properties');
            const propsData = await response.json();
            setSellerProperties(propsData || []);
        } catch (err) {
            toast.error(err.message);
            setSellerProperties([]);
        } finally {
            setIsDetailsLoading(false);
        }
    }
  };

  const closeModal = () => setModalState({ type: null, data: null });

  const handleFormSubmit = async (formData) => {
    
    const isEdit = modalState.type === 'edit';
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit
      ? `${API_URL}/api/admin/sellers/${modalState.data?._id}`
      : `${API_URL}/api/admin/sellers`;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
        body: JSON.stringify(formData)
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Failed to save seller');
      toast.success(`Seller ${isEdit ? 'updated' : 'created'} successfully!`);
      closeModal();
      fetchSellers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    
    try {
      const response = await fetch(`${API_URL}/api/admin/sellers/${modalState.data?._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to delete seller');
      }
      toast.success('Seller deleted successfully.');
      if (sellers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
      } else {
          fetchSellers();
      }
      closeModal();
    } catch (err) {
      toast.error(err.message);
    }
  };

  
  return (
    <>
      <ToastContainer theme="colored" position="bottom-right" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold text-slate-800">Seller Management</h2>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search sellers..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded-lg" />
            </div>
            <button onClick={() => openModal('add')} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"><PlusCircle size={20} /> Add Seller</button>
          </div>
        </div>

        {loading ? (<p className="text-center py-10">Loading sellers...</p>) : 
         error ? (<div className="p-6 text-center"><h2 className="text-xl font-bold text-red-600">Error Loading Data</h2><p className="text-slate-600 mt-2">{error}</p><button onClick={fetchSellers} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Retry</button></div>) : 
         sellers.length === 0 ? (<p className="text-center p-8 text-slate-500">No sellers found.</p>) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellers.map(seller => (
                <motion.div key={seller._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-lg border overflow-hidden flex flex-col group">
                  <div className="relative">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name)}&background=random`} alt={seller.name} className="w-full h-40 object-cover" />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal('edit', seller)} className="bg-white/80 p-1.5 rounded-full text-blue-600 hover:bg-white"><Edit size={16} /></button>
                      <button onClick={() => openModal('delete', seller)} className="bg-white/80 p-1.5 rounded-full text-red-500 hover:bg-white"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-slate-800">{seller.name}</h3>
                    <p className="text-sm text-slate-500 mb-2 truncate">{seller.email}</p>
                    <div className="mt-auto pt-4 border-t">
                      <button onClick={() => openModal('details', seller)} className="w-full py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 flex items-center justify-center gap-2"><Eye size={16} /> View Details</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}

        {}
        <Modal isOpen={modalState.type === 'add' || modalState.type === 'edit'} onClose={closeModal} title={modalState.type === 'add' ? 'Create New Seller' : 'Edit Seller'}>
          <SellerForm initialData={modalState.data} onSubmit={handleFormSubmit} onCancel={closeModal} />
        </Modal>
        <Modal isOpen={modalState.type === 'delete'} onClose={closeModal} title="Confirm Deletion" size="max-w-md">
            <p className="my-4 text-slate-600">Are you sure you want to delete <span className="font-bold">{modalState.data?.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Yes, Delete</button>
            </div>
        </Modal>
        <Modal isOpen={modalState.type === 'details'} onClose={closeModal} title="Seller Details">
            {modalState.data && (<div><h3 className="text-2xl font-bold">{modalState.data.name}</h3><p className="text-slate-500">{modalState.data.email}</p><p className="text-slate-600 mt-2">Phone: {modalState.data.phoneNumber}</p><p className="text-slate-600">Username: {modalState.data.username}</p><h4 className="font-bold mt-6 mb-2 border-t pt-4">Associated Properties</h4>{isDetailsLoading ? (<p>Loading properties...</p>) : sellerProperties.length > 0 ? (<ul className="space-y-2 max-h-60 overflow-y-auto pr-2">{sellerProperties.map(prop => (<li key={prop._id} className="flex justify-between p-2 bg-slate-50 rounded"><span>{prop.title}</span><span className="text-sm text-slate-500">${parseInt(prop.price).toLocaleString()}</span></li>))}</ul>) : (<p className="text-sm text-slate-500">No properties found for this seller.</p>)}</div>)}
        </Modal>
      </motion.div>
    </>
  );
}