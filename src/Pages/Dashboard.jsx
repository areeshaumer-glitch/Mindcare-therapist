// pages/Dashboard.js
import React, { useState } from 'react';
import SidebarItem from '../components/SideBarItem';
import images from '../assets/Images';
import Content from '../components/Content';
import TopBar from '../components/TopBar';

const sidebarItems = [
  { label: 'Dashboard', icon: images.dash },
  { label: 'Create Workout', icon: images.workout },
  { label: 'Video Library', icon: images.video },
  { label: 'Track Attendance', icon: images.track },
  { label: 'Sign Out', icon: images.Signout, isLast: true },
];

const Dashboard = () => {
 const [selected, setSelected] = useState("Dashboard");


  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white shadow-lg p-6 fixed inset-y-0 left-0 flex flex-col">
        <h1 className="text-2xl font-bold text-teal-700 mb-6 ml-18">MindCare</h1>
        <div className="flex-1 flex flex-col space-y-3">
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={selected === item.label}
              onClick={() => setSelected(item.label)}
              isLast={item.isLast}
            />
          ))}
        </div>
      </aside>

      <main className="ml-64 p-6 flex-1 bg-slate-100  min-h-screen">
        <TopBar />
      
          <Content selected={selected} />
      
      </main>
    </div>
  );
};

export default Dashboard;
