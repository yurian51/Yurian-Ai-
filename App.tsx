import React, { useState, useCallback, useRef, useEffect } from 'react';
import Hologram from './components/Hologram';
import Terminal from './components/Terminal';
import SmartHomePanel from './components/SmartHomePanel';
import { SmartHomeState, LogEntry, ConnectionStatus, HiveNode, Process, FileNode } from './types';
import { GeminiLiveService } from './services/geminiService';

// GENERATE DUMMY DATA FOR DEEP FEATURES
const generateNodes = (): HiveNode[] => {
    return Array.from({length: 64}).map((_, i) => ({
        id: `N-${i}`,
        status: Math.random() > 0.8 ? 'ACTIVE' : 'IDLE',
        load: Math.floor(Math.random() * 100),
        function: 'QUANTUM_COMPUTE'
    }));
};

const generateProcesses = (): Process[] => {
    return Array.from({length: 20}).map((_, i) => ({
        pid: 1000 + i,
        name: ['KERNEL_D', 'NET_WDT', 'CRYPTO_M', 'BIO_SCAN', 'SAT_UPLINK'][Math.floor(Math.random() * 5)],
        user: 'ROOT',
        cpu: Math.floor(Math.random() * 15),
        mem: Math.floor(Math.random() * 500),
        status: 'RUNNING'
    }));
};

const generateFiles = (): FileNode[] => {
    return Array.from({length: 15}).map((_, i) => ({
        id: `f-${i}`,
        name: `sys_log_${i}.dat`,
        type: 'FILE',
        permissions: '-rwxr-xr-x',
        size: '4KB'
    }));
};

const INITIAL_HOME_STATE: SmartHomeState = {
  viewMode: 'DASHBOARD',
  systemMode: 'NORMAL',
  customPresets: [],
  hologramMode: 'CODE',
  powerSavingMode: false,
  activeOperation: {
    name: null,
    progress: 0,
    status: 'IDLE',
    details: 'SYSTEM READY',
  },
  networkHealth: {
    status: 'SECURE',
    threatLevel: 0,
    activeIntrusions: 0,
    defcon: 5
  },
  lights: {
    livingRoom: false,
    kitchen: true,
    bedroom: false,
    corridor: true,
  },
  security: {
    doorLocked: true,
    perimeterArmed: false,
    camerasActive: true,
  },
  environment: {
    temperature: 21,
    airQuality: 'GOOD',
    humidity: 45,
    condition: 'UNKNOWN',
    location: 'UNKNOWN',
  },
  entertainment: {
    tvOn: false,
    musicPlaying: false,
    volume: 50,
    currentMedia: 'IDLE',
  },
  evidenceFiles: [],
  selectedEvidenceIds: [],
  
  // Expanded Data
  drones: [
      { id: 'D1', name: 'ALPHA-1', status: 'PATROL', battery: 85, location: { x: 20, y: 30, label: 'Sector 7' }, loadout: 'Standard' },
      { id: 'D2', name: 'BRAVO-6', status: 'IDLE', battery: 100, location: { x: 50, y: 50, label: 'Base' }, loadout: 'Stealth' },
      { id: 'D3', name: 'CHARLIE-9', status: 'OFFLINE', battery: 0, location: { x: 80, y: 20, label: 'Maintenance' }, loadout: 'Heavy' }
  ],
  biometrics: [
      { id: 'U1', name: 'ADMINISTRATOR', role: 'ADMIN', accessLevel: 5, status: 'AUTHORIZED', lastSeen: 'NOW', heartRate: 72, dnaSequence: 'AGCT-9922' },
      { id: 'U2', name: 'UNKNOWN_SUBJECT', role: 'UNKNOWN', accessLevel: 0, status: 'DENIED', lastSeen: '14:02', heartRate: 110, dnaSequence: 'XXXX-0000' }
  ],
  resources: {
      cpuLoad: 12,
      memoryUsage: 42.5,
      powerOutput: 88,
      coreTemp: 45,
      encryptionIntegrity: 100,
      networkUpload: 840,
      uplinkStability: 99
  },
  finance: {
      balance: 1240500,
      currency: 'USD',
      miningRate: 450,
      marketTrend: 'BULL',
      assets: [
          { symbol: 'BTC', value: 64200, change: 2.4, volume: '24B' },
          { symbol: 'ETH', value: 3400, change: -1.2, volume: '12B' },
          { symbol: 'YURI', value: 12.50, change: 15.4, volume: '500M' }
      ]
  },
  hive: {
      quantumStability: 98.5,
      neuralDensity: 4500,
      activeThreads: 1240,
      nodes: generateNodes()
  },
  processes: generateProcesses(),
  fileSystem: generateFiles(),
  currentPath: ['root'],
  satellites: [
      { id: 'SAT-1', designation: 'US-KH-11', orbit: 'LEO', status: 'ONLINE', target: 'SECTOR_4', coverage: 85 },
      { id: 'SAT-2', designation: 'EU-GALILEO', orbit: 'MEO', status: 'ONLINE', target: 'GLOBAL', coverage: 100 }
  ]
};

