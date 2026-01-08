import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Method, callApi } from '../../netwrok/NetworkManager';
import { api } from '../../netwrok/Environment';
// Modal Component
const TrackAttendence = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPercent = (value) => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return '-';
    const rounded = Math.round(n * 10) / 10;
    return `${rounded}%`;
  };

  const toYyyyMmDd = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const range = useMemo(() => {
    const end = new Date(selectedDate);
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - 29);
    return { startDate: toYyyyMmDd(start), endDate: toYyyyMmDd(end) };
  }, [selectedDate]);

  const endPoint = useMemo(() => {
    const params = new URLSearchParams();
    if (range.startDate) params.set('startDate', range.startDate);
    if (range.endDate) params.set('endDate', range.endDate);
    const query = params.toString();
    return query ? `${api.attendanceSummary}?${query}` : api.attendanceSummary;
  }, [range]);

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
    let isActive = true;
    setIsLoading(true);
    setApiError('');

    void callApi({
      method: Method.GET,
      endPoint,
      onSuccess: (response) => {
        if (!isActive) return;
        setEntries(Array.isArray(response?.data) ? response.data : []);
        setCurrentPage(1);
        setIsLoading(false);
      },
      onError: (err) => {
        if (!isActive) return;
        setApiError(err?.message || 'Failed to load attendance summary.');
        setEntries([]);
        setIsLoading(false);
      },
    });

    return () => {
      isActive = false;
    };
  }, [endPoint]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const generateCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
  
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDateSelect = (day) => {
    if (day) {
      const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      setSelectedDate(newDate);
      setShowCalendar(false);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEntries = entries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(entries.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };




  return (
    <> 
   
      <div className="bg-white p-4 rounded-2xl min-h-[calc(100vh-180px)]">
        
        <div className="w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text- font-semibold text-teal-600">Track Attendance </h1>
            
            {/* Date Selector */}
            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">{formatDate(selectedDate)}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Calendar Dropdown */}
              {showCalendar && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4 w-80">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => navigateMonth(-1)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                    </button>
                    <h3 className="font-semibold">
                      {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                      onClick={() => navigateMonth(1)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendar().map((day, index) => {
                      const isFuture = day && new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day) > new Date();
                      return (
                      <button
                        key={index}
                        onClick={() => !isFuture && handleDateSelect(day)}
                        className={`h-8 text-sm rounded transition-colors ${
                          day === selectedDate.getDate() ? 'bg-teal-600 text-white hover:bg-teal-700' : 
                          day && !isFuture ? 'text-gray-700 hover:bg-teal-100' : ''
                        } ${isFuture ? 'text-gray-300 cursor-default' : ''}`}
                        disabled={!day || isFuture}
                      >
                        {day}
                      </button>
                    )})}
                  </div>
                </div>
              )}
            </div>
          </div>

          {apiError ? <div className="text-red-500 text-sm mb-4">{apiError}</div> : null}
          {isLoading ? <div className="text-gray-600 text-sm mb-4">Loading...</div> : null}

         
           {/* Attendance Table */}
        <div className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Table Header */}
              <div className="bg-teal-600 text-white rounded-xl">
                <div className="grid grid-cols-4 gap-4 p-4 font-semibold text-lg ">
                  <div className="text-left">Name</div>
                  <div className="text-center">Absent</div>
                  <div className="text-center">Attend From Gym</div>
                  <div className="text-center">Attend from Home</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {!isLoading && entries.length === 0 ? (
                  <div className="p-6 text-gray-600">No attendance data found.</div>
                ) : null}
                {currentEntries.map((row, idx) => {
                  const key = row?.userId || row?._id || row?.id || `${row?.name || 'row'}-${idx}`;
                  const stats = row?.stats || {};
                  return (
                  <div key={key} className="grid grid-cols-4 gap-4 p-6 items-center ">
                    {/* Name */}
                    <div className="text-left">
                      <p className="font-medium text-gray-700 text-lg">{row?.name || '-'}</p>
                    </div>

                    {/* Absent */}
                    <div className="text-center">
                      <span className="text-gray-600 text-lg">{formatPercent(stats?.percentAbsent)}</span>
                    </div>

                    {/* Attend From Gym */}
                    <div className="text-center">
                      <span className="text-gray-600 text-lg">{formatPercent(stats?.percentGym)}</span>
                    </div>

                    {/* Attend from Home */}
                    <div className="text-center">
                      <span className="text-gray-600 text-lg">{formatPercent(stats?.percentHome)}</span>
                    </div>
                  </div>
                )})}
                {/* Fill empty rows to maintain height */}
                {Array.from({ length: Math.max(0, itemsPerPage - currentEntries.length) }).map((_, idx) => (
                   <div key={`empty-${idx}`} className="grid grid-cols-4 gap-4 p-6 items-center invisible">
                      <div className="text-left"><p className="font-medium text-lg">-</p></div>
                      <div className="text-center"><span className="text-lg">-</span></div>
                      <div className="text-center"><span className="text-lg">-</span></div>
                      <div className="text-center"><span className="text-lg">-</span></div>
                   </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && entries.length > itemsPerPage && (
            <div className="flex items-center justify-end gap-3 mt-0">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <span className="text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Modal */}

    </>
  );
};

export default TrackAttendence;
