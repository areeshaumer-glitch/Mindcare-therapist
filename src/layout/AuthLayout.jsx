import React from 'react'
import images from '../assets/Images';

const AuthLayout = ({ title = "Welcome", description, children, centerContent = true }) => {
  return (
    <div className="flex flex-col lg:flex-row h-screen w-full">
      {/* Left Section */}
      <div className="w-full lg:w-[60%] relative bg-black h-[50vh] lg:h-full">
        <img
          src={images.therapyImage}
          alt="Therapy Session"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="relative z-10 p-6 md:p-10 text-white h-full flex flex-col justify-between">
          <div>
            <h1 className="text-white text-3xl md:text-5xl font-nunitoBold">MindCare</h1>
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-nunitoBold leading-tight">
              Care, support, and progress — in one place.
            </h2>
            <p className="mt-4 text-sm md:text-base font-nunitoReguler">
              MindCare helps therapists manage appointments, sessions, and client progress securely.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className={`w-full lg:w-[40%] flex flex-col items-center bg-white p-6 md:p-10 ${centerContent ? 'justify-center' : 'justify-start pt-24 overflow-y-auto'}`}>
        <h2 className="text-3xl md:text-4xl font-nunitoSemiBold mb-6">{title}</h2>
        {description ? (
          <p className="text-center text-gray-500 mb-6">
            {description}
          </p>
        ) : null}
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
