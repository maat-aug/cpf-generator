import { useEffect, useRef } from 'react';
import { mountGradientWaves } from '../lib/waves-bg';

export function WavesBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const unmount = mountGradientWaves(node, {
      horizonColor: '#5227FF',
      waveColor: '#FF9FFC',
      crestColor: '#FFFFFF',
      speed: 0.4,
      amplitude: 2.5,
      waveScale: 0.6,
      waveRatio: 0.9,
      swell: 35,
      turbulence: 20,
      tilt: 1.11,
      zoom: 1.0,
      height: 5.5,
      fogDepth: 15,
      detail: 'medium',
      brightness: 1.0,
      opacity: 1.0,
      mouseInteraction: false,
      parallaxStrength: 0.5,
      grain: true,
      grainIntensity: 0.05,
    });
    return unmount;
  }, []);

  return <div id="cpf-waves-bg" aria-hidden="true" ref={ref} />;
}
