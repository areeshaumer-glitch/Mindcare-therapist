import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import EditProfile from '../../components/EditProfile';
import ChangePassword from '../../components/ChangePassword';
import TermsConditions from '../../components/TermCondition';
import PrivacyPolicy from '../../components/PrivacyPolicy';

import { Method, callApi } from '../../netwrok/NetworkManager';
import { api } from '../../netwrok/Environment';

const MyProfile = () => {
  const [selectedSection, setSelectedSection] = useState('editProfile');
  const { therapistProfile, refreshProfile } = useOutletContext() || {};

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedSection]);

  const renderContent = () => {
    switch (selectedSection) {
      case 'editProfile':
        return <EditProfile profile={therapistProfile} onProfileUpdate={refreshProfile} />;
      case 'changePassword':
        return <ChangePassword />;
      case 'comments':
        return <CommentsPanel />;
      case 'timeSlot':
        return <TimeSlotPanel availability={therapistProfile?.availability} />;
      case 'terms':
        return <TermsConditions />;
      case 'privacy':
        return <PrivacyPolicy />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row gap-4 md:gap-6 max-[450px]:gap-3 max-[450px]:overflow-x-hidden">
      <div className="w-full md:w-1/3 lg:w-1/4 space-y-4 px-4 md:px-0 max-[450px]:px-2 max-[450px]:space-y-3">
        <MenuItem
          label="Edit Profile"
          subtitle="Details about your Personal Info"
          active={selectedSection === 'editProfile'}
          onClick={() => setSelectedSection('editProfile')}
        />
        <MenuItem
          label="Change Password"
          subtitle="Change your password for security"
          active={selectedSection === 'changePassword'}
          onClick={() => setSelectedSection('changePassword')}
        />
        <MenuItem
          label="My Comments"
          subtitle="Lorem ipsum dolor sit"
          active={selectedSection === 'comments'}
          onClick={() => setSelectedSection('comments')}
        />
        <MenuItem
          label="Time Slot"
          subtitle="Update Appointment Time"
          active={selectedSection === 'timeSlot'}
          onClick={() => setSelectedSection('timeSlot')}
        />
        <ToggleItem label="App Notifications" />
        <MenuItem
          label="Terms & Condition"
          subtitle="Details about terms & condition"
          active={selectedSection === 'terms'}
          onClick={() => setSelectedSection('terms')}
        />
        <MenuItem
          label="Privacy Policy"
          subtitle="Details about Privacy Policy"
          active={selectedSection === 'privacy'}
          onClick={() => setSelectedSection('privacy')}
        />
      </div>
      <div className="w-full md:flex-1 bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-6 mx-4 md:mx-0 max-[450px]:mx-2 max-[450px]:p-3 h-fit min-h-[450px]">
        {renderContent()}
      </div>
    </div>
  );
};

