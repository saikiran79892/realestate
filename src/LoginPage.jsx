import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  BuildingOffice2Icon, 
  MapPinIcon, 
  XMarkIcon, 
  UserIcon,
  KeyIcon,
} from '@heroicons/react/24/solid';

// CSS for Sliding Animation
const styles = `
  .slide-tabs {
    position: relative;
    overflow: hidden;
  }
  .slide-indicator {
    position: absolute;
    bottom: 0;
    height: 2px;
    background-color: #2ecc71;
    transition: all 0.3s ease;
  }
  .animate-scale-in {
    animation: scaleIn 0.3s ease;
  }
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

export function LoginPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRole, setActiveRole] = useState('buyer');
  const [activeTab, setActiveTab] = useState('signin');
  const [properties, setProperties] = useState([]);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch properties from backend
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch(`${API_URL}/api/properties`);
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON');
        }
        const data = await response.json();
        setProperties(data);
      } catch (err) {
        toast.error('Error fetching properties');
        console.error(err);
      }
    };
    fetchProperties();
  }, [API_URL]);

  const openModal = (role = 'buyer', tab = 'signin') => {
    setActiveRole(role);
    setActiveTab(tab);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') {
      closeModal();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      email: formData.get('email'),
      password: formData.get('password'),
      role: activeRole,
    };

    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data._id,
          name: data.name,
          username: data.username,
          email: data.email,
          role: data.role,
        }));
        closeModal();
        toast.success('Successfully signed in');
        navigate(`/${data.role}`);
      } else {
        toast.error(data.message || 'Error signing in');
      }
    } catch (err) {
      toast.error('Error connecting to server');
      console.error(err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      name: formData.get('name'),
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      phoneNumber: formData.get('phoneNumber'),
      role: activeRole,
    };

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setActiveTab('signin');
        toast.success('Registration successful, please sign in');
      } else {
        toast.error(data.message || 'Error registering');
      }
    } catch (err) {
      toast.error('Error connecting to server');
      console.error(err);
    }
  };

  const renderFormFields = (role) => {
    const commonFields = (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-emerald-800">Full Name</label>
          <input
            type="text"
            name="name"
            required
            className="mt-1 block w-full px-4 py-3 border border-emerald-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            placeholder="jhon Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-emerald-800">Username</label>
          <input
            type="text"
            name="username"
            required
            className="mt-1 block w-full px-4 py-3 border border-emerald-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            placeholder="jhondoe123"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-emerald-800">Email Address</label>
          <input
            type="email"
            name="email"
            required
            className="mt-1 block w-full px-4 py-3 border border-emerald-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            placeholder="jhondoe@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-emerald-800">Password</label>
          <input
            type="password"
            name="password"
            required
            className="mt-1 block w-full px-4 py-3 border border-emerald-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            placeholder="••••••••"
          />
        </div>
      </div>
    );

    if (role === 'buyer' || role === 'seller') {
      return (
        <>
          {commonFields}
          <div className="mt-4">
            <label className="block text-sm font-medium text-emerald-800">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              required
              className="mt-1 block w-full px-4 py-3 border border-emerald-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              placeholder="+1 91 (123) 456-7890"
            />
          </div>
        </>
      );
    }

    return commonFields;
  };

  return (
    <div className="bg-gray-50 font-sans antialiased text-gray-900">
      <ToastContainer position="top-right" autoClose={5000} />
      <style>{styles}</style>

      {/* HEADER */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <a href="#" className="text-2xl font-bold text-emerald-600 flex items-center">
            <BuildingOffice2Icon className="w-8 h-8 mr-2" />
            EstateFlow
          </a>
          <div className="hidden md:flex items-center space-x-8 text-base font-medium">
            <a href="#properties" className="text-gray-600 hover:text-emerald-600 transition-colors duration-200">Properties</a>
            <a href="#about" className="text-gray-600 hover:text-emerald-600 transition-colors duration-200">About</a>
            <a href="#contact" className="text-gray-600 hover:text-emerald-600 transition-colors duration-200">Contact</a>
          </div>
          <button
            onClick={() => openModal('buyer', 'signin')}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            Sign In
          </button>
        </nav>
      </header>

      <main className="pt-16">
        {/* HERO SECTION */}
        <section
          className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2874&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 to-emerald-800/50"></div>
          <div className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Discover Your Dream Home
            </h1>
            <p className="mt-4 text-lg lg:text-xl text-gray-100 leading-relaxed">
              Seamlessly explore, manage, and grow your property portfolio with EstateFlow's intuitive platform.
            </p>
            <a
              href="#properties"
              className="mt-8 inline-block bg-emerald-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Explore Properties
            </a>
          </div>
        </section>

        {/* FEATURED PROPERTIES SECTION */}
        <section id="properties" className="py-24 bg-gray-100">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-800">Featured Properties</h2>
              <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
                Discover our curated selection of premium properties tailored to your needs.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <div
                  key={property._id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="relative">
                    <img
                      src={property.imageUrl}
                      alt={property.title}
                      className="w-full h-60 object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      ₹ {property.price}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800">{property.title}</h3>
                    <p className="text-gray-600 mt-2 flex items-center text-sm">
                      <MapPinIcon className="w-5 h-5 mr-2 text-emerald-500" />
                      {property.address}
                    </p>
                    <div className="mt-4 flex justify-between text-gray-700 text-sm">
                      <span className="flex items-center">
                        <UserIcon className="w-5 h-5 mr-1 text-emerald-500" />
                        {property.beds} Beds
                      </span>
                      <span className="flex items-center">
                        <KeyIcon className="w-5 h-5 mr-1 text-emerald-500" />
                        {property.baths} Baths
                      </span>
                      <span className="flex items-center">
                        <BuildingOffice2Icon className="w-5 h-5 mr-1 text-emerald-500" />
                        {property.sqft} sqft
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">
                      By: {property.createdBy?.name || 'Unknown'}
                    </p>
                    <button
                      onClick={() => openModal('buyer', 'signin')}
                      className="mt-6 w-full bg-emerald-100 text-emerald-700 px-4 py-3 rounded-lg font-semibold hover:bg-emerald-200 transition-all duration-300"
                    >
                      Enquire Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer id="contact" className="bg-emerald-900 text-white">
        <div className="container mx-auto px-6 py-12 text-center">
          <h3 className="text-2xl font-bold text-emerald-400">EstateFlow</h3>
          <p className="mt-2 text-gray-200">Simplifying your real estate journey.</p>
          <div className="mt-6">
            <p>© {new Date().getFullYear()} EstateFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* AUTHENTICATION MODAL */}
      {isModalOpen && (
        <div
          id="modal-overlay"
          onClick={handleOverlayClick}
          onKeyDown={handleKeyDown}
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
          tabIndex={-1}
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 animate-scale-in">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 id="modal-title" className="text-2xl font-bold text-emerald-800">Welcome to EstateFlow</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-emerald-600 transition-colors"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* SIGN IN / REGISTER SLIDING TABS */}
              <div className="slide-tabs flex relative mb-6">
                <button
                  onClick={() => setActiveTab('signin')}
                  className={`w-1/2 py-3 text-center font-semibold transition-colors text-sm ${
                    activeTab === 'signin' ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-500'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`w-1/2 py-3 text-center font-semibold transition-colors text-sm ${
                    activeTab === 'register' ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-500'
                  }`}
                >
                  Register
                </button>
                <div
                  className="slide-indicator w-1/2"
                  style={{
                    left: activeTab === 'signin' ? '0%' : '50%',
                    width: '50%',
                  }}
                ></div>
              </div>

              {/* ROLE SLIDING TABS */}
              <div className="slide-tabs flex relative mb-6">
                {['buyer', 'seller', 'admin'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role)}
                    className={`w-1/3 py-3 text-center font-semibold text-sm capitalize transition-colors ${
                      activeRole === role ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-500'
                    }`}
                  >
                    {role}
                  </button>
                ))}
                <div
                  className="slide-indicator w-1/3"
                  style={{
                    left: activeRole === 'buyer' ? '0%' : activeRole === 'seller' ? '33.33%' : '66.66%',
                    width: '33.33%',
                  }}
                ></div>
              </div>

              {/* FORM CONTENT */}
              <div>
                {activeTab === 'signin' && (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <p className="text-center text-gray-600 capitalize">Sign in as {activeRole}</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-emerald-800">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          required
                          className="mt-1 block w-full px-4 py-3 border border-emerald-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                          placeholder="you@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-emerald-800">Password</label>
                        <input
                          type="password"
                          name="password"
                          required
                          className="mt-1 block w-full px-4 py-3 border border-emerald-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-all duration-300 shadow-md"
                    >
                      Sign In
                    </button>
                  </form>
                )}
                {activeTab === 'register' && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <p className="text-center text-gray-600 capitalize">Register as {activeRole}</p>
                    {renderFormFields(activeRole)}
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition-all duration-300 shadow-md"
                    >
                      Create Account
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}