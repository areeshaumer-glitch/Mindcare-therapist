import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ChevronDown, Clock, MapPin, X, Star } from 'lucide-react';
import { Method, callApi } from '../../netwrok/NetworkManager';
import { api } from '../../netwrok/Environment';
import { DEFAULT_AVATAR } from '../../assets/defaultAvatar';
import { useAuthStore } from '../../store/authSlice';
import GroupIcon from '../../assets/Images/Group.png';

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

const Appointment = () => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const calendarRef = useRef(null);
  const feedbackRef = useRef(null);
  const [error, setError] = useState(false);
  const [rating, setRating] = useState(5);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDateSelected, setIsDateSelected] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const { navigationEvent } = useOutletContext();

  useEffect(() => {
    if (navigationEvent?.label === 'Appointments') {
      setSelectedAppointment(null);
    }
  }, [navigationEvent]);

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

  useEffect(() => {
    try {
      if (isModalOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    } catch {}
    return () => {
      try {
        document.body.style.overflow = '';
      } catch {}
    };
  }, [isModalOpen]);

  const getAppointmentId = (appointment) => {
    if (!appointment) return null;
    return appointment._id || appointment.appointmentId || appointment.id || null;
  };

  const endPoint = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    let status = '';
    if (activeTab === 'upcoming' || activeTab === 'missing') {
      status = 'pending';
    } else if (activeTab === 'completed') {
      status = 'completed';
    }
    if (status) {
      params.set('status', status);
    }

    const query = params.toString();
    return `${api.appointmentsMe}?${query}`;
  }, [limit, page, activeTab]);

  const fetchAppointments = (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    
    callApi({
      method: Method.GET,
      endPoint,
      onSuccess: (response) => {
        const payload = response?.data ?? response;
        const list = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        setAppointments(list);
        setIsLoading(false);

        // Update selected appointment if it exists to ensure fresh data (like feedback)
         setSelectedAppointment(prev => {
             if (!prev) return null;
             const id = getAppointmentId(prev);
             const updated = list.find(a => getAppointmentId(a) === id);
             if (updated) {
                 console.log("Feedback: Updated appointment data:", updated);
                 console.log("Feedback: myFeedback field:", updated.myFeedback);
             }
             return updated || prev;
         });
      },
      onError: (err) => {
        if (!isBackground) {
            setAppointments([]);
            setIsLoading(false);
        }
      },
    });
  };

  const fetchFeedbackDetails = (appointmentId) => {
    console.log("Feedback: Fetching details for appointment:", appointmentId);
    // Try fetching from feedback/me
    callApi({
        method: Method.GET,
        endPoint: `${api.feedbackMe}?limit=100`, 
        onSuccess: (res) => {
            const payload = res?.data ?? res;
            const list = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
            
            console.log("Feedback: Fetched feedback list:", list.length);
            
            const match = list.find(f => 
                (f.appointmentId === appointmentId) || 
                (f.appointment?._id === appointmentId) ||
                (f.appointment === appointmentId)
            );

            if (match) {
                console.log("Feedback: Found matching feedback:", match);
                const feedbackData = {
                    comment: match.comment || match.text || match.description,
                    rating: match.rating,
                    type: match.type || 'session'
                };

                setSelectedAppointment(prev => {
                    if (!prev) return null;
                    if (getAppointmentId(prev) !== appointmentId) return prev;
                    return {
                        ...prev,
                        myFeedback: feedbackData
                    };
                });
                
                // Update main list too
                setAppointments(prev => 
                    prev.map(app => 
                        getAppointmentId(app) === appointmentId 
                        ? { ...app, myFeedback: feedbackData } 
                        : app
                    )
                );
            } else {
                console.log("Feedback: No matching feedback found in list");
            }
        },
        onError: (err) => {
            console.warn("Feedback: Failed to fetch feedback details", err);
        }
    });
  };

  useEffect(() => {
    let isActive = true;
    fetchAppointments();
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

  const handleMarkAsComplete = () => {
    const id = getAppointmentId(selectedAppointment);
    if (!id || isMarkingComplete) return;

    setIsMarkingComplete(true);

    void callApi({
      method: Method.PATCH,
      endPoint: `${api.appointments}/${id}/status`,
      bodyParams: { status: 'completed', completionComment: selectedAppointment?.completionComment || 'Shared after-session guidance.' },
      onSuccess: () => {
        setIsMarkingComplete(false);
        window.showToast?.('Appointment marked as complete', 'success');
        setSelectedAppointment((prev) => (prev ? { ...prev, status: 'completed' } : prev));
        setAppointments((prev) =>
          prev.map((a) => (getAppointmentId(a) === id ? { ...a, status: 'completed' } : a))
        );
      },
      onError: () => {
        setIsMarkingComplete(false);
      },
    });
  };

  const isAppointmentVisible = (appointment) => {
    const dateStr = appointment.appointmentDate || appointment.date;
    const start = appointment.startTime || appointment.time;
    const dateObj = dateStr ? new Date(dateStr) : null;

    let startsAt = null;
    if (dateObj && start) {
      const [h, m] = String(start).split(':').map(Number);
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        const d = new Date(dateObj);
        d.setHours(h, m, 0, 0);
        startsAt = d;
      }
    }

    const now = new Date();

    if (isDateSelected && dateObj) {
      const isSameDay =
        dateObj.getDate() === selectedDate.getDate() &&
        dateObj.getMonth() === selectedDate.getMonth() &&
        dateObj.getFullYear() === selectedDate.getFullYear();
      if (!isSameDay) return false;
    }

    if (activeTab === 'upcoming' && startsAt && startsAt <= now) {
      return false;
    }
    if (activeTab === 'missing' && startsAt && startsAt > now) {
      return false;
    }

    return true;
  };

  const visibleAppointments = appointments.filter(isAppointmentVisible);

  const Modal = ({ onClose, children }) => {
    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50"
        onClick={() => setIsModalOpen(false)}>
        <div className="bg-[#F9FAFB] shadow-lg rounded-lg max-w-md w-full mx-4 relative"
          onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    );
  };


  // Automatically try to fetch feedback if it's missing but status is completed
  useEffect(() => {
    if (selectedAppointment) {
      const statusValue = String(selectedAppointment.status || '').toLowerCase();
      // Check for myFeedback in various possible locations
      const myFeedbackData = selectedAppointment.myFeedback || selectedAppointment.feedback;
      const hasMyFeedback = !!(myFeedbackData && (myFeedbackData.comment || myFeedbackData.text || myFeedbackData.rating));

      if (statusValue === 'completed' && !hasMyFeedback) {
        const id = getAppointmentId(selectedAppointment);
        if (id) {
          fetchFeedbackDetails(id);
        }
      }
    }
  }, [selectedAppointment]);

  if (selectedAppointment) {
    const user = selectedAppointment.user || {};
    const profile = user.profile || {};
    const name =
      profile.name ||
      selectedAppointment.name ||
      user.name ||
      user.fullName ||
      '-';
    const profileImage =
      sanitizeImageUrl(profile.profilePicture) ||
      sanitizeImageUrl(selectedAppointment.profileImage) ||
      sanitizeImageUrl(user.profileImage) ||
      user.avatar ||
      DEFAULT_AVATAR;

    // Formatting date time
    const dateObj = selectedAppointment.appointmentDate ? new Date(selectedAppointment.appointmentDate) : null;
    const displayDate = dateObj ? dateObj.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase() : '';
    const displayTime = selectedAppointment.startTime ? formatTime12h(selectedAppointment.startTime) : '';

    const startRaw = selectedAppointment.startTime || selectedAppointment.time;
    let isUpcoming = false;
    if (dateObj && startRaw) {
      const [h, m] = String(startRaw).split(':').map(Number);
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        const d = new Date(dateObj);
        d.setHours(h, m, 0, 0);
        isUpcoming = d > new Date();
      }
    }
    const statusValue = String(selectedAppointment.status || '').toLowerCase();
    
    // Check for myFeedback in various possible locations
    const myFeedbackData = selectedAppointment.myFeedback || selectedAppointment.feedback;
    const hasMyFeedback = !!(myFeedbackData && (myFeedbackData.comment || myFeedbackData.text || myFeedbackData.rating));
    
    const canMarkComplete = statusValue === 'pending' && isUpcoming;
    const canGiveFeedback = statusValue === 'completed' && !hasMyFeedback;

    return (
      <>
        <div className="h-full">
          <div className="w-full">
           

            <div className="bg-white rounded-[24px] shadow-sm p-6">
              <div className="flex items-center mb-6">
                <img
                  src={profileImage}
                  alt={name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <h1 className="font-nunito font-bold text-[18px] leading-[24px] tracking-[0px] text-[#121212]">{name}</h1>
              </div>

              <div className="mb-6">
                <h2 className="font-nunito font-bold text-[18px] leading-[24px] tracking-[0px] text-[#121212] mb-2">Appointment date & time</h2>
                <div className="flex flex-wrap items-center gap-6 text-[#121212]">
                  <div className="flex items-center font-nunito font-normal text-[16px] leading-[26px] tracking-[0px] uppercase">
                    <CalendarDays className="w-5 h-5 mr-3" />
                    <span>{displayDate || 'Date not available'}</span>
                  </div>
                  <div className="flex items-center font-nunito font-normal text-[16px] leading-[26px] tracking-[0px] uppercase">
                    <Clock className="w-5 h-5 mr-3" />
                    <span>{displayTime || 'Time not available'}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="font-nunito font-bold text-[18px] leading-[24px] tracking-[0px] text-[#121212] mb-2">Mental Health Goals</h2>
                <p className="font-nunito font-normal text-[16px] leading-[100%] tracking-[0px] text-[#121212]">{selectedAppointment?.goals || 'No goals provided.'}</p>
              </div>

              <div className="mb-6">
                <h2 className="font-nunito font-bold text-[18px] leading-[24px] tracking-[0px] text-[#121212] mb-2">Note</h2>
                <p className="font-nunito font-normal text-[16px] leading-[100%] tracking-[0px] text-[#121212]">{selectedAppointment?.note || 'No notes provided.'}</p>
              </div>

              <div>
                <h2 className="font-nunito font-bold text-[18px] leading-[24px] tracking-[0px] text-[#121212] mb-2">AI Summary</h2>
                <p className="font-nunito font-normal text-[16px] leading-[100%] tracking-[0px] text-[#121212]">{selectedAppointment?.aiSummary || 'No AI summary available.'}</p>
              </div>
              {hasMyFeedback && (
                <div className="mt-6">
                  <h2 className="font-nunito font-bold text-[18px] leading-[24px] tracking-[0px] text-[#121212] mb-2">My feedback</h2>
                  <p className="font-nunito font-normal text-[16px] leading-[100%] tracking-[0px] text-[#121212]">
                    {myFeedbackData?.comment || myFeedbackData?.text || '—'}
                  </p>
                </div>
              )}
              {activeTab === 'missing' && (
                <div className="mt-6">
                  <h2 className="font-nunito font-bold text-[18px] leading-[24px] tracking-[0px] text-[#121212] mb-2">Reason for Missing</h2>
                  <p className="font-nunito font-normal text-[16px] leading-[100%] tracking-[0px] text-[#121212]">
                    {selectedAppointment?.missingReason || 'No reason provided.'}
                  </p>
                </div>
              )}
              {canMarkComplete && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleMarkAsComplete}
                    disabled={isMarkingComplete}
                    className={`w-[221px] h-[48px] rounded-[12px] border text-sm font-medium flex items-center justify-center ${
                      isMarkingComplete
                        ? 'bg-teal-300 border-teal-300 cursor-not-allowed text-white'
                        : 'bg-teal-700 border-teal-700 hover:bg-teal-800 hover:border-teal-800 text-white'
                    }`}
                  >
                    {isMarkingComplete ? 'Marking...' : 'Mark As Complete'}
                  </button>
                </div>
              )}
              {canGiveFeedback && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(true);
                      setRating(5);
                      if (feedbackRef.current) feedbackRef.current.value = '';
                    }}
                    className="w-[221px] h-[48px] rounded-[12px] border text-sm font-medium flex items-center justify-center bg-teal-700 border-teal-700 hover:bg-teal-800 hover:border-teal-800 text-white"
                  >
                    Give Feedback
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Feedback</h2>

              

              <textarea
                ref={feedbackRef}
                className={`w-full mt-2 p-3 border ${error ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:border-teal-600 resize-none`}
                rows="5"
                placeholder="Add Feedback"
                onChange={() => {
                  if (error) setError(false);
                }}
              ></textarea>

              {error && (
                <p className="text-red-500 text-sm mt-1">Please write feedback</p>
              )}

              <div className="mt-6 flex justify-end gap-3">
               
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      console.log("Feedback: Send button clicked");
                      
                      const value = feedbackRef?.current?.value || '';
                      console.log("Feedback: Comment value:", value);

                      if (!value.trim()) {
                        console.log("Feedback: Comment is empty");
                        setError(true);
                        return;
                      }
                      setError(false);

                      const appointmentId = getAppointmentId(selectedAppointment);
                      console.log("Feedback: Appointment ID:", appointmentId);

                      if (!appointmentId) {
                        console.error("Feedback: No appointment ID found");
                        window.showToast?.('Appointment not found.', 'error');
                        return;
                      }

                      const userId = selectedAppointment?.user?._id || selectedAppointment?.userId;

                      let instructorProfileId = '';
                      try {
                        // 1. Try from appointment object
                        const fromAppt = selectedAppointment?.therapistProfile?._id;
                        if (fromAppt) instructorProfileId = String(fromAppt).trim();
                        console.log("Feedback: ID from appointment:", instructorProfileId);

                        // 2. Try from auth store
                        if (!instructorProfileId) {
                          const storeState = useAuthStore.getState();
                          const fromStore = storeState?.userData?.profile?._id || storeState?.userData?.therapistProfile?._id;
                          if (fromStore) instructorProfileId = String(fromStore).trim();
                          console.log("Feedback: ID from store:", instructorProfileId);
                        }

                        // 3. Try from API
                        if (!instructorProfileId) {
                          console.log("Feedback: Fetching ID from API...");
                          await callApi({
                            method: Method.GET,
                            endPoint: api.therapistProfileMe,
                            onSuccess: (res) => {
                              const payload = res?.data ?? res;
                              const data = payload?.data ?? payload;
                              const p = data?.therapistProfile ?? data?.profile ?? data?.therapist ?? data;
                              const idVal = p?._id || p?.profile?._id || '';
                              if (idVal) instructorProfileId = String(idVal).trim();
                              console.log("Feedback: ID from API success:", instructorProfileId);
                            },
                            onError: (err) => {
                              console.warn("Feedback: Failed to fetch therapist profile", err);
                            },
                          });
                        }
                      } catch (err) {
                        console.error("Feedback: Error resolving profile ID", err);
                      }

                      console.log("Feedback: Final Instructor ID:", instructorProfileId);
                      console.log("Feedback: UserId:", userId);
                      
                      // Try sending minimal payload first
                      const params = {
                        type: 'session',
                        comment: value,
                        rating: rating,
                        appointmentId: appointmentId,
                      };
                      console.log("Feedback: RETRYING with minimal params:", params);

                      callApi({
                        method: Method.POST,
                        endPoint: api.feedback,
                        bodyParams: params,
                        onSuccess: () => {
                          console.log("Feedback: API Success");
                          window.showToast?.('Feedback submitted successfully', 'success');
                          setIsModalOpen(false);
                          setRating(5);
                          if (feedbackRef?.current) {
                            feedbackRef.current.value = '';
                          }
                          
                          const newFeedback = {
                            comment: value,
                            rating: rating,
                            type: 'session'
                          };

                          setSelectedAppointment((prev) => {
                            if (!prev) return prev;
                            // Update local state immediately for instant feedback
                            const updated = {
                              ...prev,
                              myFeedback: newFeedback,
                            };
                            return updated;
                          });
                          
                          setAppointments((prev) => 
                            prev.map(app => 
                              getAppointmentId(app) === appointmentId 
                                ? { ...app, myFeedback: newFeedback } 
                                : app
                            )
                          );
                        },
                        onError: (err) => {
                          console.error("Feedback: API Error", err);
                          
                          if (err?.message && (
                            err.message.toLowerCase().includes("already submitted") ||
                            err.message.toLowerCase().includes("duplicate")
                          )) {
                              console.log("Feedback: Feedback already exists, refreshing...");
                              window.showToast?.('Feedback already exists. Updating...', 'info');
                              setIsModalOpen(false);
                              
                              // Try to fetch the specific feedback details
                              if (appointmentId) {
                                  fetchFeedbackDetails(appointmentId);
                              } else {
                                  fetchAppointments(true);
                              }
                              return;
                          }

                          window.showToast?.('Unable to submit feedback. Please try again.', 'error');
                        },
                      });
                    }}
                    className="w-[244px] h-[48px] rounded-[16px] bg-teal-600 text-white hover:bg-teal-700 transition-colors"
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
                  className={`w-[121px] h-[33px] px-[21px] py-[9px] rounded-[16px] text-sm font-medium flex items-center justify-center gap-[10px] ${activeTab === 'upcoming' ? 'bg-teal-700 text-white' : 'bg-[#E6E6E6] text-gray-700'
                    }`}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('completed')}
                  className={`w-[121px] h-[33px] px-[21px] py-[9px] rounded-[16px] text-sm font-medium flex items-center justify-center gap-[10px] ${activeTab === 'completed' ? 'bg-teal-700 text-white' : 'bg-[#E6E6E6] text-gray-700'
                    }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('missing')}
                  className={`w-[121px] h-[33px] px-[21px] py-[9px] rounded-[16px] text-sm font-medium flex items-center justify-center gap-[10px] ${activeTab === 'missing' ? 'bg-teal-700 text-white' : 'bg-[#E6E6E6] text-gray-700'
                    }`}
                >
                  Missing
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
                <img src={GroupIcon} alt="Calendar" className="w-5 h-5" />
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
            {!isLoading && visibleAppointments.length === 0 ? (
              <div className="text-gray-600">
                {activeTab === 'upcoming'
                  ? 'No upcoming appointments.'
                  : activeTab === 'completed'
                    ? 'No completed appointments.'
                    : activeTab === 'missing'
                      ? 'No missing appointments.'
                      : 'No appointments found.'}
              </div>
            ) : null}
            {!isLoading && visibleAppointments.map((appointment, idx) => {
              const user = appointment.user || {};
              const profile = user.profile || {};
              const title =
                profile.name ||
                appointment.name ||
                user.name ||
                user.fullName ||
                '-';
              const image =
                (profile.profilePicture
                  ? sanitizeImageUrl(profile.profilePicture)
                  : null) ||
                (user.profileImage
                  ? sanitizeImageUrl(user.profileImage)
                  : null) ||
                DEFAULT_AVATAR;
              const key = appointment._id || idx;

              const dateStr = appointment.appointmentDate || appointment.date;
              const start = appointment.startTime || appointment.time;
              const timeStr = start ? formatTime12h(start) : '';
              const dateObj = dateStr ? new Date(dateStr) : null;

              const metaLine = (dateObj || timeStr)
                ? `${dateObj ? formatCardDate(null, dateObj) : ''} ${timeStr ? '- ' + timeStr : ''}`
                : '';

              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => handleAppointmentClick(appointment)}
                  className="bg-white rounded-[24px] w-[316px] h-[120px] p-6 cursor-pointer duration-200 shadow-sm hover:shadow-md flex items-center opacity-100 text-left"
                >
                  <img
                    src={image}
                    alt={title}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{title}</h3>
                    <p className="text-sm text-gray-600">{metaLine}</p>
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