const MenuItem = ({ label, subtitle, onClick, active }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer p-4 max-[450px]:p-3 rounded-xl shadow-sm border flex justify-between items-center w-full ${active ? 'border-teal-700' : 'border-gray-100'
      } bg-white hover:bg-gray-50 transition`}
  >
    <div>
      <div className="font-semibold text-black max-[450px]:text-sm">{label}</div>
      {subtitle ? <div className="text-xs text-gray-500 mt-1 max-[450px]:text-[11px]">{subtitle}</div> : null}
    </div>
    <ChevronRight className="w-4 h-4 text-gray-500" />
  </div>
);

const ToggleItem = ({ label }) => {
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="flex items-center justify-between p-4 max-[450px]:p-3 rounded-xl shadow-sm border border-gray-100 bg-white w-full">
      <div>
        <div className="font-semibold text-black max-[450px]:text-sm">{label}</div>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`w-12 h-6 rounded-full p-1 transition ${enabled ? 'bg-teal-600' : 'bg-gray-300'} max-[450px]:w-11 max-[450px]:h-5`}
      >
        <div className={`w-4 h-4 rounded-full bg-white transition transform ${enabled ? 'translate-x-6' : ''} max-[450px]:w-3.5 max-[450px]:h-3.5`}></div>
      </button>
    </div>
  );
};

const CommentsPanel = () => {
  const comments = useMemo(
    () => [
      {
        id: 1,
        author: 'Anonymous',
        body: 'Lorem ipsum dolor sit amet consectetur. Purus massa tristique arcu tempus ut ac porttitor. Lorem ipsum dolor sit amet consectetur.',
      },
      {
        id: 2,
        author: 'Anonymous',
        body: 'Lorem ipsum dolor sit amet consectetur. Purus massa tristique arcu tempus ut ac porttitor. Lorem ipsum dolor sit amet consectetur.',
      },
      {
        id: 3,
        author: 'Anonymous',
        body: 'Lorem ipsum dolor sit amet consectetur. Purus massa tristique arcu tempus ut ac porttitor. Lorem ipsum dolor sit amet consectetur.',
      },
      {
        id: 4,
        author: 'Anonymous',
        body: 'Lorem ipsum dolor sit amet consectetur. Purus massa tristique arcu tempus ut ac porttitor. Lorem ipsum dolor sit amet consectetur.',
      },
    ],
    []
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-baseline gap-2 mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
        <span className="text-sm text-gray-400">(1040)</span>
      </div>

      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
            <div className="text-sm font-semibold text-gray-900 mb-2">{c.author}</div>
            <div className="text-sm text-gray-500 leading-relaxed">{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimeSlotPanel = ({ availability }) => {
  const initialAppliedRef = useRef(false);
  const allDays = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], []);
  const [isUpdating, setIsUpdating] = useState(false);

  const [selectedDays, setSelectedDays] = useState(() => ({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
  }));

  const [daySlots, setDaySlots] = useState(() => ({
    Monday: { slot1: { from: '', to: '' }, slot2: { from: '', to: '' } },
    Tuesday: { slot1: { from: '', to: '' }, slot2: { from: '', to: '' } },
    Wednesday: { slot1: { from: '', to: '' }, slot2: { from: '', to: '' } },
    Thursday: { slot1: { from: '', to: '' }, slot2: { from: '', to: '' } },
    Friday: { slot1: { from: '', to: '' }, slot2: { from: '', to: '' } },
    Saturday: { slot1: { from: '', to: '' }, slot2: { from: '', to: '' } },
    Sunday: { slot1: { from: '', to: '' }, slot2: { from: '', to: '' } },
  }));

  const [showSlot2, setShowSlot2] = useState(() => ({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
  }));

  const [initialStateStr, setInitialStateStr] = useState('');

  const selectedCount = Object.values(selectedDays).filter(Boolean).length;

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        await callApi({
          method: Method.GET,
          endPoint: api.therapistProfileMe,
          onSuccess: (response) => {
            const fetchedAvailability = response?.data?.availability;
            if (Array.isArray(fetchedAvailability)) {
              const nextSelected = { ...selectedDays };
              const nextSlots = { ...daySlots };
              const nextShow2 = { ...showSlot2 };

              fetchedAvailability.forEach((d) => {
                const name = String(d?.day || '').trim().toLowerCase();
                const mapped =
                  name === 'monday'
                    ? 'Monday'
                    : name === 'tuesday'
                      ? 'Tuesday'
                      : name === 'wednesday'
                        ? 'Wednesday'
                        : name === 'thursday'
                          ? 'Thursday'
                          : name === 'friday'
                            ? 'Friday'
                            : name === 'saturday'
                              ? 'Saturday'
                              : name === 'sunday'
                                ? 'Sunday'
                                : null;

                if (!mapped) return;
                nextSelected[mapped] = true;
                const slots = Array.isArray(d?.timeSlots) ? d.timeSlots : [];
                if (slots[0]) nextSlots[mapped].slot1 = { from: slots[0]?.from || '', to: slots[0]?.to || '' };
                if (slots[1]) {
                  nextSlots[mapped].slot2 = { from: slots[1]?.from || '', to: slots[1]?.to || '' };
                  nextShow2[mapped] = true;
                }
              });

              setSelectedDays(nextSelected);
              setDaySlots(nextSlots);
              setShowSlot2(nextShow2);
              setInitialStateStr(JSON.stringify({
                selectedDays: nextSelected,
                daySlots: nextSlots,
                showSlot2: nextShow2
              }));
            }
          },
          onError: (err) => {
            console.error("Failed to fetch fresh availability", err);
          }
        });
      } catch (e) {
        console.error("Error fetching availability", e);
      }
    };

    fetchAvailability();
  }, []);

  const toggleDay = (day) => {
    setSelectedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const updateTime = (day, slot, field, value) => {
    setDaySlots((prev) => {
      const currentSlot = prev[day][slot];
      const updatedSlot = { ...currentSlot, [field]: value };
      
      // Auto-show Slot 2 if Slot 1 is filled (both start and end time)
      if (slot === 'slot1' && updatedSlot.from && updatedSlot.to) {
        setShowSlot2(prevShow => ({ ...prevShow, [day]: true }));
      }

      return {
        ...prev,
        [day]: { ...prev[day], [slot]: updatedSlot },
      };
    });
  };

  const handleUpdate = async () => {
    const currentState = {
      selectedDays,
      daySlots,
      showSlot2
    };

    if (initialStateStr && JSON.stringify(currentState) === initialStateStr) {
      if (window.showToast) {
        window.showToast("No time slot changes detected.", "error");
      }
      return;
    }

    // Validation: Ensure selected days have valid time slots
    const invalidDays = [];
    const daysToValidate = allDays.filter(day => selectedDays[day]);

    // Helper to check if slot is valid
    const isValidSlot = (s) => s.from && s.to && s.from < s.to;
    // Helper to check if slot is completely empty
    const isEmptySlot = (s) => !s.from && !s.to;

    for (const day of daysToValidate) {
      const dParams = daySlots[day];
      const s1Valid = isValidSlot(dParams.slot1);
      // Slot 2 is valid if it's either fully valid OR completely empty (even if shown)
      const s2Valid = !showSlot2[day] || isValidSlot(dParams.slot2) || isEmptySlot(dParams.slot2);

      if (!s1Valid || !s2Valid) {
        invalidDays.push(day);
      }
    }

    if (invalidDays.length > 0) {
      if (window.showToast) {
        window.showToast(`Please check time slots for: ${invalidDays.join(', ')}. Ensure start time is before end time.`, "error");
      }
      return;
    }

    setIsUpdating(true);
    try {
      const initialObj = initialStateStr ? JSON.parse(initialStateStr) : {};
      const initialSelected = initialObj.selectedDays || {};

      for (const day of allDays) {
        // Skip if day was unchecked and is still unchecked
        if (!selectedDays[day] && !initialSelected[day]) {
          continue;
        }

        const slots = [];
        // Only populate slots if day is currently selected
        if (selectedDays[day]) {
          const dParams = daySlots[day];

          if (isValidSlot(dParams.slot1)) {
            slots.push(dParams.slot1);
          }
          if (showSlot2[day] && isValidSlot(dParams.slot2)) {
            slots.push(dParams.slot2);
          }
        }
        // If !selectedDays[day], slots remains [], which clears the day

        // Important: API requires lower case day name
        await callApi({
          method: Method.PATCH,
          endPoint: api.availability,
          bodyParams: {
            day: day.toLowerCase(),
            timeSlots: slots
          },
          onError: (err) => {
            console.error(`Failed to update ${day}`, err);
          }
        });
      }

      if (window.showToast) {
        window.showToast("Availability updated successfully!", "success");
      }
      setInitialStateStr(JSON.stringify(currentState));
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6">
        {allDays.map((day) => (
          <div key={day} className="flex flex-col gap-3 pb-4 md:pb-0">
            <button
              type="button"
              onClick={() => toggleDay(day)}
              className="flex items-center gap-3 min-w-[140px] mb-2 md:mb-0"
            >
              <div
                className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${selectedDays[day] ? 'bg-teal-700 border-teal-700' : 'border-gray-200 bg-white'
                  }`}
              >
                {selectedDays[day] ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : null}
              </div>
              <span className="text-base font-bold text-[#102a43]">{day}</span>
            </button>

            {selectedDays[day] ? (
              <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto">
                {/* Slot 1 */}
                <input
                  type={daySlots[day].slot1.from ? "time" : "text"}
                  placeholder="From"
                  onFocus={(e) => (e.target.type = "time")}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.type = "text";
                  }}
                  value={daySlots[day].slot1.from}
                  onChange={(e) => updateTime(day, 'slot1', 'from', e.target.value)}
                  className="w-[calc(50%-0.5rem)] md:w-[130px] px-4 py-3 rounded-xl bg-[#F8F8F8] text-sm text-gray-600 focus:outline-none placeholder-gray-400"
                />
                <input
                  type={daySlots[day].slot1.to ? "time" : "text"}
                  placeholder="To"
                  onFocus={(e) => (e.target.type = "time")}
                  onBlur={(e) => {
                    if (!e.target.value) e.target.type = "text";
                  }}
                  value={daySlots[day].slot1.to}
                  onChange={(e) => updateTime(day, 'slot1', 'to', e.target.value)}
                  className="w-[calc(50%-0.5rem)] md:w-[130px] px-4 py-3 rounded-xl bg-[#F8F8F8] text-sm text-gray-600 focus:outline-none placeholder-gray-400"
                />

                {/* Slot 2 (merged into same flow) */}
                {showSlot2[day] ? (
                  <>
                    <input
                      type={daySlots[day].slot2.from ? "time" : "text"}
                      placeholder="From"
                      onFocus={(e) => (e.target.type = "time")}
                      onBlur={(e) => {
                        if (!e.target.value) e.target.type = "text";
                      }}
                      value={daySlots[day].slot2.from}
                      onChange={(e) => updateTime(day, 'slot2', 'from', e.target.value)}
                      className="w-[calc(50%-0.5rem)] md:w-[130px] px-4 py-3 rounded-xl bg-[#F8F8F8] text-sm text-gray-600 focus:outline-none placeholder-gray-400"
                    />
                    <input
                      type={daySlots[day].slot2.to ? "time" : "text"}
                      placeholder="To"
                      onFocus={(e) => (e.target.type = "time")}
                      onBlur={(e) => {
                        if (!e.target.value) e.target.type = "text";
                      }}
                      value={daySlots[day].slot2.to}
                      onChange={(e) => updateTime(day, 'slot2', 'to', e.target.value)}
                      className="w-[calc(50%-0.5rem)] md:w-[130px] px-4 py-3 rounded-xl bg-[#F8F8F8] text-sm text-gray-600 focus:outline-none placeholder-gray-400"
                    />
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}

        <div className="flex justify-end pt-6">
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isUpdating}
            className={`bg-teal-700 text-white font-medium w-[312px] h-[50px] rounded-[12px] hover:bg-teal-800 transition-colors flex items-center justify-center ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
