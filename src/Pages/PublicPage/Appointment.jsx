import React, { useEffect, useMemo, useState, useRef } from 'react';
import { ArrowLeft, Calendar, ChevronDown, Clock, MapPin, X } from 'lucide-react';
import { Method, callApi } from '../../netwrok/NetworkManager';
import { api } from '../../netwrok/Environment';

const Appointment = () => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const calendarRef = useRef(null);
  const [error, setError] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDateSelected, setIsDateSelected] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const endPoint = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    // upcoming -> pending, completed -> completed or similar.
    // User curl used 'pending'. Assuming 'completed' is also 'completed'.
    const status = activeTab === 'upcoming' ? 'pending' : 'completed';
    params.set('status', status);

    const query = params.toString();
    return `${api.appointmentsMe}?${query}`;
  }, [limit, page, activeTab]);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setAppointments([]);

    void callApi({
      method: Method.GET,
      endPoint,
      onSuccess: (response) => {
        if (!isActive) return;
        const payload = response?.data ?? response;
        const list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        setAppointments(list);
        setIsLoading(false);
      },
      onError: (err) => {
        if (!isActive) return;
        setAppointments([]);
        setIsLoading(false);
      },
    });

    return () => {
      isActive = false;
    };
  }, [endPoint]);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCardDate = (dateString, dateObj) => {
    const d = dateObj || (dateString ? new Date(dateString) : new Date());
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  };

  const sanitizeImageUrl = (value) => {
    if (!value) return '';
    return String(value).replaceAll('`', '').replaceAll('"', '').trim();
  };

  const generateCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const handleDateSelect = (day) => {
    if (day) {
      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      setSelectedDate(newDate);
      setIsDateSelected(true);
      setShowCalendar(false);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleBackClick = () => {
    setSelectedAppointment(null);
  };

  const Modal = ({ onClose, children }) => {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50"
        onClick={() => setIsModalOpen(false)}>
        <div className="bg-white shadow-lg rounded-lg max-w-md w-full mx-4 relative"
          onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
          {children}
        </div>
      </div>
    );
  };


  if (selectedAppointment) {
    // Determine overlapping fields
    const user = selectedAppointment.user || {};
    const name = selectedAppointment.name || user.name || user.fullName || 'Student Name';
    const profileImage =
      sanitizeImageUrl(selectedAppointment.profileImage) ||
      sanitizeImageUrl(user.profileImage) ||
      user.avatar ||
      'https://i.pravatar.cc/120';
    const location = selectedAppointment?.location || user?.location || '';
    const bio = selectedAppointment?.bio || user?.bio || '';
    const specializationsList = Array.isArray(selectedAppointment?.specializations)
      ? selectedAppointment.specializations
      : [];

    // Formatting date time
    const displayDate = selectedAppointment.date ? new Date(selectedAppointment.date).toLocaleDateString() : '';
    const displayTime = selectedAppointment.time || '';

    return (
      <>
        <div className="h-full">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
              <button
                onClick={handleBackClick}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Back to Appointments</span>
              </button>

              <div className="flex items-center mb-8">
                <img
                  src={profileImage}
                  alt={name}
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-semibold text-gray-800 truncate">{name}</h1>
                  {location ? (
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm truncate">{location}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {(displayDate || displayTime) ? (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-800 mb-1">Appointment date & time</h2>
                  <div className="flex flex-wrap items-center gap-4 text-gray-600">
                    {displayDate ? (
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        <span>{displayDate}</span>
                      </div>
                    ) : null}
                    {displayTime ? (
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        <span>{displayTime}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {bio ? (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-800 mb-1">Bio</h2>
                  <p className="text-gray-600 leading-relaxed">{bio}</p>
                </div>
              ) : null}

              {specializationsList.length > 0 ? (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-800 mb-3">Specializations</h2>
                  <div className="flex flex-wrap gap-2">
                    {specializationsList.map((s) => (
                      <span
                        key={String(s)}
                        className="px-3 py-1 rounded-full text-sm bg-teal-50 text-teal-700"
                      >
                        {String(s).replaceAll('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedAppointment?.goals ? (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-800 mb-1">Mental Health Goals</h2>
                  <p className="text-gray-600 leading-relaxed">{selectedAppointment.goals}</p>
                </div>
              ) : null}

              {selectedAppointment?.note ? (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-800 mb-1">Note</h2>
                  <p className="text-gray-600 leading-relaxed">{selectedAppointment.note}</p>
                </div>
              ) : null}

              {selectedAppointment?.aiSummary ? (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-1">Ai Summary</h2>
                  <p className="text-gray-600 leading-relaxed">{selectedAppointment.aiSummary}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Feedback</h2>

              <textarea
                className={`w-full mt-2 p-3 border ${error ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:border-teal-600`}
                rows="4"
                placeholder="Write feedback..."
                value={feedback}
                onChange={(e) => {
                  setFeedback(e.target.value);
                  if (error) setError(false); // clear error when typing
                }}
              ></textarea>

              {error && (
                <p className="text-red-500 text-sm mt-1">Please write feedback</p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!feedback.trim()) {
                      setError(true);
                    } else {
                      setError(false);
                      setIsModalOpen(false);
                      // submit feedback here
                    }
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  }

  return (
    <>
      <div className="h-full">
        <div className="max-w-6xl mx-auto px-4 md:px-0">
          <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
            <div className="w-full md:w-auto">
              <h1 className="text-xl font-semibold text-gray-900">My Appointments</h1>
              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'upcoming' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('completed')}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${activeTab === 'completed' ? 'bg-teal-700 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                >
                  Completed
                </button>
              </div>
            </div>

            <div className="relative w-full md:w-auto" ref={calendarRef}>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full md:w-56 flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm text-gray-700">
                  {isDateSelected ? formatDate(selectedDate) : 'Select Date'}
                </span>
                <Calendar className="w-5 h-5 text-gray-500" />
              </button>

              {showCalendar && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4 w-80">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => navigateMonth(-1)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                    </button>
                    <h3 className="font-semibold">
                      {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigateMonth(1)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendar().map((day, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => handleDateSelect(day)}
                        className={`h-8 text-sm rounded transition-colors ${day === selectedDate.getDate()
                          ? 'bg-teal-600 text-white hover:bg-teal-700'
                          : day
                            ? 'text-gray-700 hover:bg-teal-100'
                            : 'cursor-default'
                        }`}
                        disabled={!day}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? <div className="text-gray-600">Loading...</div> : null}
            {!isLoading && appointments.length === 0 ? (
              <div className="text-gray-600">No appointments found.</div>
            ) : null}
            {!isLoading && appointments.map((appointment, idx) => {
              // Extract fields from new appointment object structure
              const user = appointment.user || {};
              const title = user.name || user.fullName || user.email || 'Client';
              const image = user.profileImage
                ? sanitizeImageUrl(user.profileImage)
                : 'https://i.pravatar.cc/120';
              const key = appointment._id || idx;

              const dateStr = appointment.appointmentDate;
              const timeStr = (appointment.startTime && appointment.endTime)
                ? `${appointment.startTime} - ${appointment.endTime}`
                : (appointment.startTime || '');
              const dateObj = dateStr ? new Date(dateStr) : null;

              // Filter logic if date is selected
              if (isDateSelected) {
                // If date is selected, compare. 
                // Assuming appointment.date is ISO or "YYYY-MM-DD"
                if (dateObj) {
                  const isSameDay =
                    dateObj.getDate() === selectedDate.getDate() &&
                    dateObj.getMonth() === selectedDate.getMonth() &&
                    dateObj.getFullYear() === selectedDate.getFullYear();
                  if (!isSameDay) return null;
                }
              }

              const metaLine = (dateObj || timeStr)
                ? `${dateObj ? formatCardDate(null, dateObj) : ''} ${timeStr ? '· ' + timeStr : ''}`
                : '';

              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleAppointmentClick(appointment)}
                  className="bg-white rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={image}
                      alt={title}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
                      <div className="text-xs text-gray-500 mt-1">{metaLine}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default Appointment;
