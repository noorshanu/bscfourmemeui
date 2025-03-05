import React from "react";

/**
 * Site footer
 */
const Footer = () => {
  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0 dark:bg-[#000]">
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-2 text-sm w-full">
            <div className="flex justify-center items-center gap-2">
              <p className="m-0 text-center text-gray-400 text-sm" style={{ textShadow: "3px 3px 0px #000000" }}>2025 BscToolz | All Rights Reserved</p>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
};

export default Footer;
