import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col text-[var(--text-main)]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Overlay backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Main content wrapper */}
      <div className="md:pl-64 lg:pl-72 flex flex-col flex-1 min-w-0 transition-all">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="pt-20 px-4 md:px-8 pb-12 w-full max-w-7xl mx-auto flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
