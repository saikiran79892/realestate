

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Search, ArrowUp, ArrowDown } from 'lucide-react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDebounce } from '../hooks/useDebounce';


function Modal({ isOpen, onClose, title, children, size = 'max-w-2xl' }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`bg-white rounded-2xl shadow-xl w-full ${size} p-6`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl">×</button>
                </div>
                {children}
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


const UserAvatar = ({ user }) => (
    user.photo ? (
        <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
    ) : (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {user.name?.charAt(0) || 'U'}
        </div>
    )
);


function AdminBuyers() {
    const [buyersList, setBuyersList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalState, setModalState] = useState({ type: null, data: null });
    const [formData, setFormData] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    const fetchBuyers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: 10,
                search: debouncedSearchTerm,
                sortBy: sortConfig.key,
                sortOrder: sortConfig.direction,
            };
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/buyers/all`, {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                params,
            });
            
            setBuyersList(response.data.data || []);
            setPagination({
                page: response.data.currentPage || 1,
                totalPages: response.data.totalPages || 1,
                total: response.data.totalItems || 0
            });
        } catch (err) {
            toast.error('Failed to fetch buyer data.');
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, debouncedSearchTerm, sortConfig]);

    useEffect(() => {
        document.title = "Admin | Manage Buyers";
        fetchBuyers();
    }, [fetchBuyers]);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const openModal = (type, data = null) => {
        setModalState({ type, data });
        if (type === 'add') {
            setFormData({ name: '', username: '', email: '', password: '', phoneNumber: '' });
        } else if (type === 'edit') {
            setFormData(data);
        }
    };

    const closeModal = () => {
        setModalState({ type: null, data: null });
        setFormData({});
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const headers = {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            };

            if (modalState.type === 'add') {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/buyers/add`, formData, { headers });
                toast.success('Buyer added successfully!');
            } else if (modalState.type === 'edit') {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/buyers/update/${modalState.data._id}`, formData, { headers });
                toast.success('Buyer updated successfully!');
            }
            fetchBuyers();
            closeModal();
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to ${modalState.type} buyer.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            const headers = {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            };
            
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/buyers/delete/${modalState.data._id}`, { headers });
            toast.success('Buyer permanently deleted.');
            fetchBuyers();
            closeModal();
        } catch (err) {
            toast.error('Failed to delete buyer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSort = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction });
    };

    const SortableHeader = ({ tkey, label }) => (
        <th className="p-4 cursor-pointer" onClick={() => handleSort(tkey)}>
            <div className="flex items-center gap-2">
                {label}
                {sortConfig.key === tkey && (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
            </div>
        </th>
    );

    return (
        <>
            <ToastContainer theme="colored" position="bottom-right" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-3xl font-bold text-slate-800">Manage Buyers</h2>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search buyers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <button
                            onClick={() => openModal('add')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors shrink-0"
                        >
                            <PlusCircle size={20} /> Add New
                        </button>
                    </div>
                </div>

                {}
                <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-gray-200/70">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b-2 border-slate-200">
                                <tr className="text-sm text-slate-600">
                                    <SortableHeader tkey="name" label="Name" />
                                    <SortableHeader tkey="username" label="Username" />
                                    <SortableHeader tkey="email" label="Email" />
                                    <th className="p-4">Phone Number</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="5" className="text-center p-8">Loading...</td></tr>
                                ) : buyersList.map(buyer => (
                                    <tr key={buyer._id} className="border-b border-slate-100 hover:bg-slate-50/70">
                                        <td className="p-4 flex items-center gap-4">
                                            <UserAvatar user={buyer} />
                                            <div>
                                                <p className="font-bold text-slate-800">{buyer.name || 'Unnamed Buyer'}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-700">{buyer.username || 'N/A'}</td>
                                        <td className="p-4 text-slate-700">{buyer.email || 'N/A'}</td>
                                        <td className="p-4 text-slate-700">{buyer.phoneNumber || 'N/A'}</td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => openModal('edit', buyer)}
                                                className="text-blue-600 p-2 rounded-full hover:bg-blue-100"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => openModal('delete', buyer)}
                                                className="text-red-500 p-2 rounded-full hover:bg-red-100 ml-2"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {buyersList.length === 0 && !isLoading && <p className="text-center p-8 text-slate-500">No buyers found.</p>}
                    </div>
                    {}
                    <div className="flex justify-between items-center mt-6">
                        <p className="text-sm text-slate-600 font-medium">
                            Page {pagination.page} of {pagination.totalPages} (Total: {pagination.total})
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page <= 1}
                                className="px-4 py-2 text-sm font-medium border rounded-lg disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-4 py-2 text-sm font-medium border rounded-lg disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {}
            <Modal
                isOpen={modalState.type === 'add' || modalState.type === 'edit'}
                onClose={closeModal}
                title={modalState.type === 'add' ? 'Add New Buyer' : 'Edit Buyer'}
            >
                <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            name="name"
                            label="Full Name"
                            type="text"
                            value={formData.name || ''}
                            onChange={handleInputChange}
                        />
                        <InputField
                            name="username"
                            label="Username"
                            type="text"
                            value={formData.username || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            name="email"
                            label="Email Address"
                            type="email"
                            value={formData.email || ''}
                            onChange={handleInputChange}
                        />
                        <InputField
                            name="phoneNumber"
                            label="Phone Number"
                            type="text"
                            value={formData.phoneNumber || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                    {modalState.type === 'add' && (
                        <InputField
                            name="password"
                            label="Password"
                            type="password"
                            value={formData.password || ''}
                            onChange={handleInputChange}
                            placeholder="Min. 6 characters"
                        />
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>

            {}
            <Modal isOpen={modalState.type === 'delete'} onClose={closeModal} title="Confirm Deletion" size="max-w-md">
                <p className="my-4 text-slate-600">
                    Are you sure you want to <span className="font-bold text-red-600">permanently delete</span> {modalState.data?.name || 'Unnamed Buyer'}? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={closeModal} className="px-4 py-2 bg-slate-100 rounded-lg">Cancel</button>
                    <button
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                    >
                        {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                </div>
            </Modal>
        </>
    );
}

export default AdminBuyers;