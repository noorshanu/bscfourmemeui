/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SidebarItem from "@/components/Sidebar/SidebarItem";
import ClickOutside from "@/components/ClickOutside";
import useLocalStorage from "@/hooks/useLocalStorage";
import { GiKeyCard } from "react-icons/gi";
import { GiShop } from "react-icons/gi";
import { RiFunctionAddFill } from "react-icons/ri";
import { IoCreateOutline } from "react-icons/io5";
import { FaTwitter, FaXTwitter } from "react-icons/fa6";
import { FaTelegram } from "react-icons/fa6";
import { IoHomeSharp } from "react-icons/io5";
import { IoDocumentTextSharp } from "react-icons/io5";



interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
  isCollapsed: boolean; // Add this line
  setIsCollapsed: (arg: boolean) => void; // Add this line
 
}

const menuGroups = [
  {
    menuItems: [
      // {
      //   icon: <IoHomeSharp className="text-xl " />,
      //   label: "Home",
      //   route: "https://minto.live/",
      // },
   
      
  

      {
        icon: <IoCreateOutline className="text-xl " />,
        label: " Create + Bundle ",
        route: "/four-meme",
      },


      // {
      //   icon: <RiFunctionAddFill className="text-xl " />,
      //   label: " Launch Token",
      //   route: "/create-token",
      // },
      // {
      //   icon: <GiKeyCard className="text-xl " />,
      //   label: "Vanity Generator",
      //   route: "/grind-keypair",
      // },
      // {
      //   icon: <GiShop className="text-xl " />,
      //   label: " Marketplace",
      //   route: "/market-place",
      // },
      // {
      //   icon: <IoDocumentTextSharp className="text-xl " />,
      //   label: " Bump Bot",
      //   route: "/bump-bot",
      // },
      // {
      //   icon: <FaTelegram className="text-xl text-black" />,
      //   label: "Telegram",
      //   route: "https://t.me/MintoMascot",
      // },
      // {
      //   icon: <FaTwitter className="text-xl text-black" />,
      //   label: "Twitter",
      //   route: "https://x.com/MintoMascot",
      // },
      
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  isCollapsed,
  setIsCollapsed,
// Destructure this prop
}) => {
  const pathname = usePathname();
  const [pageName, setPageName] = useLocalStorage("selectedMenu", "dashboard");

  

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <ClickOutside onClick={() => setSidebarOpen(false)}>
      <aside
        className={`w-68.5 fixed left-0 top-0 z-9999 flex h-screen flex-col overflow-y-hidden  bg-[#010101] duration-300 ease-linear  sm:bg-[#010101]  lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* <!-- SIDEBAR HEADER --> */}
        <div className="flex flex-col items-center justify-between gap-2 px-6 py-2.5 ">
          <Link href="/" className=" flex items-center gap-2 mt-3 font-inter font-bold">
          {/* /*<Image
              width={isCollapsed ? 70 : 40} // Adjust logo size
              height={32}
              src={isCollapsed ? "/logo.webp" : "/logo.webp"}
              alt="Logo"
              priority
            />*/ }
            <p>Bsctoolz</p>
          </Link>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls="sidebar"
            className="block lg:hidden"
          >
            
            <svg
              className="fill-current"
              width="20"
              height="18"
              viewBox="0 0 20 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 8.175H2.98748L9.36248 1.6875C9.69998 1.35 9.69998 0.825 9.36248 0.4875C9.02498 0.15 8.49998 0.15 8.16248 0.4875L0.399976 8.3625C0.0624756 8.7 0.0624756 9.225 0.399976 9.5625L8.16248 17.4375C8.31248 17.5875 8.53748 17.7 8.76248 17.7C8.98748 17.7 9.17498 17.625 9.36248 17.475C9.69998 17.1375 9.69998 16.6125 9.36248 16.275L3.02498 9.8625H19C19.45 9.8625 19.825 9.4875 19.825 9.0375C19.825 8.55 19.45 8.175 19 8.175Z"
                fill=""
              />
            </svg>
          </button>


        </div>
        {/* <!-- SIDEBAR HEADER --> */}

        <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
          {/* <!-- Sidebar Menu --> */}
          <nav className="mt-5 py-4  ">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex} >
                {/* <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
                  {group.name}
                </h3> */}

                <ul className="mb-6 flex flex-col gap-1.5">
                  {group.menuItems.map((menuItem, menuIndex) => (
                    <SidebarItem
                      key={menuIndex}
                      item={menuItem}
                      pageName={pageName}
                      setPageName={setPageName}
                      isCollapsed={isCollapsed}
                      
                    />
                  ))}
                </ul>
              </div>
            ))}
       
          </nav>
          {/* <!-- Sidebar Menu --> */}
          <div className="flex justify-center items-center gap-4 text-sm w-full border-t py-4 border-[#dcdcdc39] mt-[150%]">
          <a href="https://x.com/pumpmint" target="_blank">
          <FaXTwitter className="text-3xl text-white" />
         
          </a>
          <a href="https://t.me/pumpmintbot" target="_blank">
          <FaTelegram className="text-3xl text-white" />
          </a>
            </div>
        </div>
      </aside>
    </ClickOutside>
  );
};

export default Sidebar;
