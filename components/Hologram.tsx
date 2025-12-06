
import React, { useEffect, useRef } from 'react';
import { SmartHomeState } from '../types';

interface HologramProps {
  active: boolean;
  muted: boolean;
  systemMode: SmartHomeState['systemMode'];
  networkHealth: SmartHomeState['networkHealth'];
  activeOperation: SmartHomeState['activeOperation'];
  powerSaving: boolean;
  hologramMode: SmartHomeState['hologramMode'];
  onSelectMode: (mode: SmartHomeState['hologramMode']) => void;
}

// Internal types for the Context Engine
type GeometryType = 'SPHERE' | 'TORUS' | 'KNOT' | 'CYLINDER' | 'PLANE' | 'RIPPLE' | 'SCAN_STACK' | 'SCAN_FLAT';
type EffectType = 'IDLE' | 'PULSE' | 'JITTER' | 'GLITCH' | 'SPIKE' | 'NONE';

class Vertex {
  // Current Render Position
  x: number = 0;
  y: number = 0;
  z: number = 0;

  // Target Position
  tx: number = 0;
  ty: number = 0;
  tz: number = 0;

  // Properties
  id: number;
  u: number; // 0-1 progress
  
  // Pre-computed connectivity
  neighbors: number[] = [];
  
  constructor(id: number, total: number) {
    this.id = id;
    this.u = id / total;
  }

  update(time: number, geometry: GeometryType, effect: EffectType, radius: number, powerSaving: boolean) {
    // 1. Calculate Target Geometry Position
    this.calculateTarget(time, geometry, radius);

    // 2. Apply Dynamic Effects to Target
    if (!powerSaving) {
        this.applyEffects(time, effect);
    }

    // 3. Smooth Transition (LERP)
    const smoothFactor = 0.08; 
    this.x += (this.tx - this.x) * smoothFactor;
    this.y += (this.ty - this.y) * smoothFactor;
    this.z += (this.tz - this.z) * smoothFactor;
  }

  private calculateTarget(time: number, geometry: GeometryType, radius: number) {
    switch (geometry) {
        case 'TORUS': 
            {
                // Torus Math
                const p = this.u * Math.PI * 2;
                const q = (this.u * Math.PI * 2 * 10) + time * 0.0005; // 10 loops
                const rTube = radius * 0.4;
                const rMajor = radius * 0.8;
                
                this.tx = (rMajor + rTube * Math.cos(q)) * Math.cos(p);
                this.tz = (rMajor + rTube * Math.cos(q)) * Math.sin(p);
                this.ty = rTube * Math.sin(q);
                
                // Rotate entire torus slowly
                const rot = time * 0.0003;
                const x = this.tx * Math.cos(rot) - this.tz * Math.sin(rot);
                const z = this.tx * Math.sin(rot) + this.tz * Math.cos(rot);
                this.tx = x; this.tz = z;
            }
            break;

        case 'KNOT': // Trefoil Knot
            {
                const t = this.u * Math.PI * 2 * 3 + time * 0.0005; // 3 loops
                const s = radius * 0.5;
                this.tx = s * (Math.sin(t) + 2 * Math.sin(2 * t));
                this.ty = s * (Math.cos(t) - 2 * Math.cos(2 * t));
                this.tz = s * (-Math.sin(3 * t));
            }
            break;

        case 'CYLINDER': // Code / Matrix
            {
                const theta = (this.u * Math.PI * 2 * 8) + time * 0.0002;
                this.tx = Math.sin(theta) * radius * 0.8;
                this.tz = Math.cos(theta) * radius * 0.8;
                
                // Vertical scrolling
                const height = radius * 4;
                const scrollSpeed = 0.2;
                const yBase = (this.u * height) - height/2;
                const scrollOffset = (time * scrollSpeed) % height;
                this.ty = yBase - scrollOffset;
                if (this.ty < -height/2) this.ty += height;
                if (this.ty < -height/2) this.ty += height; // wrap
            }
            break;

        case 'PLANE': // Writing / Scroll
            {
                const cols = 20;
                const col = this.id % cols;
                const row = Math.floor(this.id / cols);
                const lineHeight = 15;
                
                this.tx = (col - cols/2) * 12;
                // Gentle curve like a page
                this.tz = Math.sin(this.tx * 0.01 + time * 0.001) * 20; 
                
                const totalHeight = 400;
                const scrollSpeed = 0.05;
                this.ty = ((row * lineHeight) + (time * scrollSpeed)) % totalHeight - (totalHeight/2);
            }
            break;

        case 'RIPPLE': // Music / Wave
            {
                // Fib Sphere base
                const phi = Math.PI * (3 - Math.sqrt(5));
                const y = 1 - (this.id / 799) * 2; 
                const r = Math.sqrt(1 - y * y);
                const theta = phi * this.id;
                
                const ox = Math.cos(theta) * r;
                const oz = Math.sin(theta) * r;
                
                const beat = Math.sin(time * 0.01) * 0.5 + 0.5; 
                const freq = Math.sin(ox * 10 + oz * 10 + time * 0.008);
                
                this.ty = y * radius * 0.5; // flatten y
                const wave = 1 + (freq * beat * 0.5);
                this.tx = ox * radius * wave;
                this.tz = oz * radius * wave;
            }
            break;

        case 'SCAN_FLAT': // Editing single image
            {
                // Grid layout
                const size = Math.sqrt(800);
                const x = (this.id % size) - size/2;
                const y = Math.floor(this.id / size) - size/2;
                
                this.tx = x * 10;
                this.ty = y * 10;
                this.tz = 0;
                
                // Scan wave
                const scanZ = Math.sin(this.ty * 0.1 + time * 0.005) * 20;
                this.tz = scanZ;
            }
            break;

        case 'SCAN_STACK': // Batch editing
            {
               const layer = this.id % 3;
               const offset = (layer - 1) * 40;
               // Reuse scan flat logic approx
               const size = Math.sqrt(250); // fewer per layer
               const subId = Math.floor(this.id / 3);
               const x = (subId % size) - size/2;
               const y = Math.floor(subId / size) - size/2;

               this.tx = x * 12;
               this.ty = y * 12;
               this.tz = offset + Math.sin(x * 0.2 + time * 0.005) * 5;
            }
            break;

        case 'SPHERE':
        default:
            {
                // Fibonacci Sphere
                const phi = Math.PI * (3 - Math.sqrt(5));
                const y = 1 - (this.id / 799) * 2; 
                const r = Math.sqrt(1 - y * y);
                const theta = phi * this.id;

                this.tx = Math.cos(theta) * r * radius;
                this.ty = y * radius;
                this.tz = Math.sin(theta) * r * radius;
            }
            break;
    }
  }

