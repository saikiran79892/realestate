import { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink, useLocation, Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  BuildingOffice2Icon,
  HomeIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { BuyerHome } from './components/BuyerHome';
import  { BuyerAppointments }  from './components/BuyerAppointments';
import { BuyerProfile } from './BuyerProfile';
import  { BuyerPropertyDetails}  from './components/BuyerPropertyDetails';




const getInitialsColor = (name) => {
  const colors = ['bg-blue-500', 'bg-cyan-500', 'bg-teal-500', 'bg-green-500', 'bg-emerald-500', 'bg-lime-500', 'bg-yellow-500'];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
};

const getPageTitle = (pathname) => {
  const routeName = pathname.split('/').pop();
  if (!routeName || routeName === 'buyer') return 'Dashboard';
  return routeName.charAt(0).toUpperCase() + routeName.slice(1);
};


export function BuyerDashboard() {
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (!token || !storedUser || storedUser.role !== 'buyer') {
      toast.error('Access denied. Please log in as buyer.');
      navigate('/');
      return;
    }
    setUser(storedUser);
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/');
  };

  
  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-blue-200 rounded"></div>
        </div>
      </div>
    );
  }

  const sidebarClasses = `fixed inset-y-0 left-0 z-40 bg-gradient-to-b from-blue-900 to-cyan-900 text-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl`;
  const collapsedSidebar = `w-16 md:w-20`;
  const expandedSidebar = `w-64`;

  const mainContentClasses = `flex-1 flex flex-col transition-all duration-300 ease-in-out`;
  const collapsedMainContent = `md:ml-20 ml-0`;
  const expandedMainContent = `md:ml-64 ml-0`;

  const navItems = [
    { to: '/buyer', label: 'Home', icon: HomeIcon },
    { to: '/buyer/appointments', label: 'Appointments', icon: CalendarIcon },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {}
      <Transition appear show={isMobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsMobileMenuOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-start text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 -translate-x-full"
                enterTo="opacity-100 translate-x-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 -translate-x-full"
              >
                <Dialog.Panel className="w-3/4 max-w-xs h-screen transform bg-gradient-to-b from-blue-900 to-cyan-900 text-white p-6 shadow-xl transition-all">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2">
                      <BuildingOffice2Icon className="h-8 w-8 text-cyan-300" />
                      <span className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">EstateFlow</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-blue-800/50">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <nav className="space-y-3">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center p-3 rounded-xl transition-all duration-200 ${
                            isActive ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'hover:bg-blue-800/30'
                          }`
                        }
                      >
                        <item.icon className="h-6 w-6" />
                        <span className="ml-4 font-medium text-cyan-100">{item.label}</span>
                      </NavLink>
                    ))}
                  </nav>

                  <div className="absolute bottom-0 left-0 p-6 w-3/4 max-w-xs">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-3 text-sm text-rose-300 hover:bg-rose-900/20 rounded-xl transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {}
      <aside className={`${sidebarClasses} ${isSidebarCollapsed ? collapsedSidebar : expandedSidebar} hidden md:flex`}>
        {}
        <div className="flex items-center justify-between p-4 border-b border-blue-700/50 h-16">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2">
              <BuildingOffice2Icon className="h-8 w-8 text-cyan-300" />
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">EstateFlow</span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-blue-800/50 transition-colors"
          >
            <ChevronLeftIcon
              className={`h-6 w-6 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {}
        <nav className="flex-1 px-2 py-8 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center p-3 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'hover:bg-blue-800/30'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`
              }
              title={isSidebarCollapsed ? item.label : ''}
            >
              <item.icon className={`h-6 w-6 transition-transform duration-200 ${!isSidebarCollapsed ? 'group-hover:scale-105' : ''}`} />
              {!isSidebarCollapsed && <span className="ml-4 font-medium text-cyan-100">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-blue-700/50">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${getInitialsColor(user.name)}`}>
                {getInitials(user.name)}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-cyan-100">{user.name}</p>
                <p className="text-xs text-cyan-300">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {}
      <div className={`${mainContentClasses} ${isSidebarCollapsed ? collapsedMainContent : expandedMainContent}`}>
        {}
        <header className="sticky top-0 bg-white shadow-md z-30 backdrop-blur-sm bg-white/95">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            {}
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 md:hidden transition-colors">
                <Bars3Icon className="h-6 w-6 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800 md:truncate md:max-w-[200px] lg:max-w-md">{getPageTitle(location.pathname)}</h1>
            </div>

            {}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 md:gap-3 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg ${getInitialsColor(user.name)}`}>
                  {getInitials(user.name)}
                </div>
                <div className="hidden md:block text-left max-w-[150px]">
                  <p className="text-sm font-semibold text-gray-700 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 z-50 animate-fade-in-down border border-gray-100">
                  <NavLink
                    to="/buyer/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserCircleIcon className="h-5 w-5 text-gray-500" />
                    <span>Profile Settings</span>
                  </NavLink>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {}
        <main className="p-4 md:p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<BuyerHome />} />
            <Route path="appointments" element={<BuyerAppointments />} />
            <Route path="profile" element={<BuyerProfile />} />
            <Route path="property/:id" element={<BuyerPropertyDetails />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}


const styles = `
  @keyframes fade-in-down {
    from { 
      opacity: 0; 
      transform: translateY(-8px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
  @keyframes fade-in {
    from { 
      opacity: 0; 
    }
    to { 
      opacity: 1; 
    }
  }
  .animate-fade-in-down {
    animation: fade-in-down 0.2s ease-out forwards;
  }
  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
  }
`;
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);