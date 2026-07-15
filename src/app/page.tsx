"use client";

import { useEffect, useState, useRef } from "react";
import { SmokeRing } from '@paper-design/shaders-react';
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [showRing, setShowRing] = useState(true);
  const showRingRef = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const ringWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
    
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useGSAP(() => {
    if (!containerRef.current || !ringWrapperRef.current) return;

    ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      animation: gsap.fromTo(
        ringWrapperRef.current,
        { scale: 1 },
        { 
          scale: 40,
          ease: "power2.inOut" 
        }
      ),
      onUpdate: (self) => {
        // When progress is near completion, the screen should be covered by the black part of the ring
        const shouldShow = self.progress < 0.95;
        if (shouldShow !== showRingRef.current) {
          showRingRef.current = shouldShow;
          setShowRing(shouldShow);
        }
      }
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="relative h-[400vh] w-full bg-black">
      <div className="sticky top-0 h-screen w-screen overflow-hidden flex items-center justify-center bg-zinc-50 dark:bg-black">
        <div 
          ref={ringWrapperRef} 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          {showRing && dimensions.width > 0 && (
            <SmokeRing
              width={dimensions.width}
              height={dimensions.height}
              colors={["#000000"]}
              colorBack="#ffffff"
              noiseScale={3.5}
              noiseIterations={8}
              radius={0.4}
              thickness={0.5}
              innerShape={4}
              speed={-0.5}
              scale={0.4}
              rotation={60}
              minPixelRatio={typeof window !== 'undefined' ? window.devicePixelRatio : 1}
            />
          )}
        </div>
        
        {/* The absolute black screen that is shown when the ring unmounts */}
        <div 
          className="absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none flex items-center justify-center"
          style={{ opacity: showRing ? 0 : 1 }}
        >
          {/* You can add content here for when it's fully zoomed in */}
        </div>
      </div>
    </div>
  );
}
