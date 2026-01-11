import { useMemo, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import images from "../assets/Images";
import { DEFAULT_AVATAR } from "../assets/defaultAvatar";

export function WorkoutDetailsModal({ showModal, setShowModal, workoutData: _workoutData, onComplete }) {
  const [selectedDays, setSelectedDays] = useState([]);
  const initialReps = useMemo(() => ["", "", ""], []);
  const exerciseThumbnails = useMemo(
    () => [DEFAULT_AVATAR, DEFAULT_AVATAR, DEFAULT_AVATAR],
    []
  );
  const gymOptions = useMemo(
    () => ["Chest Press Machine", "Leg Press", "Lat Pulldown", "Shoulder Press Machine"],
    []
  );
  const homeOptions = useMemo(
    () => ["Push Ups", "Squats", "Plank", "Lunges"],
    []
  );

  const createExercise = (id) => ({
    id,
    name: `Exercise ${id}`,
    thumbnails: exerciseThumbnails,
    gym: {
      name: gymOptions[0],
      reps: [...initialReps],
    },
    home: {
      name: homeOptions[0],
      reps: [...initialReps],
    },
  });

  const [exercises, setExercises] = useState(() => [createExercise(1)]);
  const [errors, setErrors] = useState({});

  const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const addExercise = () => {
    setExercises((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((e) => e.id)) + 1 : 1;
      return [...prev, createExercise(nextId)];
    });
  };

  const updateReps = (exerciseId, location, setIndex, value) => {
    setExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        const next = {
          ...exercise,
          [location]: {
            ...exercise[location],
            reps: exercise[location].reps.map((rep, idx) => (idx === setIndex ? value : rep)),
          },
        };
        return next;
      })
    );
  };

  const getRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

  const regenerateExercise = (exerciseId) => {
    setExercises((prev) =>
      prev.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        return {
          ...exercise,
          gym: { ...exercise.gym, name: getRandomItem(gymOptions), reps: [...initialReps] },
          home: { ...exercise.home, name: getRandomItem(homeOptions), reps: [...initialReps] },
        };
      })
    );
  };

  const validate = () => {
    const newErrors = {};
    if (selectedDays.length === 0) {
      newErrors.days = 'Please select at least one day';
    }

    const repErrors = {};
    exercises.forEach((exercise) => {
      (["gym", "home"]).forEach((loc) => {
        exercise[loc].reps.forEach((rep, idx) => {
          if (!rep.trim()) {
            repErrors[`${exercise.id}-${loc}-${idx}`] = true;
          }
        });
      });
    });

    if (Object.keys(repErrors).length > 0) {
      newErrors.reps = repErrors;
      newErrors.sets = "Please fill all rep fields";
    }

    return newErrors;
  };

  const resetState = () => {
    setSelectedDays([]);
    setExercises([createExercise(1)]);
    setErrors({});
  };

  const handleComplete = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onComplete();
    resetState();
  };

  const closeModal = () => {
    setShowModal(false);
    resetState();
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex justify-center items-center z-[60]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 text-gray-500 text-xl hover:text-gray-700"
        >
          &times;
        </button>

        <h2 className="text-2xl font-semibold mb-6">Exercises</h2>

        <div className="flex gap-10">
          <div className="w-28 flex-shrink-0">
            <div className="space-y-3">
              {days.map((day) => (
                <div key={day} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={day}
                    checked={selectedDays.includes(day)}
                    onChange={() => toggleDay(day)}
                    className={`w-4 h-4 rounded ${
                      errors.days && !selectedDays.includes(day) ? "accent-red-600" : "accent-teal-700"
                    }`}
                  />
                  <label 
                    htmlFor={day} 
                    className={`text-sm ${
                      errors.days && !selectedDays.includes(day) ? 'text-red-500' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </label>
                </div>
              ))}
            </div>
            {errors.days && <p className="text-red-500 text-xs mt-2">{errors.days}</p>}
          </div>

          <div className="flex-1">
            {selectedDays.length > 0 ? (
              exercises.map((exercise) => (
                <div key={exercise.id} className="mb-10">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">{exercise.name}</h3>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      {exercise.thumbnails.map((src, idx) => (
                        <img
                          key={`${exercise.id}-${idx}`}
                          src={src}
                          alt=""
                          onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                          className="w-10 h-10 rounded object-cover border border-gray-200"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => regenerateExercise(exercise.id)}
                      className="text-teal-700 text-sm flex items-center gap-2 hover:text-teal-800"
                    >
                      <RotateCcw size={16} />
                      Regenerate
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(["gym", "home"]).map((loc) => (
                      <div key={`${exercise.id}-${loc}`} className="flex items-center gap-6">
                        <div className="flex items-center gap-4 min-w-[240px]">
                          <span className="text-teal-700 font-medium text-sm">
                            {loc === "gym" ? "At Gym" : "At Home"}
                          </span>
                          <span className="text-gray-700 text-sm">
                            {loc === "gym" ? exercise.gym.name : exercise.home.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          {(loc === "gym" ? exercise.gym.reps : exercise.home.reps).map((rep, idx) => {
                            const errorKey = `${exercise.id}-${loc}-${idx}`;
                            return (
                              <div key={errorKey} className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Set {idx + 1}</span>
                                <input
                                  type="text"
                                  placeholder="Rep here"
                                  value={rep}
                                  onChange={(e) => updateReps(exercise.id, loc, idx, e.target.value)}
                                  className={`w-24 px-2 py-1 border rounded text-sm focus:outline-none focus:border-teal-700 ${
                                    errors.reps?.[errorKey] ? "border-red-500" : "border-gray-300"
                                  }`}
                                />
                              </div>
                            );
                          })}

                          <button
                            type="button"
                            onClick={addExercise}
                            className="w-6 h-6 rounded-full bg-teal-700 text-white hover:bg-teal-800 flex items-center justify-center"
                            aria-label="Add exercise"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Please select at least one day to view exercises</p>
              </div>
            )}

            {errors.sets && <p className="text-red-500 text-sm mb-4">{errors.sets}</p>}

            <div className="flex justify-end pt-3">
              <button
                onClick={handleComplete}
                disabled={selectedDays.length === 0}
                className={`bg-teal-700 text-white rounded-lg text-sm font-semibold px-16 py-3 w-64 ${
                  selectedDays.length === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-teal-800"
                }`}
              >
                COMPLETE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
