import { useEffect, useRef } from 'react';

const StarBackground: React.FC = () => {
  // Type the ref as HTMLDivElement | null
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const createStar = (): void => {
      if (!starsRef.current) return;

      const star: HTMLDivElement = document.createElement('div');
      star.className = 'star';

      // Random position
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;

      // Random size
      const size = `${Math.random() * 2}px`;
      star.style.width = size;
      star.style.height = size;

      // Random animation duration and delay
      star.style.setProperty('--duration', `${2 + Math.random() * 3}s`);
      star.style.setProperty('--opacity', `${0.3 + Math.random() * 0.7}`);
      star.style.animationDelay = `${Math.random() * 3}s`;

      starsRef.current.appendChild(star);
    };

    // Create initial stars
    for (let i = 0; i < 150; i++) {
      createStar();
    }

    // Cleanup on unmount
    return () => {
      if (starsRef.current) {
        starsRef.current.innerHTML = '';
      }
    };
  }, []);

  return <div ref={starsRef} className="stars" />;
};

export default StarBackground;