import React, { useEffect, useState } from 'react';

interface Props {
  isLoading: boolean;
}

const ProgressBar: React.FC<Props> = ({ isLoading }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isLoading) {
      // STARTING SEQUENCE
      // 1. Make visible immediately but keep width at 0 initially for a frame
      setIsVisible(true);
      
      // 2. Start the movement after a tiny delay to ensure the browser registers the transition from 0 opacity/width
      const startTimeout = setTimeout(() => {
        setProgress(15); // Jump start slightly to give immediate feedback but smooth
      }, 50);

      // 3. Progressive Loading loop
      interval = setInterval(() => {
        setProgress(prev => {
          // Asymptotic approach to 90%
          if (prev >= 90) return prev;
          // Decelerating curve
          const remaining = 95 - prev;
          const step = Math.max(0.1, remaining * 0.02); 
          return prev + step;
        });
      }, 50);

      return () => clearTimeout(startTimeout);
      
    } else {
      // ENDING SEQUENCE
      if (isVisible) {
        setProgress(100); // Glides to finish using the CSS transition
        
        // Wait for the bar to hit 100% visually before fading out
        const fadeOutTimeout = setTimeout(() => {
          setIsVisible(false);
        }, 800); 

        // Reset state after fade out is complete
        const resetTimeout = setTimeout(() => {
          setProgress(0); 
        }, 1600); 

        return () => {
            clearTimeout(fadeOutTimeout);
            clearTimeout(resetTimeout);
        };
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, isVisible]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none">
      <div 
        className={`
            h-full 
            bg-gradient-to-r from-[#FF7400] via-[#FFA000] via-[#FFE57F] via-[#FFA000] to-[#FF7400] 
            animate-shimmer 
            shadow-[0_0_20px_rgba(255,116,0,0.5)] 
        `}
        style={{ 
            width: `${progress}%`, 
            backgroundSize: '200% 100%',
            opacity: isVisible ? 1 : 0,
            
            // Shared "Luxury" Bezier for both start and end
            transitionProperty: 'width, opacity',
            
            // Duration logic:
            // Width: Slower on finish (800ms) to feel satisfying. Snappier on start (1200ms for long haul).
            // Opacity: Fade in fast (400ms), Fade out slow (800ms).
            transitionDuration: isVisible ? '1500ms, 800ms' : '800ms, 800ms', 
            
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' 
        }}
      />
    </div>
  );
};

export default ProgressBar;