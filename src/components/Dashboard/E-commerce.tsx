"use client";
import dynamic from "next/dynamic";
import React from "react";

import BlockchainGrid from "../BlockchainGrid";

import HeroHeader from "../HeroHeader";



const ECommerce: React.FC = () => {
  return (
    <>
      <div className="re flex flex-grow flex-col items-center pt-0">
        <div className="  mb-4 ">
          {/* <CoinMarketCapMarquee/> */}
{/* <CoinMarquee/> */}
        </div>
        <div>
          <HeroHeader />
        </div>

        <BlockchainGrid />

     
       
        {/* <FearGreedWidget/> */}
      </div>
    </>
  );
};

export default ECommerce;
