import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  baseOpacity: number;
  pulseSpeed: number;
  pulseAmount: number;
  color: string;
  originalColor: string;
  connectionCount: number;
  lastConnectionTime: number;
}

/**
 * Ultra-Advanced Neural Network Background
 * Maximum movement, realism, and visual depth
 */
export const AdvancedNeuralBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Track mouse for interactive effect
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Color palette for neural network
    const colors = ['rgba(6, 229, 255, ', 'rgba(6, 255, 208, ', 'rgba(13, 153, 255, ', 'rgba(168, 85, 247, '];

    // Initialize particles with more density and variety
    const particles: Particle[] = [];
    const particleCount = 200; // Increased from 120

    for (let i = 0; i < particleCount; i++) {
      const depth = Math.random();
      const scale = 0.3 + depth * 0.7;
      const colorIdx = i % colors.length;

      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: depth,
        vx: (Math.random() - 0.5) * 0.25 * (1 - depth * 0.4),
        vy: (Math.random() - 0.5) * 0.25 * (1 - depth * 0.4),
        vz: (Math.random() - 0.5) * 0.0008,
        radius: Math.random() * 2 + 0.8 * scale,
        baseOpacity: 0.2 + depth * 0.6,
        pulseSpeed: Math.random() * 0.03 + 0.015,
        pulseAmount: Math.random() * Math.PI * 2,
        color: colors[colorIdx],
        originalColor: colors[colorIdx],
        connectionCount: 0,
        lastConnectionTime: 0,
      });
    }

    particlesRef.current = particles;

    let animationTime = 0;
    let rafId: number;

    const animate = () => {
      animationTime += 0.016; // ~60fps
      timeRef.current = animationTime;

      // Create dark trailing effect with less opacity for more movement visibility
      ctx.fillStyle = 'rgba(8, 12, 20, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Reset connection counts
      particles.forEach(p => {
        p.connectionCount = 0;
        p.color = p.originalColor;
        // Fade back to original color
        if (animationTime - p.lastConnectionTime > 0.5) {
          p.color = p.originalColor;
        }
      });

      // Update particles with enhanced physics
      particles.forEach((particle, i) => {
        // Movement with wave effect
        const waveInfluence = Math.sin(animationTime * 0.5 + particle.z * 10) * 0.05;
        particle.x += particle.vx + waveInfluence;
        particle.y += particle.vy + Math.cos(animationTime * 0.5 + particle.x * 0.001) * 0.02;
        particle.z += particle.vz;

        // Wrap around screen with smooth transitions
        if (particle.x < -30) particle.x = canvas.width + 30;
        if (particle.x > canvas.width + 30) particle.x = -30;
        if (particle.y < -30) particle.y = canvas.height + 30;
        if (particle.y > canvas.height + 30) particle.y = -30;

        // Depth wrapping with reset
        if (particle.z < 0.05) {
          particle.z = 0.95;
          particle.vz = (Math.random() - 0.5) * 0.0008;
        }
        if (particle.z > 0.95) {
          particle.z = 0.05;
          particle.vz = (Math.random() - 0.5) * 0.0008;
        }

        // Enhanced pulsing animation
        particle.pulseAmount += particle.pulseSpeed;
        const pulse = Math.sin(particle.pulseAmount) * 0.5 + 0.5;

        // Mouse interaction with stronger gravitation
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 250) {
          const force = (1 - distance / 250) * 0.001 * (1 - particle.z * 0.3);
          const angle = Math.atan2(dy, dx);
          particle.vx += Math.cos(angle) * force;
          particle.vy += Math.sin(angle) * force;
        }

        // Damping with variation
        particle.vx *= 0.985;
        particle.vy *= 0.985;

        // Draw connections with enhanced effects
        particles.forEach((other, j) => {
          if (i >= j) return;
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDistance = 180 - particle.z * 80 - other.z * 80;

          if (dist < maxDistance && dist > 5) {
            particle.connectionCount++;
            other.connectionCount++;

            const opacity = (1 - dist / maxDistance) * (particle.z * other.z * 0.5);
            const strength = particle.z * other.z;

            // Connection pulse based on overall animation time
            const connectionPulse = Math.sin(animationTime * 2) * 0.5 + 0.5;

            // Choose connection color based on distance
            const colorMix = dist / maxDistance;
            let connColor = `rgba(6, 229, 255, ${opacity * strength * connectionPulse})`;

            if (colorMix < 0.3) {
              connColor = `rgba(168, 85, 247, ${opacity * strength * connectionPulse * 0.8})`;
            } else if (colorMix < 0.6) {
              connColor = `rgba(6, 255, 208, ${opacity * strength * connectionPulse})`;
            }

            // Draw synapse line with dynamic glow
            ctx.shadowBlur = 15 + connectionPulse * 10;
            ctx.shadowColor = connColor.replace('1)', '0.5)');
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = connColor;
            ctx.lineWidth = 0.5 + strength * 0.8 + connectionPulse * 0.3;
            ctx.stroke();
          }
        });

        // Draw particle with enhanced glow
        const finalRadius = particle.radius + Math.sin(particle.pulseAmount) * particle.radius * 0.4;
        const finalOpacity = particle.baseOpacity * (0.5 + pulse * 0.5) + particle.connectionCount * 0.1;

        // Multi-layer particle rendering
        // Layer 1: Distant glow
        ctx.shadowBlur = 30 + particle.connectionCount * 5;
        ctx.shadowColor = `${particle.color}${(finalOpacity * 0.15).toFixed(2)})`;
        ctx.fillStyle = `${particle.color}${(finalOpacity * 0.08).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, finalRadius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Layer 2: Mid glow
        ctx.shadowBlur = 20 + particle.connectionCount * 3;
        ctx.shadowColor = `${particle.color}${(finalOpacity * 0.4).toFixed(2)})`;
        ctx.fillStyle = `${particle.color}${(finalOpacity * 0.25).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, finalRadius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Layer 3: Bright core
        ctx.shadowBlur = 25 + particle.connectionCount * 5;
        ctx.shadowColor = `${particle.color}${finalOpacity.toFixed(2)})`;
        ctx.fillStyle = `${particle.color}${finalOpacity.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, finalRadius, 0, Math.PI * 2);
        ctx.fill();

        // Layer 4: Ultra bright center for close particles
        if (particle.z > 0.4) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = `rgba(255, 255, 255, ${(particle.z - 0.4) * 0.5})`;
          ctx.fillStyle = `rgba(255, 255, 255, ${(particle.z - 0.4) * 0.6})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, finalRadius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Layer 5: Connection indicator (bright when connected)
        if (particle.connectionCount > 5) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = `${particle.color}0.8)`;
          ctx.fillStyle = `${particle.color}${Math.min(particle.connectionCount * 0.05, 0.6).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, finalRadius * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.shadowBlur = 0;

      // Add subtle wave scan line effect
      const scanLineY = (Math.sin(animationTime * 0.7) * canvas.height / 2) + canvas.height / 2;
      ctx.fillStyle = `rgba(6, 229, 255, ${Math.abs(Math.sin(animationTime * 1.5)) * 0.02})`;
      ctx.fillRect(0, scanLineY, canvas.width, 1);

      // Add occasional pulses from connections
      particles.forEach(p => {
        if (p.connectionCount > 8) {
          const pulseIntensity = p.connectionCount / 50;
          ctx.strokeStyle = `${p.color}${(pulseIntensity * 0.1).toFixed(2)})`;
          ctx.lineWidth = 1 + pulseIntensity;
          ctx.beginPath();
          const pulseRadius = p.radius * 2 + Math.sin(animationTime * 3) * p.radius;
          ctx.arc(p.x, p.y, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden">
      {/* Multi-layer gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030609] via-[#0a0e1a] to-[#050810]" />
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-950/15 via-transparent to-purple-950/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-teal-950/10 via-transparent to-transparent" />

      {/* Canvas for particle system */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          background: 'transparent',
        }}
      />

      {/* Enhanced floating orbs with more varied animations */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/6 rounded-full blur-3xl pointer-events-none"
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -60, 40, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ filter: 'blur(80px)' }}
      />

      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/6 rounded-full blur-3xl pointer-events-none"
        animate={{
          x: [0, -50, 50, 0],
          y: [0, 50, -50, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ filter: 'blur(80px)' }}
      />

      <motion.div
        className="absolute top-1/3 right-1/3 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"
        animate={{
          x: [0, 40, -40, 0],
          y: [0, -40, 40, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ filter: 'blur(90px)' }}
      />

      {/* Additional accent orbs */}
      <motion.div
        className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/3 rounded-full blur-3xl pointer-events-none"
        animate={{
          opacity: [0.5, 1, 0.5],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ filter: 'blur(100px)' }}
      />

      <motion.div
        className="absolute top-0 right-0 w-80 h-80 bg-purple-500/4 rounded-full blur-3xl pointer-events-none"
        animate={{
          opacity: [0.3, 0.7, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ filter: 'blur(100px)' }}
      />

      {/* Advanced vignette with radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 150% 100% at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.2) 50%, rgba(0, 0, 0, 0.5) 100%)',
        }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' result='noise' /%3E%3C/filter%3E%3Crect width='400' height='400' fill='white' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />
    </div>
  );
};

export default AdvancedNeuralBackground;