const INACTIVITY_THRESHOLD = 30000; // 30 seconds

// Keywords for Auto-Suggestion
const STYLE_KEYWORDS = [
  'CYBERPUNK', 'PHOTOREALISTIC', '4K RESOLUTION', 'CINEMATIC LIGHTING', 
  'NEON NOIR', 'BLUEPRINT SCHEMATIC', 'ISOMETRIC VIEW', 'HDR', 
  'WIDE-ANGLE LENS', 'MACRO ZOOM', 'GLITCH STYLE', 'SYNTHWAVE',
  'STUDIO QUALITY', 'DARK ATMOSPHERE', 'HIGH CONTRAST', 'VAPORWAVE',
  'ANIME STYLE', 'OIL PAINTING', 'SKETCH'
];

const EDIT_KEYWORDS = [
  'BLACK AND WHITE', 'INCREASE CONTRAST', 'NIGHT VISION', 
  'GLITCH EFFECT', 'REMOVE BACKGROUND', 'MAKE IT RAINY',
  'ADD RED HUE', 'SHARPEN DETAILS', 'DISTORT', 'PIXELATE',
  'ENHANCE RESOLUTION', 'ADD FIRE EFFECT'
];

// LANDING PAGE COMPONENT
const LandingPage: React.FC<{ onInitialize: () => void }> = ({ onInitialize }) => {
    const [initStep, setInitStep] = useState(0);
    const [scanProgress, setScanProgress] = useState(0);
    const [accessGranted, setAccessGranted] = useState(false);

    useEffect(() => {
        const steps = [
            { t: 500, cb: () => setInitStep(1) }, // Core
            { t: 1500, cb: () => setInitStep(2) }, // Memory
            { t: 2500, cb: () => setInitStep(3) }, // Network
            { t: 3500, cb: () => setInitStep(4) }, // Biometrics start
        ];

        let timeouts: ReturnType<typeof setTimeout>[] = [];
        steps.forEach(step => {
            timeouts.push(setTimeout(step.cb, step.t));
        });

        return () => timeouts.forEach(clearTimeout);
    }, []);

    // Simulate Biometric Scan
    useEffect(() => {
        if (initStep === 4) {
            const interval = setInterval(() => {
                setScanProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setAccessGranted(true);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 30);
            return () => clearInterval(interval);
        }
    }, [initStep]);

    return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-mono selection:bg-red-500 selection:text-black">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 animate-noise"></div>
            <div className="absolute inset-0 bg-[url('https://cdn.tailwindcss.com/img/scanline.png')] opacity-10"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-red-600/50 animate-[scan_2s_linear_infinite]"></div>
            
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10" 
                 style={{backgroundImage: 'linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
            </div>

            {/* Content Container */}
            <div className="z-10 w-full max-w-2xl px-4 flex flex-col items-center gap-8 relative">
                
                {/* Branding */}
                <div className="relative text-center">
                    <div className="absolute -inset-10 bg-red-600/5 blur-3xl rounded-full animate-pulse"></div>
                    <h1 className="text-6xl md:text-9xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-white via-red-500 to-red-900 glitch-text scale-100" data-text="YURIAN">
                        YURIAN
                    </h1>
                    <div className="text-red-500 font-mono tracking-[0.8em] text-xs md:text-sm mt-4 opacity-70">
                        ADVANCED AI OPERATING SYSTEM
                    </div>
                </div>

                {/* System Initialization Log */}
                <div className="w-full max-w-md border border-red-900/30 bg-black/50 p-4 font-mono text-xs shadow-2xl backdrop-blur-sm">
                    <div className="border-b border-red-900/30 pb-2 mb-2 flex justify-between text-red-700">
                        <span>SYS_BOOT_SEQUENCE</span>
                        <span>V.9.4.1</span>
                    </div>
                    <div className="flex flex-col gap-1 h-32 overflow-hidden text-gray-400">
                        <div className={initStep >= 0 ? 'opacity-100' : 'opacity-0'}>&gt; INITIALIZING KERNEL... <span className="text-green-500">OK</span></div>
                        <div className={initStep >= 1 ? 'opacity-100' : 'opacity-0'}>&gt; LOADING NEURAL MODULES... <span className="text-green-500">OK</span></div>
                        <div className={initStep >= 2 ? 'opacity-100' : 'opacity-0'}>&gt; VERIFYING ENCRYPTION KEYS... <span className="text-green-500">OK</span></div>
                        <div className={initStep >= 3 ? 'opacity-100' : 'opacity-0'}>&gt; CHECKING PERIPHERALS... <span className="text-green-500">OK</span></div>
                        <div className={initStep >= 4 ? 'opacity-100' : 'opacity-0'}>&gt; BIOMETRIC SCAN REQUIRED...</div>
                        
                        {initStep >= 4 && (
                            <div className="mt-2 border border-red-900/50 p-2 bg-red-900/10">
                                <div className="flex justify-between mb-1 text-red-400">
                                    <span>SCANNING RETINA</span>
                                    <span>{scanProgress}%</span>
                                </div>
                                <div className="w-full h-1 bg-red-900/30">
                                    <div className="h-full bg-red-600 transition-all duration-75" style={{width: `${scanProgress}%`}}></div>
                                </div>
                            </div>
                        )}
                        
                        {accessGranted && (
                            <div className="text-red-500 font-bold animate-pulse mt-1">&gt; ACCESS GRANTED. WELCOME, ADMIN.</div>
                        )}
                    </div>
                </div>

                <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-red-900 to-transparent"></div>

                {/* Initialize Button */}
                <button 
                    onClick={onInitialize}
                    disabled={!accessGranted}
                    className={`
                        group relative px-10 py-5 bg-black border overflow-hidden transition-all duration-500
                        ${accessGranted 
                            ? 'border-red-600 cursor-pointer shadow-[0_0_30px_rgba(255,0,0,0.3)] hover:shadow-[0_0_50px_rgba(255,0,0,0.6)] hover:bg-red-950/20' 
                            : 'border-gray-800 opacity-50 cursor-not-allowed'}
                    `}
                >
                    <div className={`absolute inset-0 w-0 bg-red-600 transition-all duration-[250ms] ease-out group-hover:w-full opacity-10 ${!accessGranted ? 'hidden' : ''}`}></div>
                    
                    <div className="flex flex-col items-center">
                        <span className={`relative font-mono font-bold tracking-[0.3em] text-lg ${accessGranted ? 'text-red-500 group-hover:text-white' : 'text-gray-600'}`}>
                            {accessGranted ? 'ENTER SYSTEM' : 'LOCKED'}
                        </span>
                        {accessGranted && <span className="text-[9px] text-red-800 group-hover:text-red-400 tracking-widest mt-1">TAP TO INITIALIZE AUDIO LINK</span>}
                    </div>
                    
                    {/* Corner Decorations */}
                    <div className={`absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 ${accessGranted ? 'border-red-600' : 'border-gray-600'}`}></div>
                    <div className={`absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 ${accessGranted ? 'border-red-600' : 'border-gray-600'}`}></div>
                    <div className={`absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 ${accessGranted ? 'border-red-600' : 'border-gray-600'}`}></div>
                    <div className={`absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 ${accessGranted ? 'border-red-600' : 'border-gray-600'}`}></div>
                </button>

                <div className="absolute bottom-[-10vh] font-mono text-[9px] text-gray-700 flex flex-col items-center gap-1 opacity-50">
                    <span>UMBRELLA CORP. PROPRIETARY TECHNOLOGY</span>
                    <span>UNAUTHORIZED ACCESS IS PUNISHABLE BY TERMINATION</span>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [homeState, setHomeState] = useState<SmartHomeState>(() => {
      // Load custom presets from local storage if available
      try {
          const savedPresets = localStorage.getItem('yurian_presets');
          if (savedPresets) {
              const presets = JSON.parse(savedPresets);
              return { ...INITIAL_HOME_STATE, customPresets: presets };
          }
      } catch (e) {
          console.error("Failed to load presets", e);
      }
      return INITIAL_HOME_STATE;
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const geminiServiceRef = useRef<GeminiLiveService | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const stateRef = useRef(homeState);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    stateRef.current = homeState;
  }, [homeState]);

  // Persist custom presets
  useEffect(() => {
      localStorage.setItem('yurian_presets', JSON.stringify(homeState.customPresets));
  }, [homeState.customPresets]);

  useEffect(() => {
    const upper = textInput.toUpperCase();
    let pool = STYLE_KEYWORDS;
    
    if (upper.startsWith('EDIT')) {
        pool = EDIT_KEYWORDS;
    }
    
    const lastWord = upper.split(' ').pop() || '';
    
    if (lastWord.length > 0) {
        const filtered = pool.filter(kw => kw.includes(lastWord));
        setSuggestions(filtered.length > 0 ? filtered : pool);
    } else {
        setSuggestions(pool);
    }
  }, [textInput]);

  const addLog = useCallback((message: string, type: 'AI' | 'USER' | 'SYSTEM' | 'ERROR') => {
    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        message,
        type
      }
    ].slice(-50));
  }, []);

  const updateHomeStateWrapper = useCallback((action: (prev: SmartHomeState) => SmartHomeState) => {
    setHomeState(action);
  }, []);

  useEffect(() => {
    const fetchWeather = () => {
      const updateWeatherState = async (lat: number, long: number, locName: string) => {
         try {
              const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current_weather=true`);
              const data = await response.json();
              if (data.current_weather) {
                const temp = data.current_weather.temperature;
                const weatherCode = data.current_weather.weathercode;
                
                let condition = 'CLEAR';
                if (weatherCode > 2 && weatherCode < 50) condition = 'CLOUDY';
                if (weatherCode >= 50 && weatherCode < 80) condition = 'RAIN';
                if (weatherCode >= 80) condition = 'STORM';
                if (weatherCode === 0) condition = 'CLEAR';

                setHomeState(prev => ({
                  ...prev,
                  environment: {
                    ...prev.environment,
                    temperature: temp,
                    condition: condition,
                    location: locName
                  }
                }));
              }
            } catch (e) {
              console.error("Weather fetch failed", e);
              // Fallback for API failure
              setHomeState(prev => ({
                  ...prev,
                  environment: {
                    ...prev.environment,
                    location: locName, 
                    condition: 'STABLE'
                  }
                }));
            }
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            updateWeatherState(latitude, longitude, `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
          },
          (error) => {
            console.warn("Geolocation denied - initiating fallback protocol");
            addLog("GEOLOCATION SIGNAL LOST. TRIANGULATING SECTOR-7...", 'SYSTEM');
            // Fallback to "Sector 7" (Tokyo coordinates)
            updateWeatherState(35.6762, 139.6503, "SECTOR-7 [NEO-TOKYO]");
          }
        );
      } else {
         addLog("GEOLOCATION UNAVAILABLE. USING DEFAULT COORDINATES.", 'SYSTEM');
         updateWeatherState(35.6762, 139.6503, "SECTOR-7 [NEO-TOKYO]");
      }
    };

    fetchWeather();
    const intervalId = setInterval(fetchWeather, 900000);

    return () => clearInterval(intervalId);
  }, [addLog]);

  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (homeState.powerSavingMode) {
        setHomeState(prev => ({ ...prev, powerSavingMode: false }));
        addLog("SYSTEM WAKE: POWER SAVING DISABLED", 'SYSTEM');
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    const intervalId = setInterval(() => {
      if (status === ConnectionStatus.CONNECTED && !homeState.powerSavingMode) {
        if (Date.now() - lastActivityRef.current > INACTIVITY_THRESHOLD) {
          setHomeState(prev => ({
            ...prev,
            powerSavingMode: true,
            lights: { livingRoom: false, kitchen: false, bedroom: false, corridor: false },
            entertainment: { ...prev.entertainment, tvOn: false, musicPlaying: false, currentMedia: 'IDLE' }
          }));
          addLog("SYSTEM IDLE: POWER SAVING ENABLED", 'SYSTEM');
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(intervalId);
    };
  }, [homeState.powerSavingMode, status, addLog]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (status === ConnectionStatus.CONNECTED && !homeState.powerSavingMode) {
        if (homeState.networkHealth.status === 'CRITICAL' || homeState.networkHealth.threatLevel > 80) {
          addLog('CRITICAL SYSTEM FAILURE DETECTED. AUTO-REPAIR FAILED. IMMEDIATE ATTENTION REQUIRED.', 'ERROR');
        } else if (homeState.networkHealth.status === 'WARNING') {
           addLog('SYSTEM DIAGNOSTIC: THREATS DETECTED. MONITORING.', 'SYSTEM');
        } else {
           // Random ambient log
           const ambientLogs = ['DRONE ALPHA-1 CHECKING IN...', 'SATELLITE LINK STABLE', 'BIOMETRIC DATABASE SYNCED', 'MINING OPERATION OPTIMAL'];
           if (Math.random() > 0.7) addLog(ambientLogs[Math.floor(Math.random() * ambientLogs.length)], 'SYSTEM');
        }
      }
    }, 30000); // More frequent ambient logs

    return () => clearInterval(intervalId);
  }, [homeState.networkHealth, status, homeState.powerSavingMode, addLog]);

  const toggleSystem = async () => {
    if (status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR) {
      setStatus(ConnectionStatus.CONNECTING);
      addLog("INITIALIZING YURIAN PROTOCOL...", 'SYSTEM');
      lastActivityRef.current = Date.now();
      
      try {
        if (!geminiServiceRef.current) {
          geminiServiceRef.current = new GeminiLiveService(
            updateHomeStateWrapper, 
            addLog, 
            () => stateRef.current
          );
        }
        await geminiServiceRef.current.start();
        geminiServiceRef.current.setMute(isMuted);
        
        setStatus(ConnectionStatus.CONNECTED);
        addLog("SYSTEM ONLINE. AWAITING INPUT.", 'SYSTEM');
      } catch (e) {
        setStatus(ConnectionStatus.ERROR);
        addLog(`INITIALIZATION FAILED: ${e}`, 'ERROR');
      }
    } else {
      addLog("SHUTTING DOWN...", 'SYSTEM');
      if (geminiServiceRef.current) {
        await geminiServiceRef.current.stop();
      }
      setStatus(ConnectionStatus.DISCONNECTED);
      addLog("SYSTEM OFFLINE.", 'SYSTEM');
    }
  };

  const handleMicButton = () => {
    if (status === ConnectionStatus.DISCONNECTED || status === ConnectionStatus.ERROR) {
        setIsMuted(false);
        toggleSystem();
    } else {
        const newState = !isMuted;
        setIsMuted(newState);
        lastActivityRef.current = Date.now();
        if (geminiServiceRef.current) {
          geminiServiceRef.current.setMute(newState);
        }
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && geminiServiceRef.current) {
      geminiServiceRef.current.sendTextMessage(textInput);
      setTextInput('');
      lastActivityRef.current = Date.now();
    }
  };

  const handleAddKeyword = (kw: string) => {
      setTextInput(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${kw} ` : `${kw} `;
      });
      if (inputRef.current) {
          inputRef.current.focus();
      }
  };

  const isHighSec = homeState.systemMode === 'HIGH_SECURITY';
  const mainColor = isHighSec ? 'text-red-600' : 'text-cyan-500';
  const borderColor = isHighSec ? 'border-red-900' : 'border-cyan-900';

  if (showLanding) {
      return <LandingPage onInitialize={() => {
          setShowLanding(false);
          toggleSystem();
      }} />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden relative selection:bg-cyan-900 selection:text-white animate-in fade-in duration-1000">
      
      {/* Power Saving Overlay */}
      {homeState.powerSavingMode && (
         <div className="absolute inset-0 z-50 pointer-events-none bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="border border-white/20 bg-black/80 p-4 text-center">
               <div className="text-2xl font-mono text-white/50 animate-pulse tracking-widest">POWER SAVING MODE</div>
               <div className="text-[10px] text-gray-500 mt-2">SYSTEM STANDBY // INPUT DETECTED TO WAKE</div>
            </div>
         </div>
      )}

      {/* --- Top Bar --- */}
      <header className={`flex-none h-14 md:h-16 flex justify-between items-center px-4 md:px-8 border-b ${borderColor}/50 bg-black/80 backdrop-blur-sm z-30 transition-colors duration-500`}>
        <div className="flex flex-col">
           <h1 className={`text-xl md:text-3xl font-bold tracking-[0.2em] ${mainColor} drop-shadow-[0_0_10px_currentColor] uppercase`}>YURIAN</h1>
           <span className="text-[8px] md:text-[10px] text-gray-500 tracking-[0.3em]">ARTIFICIAL INTELLIGENCE SYSTEM</span>
        </div>
        
        <div className="flex items-center gap-6 hidden sm:flex">
            {/* Threat Level Indicator */}
            <div className="flex flex-col items-end border-r border-gray-800 pr-6">
               <div className="text-[8px] text-gray-500 tracking-wider mb-0.5">THREAT LEVEL</div>
               <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                     {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-3 transform -skew-x-12 ${
                           (homeState.networkHealth.threatLevel / 20) > i 
                           ? (homeState.networkHealth.status === 'CRITICAL' ? 'bg-red-600 animate-pulse shadow-[0_0_5px_red]' : 'bg-yellow-500') 
                           : 'bg-gray-800'
                        }`}></div>
                     ))}
                  </div>
                  <span className={`text-[10px] font-bold font-mono ${homeState.networkHealth.threatLevel > 0 ? 'text-red-500' : 'text-gray-600'}`}>
                      {homeState.networkHealth.threatLevel}%
                  </span>
               </div>
            </div>

            {/* Connection Status Indicator */}
            <div className="flex flex-col items-end">
              <div className="text-[8px] text-gray-500 tracking-wider mb-0.5">SYSTEM STATUS</div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold tracking-widest ${
                    status === ConnectionStatus.CONNECTED ? 'text-green-500' : 
                    status === ConnectionStatus.CONNECTING ? 'text-yellow-500' : 'text-red-600'
                }`}>
                    {status === ConnectionStatus.CONNECTED ? 'ONLINE' : status === ConnectionStatus.CONNECTING ? 'INITIALIZING' : 'OFFLINE'}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${
                    status === ConnectionStatus.CONNECTED ? 'bg-green-500 shadow-[0_0_10px_#00ff00]' : 
                    status === ConnectionStatus.CONNECTING ? 'bg-yellow-500 animate-pulse' : 'bg-red-900'
                }`}></div>
              </div>
            </div>
        </div>
      </header>

      {/* --- Main Dashboard --- */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-20">
        
        {/* Left Panel: Visualizer */}
        <section className={`flex-none lg:flex-1 lg:max-w-[30%] min-h-[30vh] lg:min-h-full border-b lg:border-b-0 lg:border-r ${borderColor}/30 bg-black/40 flex flex-col p-4 relative transition-colors duration-500`}>
          <div className={`absolute top-2 left-2 text-[10px] ${isHighSec ? 'text-red-900' : 'text-cyan-900/60'} tracking-widest border ${borderColor}/20 px-1`}>OPTICAL_FEED</div>
          <div className="flex-1 flex items-center justify-center">
             <Hologram 
               active={status === ConnectionStatus.CONNECTED} 
               muted={isMuted} 
               systemMode={homeState.systemMode}
               networkHealth={homeState.networkHealth}
               activeOperation={homeState.activeOperation}
               powerSaving={homeState.powerSavingMode}
               hologramMode={homeState.hologramMode}
               onSelectMode={(mode) => setHomeState(prev => ({...prev, hologramMode: mode}))}
             />
          </div>
          <div className={`h-24 hidden lg:block border-t ${borderColor}/30 pt-2`}>
             <div className={`text-[10px] ${isHighSec ? 'text-red-700' : 'text-cyan-700'} mb-1`}>SYSTEM_METRICS</div>
             <div className={`grid grid-cols-2 gap-2 text-[10px] ${isHighSec ? 'text-red-900/60' : 'text-cyan-900/60'} font-mono`}>
                <div>CPU_LOAD: {homeState.resources.cpuLoad}%</div>
                <div>MEM_USAGE: {homeState.resources.memoryUsage}TB</div>
                <div>NEURAL_LINK: {status === ConnectionStatus.CONNECTED ? 'ACTIVE' : 'OFFLINE'}</div>
                <div>PWR_OUTPUT: {homeState.resources.powerOutput}%</div>
             </div>
          </div>
        </section>

        {/* Center Panel: Smart Home Controls */}
        <section className={`flex-1 flex flex-col border-b lg:border-b-0 lg:border-r ${borderColor}/30 bg-black/20 min-h-0 transition-colors duration-500 ${homeState.powerSavingMode ? 'opacity-30 grayscale' : ''}`}>
           <div className={`p-2 border-b ${borderColor}/30 flex justify-between items-center ${isHighSec ? 'bg-red-950/10' : 'bg-cyan-950/10'}`}>
              <span className={`text-[10px] ${mainColor} tracking-widest`}>FACILITY_MANAGEMENT</span>
              <span className={`text-[10px] ${isHighSec ? 'text-red-900' : 'text-cyan-900'}`}>SUB-LEVEL 3</span>
           </div>
           <div className="flex-1 overflow-hidden">
             <SmartHomePanel state={homeState} onUpdateState={setHomeState} />
           </div>
        </section>

        {/* Right Panel: Terminal & Logs */}
        <section className={`flex-none lg:flex-1 lg:max-w-[25%] h-48 lg:h-full flex flex-col bg-black/60 ${homeState.powerSavingMode ? 'opacity-50' : ''}`}>
           <Terminal logs={logs} />
        </section>

      </main>

      {/* --- Bottom Command Deck --- */}
      <footer className={`flex-none h-20 md:h-24 bg-black border-t ${isHighSec ? 'border-red-600/50' : 'border-cyan-600/50'} flex items-center px-4 md:px-8 gap-4 md:gap-8 z-30 relative shadow-[0_-5px_20px_rgba(0,0,0,0.5)] transition-colors duration-500`}>
        {/* Decorative elements */}
        <div className={`absolute top-0 left-1/4 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-${isHighSec ? 'red' : 'cyan'}-600 to-transparent opacity-50`}></div>
        
        {/* INPUT DECK */}
        <div className="flex-1 flex items-center gap-4 relative">
           
           {/* MIC BUTTON */}
           <button 
             onClick={handleMicButton}
             className={`
               group relative flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300
               ${status !== ConnectionStatus.CONNECTED 
                 ? 'border-gray-500 opacity-80 hover:border-white hover:shadow-[0_0_10px_white]' 
                 : !isMuted 
                    ? 'border-green-500 bg-green-900/20 shadow-[0_0_15px_#00ff0066]' 
                    : 'border-red-500 bg-red-900/20'}
             `}
             title={status !== ConnectionStatus.CONNECTED ? "ACTIVATE VOICE COMMAND" : (isMuted ? "UNMUTE" : "MUTE")}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${status !== ConnectionStatus.CONNECTED ? 'text-gray-400' : (!isMuted ? 'text-green-400' : 'text-red-400')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={!isMuted ? "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"} />
             </svg>
           </button>

           {/* CHAT/MESSAGE BUTTON */}
           <button 
             onClick={() => setShowChat(!showChat)}
             disabled={status !== ConnectionStatus.CONNECTED}
             className={`
               group relative flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300
               ${status !== ConnectionStatus.CONNECTED ? 'border-gray-800 opacity-50 cursor-not-allowed' : 
                 showChat ? 'border-blue-500 bg-blue-900/20 shadow-[0_0_15px_#0088ff66]' : `${borderColor} bg-transparent hover:bg-gray-900`}
             `}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${showChat ? 'text-blue-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
             </svg>
           </button>

           {/* DYNAMIC INPUT AREA */}
           <div className="flex-1 h-14 relative flex items-center">
              {showChat ? (
                <div className="relative w-full">
                    {/* Suggestion Chips */}
                    {suggestions.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 w-full flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-fade-right">
                            {suggestions.map((kw, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAddKeyword(kw)}
                                    className={`
                                        flex-none px-3 py-1 text-[9px] font-mono font-bold tracking-wider border transition-all whitespace-nowrap
                                        ${isHighSec ? 'border-red-800 bg-red-900/40 text-red-200 hover:bg-red-800' : 'border-cyan-800 bg-cyan-900/40 text-cyan-200 hover:bg-cyan-800'}
                                    `}
                                >
                                    + {kw}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSendText} className="w-full flex gap-2">
                       <input 
                         ref={inputRef}
                         type="text" 
                         value={textInput}
                         onChange={(e) => setTextInput(e.target.value)}
                         className={`flex-1 bg-black border ${borderColor} text-white px-4 py-2 focus:outline-none focus:border-white font-mono uppercase text-sm`}
                         placeholder="ENTER COMMAND OR GENERATE IMAGE..."
                         autoFocus
                       />
                       <button type="submit" className={`px-4 bg-${isHighSec ? 'red' : 'cyan'}-900/40 border ${borderColor} text-white font-bold hover:bg-white/10`}>SEND</button>
                    </form>
                </div>
              ) : (
                /* Audio Visualizer */
                <div className="w-full h-full flex items-center gap-[2px] opacity-60">
                    {Array.from({ length: 40 }).map((_, i) => {
                        const isAnimating = status === ConnectionStatus.CONNECTED && !isMuted && !homeState.powerSavingMode;
                        return (
                          <div 
                            key={i} 
                            className={`w-1 flex-1 ${isHighSec ? 'bg-red-600' : 'bg-cyan-500'} transition-all duration-75 ${isAnimating ? 'animate-wave' : 'h-0.5'}`}
                            style={{ 
                              height: isAnimating ? `${Math.random() * 80 + 20}%` : '2px',
                              animationDelay: `${i * 0.02}s`
                            }}
                          ></div>
                        );
                    })}
                </div>
              )}
           </div>

        </div>

        {/* System Power */}
        <div className="flex-none">
           <button 
             onClick={toggleSystem}
             className={`
               relative px-4 md:px-6 py-3 font-bold text-xs md:text-sm tracking-[0.2em] border transition-all duration-500 overflow-hidden
               ${status === ConnectionStatus.CONNECTED 
                  ? `${isHighSec ? 'border-red-500 text-red-500 shadow-[0_0_15px_rgba(255,0,0,0.3)]' : 'border-cyan-500 text-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.3)]'}` 
                  : 'border-gray-800 text-gray-500 hover:border-gray-500 hover:text-gray-300'}
             `}
             title={status === ConnectionStatus.CONNECTED ? "SHUTDOWN SYSTEM" : "INITIALIZE AI"}
           >
             <span className="relative z-10">{status === ConnectionStatus.CONNECTED ? 'TERMINATE' : 'INITIALIZE'}</span>
           </button>
        </div>
      </footer>

    </div>
  );
};

export default App;