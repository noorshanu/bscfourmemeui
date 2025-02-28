import React from 'react';

interface VideoPlayerProps {
  src: string;               // The actual video file URL/path
  type?: string;            // e.g. 'video/mp4'
  autoPlay?: boolean;       
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  poster?: string;          // Optional poster image
  className?: string;       // Additional Tailwind/CSS classes
}

/**
 * Renders an HTML5 video.
 * By default, it's set to "object-cover" inside a 16:9 container for responsiveness.
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  type = 'video/mp4',
  autoPlay = false,
  loop = false,
  muted = false,
  controls = true,
  poster,
  className = '',
}) => {
  return (
    // Aspect ratio trick for 16:9:
    <div className="relative pb-[56.25%] h-0 overflow-hidden">
      <video
        className={`absolute top-0 left-0 w-full h-full object-cover rounded-xl ${className}`}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        controls={controls}
      >
        <source src={src} type={type} />
        {/* Fallback text for browsers that don't support <video> */}
        Your browser does not support the HTML5 Video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;