  private applyEffects(time: number, effect: EffectType) {
      switch (effect) {
          case 'JITTER': // Warning
              this.tx += (Math.random() - 0.5) * 5;
              this.ty += (Math.random() - 0.5) * 5;
              this.tz += (Math.random() - 0.5) * 5;
              break;
          
          case 'GLITCH': // Critical
              if (Math.random() > 0.92) {
                  this.tx *= 1.2;
                  this.tz *= 0.8;
                  this.ty += (Math.random() - 0.5) * 20;
              }
              break;

          case 'SPIKE': // High Security / Aggressive
              {
                   // Spike based on normal direction (approx position)
                   const len = Math.sqrt(this.tx*this.tx + this.ty*this.ty + this.tz*this.tz);
                   if (len > 0) {
                       const spike = Math.sin(time * 0.01 + this.id * 0.2);
                       if (spike > 0.8) {
                           const mag = 1.3;
                           this.tx *= mag;
                           this.ty *= mag;
                           this.tz *= mag;
                       }
                   }
              }
              break;

          case 'PULSE': // Processing
              {
                  const pulse = 1 + Math.sin(time * 0.008 + this.ty * 0.05) * 0.05;
                  this.tx *= pulse;
                  this.ty *= pulse;
                  this.tz *= pulse;
              }
              break;
          
          case 'IDLE': // Breathing / Evolving
              {
                  // Simplex-ish noise movement
                  const noise = Math.sin(this.tx * 0.02 + time * 0.001) * Math.cos(this.ty * 0.02 + time * 0.002);
                  const scale = 1 + noise * 0.1;
                  this.tx *= scale;
                  this.ty *= scale;
                  this.tz *= scale;
              }
              break;
      }
  }
}

