"use client";
import React, { useState, ReactNode, Suspense, lazy } from "react";
const Sidebar = lazy(() => import("@/components/Sidebar"));

const Footer = lazy(() => import("../Footer"));
const StarBackground = lazy(() => import("../StarBackground"));

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Handle mouse enter and leave to toggle the sidebar
  const handleMouseEnter = () => setIsCollapsed(false);
  const handleMouseLeave = () => setIsCollapsed(true);

  return (
    <>
      <div className=" ">
        <Suspense fallback={<div className="min-h-[100px]" />}>
          <StarBackground/>
        </Suspense>
      </div>
      <div className="flex">
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`transition-[width] duration-500 ease-in-out ${
            isCollapsed ? " w-0 sm:w-22" : " w-auto sm:w-[14.05rem]"
          }`}
        >
          <Suspense fallback={<div className="w-22 h-screen bg-gray-100/10" />}>
            <Sidebar
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
            />
          </Suspense>
        </div>

        <div
          className={`relative flex  flex-1 flex-col transition-[margin-left] duration-500 ease-in-out ${
            isCollapsed ? "lg:ml-0" : "lg:ml-[0rem]"
          }`}
        >
          <main>
            <div className="background relative z-10"></div>
            <div className="mx-auto max-w-full p-2 md:p-4 2xl:p-2">
              {children}
            </div>
            <Suspense fallback={<div className="h-20" />}>
              <Footer />
            </Suspense>
          </main>
        </div>
      </div>
    </>
  );
}