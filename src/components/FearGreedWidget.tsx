import React, { useEffect } from 'react';

// Extend JSX to allow the custom CoinStats widget element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'cs-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        type: string;
        theme?: string;
        direction?: string;
        background?: string;
        'is-market-sentiment-visible'?: string;
        'is-last-updated-visible'?: string;
        'title-color'?: string;
        'chart-indicator-one-color'?: string;
        'chart-indicator-two-color'?: string;
        'chart-indicator-three-color'?: string;
        'chart-indicator-four-color'?: string;
        'subtitle-color'?: string;
        'last-updated-color'?: string;
        'arrow-color'?: string;
      };
    }
  }
}

const FearGreedWidget: React.FC = () => {
  useEffect(() => {
    // Load the CoinStats widget script
    const script = document.createElement('script');
    script.src = "https://static.coinstats.app/widgets/v5/cs-widget.js";
    script.async = true;
    document.body.appendChild(script);

    // Clean up the script when the component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className=' w-full'>
      <cs-widget
      className='w-full'
        type="fear-and-greed"
        theme="dark"
        direction="horizontal"
        background="rgba(13,13,13,0)"
        is-market-sentiment-visible="false"
        is-last-updated-visible="true"
        title-color="#FFFFFF"
        chart-indicator-one-color="#F02935"
        chart-indicator-two-color="#F07D29"
        chart-indicator-three-color="#9ACB82"
        chart-indicator-four-color="#34B349"
        subtitle-color="#999999"
        last-updated-color="#999999"
        arrow-color="#262626"
      ></cs-widget>
    </div>
  );
};

export default FearGreedWidget;