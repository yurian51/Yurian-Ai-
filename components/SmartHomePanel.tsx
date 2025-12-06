

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SmartHomeState, EvidenceFile, SystemPreset } from '../types';

interface SmartHomePanelProps {
  state: SmartHomeState;
  onUpdateState: React.Dispatch<React.SetStateAction<SmartHomeState>>;
}

const SmartHomePanel: React.FC<SmartHomePanelProps> = ({ state, onUpdateState }) => {
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceFile | null>(null);
  const [viewingCamera, setViewingCamera] = useState<number | null>(null);
  const [cameraStates, setCameraStates] = useState<boolean[]>(Array(9).fill(true));
  const [hexStream, setHexStream] = useState<string[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  
  // Tabs for the OS-like interface
  const tabs = [
      { id: 'DASHBOARD', icon: '⊞', label: 'MAIN DECK' },
      { id: 'HIVE', icon: '⚛', label: 'H.I.V.E.' },
      { id: 'TACTICAL', icon: '⊕', label: 'TACTICAL' },
      { id: 'DATABASE', icon: '📂', label: 'DATABASE' },
      { id: 'SYSTEMS', icon: '⚡', label: 'SYSTEMS' },
      { id: 'PROTOCOLS', icon: '⌬', label: 'PROTOCOLS' }
  ];

  const bgHexData = useMemo(() => {
    return Array.from({length: 40}).map(() => 
        Array.from({length: 12}).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2,'0').toUpperCase()).join(' ')
    );
  }, []);

  useEffect(() => {
    if (state.activeOperation.status === 'PROCESSING' && !state.powerSavingMode) {
      const interval = setInterval(() => {
        const hex = Array.from({length: 3}, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(' ');
        setHexStream(prev => [hex, ...prev].slice(0, 8));
      }, 100);
      return () => clearInterval(interval);
    } else {
        setHexStream([]);
    }
  }, [state.activeOperation.status, state.powerSavingMode]);

  const isHighSec = state.systemMode === 'HIGH_SECURITY';
  const themeText = isHighSec ? 'text-red-500' : 'text-cyan-500';
  const themeBorder = isHighSec ? 'border-red-900' : 'border-cyan-900';
  const themeBg = isHighSec ? 'bg-red-950/20' : 'bg-cyan-950/20';

  // --- ACTIONS ---

  const handleSavePreset = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPresetName.trim()) return;

      const newPreset: SystemPreset = {
          id: Math.random().toString(36).substring(7),
          name: newPresetName.trim().toUpperCase(),
          lights: { ...state.lights },
          security: { ...state.security },
          entertainment: { ...state.entertainment },
          environment: { temperature: state.environment.temperature }
      };

      onUpdateState(prev => ({
          ...prev,
          customPresets: [...prev.customPresets, newPreset]
      }));
      setNewPresetName('');
  };

  const applyPreset = (preset: SystemPreset) => {
      onUpdateState(prev => ({
          ...prev,
          systemMode: preset.name,
          lights: preset.lights,
          security: preset.security,
          entertainment: preset.entertainment,
          environment: { ...prev.environment, ...preset.environment }
      }));
  };

  const applyStandardMode = (mode: string) => {
        const updates: any = { systemMode: mode };
        if (mode === 'NORMAL') {
            updates.lights = { livingRoom: true, kitchen: true, bedroom: false, corridor: true };
            updates.security = { doorLocked: true, perimeterArmed: false, camerasActive: true };
        } else if (mode === 'HIGH_SECURITY') {
            updates.lights = { livingRoom: true, kitchen: true, bedroom: true, corridor: true };
            updates.security = { doorLocked: true, perimeterArmed: true, camerasActive: true };
        } else if (mode === 'AWAY') {
            updates.lights = { livingRoom: false, kitchen: false, bedroom: false, corridor: false };
            updates.security = { doorLocked: true, perimeterArmed: true, camerasActive: true };
            updates.entertainment = { tvOn: false, musicPlaying: false, ...state.entertainment };
        } else if (mode === 'SLEEP') {
            updates.lights = { livingRoom: false, kitchen: false, bedroom: false, corridor: false };
            updates.security = { doorLocked: true, perimeterArmed: true, camerasActive: true };
            updates.entertainment = { tvOn: false, musicPlaying: false, ...state.entertainment };
        }
        onUpdateState(prev => ({ ...prev, ...updates }));
  };

  const deletePreset = (id: string) => {
      onUpdateState(prev => ({
          ...prev,
          customPresets: prev.customPresets.filter(p => p.id !== id)
      }));
  };

  // --- SUB-VIEWS ---

  const DashboardView = () => (
      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 h-full overflow-y-auto pr-2">
          {/* Top Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-none">
              <div className={`border ${themeBorder} bg-black/40 p-2 flex flex-col items-center justify-center`}>
                  <span className="text-[9px] text-gray-500 uppercase">THREAT LEVEL</span>
                  <span className={`text-xl font-bold ${isHighSec ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>{state.networkHealth.threatLevel}%</span>
              </div>
              <div className={`border ${themeBorder} bg-black/40 p-2 flex flex-col items-center justify-center`}>
                  <span className="text-[9px] text-gray-500 uppercase">ACTIVE THREADS</span>
                  <span className="text-xl font-bold text-yellow-500">{state.hive.activeThreads}</span>
              </div>
              <div className={`border ${themeBorder} bg-black/40 p-2 flex flex-col items-center justify-center`}>
                  <span className="text-[9px] text-gray-500 uppercase">QUANTUM STABILITY</span>
                  <span className="text-xl font-bold text-blue-500">{state.hive.quantumStability}%</span>
              </div>
              <div className={`border ${themeBorder} bg-black/40 p-2 flex flex-col items-center justify-center`}>
                  <span className="text-[9px] text-gray-500 uppercase">CRYPTO YIELD</span>
                  <span className="text-xl font-bold text-purple-500">+{state.finance.miningRate} H/s</span>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-none">
              {/* Security Module */}
              <div className={`border ${themeBorder} bg-black/40 p-3 flex flex-col gap-2 min-h-[200px]`}>
                <h3 className={`${themeText} text-[10px] font-bold tracking-widest border-b ${themeBorder} pb-1 flex justify-between`}>
                    <span>SECURITY_GRID</span>
                    <span className={state.security.camerasActive ? 'text-green-500' : 'text-red-500'}>{state.security.camerasActive ? 'LIVE' : 'OFFLINE'}</span>
                </h3>
                <div className="grid grid-cols-3 gap-1 flex-1">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} onClick={() => setViewingCamera(i+1)} className={`relative bg-black border ${themeBorder} cursor-pointer hover:opacity-80 group overflow-hidden h-16 md:h-auto`}>
                             {state.security.camerasActive && cameraStates[i] ? (
                                <>
                                    <div className="absolute inset-0 bg-green-900/10"></div>
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(https://grainy-gradients.vercel.app/noise.svg)' }}></div>
                                    <span className="absolute top-0.5 left-0.5 text-[5px] text-green-500">CAM_{i+1}</span>
                                    {isHighSec && <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>}
                                </>
                             ) : (
                                 <div className="flex items-center justify-center h-full text-[5px] text-gray-700">NO SIGNAL</div>
                             )}
                        </div>
                    ))}
                </div>
              </div>

              {/* H.I.V.E Overview (Simplified for Dashboard) */}
              <div className={`border ${themeBorder} bg-black/40 p-3 flex flex-col gap-2 min-h-[200px]`}>
                  <h3 className={`${themeText} text-[10px] font-bold tracking-widest border-b ${themeBorder} pb-1`}>ACTIVE_OPERATIONS</h3>
                  <div className="flex-1 flex flex-col justify-center items-center">
                       {state.activeOperation.status === 'IDLE' ? (
                           <div className="text-gray-600 text-xs font-mono">SYSTEM STANDBY</div>
                       ) : (
                           <div className="w-full">
                               <div className="flex justify-between text-xs mb-1 font-mono">
                                   <span className={themeText}>{state.activeOperation.name}</span>
                                   <span>{state.activeOperation.progress}%</span>
                               </div>
                               <div className="w-full h-2 bg-gray-900">
                                   <div className={`h-full ${isHighSec ? 'bg-red-600' : 'bg-cyan-600'} transition-all`} style={{width: `${state.activeOperation.progress}%`}}></div>
                               </div>
                               <div className="mt-2 text-[9px] font-mono text-gray-500">
                                   {state.activeOperation.details}
                               </div>
                           </div>
                       )}
                  </div>
              </div>
          </div>
      </div>
  );

  const HiveMindView = () => (
      <div className="flex flex-col h-full gap-2 animate-in fade-in zoom-in duration-500">
          <div className={`flex-1 border ${themeBorder} bg-black relative overflow-hidden flex items-center justify-center`}>
              <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
              
              {/* Neural Grid Visualization */}
              <div className="grid grid-cols-6 gap-2 rotate-12 scale-110">
                  {state.hive.nodes.slice(0, 36).map(node => (
                      <div key={node.id} className={`w-8 h-8 md:w-12 md:h-12 border ${node.status === 'ACTIVE' ? (isHighSec ? 'border-red-500 bg-red-900/40' : 'border-cyan-500 bg-cyan-900/40') : 'border-gray-800 bg-black'} flex items-center justify-center text-[8px] transition-all duration-300`}>
                          <div className={`w-2 h-2 rounded-full ${node.status === 'ACTIVE' ? (isHighSec ? 'bg-red-400' : 'bg-cyan-400') : 'bg-gray-800'}`}></div>
                      </div>
                  ))}
              </div>

              <div className="absolute bottom-4 left-4 font-mono text-xs">
                  <div className={themeText}>H.I.V.E. CORE MONITOR</div>
                  <div className="text-gray-500">DENSITY: {state.hive.neuralDensity} N/ms</div>
                  <div className="text-gray-500">QUANTUM SYNC: {state.hive.quantumStability}%</div>
              </div>
          </div>

          <div className={`h-32 border ${themeBorder} bg-black/40 p-2 overflow-y-auto font-mono text-[9px]`}>
              <div className="mb-1 text-gray-500">THREAD_DUMP_LOG:</div>
              {Array.from({length: 8}).map((_, i) => (
                  <div key={i} className="text-gray-400 opacity-60">
                      0x{Math.random().toString(16).substr(2,8).toUpperCase()} :: THREAD_{Math.floor(Math.random()*9000)+1000} :: {['ALLOCATING', 'SYNCING', 'PURGING', 'OPTIMIZING'][Math.floor(Math.random()*4)]}
                  </div>
              ))}
          </div>
      </div>
  );

  const TacticalMapView = () => (
      <div className="flex flex-col h-full gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
           <div className={`flex-1 border ${themeBorder} bg-black relative overflow-hidden group`}>
               {/* Map Grid Background */}
               <div className="absolute inset-0 opacity-20" style={{ 
                   backgroundImage: `linear-gradient(${isHighSec ? '#300' : '#003'} 1px, transparent 1px), linear-gradient(90deg, ${isHighSec ? '#300' : '#003'} 1px, transparent 1px)`,
                   backgroundSize: '40px 40px'
               }}></div>
               
               {/* World Map Outline (Simulated) */}
               <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <svg viewBox="0 0 100 50" className="w-full h-full fill-none stroke-current text-gray-500" preserveAspectRatio="none">
                        <path d="M10,10 Q30,5 50,10 T90,10" strokeWidth="0.5" />
                        <path d="M15,20 Q35,15 55,20 T95,20" strokeWidth="0.5" />
                        <path d="M5,30 Q25,35 45,30 T85,30" strokeWidth="0.5" />
                    </svg>
               </div>

               {/* Drone Units */}
               {state.drones.map(drone => (
                   <div key={drone.id} 
                        className="absolute w-8 h-8 flex items-center justify-center transition-all duration-1000"
                        style={{ left: `${drone.location.x}%`, top: `${drone.location.y}%` }}
                   >
                       <div className={`w-3 h-3 rotate-45 border ${drone.status === 'ATTACK' ? 'bg-red-500 border-red-300' : 'bg-blue-500 border-blue-300'} shadow-[0_0_10px_currentColor] animate-pulse`}></div>
                       <div className="absolute top-full mt-1 text-[8px] font-mono text-white whitespace-nowrap bg-black/50 px-1 border border-gray-700">
                           {drone.name} [{drone.status}]
                       </div>
                   </div>
               ))}

               {/* Satellites */}
               {state.satellites.map((sat, i) => (
                   <div key={sat.id} className="absolute w-2 h-2 bg-white rounded-full animate-pulse" style={{top: `${20 + i*10}%`, left: `${40 + i*15}%`}}>
                       <div className="absolute -top-4 -left-4 text-[7px] text-gray-400 whitespace-nowrap">{sat.designation}</div>
                   </div>
               ))}
               
               {/* DEFCON STATUS */}
               <div className="absolute top-2 right-2 border border-red-900 bg-black/80 p-2 text-center">
                   <div className="text-[8px] text-red-500 tracking-widest">DEFCON</div>
                   <div className="text-2xl font-bold text-red-600">{state.networkHealth.defcon}</div>
               </div>
           </div>

           {/* Drone Roster */}
           <div className="h-32 border-t border-gray-800 bg-black/40 p-2 overflow-y-auto">
                <table className="w-full text-[9px] font-mono text-left">
                    <thead className="text-gray-500 border-b border-gray-700">
                        <tr>
                            <th className="py-1">UNIT_ID</th>
                            <th>STATUS</th>
                            <th>BATTERY</th>
                            <th>LOCATION</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-300">
                        {state.drones.map(d => (
                            <tr key={d.id} className="border-b border-gray-800/50 hover:bg-white/5">
                                <td className="py-1 font-bold">{d.name}</td>
                                <td className={d.status === 'ATTACK' ? 'text-red-500' : 'text-blue-400'}>{d.status}</td>
                                <td>
                                    <div className="w-12 h-1.5 bg-gray-800">
                                        <div className="h-full bg-green-500" style={{width: `${d.battery}%`}}></div>
                                    </div>
                                </td>
                                <td>{d.location.label}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
           </div>
      </div>
  );

  const DatabaseView = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Biometrics with DNA */}
          <div className={`border ${themeBorder} bg-black/40 p-2 flex flex-col h-[calc(50vh-4rem)] md:h-auto`}>
              <h3 className={`${themeText} text-[10px] font-bold tracking-widest border-b ${themeBorder} pb-1 mb-2`}>BIOMETRIC_DATA</h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scroll">
                  {state.biometrics.map(user => (
                      <div key={user.id} className="flex gap-2 bg-black/60 p-2 border border-gray-800">
                          <div className="w-10 h-10 bg-gray-900 flex items-center justify-center border border-gray-700 relative overflow-hidden">
                              <span className="text-lg z-10">👤</span>
                              {/* DNA Animation placeholder */}
                              <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                          </div>
                          <div className="flex-1 flex flex-col justify-center">
                              <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-white">{user.name}</span>
                                  <span className={`text-[8px] px-1 border ${user.status === 'AUTHORIZED' ? 'border-green-800 text-green-500' : 'border-red-800 text-red-500'}`}>
                                      {user.status}
                                  </span>
                              </div>
                              <div className="text-[8px] text-gray-500 font-mono flex justify-between">
                                  <span>BPM: {user.heartRate}</span>
                                  <span>DNA: {user.dnaSequence?.substring(0,6)}...</span>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Evidence Locker */}
          <div className={`border ${themeBorder} bg-black/40 p-2 flex flex-col h-[calc(50vh-4rem)] md:h-auto`}>
              <h3 className={`${themeText} text-[10px] font-bold tracking-widest border-b ${themeBorder} pb-1 mb-2`}>EVIDENCE_FILES</h3>
              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 content-start custom-scroll">
                   {state.evidenceFiles.map(file => (
                       <div key={file.id} 
                            onClick={() => setSelectedEvidence(file)}
                            className="aspect-square bg-black border border-gray-800 relative group cursor-pointer hover:border-white transition-colors">
                           {file.imageUrl ? (
                               <img src={file.imageUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs">NO IMG</div>
                           )}
                           <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[8px] text-white p-1 truncate">
                               {file.title}
                           </div>
                       </div>
                   ))}
              </div>
          </div>
      </div>
  );

  const SystemsView = () => (
      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4 duration-500 h-full overflow-y-auto">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-none">
               {/* Process Manager */}
               <div className={`border ${themeBorder} bg-black/40 p-2 flex flex-col h-64 md:h-auto`}>
                    <h3 className={`${themeText} text-[10px] font-bold tracking-widest border-b ${themeBorder} pb-1 mb-2`}>PROCESS_MANAGER</h3>
                    <div className="flex-1 overflow-y-auto font-mono text-[9px]">
                        <table className="w-full text-left text-gray-400">
                            <thead className="text-gray-600 border-b border-gray-800">
                                <tr><th>PID</th><th>NAME</th><th>CPU</th><th>MEM</th></tr>
                            </thead>
                            <tbody>
                                {state.processes.map(p => (
                                    <tr key={p.pid} className="border-b border-gray-900/50">
                                        <td>{p.pid}</td>
                                        <td className="text-white">{p.name}</td>
                                        <td>{p.cpu}%</td>
                                        <td>{p.mem}MB</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
               </div>

               {/* Kernel & Encryption Modules (New) */}
               <div className={`border ${themeBorder} bg-black/40 p-2 flex flex-col h-64 md:h-auto`}>
                    <h3 className={`${themeText} text-[10px] font-bold tracking-widest border-b ${themeBorder} pb-1 mb-2`}>KERNEL_MODULES</h3>
                    <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2">
                        {Array.from({length: 8}).map((_, i) => (
                            <div key={i} className="flex justify-between items-center text-gray-400 border-b border-gray-800/50 pb-1">
                                <span>MOD_0x{Math.random().toString(16).substr(2,4).toUpperCase()}</span>
                                <span className={Math.random() > 0.1 ? 'text-green-500' : 'text-red-500'}>{Math.random() > 0.1 ? 'LOADED' : 'ERR_CORRUPT'}</span>
                            </div>
                        ))}
                        <div className="mt-4 pt-2 border-t border-gray-700">
                            <div className="text-gray-500 mb-1">ENCRYPTION LAYER:</div>
                            <div className="text-[9px] text-gray-600 break-all leading-tight opacity-50">
                                {Array.from({length: 120}).map(() => Math.floor(Math.random()*16).toString(16)).join('')}
                            </div>
                        </div>
                    </div>
               </div>
           </div>

           {/* Financial Module */}
           <div className={`border ${themeBorder} bg-black/40 p-3 flex-none h-40`}>
               <h3 className={`${themeText} text-[10px] font-bold tracking-widest border-b ${themeBorder} pb-2 mb-2 flex justify-between`}>
                   <span>FINANCIAL_MARKET_ACCESS</span>
                   <span className="text-green-500">${state.finance.balance.toLocaleString()}</span>
               </h3>
               <div className="grid grid-cols-2 gap-4">
                   <table className="w-full text-[10px] font-mono">
                       <tbody>
                           {state.finance.assets.map((asset, i) => (
                               <tr key={i} className="border-b border-gray-800">
                                   <td className="py-1 text-white font-bold">{asset.symbol}</td>
                                   <td className="text-right text-gray-400">${asset.value.toLocaleString()}</td>
                                   <td className={`text-right ${asset.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                       {asset.change > 0 ? '+' : ''}{asset.change}%
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
                   <div className="flex items-center justify-center border border-gray-800">
                       <div className="text-center">
                            <div className="text-[9px] text-gray-500">MINING RATE</div>
                            <div className="text-xl text-purple-500 font-bold animate-pulse">{state.finance.miningRate}</div>
                       </div>
                   </div>
               </div>
           </div>
      </div>
  );

  const ProtocolsView = () => (
      <div className="flex flex-col h-full gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className={`border ${themeBorder} bg-black/40 p-4`}>
              <h3 className={`${themeText} text-[10px] font-bold tracking-widest border-b ${themeBorder} pb-2 mb-3`}>
                  ACTIVE_PROTOCOL // <span className="text-white bg-white/10 px-2 py-0.5">{state.systemMode}</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Standard Protocols */}
                  <div>
                      <div className="text-[9px] text-gray-500 mb-2 uppercase tracking-wider">Standard Protocols</div>
                      <div className="flex flex-wrap gap-2">
                          {['NORMAL', 'HIGH_SECURITY', 'AWAY', 'SLEEP'].map(mode => (
                              <button
                                key={mode}
                                onClick={() => applyStandardMode(mode)}
                                className={`flex-1 min-w-[100px] border border-gray-800 bg-black/50 py-3 text-xs font-mono hover:bg-white/5 transition-all
                                    ${state.systemMode === mode ? `border-${isHighSec ? 'red' : 'cyan'}-500 text-${isHighSec ? 'red' : 'cyan'}-400` : 'text-gray-400'}
                                `}
                              >
                                  {mode}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Create New */}
                  <div className="border-l border-gray-800 pl-6">
                      <div className="text-[9px] text-gray-500 mb-2 uppercase tracking-wider">Snapshot Current State</div>
                      <form onSubmit={handleSavePreset} className="flex gap-2">
                          <input 
                            type="text" 
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="PROTOCOL_NAME"
                            className="flex-1 bg-black border border-gray-800 text-white px-3 py-2 text-xs font-mono focus:border-white outline-none uppercase"
                          />
                          <button type="submit" className="bg-gray-800 px-4 text-[10px] hover:bg-white hover:text-black transition-colors">
                              SAVE
                          </button>
                      </form>
                      <div className="mt-2 text-[9px] text-gray-600">
                          Saves current Lights, Security, and Entertainment settings as a new named protocol.
                      </div>
                  </div>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto">
              <h3 className={`${themeText} text-[10px] font-bold tracking-widest border-b ${themeBorder} pb-1 mb-2`}>CUSTOM_PROTOCOLS_DB</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {state.customPresets.map(preset => (
                      <div key={preset.id} className="relative group border border-gray-800 bg-black/40 hover:border-white/40 transition-all p-3">
                          <div className="flex justify-between items-start mb-2">
                              <span className="font-mono font-bold text-white">{preset.name}</span>
                              <button onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }} className="text-red-900 hover:text-red-500 text-[10px]">DELETE</button>
                          </div>
                          
                          <div className="space-y-1 text-[8px] text-gray-500 font-mono">
                              <div className="flex justify-between">
                                  <span>LIGHTS</span>
                                  <span className={Object.values(preset.lights).some(v=>v) ? 'text-green-500' : 'text-gray-700'}>
                                      {Object.values(preset.lights).filter(v=>v).length} ON
                                  </span>
                              </div>
                              <div className="flex justify-between">
                                  <span>SECURITY</span>
                                  <span className={preset.security.perimeterArmed ? 'text-red-500' : 'text-gray-700'}>
                                      {preset.security.perimeterArmed ? 'ARMED' : 'SAFE'}
                                  </span>
                              </div>
                              <div className="flex justify-between">
                                  <span>TEMP</span>
                                  <span>{preset.environment.temperature}°C</span>
                              </div>
                          </div>

                          <button 
                            onClick={() => applyPreset(preset)}
                            className={`w-full mt-3 py-1 text-[9px] border border-gray-800 hover:bg-white hover:text-black transition-colors ${state.systemMode === preset.name ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                          >
                              EXECUTE
                          </button>
                      </div>
                  ))}
                  {state.customPresets.length === 0 && (
                      <div className="col-span-full py-8 text-center text-gray-700 text-xs font-mono border border-dashed border-gray-900">
                          NO CUSTOM PROTOCOLS FOUND
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  // --- MAIN RENDER ---

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
        
        {/* Navigation Tabs */}
        <div className={`flex border-b ${themeBorder} bg-black/60 backdrop-blur-sm z-10 overflow-x-auto no-scrollbar`}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onUpdateState(p => ({...p, viewMode: tab.id as any}))}
                    className={`
                        flex-1 py-2 text-[9px] md:text-[10px] font-bold tracking-widest uppercase transition-all whitespace-nowrap min-w-[80px]
                        border-r ${themeBorder} flex items-center justify-center gap-2
                        ${state.viewMode === tab.id 
                            ? `${themeBg} ${themeText} shadow-[inset_0_-2px_0_currentColor]` 
                            : 'text-gray-600 hover:text-gray-300 hover:bg-white/5'}
                    `}
                >
                    <span className="text-sm">{tab.icon}</span>
                    <span className="hidden md:inline">{tab.label}</span>
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-2 relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5">
            {state.viewMode === 'DASHBOARD' && <DashboardView />}
            {state.viewMode === 'HIVE' && <HiveMindView />}
            {state.viewMode === 'TACTICAL' && <TacticalMapView />}
            {state.viewMode === 'DATABASE' && <DatabaseView />}
            {state.viewMode === 'SYSTEMS' && <SystemsView />}
            {state.viewMode === 'PROTOCOLS' && <ProtocolsView />}
        </div>
        
        {/* Modals (Evidence & Camera) */}
        {selectedEvidence && (
            <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedEvidence(null)}>
                <div className={`w-full max-w-2xl border ${themeBorder} bg-black p-1`} onClick={e => e.stopPropagation()}>
                    <img src={selectedEvidence.imageUrl} className="w-full h-auto" />
                    <div className="p-2 bg-black text-white font-mono text-xs">{selectedEvidence.title}</div>
                </div>
            </div>
        )}
        
        {viewingCamera && (
             <div className="absolute inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setViewingCamera(null)}>
                <div className="relative w-full h-full p-4 flex flex-col">
                    <div className={`flex-1 bg-black relative border-2 ${isHighSec ? 'border-red-600' : 'border-red-900'} overflow-hidden`}>
                         
                         {/* Standard Feed Elements */}
                         <div className="absolute inset-0 bg-green-900/10"></div>
                         <div className="absolute top-4 left-4 text-green-500 font-mono text-xl animate-pulse z-10">LIVE FEED // CAM_{viewingCamera}</div>
                         <div className="absolute bottom-4 right-4 text-green-500 font-mono text-sm z-10">REC ● {new Date().toLocaleTimeString()}</div>
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] animate-[noise_0.2s_infinite]"></div>

                         {/* HIGH SECURITY ENHANCEMENTS */}
                         {isHighSec && (
                            <>
                                {/* Intense Red Tint */}
                                <div className="absolute inset-0 bg-red-900/30 mix-blend-multiply pointer-events-none"></div>
                                
                                {/* Heavy Static (Overlay) */}
                                <div className="absolute inset-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] animate-[noise_0.05s_infinite] mix-blend-overlay pointer-events-none"></div>
                                
                                {/* Sporadic Glitch Layers */}
                                <div className="absolute inset-0 bg-red-500/10 animate-[sporadic-glitch-anim_2s_infinite] pointer-events-none"></div>
                                <div className="absolute inset-0 bg-cyan-500/10 animate-[sporadic-glitch-anim_3s_infinite_reverse] pointer-events-none" style={{animationDelay: '0.5s'}}></div>
                                
                                {/* Critical Warning Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-red-600 font-bold text-6xl tracking-[0.5em] opacity-30 animate-pulse rotate-[-15deg] border-4 border-red-600 p-4">
                                        BREACH
                                    </div>
                                </div>
                            </>
                         )}

                    </div>
                    <button className="mt-4 border border-gray-700 text-gray-500 py-2 hover:bg-white/10" onClick={() => setViewingCamera(null)}>CLOSE FEED</button>
                </div>
             </div>
        )}

    </div>
  );
};

export default SmartHomePanel;
