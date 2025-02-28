import React from "react";

import Link from "next/link";

import Image from "next/image";
function FunHero() {
  return (
    <>
      <section
        className="mt-1 flex flex-col items-center justify-center leading-6 px-4"
        aria-label="Solana Bundler Hero Section"
      >
        <div className="mb-2 flex max-w-6xl flex-col items-center justify-between gap-8 sm:flex-row">
          {/* Left Content */}
          <div className="w-full sm:w-1/2">
            <h1 className="pb-4 text-4xl font-semibold tracking-tight  ">
              Token Bundler
            </h1>
            <p className="mt-4  font-inter">
              A powerful tool for launching tokens and executing high-impact
              trades with precision. Leverage its advanced bundling capabilities
              to launch tokens seamlessly and snipe with up to 18 wallets
              simultaneously, ensuring maximum efficiency and market advantage.
            </p>
            <div className="mt-2 flex flex-wrap gap-4">
              <Link href="/dashboard"></Link>

              <Link
                href="#"
                target="_blank"
                aria-label="Join Discord (opens in a new tab)"
              ></Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="w-full sm:w-1/2">
            <Image
              src="/pump.png"
              height={300}
              width={300}
              alt="Illustration of Solana Bundler"
              className="mx-auto"
              priority
            />
          </div>
        </div>
      </section>
    </>
  );
}

export default FunHero;
