'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    VANTA: any;
    THREE: any;
  }
}

const DARK_CONFIG = {
  backgroundColor: 0x000000,
  skyColor: 0x050404,
  cloudColor: 0x4e4e50,
  cloudShadowColor: 0x0,
  sunColor: 0x000000,
  sunGlareColor: 0x000000,
  sunlightColor: 0x333333,
  speed: 0.7,
};

const LIGHT_CONFIG = {
  backgroundColor: 0xffffff,
  skyColor: 0x68b8d7,
  cloudColor: 0xadc1de,
  cloudShadowColor: 0x183550,
  sunColor: 0xff9919,
  sunGlareColor: 0xff6633,
  sunlightColor: 0xff9933,
  speed: 0.7,
};

export default function VantaClouds() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState({ three: false, vanta: false });

  const isDark = () => document.documentElement.classList.contains('dark');

  const initOrUpdate = () => {
    if (!window.VANTA?.CLOUDS || !window.THREE || !vantaRef.current) return;

    const config = isDark() ? DARK_CONFIG : LIGHT_CONFIG;

    if (vantaEffect.current) {
      vantaEffect.current.setOptions(config);
    } else {
      vantaEffect.current = window.VANTA.CLOUDS({
        el: vantaRef.current,
        THREE: window.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        ...config,
      });
    }
  };

  // Initialize once both scripts are loaded
  useEffect(() => {
    if (scriptsLoaded.three && scriptsLoaded.vanta) {
      initOrUpdate();
    }
  }, [scriptsLoaded]);

  // Watch for dark class changes on <html> to update config
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (vantaEffect.current) {
        const config = isDark() ? DARK_CONFIG : LIGHT_CONFIG;
        vantaEffect.current.setOptions(config);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        strategy="lazyOnload"
        onLoad={() => setScriptsLoaded(prev => ({ ...prev, three: true }))}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds.min.js"
        strategy="lazyOnload"
        onLoad={() => setScriptsLoaded(prev => ({ ...prev, vanta: true }))}
      />
      <div
        ref={vantaRef}
        className="absolute inset-0 z-0 overflow-hidden"
        style={{ pointerEvents: 'none' }}
      />
    </>
  );
}