const Hologram: React.FC<HologramProps> = ({ 
  active, 
  muted, 
  systemMode, 
  networkHealth, 
  activeOperation, 
  powerSaving,
  hologramMode,
  onSelectMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vertices = useRef<Vertex[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Initialize Mesh (Nodes + Connectivity)
  useEffect(() => {
    vertices.current = [];
    const numPoints = 800;
    
    // 1. Generate Vertices (Base Sphere layout for neighbor calculation)
    const tempPoints: {x:number, y:number, z:number, id:number}[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); 

    for (let i = 0; i < numPoints; i++) {
        const v = new Vertex(i, numPoints);
        vertices.current.push(v);
        
        // Temp pos calculation for neighbor finding
        const y = 1 - (i / (numPoints - 1)) * 2; 
        const r = Math.sqrt(1 - y * y);
        const theta = phi * i;
        tempPoints.push({
            x: Math.cos(theta) * r,
            y: y,
            z: Math.sin(theta) * r,
            id: i
        });
    }

    // 2. Pre-compute Connectivity (K-Nearest Neighbors)
    const k = 4; // connections per node
    for (let i = 0; i < numPoints; i++) {
        const p1 = tempPoints[i];
        const dists = tempPoints.map(p2 => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dz = p1.z - p2.z;
            return { id: p2.id, dSq: dx*dx + dy*dy + dz*dz };
        });
        
        dists.sort((a, b) => a.dSq - b.dSq);
        
        for (let j = 1; j <= k + 2; j++) { 
            if (dists[j].id > i && dists[j].dSq < 0.15) { 
                vertices.current[i].neighbors.push(dists[j].id);
            }
        }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
        if (!active && !powerSaving) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            animationRef.current = requestAnimationFrame(render);
            return;
        }

        // --- 1. DETERMINE CONTEXT ---
        let targetGeometry: GeometryType = 'SPHERE';
        let targetEffect: EffectType = 'IDLE';
        let targetColor = { r: 0, g: 255, b: 255 }; 

        // Resolve Colors
        if (systemMode === 'HIGH_SECURITY') targetColor = { r: 255, g: 0, b: 0 };
        else if (systemMode === 'AWAY') targetColor = { r: 255, g: 200, b: 0 };
        
        // Context Engine
        if (hologramMode !== 'AUTO' && hologramMode !== 'DEFAULT') {
            // Manual Override
            switch (hologramMode) {
                case 'CODE': targetGeometry = 'CYLINDER'; targetColor = { r: 0, g: 255, b: 100 }; break;
                case 'MUSIC': targetGeometry = 'RIPPLE'; targetColor = { r: 255, g: 215, b: 0 }; break;
                case 'WRITING': targetGeometry = 'PLANE'; targetColor = { r: 0, g: 150, b: 255 }; break;
                case 'EDITING': targetGeometry = 'SCAN_FLAT'; targetColor = { r: 255, g: 0, b: 255 }; break;
                case 'BATCH_EDITING': targetGeometry = 'SCAN_STACK'; targetColor = { r: 255, g: 100, b: 255 }; break;
                case 'CRITICAL': targetGeometry = 'KNOT'; targetEffect = 'GLITCH'; targetColor = { r: 255, g: 0, b: 0 }; break;
                case 'PROCESSING': targetGeometry = 'TORUS'; targetEffect = 'PULSE'; targetColor = { r: 180, g: 50, b: 255 }; break;
            }
        } else {
            // AUTO Mode
            const opName = (activeOperation.name || '').toUpperCase();
            const isProcessing = activeOperation.status === 'PROCESSING';

            if (isProcessing) {
                if (opName.includes('CODE') || opName.includes('HACK')) {
                    targetGeometry = 'CYLINDER';
                    targetColor = { r: 0, g: 255, b: 100 };
                } else if (opName.includes('MUSIC')) {
                    targetGeometry = 'RIPPLE';
                    targetColor = { r: 255, g: 215, b: 0 };
                } else if (opName.includes('BOOK') || opName.includes('WRITE')) {
                    targetGeometry = 'PLANE';
                    targetColor = { r: 0, g: 200, b: 255 };
                } else if (opName.includes('EDIT')) {
                    targetGeometry = opName.includes('BATCH') ? 'SCAN_STACK' : 'SCAN_FLAT';
                    targetColor = { r: 255, g: 50, b: 255 };
                } else {
                    targetGeometry = 'TORUS'; // Complex processing shape
                    targetEffect = 'PULSE';
                    targetColor = { r: 180, g: 50, b: 255 };
                }
            }

            // Health Priority
            if (networkHealth.status === 'CRITICAL' || networkHealth.threatLevel > 60) {
                targetEffect = 'GLITCH';
                targetColor = { r: 255, g: 0, b: 0 };
                if (networkHealth.threatLevel > 80) targetGeometry = 'KNOT';
            } else if (networkHealth.status === 'WARNING') {
                targetEffect = 'JITTER';
                targetColor = { r: 255, g: 200, b: 0 };
            }

            // System Mode Priority
            if (systemMode === 'HIGH_SECURITY') {
                targetEffect = 'SPIKE';
            }
        }

        // --- RENDER PIPELINE ---
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalCompositeOperation = 'lighter';

        timeRef.current += 16;
        const time = timeRef.current;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRadius = Math.min(centerX, centerY) * 0.55;

        // Background Text/Hex for CODE
        if (targetGeometry === 'CYLINDER' && !powerSaving) {
             const fontSize = 12;
             const columns = Math.ceil(canvas.width / (fontSize * 1.5));
             ctx.font = `${fontSize}px "Share Tech Mono", monospace`;
             ctx.fillStyle = `rgba(${targetColor.r}, ${targetColor.g}, ${targetColor.b}, 0.08)`;
             
             for (let i = 0; i < columns; i++) {
                 const scrollSpeed = 0.08;
                 const yOffset = (time * scrollSpeed + i * 50) % canvas.height;
                 for (let j = 0; j < canvas.height; j += fontSize * 1.2) {
                     const y = (j + yOffset) % canvas.height;
                     const val = Math.floor(Math.abs(Math.sin(i * 13 + j * 7 + time * 0.00005) * 16));
                     const displayHex = val.toString(16).toUpperCase() + (15 - val).toString(16).toUpperCase();
                     ctx.fillText(displayHex, i * (fontSize * 1.5), y);
                 }
             }
        }

        const rotX = powerSaving ? 0 : time * 0.0004;
        const rotY = powerSaving ? time * 0.0002 : time * 0.0008;

        const projectedNodes: {x: number, y: number, z: number, scale: number, id: number}[] = [];
        
        // Update & Project
        vertices.current.forEach(v => {
            v.update(time, targetGeometry, targetEffect, baseRadius, powerSaving);

            let x = v.x; 
            let y = v.y;
            let z = v.z;

            // Rotate Y
            let tx = x * Math.cos(rotY) - z * Math.sin(rotY);
            let tz = x * Math.sin(rotY) + z * Math.cos(rotY);
            x = tx; z = tz;

            // Rotate X
            if (!['CYLINDER', 'PLANE'].includes(targetGeometry)) {
                let ty = y * Math.cos(rotX) - z * Math.sin(rotX);
                tz = y * Math.sin(rotX) + z * Math.cos(rotX);
                y = ty; z = tz;
            } else {
                 const tilt = 0.2;
                 let ty = y * Math.cos(tilt) - z * Math.sin(tilt);
                 tz = y * Math.sin(tilt) + z * Math.cos(tilt);
                 y = ty; z = tz;
            }

            const fov = 500;
            const scale = fov / (fov + z);
            
            projectedNodes.push({
                x: centerX + x * scale,
                y: centerY + y * scale,
                z: z,
                scale: scale,
                id: v.id
            });
        });

        // DRAW CONNECTIONS (Wireframe)
        // Standard Wireframe
        if (!['CYLINDER', 'PLANE', 'SCAN_FLAT', 'SCAN_STACK', 'RIPPLE'].includes(targetGeometry) && !powerSaving) {
            ctx.strokeStyle = `rgba(${targetColor.r}, ${targetColor.g}, ${targetColor.b}, 0.25)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            for (let i = 0; i < vertices.current.length; i++) {
                const p1 = projectedNodes[i];
                if (p1.z < -100) continue;

                const v = vertices.current[i];
                for (const neighborId of v.neighbors) {
                    const p2 = projectedNodes[neighborId];
                    if (p2 && p2.z > -100) {
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                    }
                }
            }
            ctx.stroke();
        }

        // RIPPLE (Music) - Waveform connections
        if (targetGeometry === 'RIPPLE' && !powerSaving) {
             ctx.strokeStyle = `hsla(${time * 0.1 % 360}, 70%, 50%, 0.3)`;
             ctx.lineWidth = 2;
             ctx.beginPath();
             
             for (let i = 0; i < vertices.current.length; i++) {
                const p1 = projectedNodes[i];
                if (p1.z < -100) continue;
                // Just draw connection to next few nodes to simulate wave lines
                const v = vertices.current[i];
                for (const nid of v.neighbors.slice(0, 2)) {
                    const p2 = projectedNodes[nid];
                    if (p2 && p2.z > -100) {
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                    }
                }
             }
             ctx.stroke();
        }

        // DRAW NODES / SYMBOLS
        projectedNodes.forEach((p) => {
             if (p.z < -50 && !['CYLINDER', 'PLANE', 'RIPPLE'].includes(targetGeometry)) return; 

             const alpha = Math.min(1, Math.max(0.1, p.scale));
             
             if (targetGeometry === 'CYLINDER') {
                 // Code Token
                 const codeTokens = ['const', 'let', 'if', '{', '}', '0x1', 'func', '=>', ';', 'return', 'await', 'void', 'int'];
                 const token = codeTokens[p.id % codeTokens.length];
                 const scanY = (time % 3000) / 3000 * canvas.height;
                 const distToScan = Math.abs(p.y - scanY);
                 
                 let r = targetColor.r, g = targetColor.g, b = targetColor.b;
                 if (distToScan < 50) {
                     r = 255; g = 255; b = 255;
                     ctx.shadowBlur = 15; ctx.shadowColor = 'white';
                 } else {
                     ctx.shadowBlur = 0;
                 }
                 // Highlight keywords
                 if (['const', 'func', 'return'].includes(token)) {
                     ctx.fillStyle = `rgba(255, 100, 255, ${alpha})`;
                 } else {
                     ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                 }
                 ctx.font = `${(token.length > 1 ? 9 : 12) * p.scale}px "Share Tech Mono", monospace`;
                 ctx.fillText(token, p.x, p.y);

             } else if (targetGeometry === 'RIPPLE') {
                 // Notes
                 const notes = ['♪', '♫', '♩', '♬', '♭', '♮', '♯'];
                 const note = notes[p.id % notes.length];
                 const hue = (time * 0.1 + p.y) % 360;
                 ctx.font = `${14 * p.scale}px "Share Tech Mono", monospace`;
                 ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
                 ctx.fillText(note, p.x, p.y);

             } else if (targetGeometry === 'PLANE') {
                 // Text Writing
                 // Simulate typed text blocks
                 const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                 const char = chars[Math.floor((p.id + time * 0.01) % chars.length)];
                 ctx.font = `${10 * p.scale}px "Share Tech Mono", monospace`;
                 ctx.fillStyle = `rgba(${targetColor.r}, ${targetColor.g}, ${targetColor.b}, ${alpha})`;
                 
                 // Add cursor effect for some nodes
                 if (Math.random() > 0.98) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(p.x, p.y, 8 * p.scale, 12 * p.scale);
                 } else {
                    ctx.fillText(char, p.x, p.y);
                 }

             } else {
                 // Nodes (Dots)
                 const size = (targetEffect === 'PULSE' ? 2.5 : 1.5) * p.scale;
                 ctx.fillStyle = `rgba(${targetColor.r}, ${targetColor.g}, ${targetColor.b}, ${alpha})`;
                 ctx.beginPath();
                 ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                 ctx.fill();
             }
        });

        ctx.globalCompositeOperation = 'source-over';
        animationRef.current = requestAnimationFrame(render);
    };

    const resize = () => {
        if (canvas.parentElement) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
    };
    window.addEventListener('resize', resize);
    resize();
    render();

    return () => {
        cancelAnimationFrame(animationRef.current);
        window.removeEventListener('resize', resize);
    };
  }, [active, systemMode, networkHealth, activeOperation, powerSaving, hologramMode]);

  return (
    <div className="relative w-full h-full group">
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Mode Selector */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-1 z-10 pointer-events-none group-hover:pointer-events-auto">
            <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-1 drop-shadow-md">VISUALIZATION_OVERRIDE</span>
            <div className="flex flex-wrap justify-center gap-1">
                {['AUTO', 'CODE', 'MUSIC', 'WRITING', 'PROCESSING', 'CRITICAL'].map((mode) => (
                    <button
                        key={mode}
                        onClick={() => onSelectMode(mode as any)}
                        className={`
                            px-2 py-1 text-[8px] font-bold border font-mono tracking-wider transition-all
                            ${hologramMode === mode 
                                ? (systemMode === 'HIGH_SECURITY' ? 'border-red-500 bg-red-900/40 text-red-100 shadow-[0_0_8px_red]' : 'border-cyan-500 bg-cyan-900/40 text-cyan-100 shadow-[0_0_8px_cyan]')
                                : 'border-gray-800 bg-black/60 text-gray-500 hover:border-gray-500 hover:text-white hover:bg-white/10'}
                        `}
                    >
                        {mode}
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};

export default Hologram;
