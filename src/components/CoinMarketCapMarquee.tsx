"use client";

import React, { useEffect} from 'react';
import Script from 'next/script';

const CoinMarketCapMarquee: React.FC = () => {


  useEffect(() => {
    // Ensure widget initialization by setting attributes directly if needed
    const widget = document.getElementById('crypto-widget-CoinMarquee');
    if (widget) {
      widget.setAttribute('data-transparent', 'true');
      widget.setAttribute('data-theme', 'dark');
      widget.setAttribute('data-design', 'classic');
      widget.setAttribute('data-coin-ids', '418,1,166,1986,136,382,1120,440,29');
    }
  }, []);

  return (
    <>
      {/* Load the Crypto.com widget script */}
      <Script
        src="https://price-static.crypto.com/latest/public/static/widget/index.js"
        strategy="lazyOnload"
        onLoad={() => console.log("Crypto.com widget script loaded")}
      />
      <div
        id="crypto-widget-CoinMarquee"
        data-transparent="true"
        data-theme="dark"
        data-design="classic"
        data-coin-ids="418,1,166,1986,136,382,1120,440,29"
      ></div>
    </>
  );
};

export default CoinMarketCapMarquee;