import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children?: React.ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const location = useLocation();

  // Critical: Clean up any stray overlays when route changes
  useEffect(() => {
    // Remove any stray overlay divs that might have been left behind
    const overlays = document.querySelectorAll('[data-overlay]');
    overlays.forEach((overlay) => {
      // Only remove if it's not the currently active one
      if (!overlay.textContent) {
        overlay.remove();
      }
    });

    // Force reset body overflow in case it got stuck
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    // Clean up any lingering z-index issues
    const body = document.body;
    const style = window.getComputedStyle(body);
    if (style.overflow === 'hidden') {
      body.style.overflow = '';
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-[#060910] overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="min-h-full"
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
