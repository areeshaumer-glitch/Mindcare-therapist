import React from "react";

const SidebarItem = ({ icon, label, active, onClick, isLast = false }) => (
  <div className={isLast ? "mt-auto flex justify-center items-center" : ""}
>
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-2 py-3 w-fit sm:w-full text-left text-sm font-medium rounded-lg transition ${
        active ? "bg-teal-700 text-white" : "text-[#737791]"
      }`}
    >
      <img
        src={icon}
        alt={label}
       className={`${isLast ? "w-10 h-9 lg:w-6 lg:h-6" : "w-4 h-5"} ${active ? "filter brightness-0 invert" : ""}`}

      />
      <span className="hidden sm:inline">{label}</span>
    </button>
  </div>
);

export default SidebarItem;
