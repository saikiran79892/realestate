import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
    BuildingOffice2Icon, 
    MapPinIcon, 
    XMarkIcon, 
    UserIcon,
    KeyIcon,
  } from '@heroicons/react/24/solid';
  
export function BuyerHome() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/buyer/properties`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setProperties(response.data);
        setLoading(false);
      } catch (error) {
        setError('Failed to fetch properties');
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Available Properties</h1>
      
      {}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search by title or address..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onChange={(e) => {
              const searchTerm = e.target.value.toLowerCase();
              const filtered = properties.filter(property => 
                property.title.toLowerCase().includes(searchTerm) ||
                property.address.toLowerCase().includes(searchTerm)
              );
              setFilteredProperties(filtered);
            }}
          />
          <select 
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'all') {
                setFilteredProperties(properties);
              } else {
                const maxPrice = parseInt(value);
                const filtered = properties.filter(property => 
                  property.price <= maxPrice
                );
                setFilteredProperties(filtered);
              }
            }}
          >
            <option value="all">All Prices</option>
            <option value="1000000">Under ₹10,00,000</option>
            <option value="2000000">Under ₹20,00,000</option>
            <option value="5000000">Under ₹50,00,000</option>
            <option value="10000000">Under ₹1,00,00,000</option>
          </select>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {(filteredProperties || properties).map((property) => (
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
                    <Link 
                to={`property/${property._id}`}
                className="mt-6 w-full bg-emerald-100 text-emerald-700 px-4 py-3 rounded-lg font-semibold hover:bg-emerald-200 transition-all duration-300 text-center block"
              >
                View Details
              </Link>
                  </div>
                </div>
              ))}
            </div>
    </div>
  );
}
