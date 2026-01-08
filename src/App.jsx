import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
  SignIn,
  ForgotPasswordPage,
  CreatePasswordPage,
  OTPPage,
  ProfileCreation,
  Dashboard,
  TrackAttendence,
  Home,
  MyProfile,
  Appointment
} from "./Pages/PagesList";

export default function App() {
  return (
    <BrowserRouter>
      <ToastHost />
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/OTPPage" element={<OTPPage />} />
        <Route path="/create-password" element={<CreatePasswordPage />} />
        <Route path="/create-profile" element={<ProfileCreation />} />

        {/* Protected Home Layout with nested routes */}
        <Route path="home" element={<Home />} >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
             <Route path="my-profile" element={<MyProfile />} />
          <Route path="appointments" element={<Appointment />} />
          <Route path="track-attendance" element={<TrackAttendence />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const show = (message, type = "error") => {
      if (!message) return;
      const id = `${Date.now()}-${Math.random()}`;
      const toast = { id, message: String(message), type };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    window.showToast = show;
    return () => {
      delete window.showToast;
    };
  }, []);

  const color = (type) =>
    type === "success"
      ? "bg-teal-700"
      : type === "warning"
        ? "bg-yellow-600"
        : "bg-red-600";

  return (
    <div className="fixed top-4 right-4 z-[1000] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`text-white ${color(t.type)} px-4 py-3 rounded-lg shadow-lg max-w-xs`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
