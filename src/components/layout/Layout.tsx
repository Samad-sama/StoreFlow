import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { cn } from '@/lib/utils';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F5F7] dark:bg-[#161618] text-foreground font-sans">
      <Sidebar />
      <div className={cn("flex flex-col flex-1 min-w-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]")}>
        <TopBar />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-[#F5F5F7] dark:bg-[#161618]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
