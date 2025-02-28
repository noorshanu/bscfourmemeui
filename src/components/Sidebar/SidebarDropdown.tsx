import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SidebarDropdown = ({ item,isCollapsed  }: any) => {
  const pathname = usePathname();

  return (
    <>
      <ul className="mb-5.5 mt-4   flex flex-col gap-2.5 ">
        {item.map((item: any, index: number) => (
          <li key={index} className={`flex  items-center  gap-1 ${isCollapsed ? "flex-col pl-0" : "flex-row pl-6 "  }`}>
            {item.icon}
            <Link
              href={item.route}
              className={`group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ${
                pathname === item.route ? "text-white" : ""
              }`}
            >
            {!isCollapsed && item.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};

export default SidebarDropdown;
