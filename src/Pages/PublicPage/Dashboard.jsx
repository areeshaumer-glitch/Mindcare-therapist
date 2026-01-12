import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Star, FileText, MessageSquare, MapPin } from 'lucide-react';
// import { appointmentsData } from '../../components/Data'; // Removed hardcoded data
import { Method, callApi } from '../../netwrok/NetworkManager';
import { api } from '../../netwrok/Environment';
import { DEFAULT_AVATAR } from '../../assets/defaultAvatar';

const Dashboard = () => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState(null);
  const { navigationEvent } = useOutletContext();

  useEffect(() => {
    if (navigationEvent?.label === 'Dashboard') {
      setSelectedAppointment(null);
    }
  }, [navigationEvent]);

  // Helper functions from Appointment.jsx to process API data
  const sanitizeImageUrl = (value) => {
    if (!value) return '';
    return String(value).replaceAll('`', '').replaceAll('"', '').trim();
  };

  const formatTime12h = (time24) => {
    if (!time24 || typeof time24 !== 'string') return '';
    const [hRaw, mRaw] = time24.split(':');
    const hours = Number(hRaw);
    const minutes = Number(mRaw);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return '';
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    const mm = String(minutes).padStart(2, '0');
    return `${hour12}:${mm} ${period}`;
  };

  const formatTimeRange12h = (from24, to24) => {
    const from = formatTime12h(from24);
    const to = formatTime12h(to24);
    if (from && to) return `${from} - ${to}`;
    return from || to || '';
  };

  const getFirstSlotForDate = (item, date) => {
    const availability = Array.isArray(item?.availability) ? item.availability : [];
    const weekday = date
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    const dayBlock = availability.find((d) => String(d?.day || '').toLowerCase() === weekday);
    const slot = Array.isArray(dayBlock?.timeSlots) ? dayBlock.timeSlots[0] : null;
    if (!slot?.from) return null;
    return slot;
  };

  const formatCardDate = (date) => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  };

  useEffect(() => {
    setIsLoading(true);
    // Dashboard usually shows generic recent/today stats. 
    // We can fetch 'pending' appointments to show upcoming ones for today.
    const params = new URLSearchParams();
    params.set('status', 'pending');

    callApi({
      method: Method.GET,
      endPoint: `${api.appointmentsMe}?${params.toString()}`,
      onSuccess: (response) => {
        const payload = response?.data ?? response;
        const list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        setTherapists(list); // Keeping variable name 'therapists' to minimize diff, but it holds appointments
        setMeta(payload?.meta ?? null);
        setIsLoading(false);
      },
      onError: (err) => {
        console.error("Dashboard fetch error:", err);
        setTherapists([]);
        setIsLoading(false);
      },
    });
  }, []);

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleBackClick = () => {
    setSelectedAppointment(null);
  };

  // Statistics (using meta for total if available, others hardcoded for now)
  const statisticsData = {
    totalAppointments: meta?.totalItems || 0,
    completed: 245, // Placeholder as per original
    myComments: 1040 // Placeholder as per original
  };

  const todayAppointments = useMemo(() => {
    const today = new Date();
    return therapists.filter((appointment) => {
      if (!appointment.appointmentDate) return false;
      const appDate = new Date(appointment.appointmentDate);
      return (
        appDate.getDate() === today.getDate() &&
        appDate.getMonth() === today.getMonth() &&
        appDate.getFullYear() === today.getFullYear()
      );
    });
  }, [therapists]);

  if (selectedAppointment) {
    const user = selectedAppointment.user || {};
    const name = selectedAppointment?.name || user?.name || user?.fullName || '-';
    const image =
      sanitizeImageUrl(selectedAppointment?.profileImage) ||
      sanitizeImageUrl(user?.profileImage) ||
      DEFAULT_AVATAR;

    const displayDate = selectedAppointment.appointmentDate ? new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase() : '';
    const displayTime = (selectedAppointment.startTime && selectedAppointment.endTime) 
      ? `${selectedAppointment.startTime} - ${selectedAppointment.endTime}` 
      : (selectedAppointment.startTime || '');

    return (
      <div className="h-full font-nunito">
        <div className="w-full">
        
         

          <div className="bg-white rounded-[20px] shadow-sm p-8">
            <div className="flex items-center mb-6">
              <img
                src={image}
                alt={name}
                className="w-10 h-10 rounded-full object-cover mr-3"
              />
              <h1 className="text-base font-bold text-gray-900">{name}</h1>
            </div>

              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-900 mb-2">Appointment date & time</h2>
                <div className="flex flex-wrap items-center gap-6 text-gray-500">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{displayDate || 'Date not available'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{displayTime || 'Time not available'}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-900 mb-2">Mental Health Goals</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedAppointment?.goals || 'No goals provided.'}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-sm font-bold text-gray-900 mb-2">Note</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedAppointment?.note || 'No notes provided.'}</p>
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-2">AI Summary</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedAppointment?.aiSummary || 'No AI summary available.'}</p>
              </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full ">

      <div className="max-w-6xl mx-auto">
        {/* Statistics Section */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-6">Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Total Appointments */}
            <div className=" rounded-lg border border-black p-6">
              <div className="flex items-center mb-4">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Total Appointments</h3>
              </div>

              <div className="flex items-center">
                <span className="text-gray-600 mr-2">Total</span>
                <span className="text-gray-400 mr-2">→</span>
                <span className="text-2xl font-bold text-teal-600">{statisticsData.totalAppointments}</span>
              </div>
            </div>

            {/* Completed */}
            <div className=" rounded-lg border border-black p-6">
              <div className="flex items-center mb-4">

                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Completed</h3>
              </div>

              <div className="flex items-center">
                <span className="text-gray-600 mr-2">Total</span>
                <span className="text-gray-400 mr-2">→</span>
                <span className="text-2xl font-bold text-teal-600">{statisticsData.completed}</span>
              </div>
            </div>

            {/* My Comments */}
            <div className=" rounded-lg border border-black p-6">
              <div className="flex items-center mb-4">
                <Star className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">My Comments</h3>
              </div>

              <div className="flex items-center">
                <span className="text-gray-600 mr-2">Total</span>
                <span className="text-gray-400 mr-2">→</span>
                <span className="text-sm font-bold text-gray-600">{statisticsData.myComments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today Appointments Section */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-6">Today Appointments</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {isLoading && <div className="text-gray-500">Loading...</div>}

            {!isLoading && todayAppointments.length > 0 ? (
              todayAppointments.map((appointment, idx) => {
                const user = appointment.user || {};
                const name = appointment.name || user.name || user.fullName || '-';
                const image =
                  sanitizeImageUrl(appointment.profileImage) ||
                  sanitizeImageUrl(user.profileImage) ||
                  DEFAULT_AVATAR;

                const start = appointment.startTime || appointment.time;
                const end = appointment.endTime;
                const timeLabel = (start && end) 
                  ? `${start} - ${end}` 
                  : (start || '');
                const dateStr = appointment.appointmentDate || appointment.date;
                const dateLabel = dateStr ? formatCardDate(new Date(dateStr)) : '';

                const key = appointment._id || appointment.id || idx;

                return (
                  <div
                    key={key}
                    onClick={() => handleAppointmentClick(appointment)}
                    className="bg-white rounded-[24px] w-[316px] h-[120px] p-6 cursor-pointer duration-200 shadow-sm hover:shadow-md flex items-center opacity-100"
                  >
                    <img
                      src={image}
                      alt={name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{name}</h3>
                      <p className="text-sm text-gray-600">{dateLabel} - {timeLabel}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              !isLoading && <div className="text-gray-500">No appointment is found for today.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;