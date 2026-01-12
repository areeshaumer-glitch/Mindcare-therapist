import React, { useState, useEffect } from 'react';
import { Plus, Minus, Check } from 'lucide-react';

const TimeInput = ({ value, onChange, placeholder, hasError }) => (
  <div className="relative">
    <input
      type={value ? "time" : "text"}
      onFocus={(e) => (e.target.type = "time")}
      onBlur={(e) => {
        if (!e.target.value) e.target.type = "text";
      }}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-[140px] px-4 py-3 bg-[#F8F8F8] rounded-[8px] focus:outline-none text-gray-700 placeholder-gray-400 ${
        hasError ? 'border border-red-500' : 'border-none'
      }`}
    />
  </div>
);

const TimeSlot = ({ onClick, onNext, isSubmitting = false, onSelectionChange }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [selectedDays, setSelectedDays] = useState({
    Monday: true,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
  });

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedDays);
    }
  }, [selectedDays, onSelectionChange]);

  const [showExtraBoxes, setShowExtraBoxes] = useState({});
  const [timeSlots, setTimeSlots] = useState({});
  const [errors, setErrors] = useState({});
  const [isSame, setIsSame] = useState(false);

  useEffect(() => {
    // Initialize all days
    const initialSlots = {};
    days.forEach(day => {
      initialSlots[day] = [{ from: '', to: '' }];
    });
    setTimeSlots(initialSlots);
  }, []);

  const handleDayChange = (day) => {
    const isSelecting = !selectedDays[day];
    setSelectedDays(prev => ({
      ...prev,
      [day]: isSelecting
    }));

    // If we are selecting a new day and isSame is true
    if (isSelecting && isSame) {
      // Find the previous selected day
      const dayIndex = days.indexOf(day);
      let previousDay = null;
      
      // Look backwards for the nearest selected day
      for (let i = dayIndex - 1; i >= 0; i--) {
        const d = days[i];
        if (selectedDays[d]) {
          previousDay = d;
          break;
        }
      }

      // If no previous selected day found, maybe default to Monday if it has data?
      // Or just strictly follow "previous selected day". 
      // If Monday is deselected, we might not have a source. 
      // Let's assume Monday is usually the source or the first selected day.
      if (previousDay && timeSlots[previousDay]) {
        const filteredSlots = timeSlots[previousDay].filter(slot => slot.from.trim() && slot.to.trim());
        setTimeSlots(prev => ({
          ...prev,
          [day]: filteredSlots.length > 0 ? filteredSlots.map(slot => ({ ...slot })) : [{ from: '', to: '' }]
        }));
      } else if (dayIndex > 0 && selectedDays['Monday']) {
          // Fallback to Monday if previous wasn't found but Monday is there
          // This covers cases where user skips days but wants "Same"
           const filteredSlots = timeSlots['Monday'].filter(slot => slot.from.trim() && slot.to.trim());
           setTimeSlots(prev => ({
            ...prev,
            [day]: filteredSlots.length > 0 ? filteredSlots.map(slot => ({ ...slot })) : [{ from: '', to: '' }]
          }));
      }
    }
  };

  const handleSameChange = () => {
    const newIsSame = !isSame;
    setIsSame(newIsSame);

    if (newIsSame) {
      // Find the first selected day to use as source
      const firstSelectedDay = days.find(day => selectedDays[day]);
      
      if (firstSelectedDay && timeSlots[firstSelectedDay]) {
        const sourceSlots = timeSlots[firstSelectedDay].filter(slot => slot.from.trim() && slot.to.trim());
        
        setTimeSlots(prev => {
          const newSlots = { ...prev };
          days.forEach(day => {
            // Update all other selected days to match source
            if (selectedDays[day] && day !== firstSelectedDay) {
              newSlots[day] = sourceSlots.length > 0 ? sourceSlots.map(slot => ({ ...slot })) : [{ from: '', to: '' }];
            }
          });
          return newSlots;
        });
      }
    }
  };

  const handleTimeChange = (day, index, field, value) => {
    setTimeSlots(prev => {
      const daySlots = [...(prev[day] || [])];
      if (!daySlots[index]) daySlots[index] = { from: '', to: '' };
      daySlots[index] = { ...daySlots[index], [field]: value };
      return { ...prev, [day]: daySlots };
    });

    if (value.trim()) {
      setErrors(prev => ({
        ...prev,
        [`${day}-${index}-${field}`]: false
      }));
    }
  };

  const addSlot = (day) => {
    setTimeSlots(prev => {
      const currentSlots = prev[day] || [];
      if (currentSlots.length < 3) {
        return { ...prev, [day]: [...currentSlots, { from: '', to: '' }] };
      }
      return prev;
    });
  };

  const removeSlot = (day) => {
    setTimeSlots(prev => {
      const currentSlots = prev[day] || [];
      if (currentSlots.length > 1) {
        return { ...prev, [day]: currentSlots.slice(0, -1) };
      }
      return prev;
    });
  };

  const validateFields = () => {
    const newErrors = {};
    let hasErrors = false;

    Object.keys(selectedDays).forEach(day => {
      if (selectedDays[day]) {
        const slots = timeSlots[day] || [];
        slots.forEach((slot, index) => {
          if (!slot.from.trim()) {
            newErrors[`${day}-${index}-from`] = true;
            hasErrors = true;
          }
          if (!slot.to.trim()) {
            newErrors[`${day}-${index}-to`] = true;
            hasErrors = true;
          }
        });
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleNext = () => {
    if (isSubmitting) return;
    if (!validateFields()) return;

    const availability = Object.keys(selectedDays)
      .filter((day) => selectedDays[day])
      .map((day) => {
        const slots = (timeSlots[day] || [])
          .filter(slot => slot.from && slot.to)
          .map(slot => ({ from: slot.from, to: slot.to }));
        
        return { day: day.toLowerCase(), timeSlots: slots };
      })
      .filter((d) => d.timeSlots.length > 0);

    if (typeof onNext === 'function') {
      onNext(availability);
      return;
    }

    if (typeof onClick === 'function') {
      onClick();
    }
  };

  return (
    <div className="bg-white p-6 md:py-8 md:pr-8 md:pl-[60px] w-full mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Add Time slot</h1>

      <div className="space-y-5 mb-2">
        {days.map((day, index) => (
          <div key={day} className="flex flex-col gap-3">
            {/* Day Row Header */}
            <div className="flex items-center gap-4">
               {/* Custom Checkbox */}
               <label className="flex items-center cursor-pointer gap-3">
                 <div className={`w-6 h-6 rounded-[6px] border flex items-center justify-center transition-colors ${
                   selectedDays[day] ? 'bg-teal-700 border-teal-700' : 'border-gray-300'
                 }`}>
                   {selectedDays[day] && <Check size={16} className="text-white" strokeWidth={3} />}
                 </div>
                 <input
                   type="checkbox"
                   checked={selectedDays[day]}
                   onChange={() => handleDayChange(day)}
                   className="hidden"
                 />
                 <span className="text-gray-900 font-bold text-base">{day}</span>
               </label>

               {/* Same Checkbox (Monday Only) */}
               {index === 0 && (
                 <label className="flex items-center cursor-pointer gap-3 ml-2">
                   <div className={`w-6 h-6 rounded-[6px] border flex items-center justify-center transition-colors ${
                     isSame ? 'border-teal-700' : 'border-gray-300'
                   }`}>
                     {/* The image shows an empty box for 'Same' unless checked. Assuming checked state styling similar to others or just border?
                         The image shows 'Same' unchecked. I'll make it consistent. */}
                     {isSame && <Check size={16} className="text-teal-700" strokeWidth={3} />}
                   </div>
                   <input
                    type="checkbox"
                    checked={isSame}
                    onChange={handleSameChange}
                    className="hidden"
                  />
                   <span className="text-gray-500 text-base">Same</span>
                 </label>
               )}
            </div>

            {/* Time Slots */}
            {selectedDays[day] && (
              <div className="flex flex-nowrap items-center gap-4 overflow-x-auto pb-2 hide-scrollbar">
                {/* Dynamic Slots */}
                {(timeSlots[day] || []).map((slot, index) => (
                  <React.Fragment key={index}>
                    <TimeInput
                      placeholder="From"
                      value={slot.from || ''}
                      onChange={(e) => handleTimeChange(day, index, 'from', e.target.value)}
                      hasError={errors[`${day}-${index}-from`]}
                    />
                    <TimeInput
                      placeholder="To"
                      value={slot.to || ''}
                      onChange={(e) => handleTimeChange(day, index, 'to', e.target.value)}
                      hasError={errors[`${day}-${index}-to`]}
                    />
                  </React.Fragment>
                ))}

                {/* Add/Remove Button */}
                {(timeSlots[day] || []).length < 3 ? (
                  <button
                    onClick={() => addSlot(day)}
                    className="w-8 h-8 bg-teal-700 hover:bg-teal-800 text-white rounded-full flex items-center justify-center ml-2 transition-colors shrink-0"
                  >
                    <Plus size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => removeSlot(day)}
                    className="w-8 h-8 bg-teal-700 hover:bg-teal-800 text-white rounded-full flex items-center justify-center ml-2 transition-colors shrink-0"
                  >
                    <Minus size={18} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-end pt-0">
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-[12px] transition-colors uppercase text-sm tracking-wide flex items-center justify-center"
          style={{ width: '390px', height: '48px', gap: '32px' }}
        >
          NEXT
        </button>
      </div>
    </div>
  );
};

export default TimeSlot;
