import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { X } from 'lucide-react';
import SidebarItem from '../../components/SideBarItem';
import images from '../../assets/Images';
import TopBar from '../../components/TopBar';
import { Method, callApi } from '../../netwrok/NetworkManager';
import { api } from '../../netwrok/Environment';
import { useAuthStore } from '../../store/authSlice';

const sidebarItems = [
  { label: 'Dashboard', icon: images.dash },
  { label: 'Appointments', icon: images.workout },
  { label: 'Track Attendance', icon: images.track },

  { label: 'Sign Out', icon: images.Signout, isLast: true },
];

const getSelectedFromPathname = (pathname) => {
  const path = String(pathname || '').toLowerCase();

  if (path.endsWith('/home') || path.endsWith('/home/') || path.includes('/home/dashboard')) {
    return 'Dashboard';
  }
  if (path.includes('/home/appointments')) return 'Appointments';
  if (path.includes('/home/track-attendance')) return 'Track Attendance';
  if (path.includes('/home/my-profile')) return 'My Profile';

  return 'Dashboard';
};

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState(() => getSelectedFromPathname(location.pathname));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const logout = useAuthStore((s) => s.logout);
  const updateUserData = useAuthStore((s) => s.updateUserData);
  const [therapistProfile, setTherapistProfile] = useState(null);
  const [navigationEvent, setNavigationEvent] = useState(null);

  const fetchProfile = (updatedData = null) => {
    if (updatedData) {
      setTherapistProfile((prev) => ({ ...prev, ...updatedData }));
    }
    callApi({
      method: Method.GET,
      endPoint: api.therapistProfileMe,
      onSuccess: (response) => {
        const payload = response?.data ?? response;
        const data = payload?.data ?? payload;
        const me = data?.therapistProfile ?? data?.profile ?? data?.therapist ?? data;
        if (!me) {
          updateUserData({ isProfileCompleted: false });
          navigate('/create-profile', { replace: true });
          return;
        }
        setTherapistProfile(me);
      },
      onError: (err) => {
        const message = String(err?.message ?? err?.data?.message ?? '').toLowerCase();
        if (
          message.includes('permission') ||
          message.includes('forbidden') ||
          message.includes('not authorized') ||
          message.includes('not authorised')
        ) {
          logout();
          navigate('/', { replace: true });
          return;
        }
        if (message.includes('profile not found') || message.includes('therapist profile not found')) {
          updateUserData({ isProfileCompleted: false });
          navigate('/create-profile', { replace: true });
          return;
        }
        // If the optimistic update was wrong or the fetch fails, we might want to handle it,
        // but typically the previous state or null is fine. 
        // If we want to revert, we'd need more complex logic. 
        // For now, if fetch fails, we just set null or keep optimistic state? 
        // The original code set it to null on error.
        if (!updatedData) {
           setTherapistProfile(null);
        }
      },
    });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const next = getSelectedFromPathname(location.pathname);
    setSelected((prev) => (prev === next ? prev : next));
  }, [location.pathname]);

  const handleClick = async (label) => {
    setSelected(label);
    setNavigationEvent({ label, timestamp: Date.now() });
    switch (label) {
      case 'Dashboard':
        navigate('dashboard'); // relative to /Dashboard
        break;
      case 'Appointments':
        navigate('appointments');
        break;
      case 'Track Attendance':
        navigate('track-attendance');
        break;

      case 'My Profile':
        navigate('my-profile');
        break;
      case 'Sign Out':
        await callApi({
          method: Method.POST,
          endPoint: api.logout,
          bodyParams: { refreshToken },
          onSuccess: () => {
            logout();
            navigate('/', { replace: true });
          },
          onError: () => {
            logout();
            navigate('/', { replace: true });
          },
        });
        break;
      default:
      // navigate('dashboard');
    }
  };

  const handleMobileItemClick = async (label) => {
    setIsMobileMenuOpen(false);
    await handleClick(label);
  };

  return (
    <div className="flex min-h-screen">
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white shadow-xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="text-xl font-bold text-teal-700">MindCare</div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            <div className="flex-1 flex flex-col space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleMobileItemClick(item.label)}
                  className={`flex items-center gap-3 px-3 py-3 text-left text-sm font-medium rounded-lg transition ${
                    selected === item.label ? 'bg-teal-700 text-white' : 'text-[#737791] hover:bg-gray-50'
                  } ${item.isLast ? 'mt-auto' : ''}`}
                >
                  <img
                    src={item.icon}
                    alt={item.label}
                    className={`w-4 h-5 ${selected === item.label ? 'filter brightness-0 invert' : ''}`}
                  />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <aside className="hidden sm:flex w-[230px] bg-white p-6 fixed inset-y-0 left-0 flex-col">
        <h1 className="text-xl font-bold text-teal-700 mb-6 text-center w-full flex justify-center">
          <span className="hidden sm:inline">MindCare</span>
        </h1>

        <div className="flex-1 flex flex-col space-y-3">
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={selected === item.label}
              onClick={() => handleClick(item.label)}
              isLast={item.isLast}
            />
          ))}
        </div>
      </aside>

      <main className="ml-0 sm:ml-[230px] p-6 flex-1 bg-slate-100 min-h-screen overflow-x-hidden">
        <TopBar
          profile={therapistProfile}
          onMenuClick={() => setIsMobileMenuOpen(true)}
          onClick={() => {
            setSelected('My Profile');
            navigate('my-profile');
          }}
        />
        <div className="mt-6">
          <Outlet context={{ therapistProfile, refreshProfile: fetchProfile, navigationEvent }} />
        </div>
      </main>
    </div>
  );
};

export default Home;
