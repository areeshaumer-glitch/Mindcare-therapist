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

const TimeSlot = ({ onClick, onNext, isSubmitting = false }) => {
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

  const [showExtraBoxes, setShowExtraBoxes] = useState({});
  const [timeSlots, setTimeSlots] = useState({});
  const [errors, setErrors] = useState({});
  const [isSame, setIsSame] = useState(false);

  useEffect(() => {
    if (!timeSlots.Monday) {
      initializeDay('Monday');
    }
  }, []);

  const initializeDay = (day) => {
    setTimeSlots(prev => ({
      ...prev,
      [day]: {
        slot1: { from: '', to: '' },
        slot2: { from: '', to: '' }
      }
    }));
  };

  const handleDayChange = (day) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));

    if (!timeSlots[day]) {
      initializeDay(day);
    }
  };

  const handleTimeChange = (day, slot, field, value) => {
    setTimeSlots(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: {
          ...prev[day][slot],
          [field]: value
        }
      }
    }));

    if (value.trim()) {
      setErrors(prev => ({
        ...prev,
        [`${day}-${slot}-${field}`]: false
      }));
    }
  };

  const toggleExtraBoxes = (day) => {
    setShowExtraBoxes(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const validateFields = () => {
    const newErrors = {};
    let hasErrors = false;

    Object.keys(selectedDays).forEach(day => {
      if (selectedDays[day] && timeSlots[day]) {
        const slot1 = timeSlots[day].slot1;
        if (!slot1.from.trim()) {
          newErrors[`${day}-slot1-from`] = true;
          hasErrors = true;
        }
        if (!slot1.to.trim()) {
          newErrors[`${day}-slot1-to`] = true;
          hasErrors = true;
        }

        if (showExtraBoxes[day]) {
          const slot2 = timeSlots[day].slot2;
          if (!slot2.from.trim()) {
            newErrors[`${day}-slot2-from`] = true;
            hasErrors = true;
          }
          if (!slot2.to.trim()) {
            newErrors[`${day}-slot2-to`] = true;
            hasErrors = true;
          }
        }
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleNext = () => {
    if (isSubmitting) return;
    if (!validateFields()) return;

    const availability = Object.keys(selectedDays)
      .filter((day) => selectedDays[day] && timeSlots[day])
      .map((day) => {
        const slots = [];
        const slot1 = timeSlots[day]?.slot1;
        if (slot1?.from && slot1?.to) {
          slots.push({ from: slot1.from, to: slot1.to });
        }

        if (showExtraBoxes[day]) {
          const slot2 = timeSlots[day]?.slot2;
          if (slot2?.from && slot2?.to) {
            slots.push({ from: slot2.from, to: slot2.to });
          }
        }

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
    <div className="bg-white p-6 md:p-8 w-full max-w-5xl mx-auto">
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
                     onChange={() => setIsSame(!isSame)}
                     className="hidden"
                   />
                   <span className="text-gray-500 text-base">Same</span>
                 </label>
               )}
            </div>

            {/* Time Slots */}
            {selectedDays[day] && (
              <div className="flex flex-wrap items-center gap-4">
                {/* Slot 1 */}
                <TimeInput
                  placeholder="From"
                  value={timeSlots[day]?.slot1?.from || ''}
                  onChange={(e) => handleTimeChange(day, 'slot1', 'from', e.target.value)}
                  hasError={errors[`${day}-slot1-from`]}
                />
                <TimeInput
                  placeholder="To"
                  value={timeSlots[day]?.slot1?.to || ''}
                  onChange={(e) => handleTimeChange(day, 'slot1', 'to', e.target.value)}
                  hasError={errors[`${day}-slot1-to`]}
                />

                {/* Slot 2 */}
                {showExtraBoxes[day] && (
                  <>
                    <TimeInput
                      placeholder="From"
                      value={timeSlots[day]?.slot2?.from || ''}
                      onChange={(e) => handleTimeChange(day, 'slot2', 'from', e.target.value)}
                      hasError={errors[`${day}-slot2-from`]}
                    />
                    <TimeInput
                      placeholder="To"
                      value={timeSlots[day]?.slot2?.to || ''}
                      onChange={(e) => handleTimeChange(day, 'slot2', 'to', e.target.value)}
                      hasError={errors[`${day}-slot2-to`]}
                    />
                  </>
                )}

                {/* Add Button */}
                <button
                  onClick={() => toggleExtraBoxes(day)}
                  className="w-8 h-8 bg-teal-700 hover:bg-teal-800 text-white rounded-full flex items-center justify-center ml-2 transition-colors"
                >
                  {showExtraBoxes[day] ? <Minus size={18} /> : <Plus size={18} />}
                </button>
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
          className="bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 px-[150px] rounded-[12px] transition-colors uppercase text-sm tracking-wide"
        >
          NEXT
        </button>
      </div>
    </div>
  );
};

export default TimeSlot;
