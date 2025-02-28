import React from "react";

import VideoPlayer from "./Videoplayer";

function FunInfo() {
  return (
    <section className=" mt-8 flex flex-col items-center justify-center px-4 leading-6">
      <div className="mb-2 flex max-w-6xl flex-col items-center justify-between gap-8 sm:flex-row">
        <div className="w-full sm:w-1/2">
        <h1 className=" text-start text-xl font-bold text-green-400 py-4">How to create token & bundle snipe </h1>
      <div className=" border-2 border-green-500 rounded-xl">
      <VideoPlayer
        src="/images/pump.mp4"     // Adjust path to your video
        type="video/mp4"
        autoPlay={true}
        loop={true}
        muted={true}
        controls={true}                  // Hide controls if you want a background loop
        poster="/images/poster.png"       // Optional poster image
      />
      </div>
        

      
        </div>

        <div className="w-full sm:w-1/2">
          <div className="flex items-center gap-3">
            <div className="flex-1 transform cursor-pointer rounded-lg border-2 border-black bg-[#1b1d23] px-6 py-2 shadow-[4px_4px_0_0_black] transition hover:scale-105 hover:shadow-xl">
              <h2 className="pb-1 mb-1 text-xl font-bold border-green-500 border-b">User Interface</h2>
              <p className="mb-2 text-gray-300 text-xs">
                Experience a straightforward user interface designed for ease of
                use and efficiency.
              </p>
            </div>
            <div className="flex-1 transform cursor-pointer rounded-lg border-2 border-black bg-[#1b1d23] px-6 py-2 shadow-[4px_4px_0_0_black] transition hover:scale-105 hover:shadow-xl">
              <h2 className=" pb-1 mb-1 text-xl font-bold border-green-500 border-b">Profile Creation</h2>
              <p className="mb-1 text-gray-300 text-xs">
                Generate profiles for each project to ensure maximum
                authenticity, with each wallet holding different random tokens.
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 transform cursor-pointer rounded-lg border-2 border-black bg-[#1b1d23] px-6 py-2 shadow-[4px_4px_0_0_black] transition hover:scale-105 hover:shadow-xl">
              <h2 className="pb-1 mb-1 text-xl font-bold border-green-500 border-b">
                Automatic Supply  
              </h2>
              <p className="mb-2 text-gray-300 text-xs">
                Automatically manage supply deviations for smooth and efficient
                launches.
              </p>
            </div>
            <div className="flex-1 transform cursor-pointer rounded-lg border-2 border-black bg-[#1b1d23] px-6 py-2 shadow-[4px_4px_0_0_black] transition hover:scale-105 hover:shadow-xl">
              <h2 className="pb-1 mb-1 text-xl font-bold border-green-500 border-b">Configurable Buyers</h2>
              <p className="mb-2 text-gray-300 text-xs">
                Customize and configure up to 18 different keypair buyers for
                personalized launch strategies.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 transform cursor-pointer rounded-lg border-2 border-black bg-[#1b1d23] px-6 py-2 shadow-[4px_4px_0_0_black] transition hover:scale-105 hover:shadow-xl">
              <h2 className="pb-1 mb-1 text-xl font-bold border-green-500 border-b">
              Sell Strategies

              </h2>
              <p className="mb-2 text-gray-300 text-xs">
              Implement complex percentage-based sell strategies across all keypairs simultaneously.
              </p>
            </div>
            <div className="flex-1 transform cursor-pointer rounded-lg border-2 border-black bg-[#1b1d23] px-6 py-2 shadow-[4px_4px_0_0_black] transition hover:scale-105 hover:shadow-xl">
              <h2 className="pb-1 mb-1 text-base font-bold border-green-500 border-b">Unmatched Performance
              </h2>
              <p className="mb-2 text-gray-300 text-xs">
              Benefit from unparalleled performance, stability, and speed with our tool.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FunInfo;
