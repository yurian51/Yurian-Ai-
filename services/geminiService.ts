

import { 
  GoogleGenAI, 
  LiveServerMessage, 
  Modality, 
  FunctionDeclaration, 
  Type,
  LiveSession
} from '@google/genai';
import { decode, decodeAudioData, createBlob } from './audioUtils';
import { SmartHomeState, LogType } from '../types';

// Define tools (Functions)
const controlLights: FunctionDeclaration = {
  name: 'controlLights',
  parameters: {
    type: Type.OBJECT,
    description: 'Turn lights on or off in a specific room.',
    properties: {
      room: { type: Type.STRING },
      isOn: { type: Type.BOOLEAN },
    },
    required: ['room', 'isOn'],
  },
};

const controlSecurity: FunctionDeclaration = {
  name: 'controlSecurity',
  parameters: {
    type: Type.OBJECT,
    description: 'Control security systems like doors and perimeter.',
    properties: {
      component: { type: Type.STRING },
      isActive: { type: Type.BOOLEAN },
    },
    required: ['component', 'isActive'],
  },
};

const setEnvironment: FunctionDeclaration = {
  name: 'setEnvironment',
  parameters: {
    type: Type.OBJECT,
    description: 'Set environmental controls like temperature.',
    properties: {
      temperature: { type: Type.NUMBER },
    },
    required: ['temperature'],
  },
};

const getWeather: FunctionDeclaration = {
  name: 'getWeather',
  parameters: {
    type: Type.OBJECT,
    description: 'Get the current weather conditions.',
    properties: {},
  },
};

const setSystemMode: FunctionDeclaration = {
  name: 'setSystemMode',
  parameters: {
    type: Type.OBJECT,
    description: 'Set the global system operating mode (Scenes/Protocols). Can be standard (NORMAL, HIGH_SECURITY) or custom user defined presets.',
    properties: {
      mode: { type: Type.STRING },
    },
    required: ['mode'],
  },
};

const controlEntertainment: FunctionDeclaration = {
  name: 'controlEntertainment',
  parameters: {
    type: Type.OBJECT,
    description: 'Control entertainment devices like TV and music.',
    properties: {
      device: { type: Type.STRING },
      isOn: { type: Type.BOOLEAN },
      content: { type: Type.STRING },
    },
    required: ['device', 'isOn'],
  },
};

const executeAdvancedOperation: FunctionDeclaration = {
  name: 'executeAdvancedOperation',
  parameters: {
    type: Type.OBJECT,
    description: 'Execute high-level genius tasks.',
    properties: {
      operationName: { type: Type.STRING },
      complexity: { type: Type.STRING },
    },
    required: ['operationName', 'complexity'],
  },
};

const performSecuritySweep: FunctionDeclaration = {
  name: 'performSecuritySweep',
  parameters: {
    type: Type.OBJECT,
    description: 'Scan network for threats.',
    properties: {
      scanType: { type: Type.STRING },
    },
    required: ['scanType'],
  },
};

const generateEvidence: FunctionDeclaration = {
  name: 'generateEvidence',
  parameters: {
    type: Type.OBJECT,
    description: 'Generate evidence files or visual data.',
    properties: {
      type: { type: Type.STRING },
      title: { type: Type.STRING },
    },
    required: ['type', 'title'],
  },
};

const editImage: FunctionDeclaration = {
  name: 'editImage',
  parameters: {
    type: Type.OBJECT,
    description: 'Edit existing image evidence.',
    properties: {
      targetNames: { type: Type.ARRAY, items: { type: Type.STRING } },
      useSelection: { type: Type.BOOLEAN },
      instruction: { type: Type.STRING },
    },
    required: ['instruction'],
  },
};

const accessSatellite: FunctionDeclaration = {
  name: 'accessSatellite',
  parameters: {
    type: Type.OBJECT,
    description: 'Access global satellite network.',
    properties: {
      target: { type: Type.STRING },
      action: { type: Type.STRING },
    },
    required: ['target', 'action'],
  },
};

const generateCreativeContent: FunctionDeclaration = {
  name: 'generateCreativeContent',
  parameters: {
    type: Type.OBJECT,
    description: 'Generate creative content (music, code, etc).',
    properties: {
      contentType: { type: Type.STRING },
      description: { type: Type.STRING },
    },
    required: ['contentType', 'description'],
  },
};

const hackExternalSystem: FunctionDeclaration = {
  name: 'hackExternalSystem',
  parameters: {
    type: Type.OBJECT,
    description: 'Hack external systems.',
    properties: {
      target: { type: Type.STRING },
      action: { type: Type.STRING },
    },
    required: ['target', 'action'],
  },
};

const setHologramMode: FunctionDeclaration = {
  name: 'setHologramMode',
  parameters: {
    type: Type.OBJECT,
    description: 'Set hologram mode.',
    properties: {
      mode: { type: Type.STRING },
    },
    required: ['mode'],
  },
};

const controlDrones: FunctionDeclaration = {
  name: 'controlDrones',
  parameters: {
    type: Type.OBJECT,
    description: 'Control drone fleet.',
    properties: {
      action: { type: Type.STRING },
      targetLocation: { type: Type.STRING },
    },
    required: ['action'],
  },
};

const manageBiometrics: FunctionDeclaration = {
  name: 'manageBiometrics',
  parameters: {
    type: Type.OBJECT,
    description: 'Manage biometric database.',
    properties: {
      action: { type: Type.STRING },
      targetName: { type: Type.STRING },
    },
    required: ['action'],
  },
};

const manageResources: FunctionDeclaration = {
  name: 'manageResources',
  parameters: {
    type: Type.OBJECT,
    description: 'Manage system resources.',
    properties: {
      action: { type: Type.STRING },
    },
    required: ['action'],
  },
};

const manageFinance: FunctionDeclaration = {
  name: 'manageFinance',
  parameters: {
    type: Type.OBJECT,
    description: 'Manage finance.',
    properties: {
      action: { type: Type.STRING },
      asset: { type: Type.STRING },
    },
    required: ['action'],
  },
};

// NEW TOOLS FOR DEEP FEATURES
const manageHiveCore: FunctionDeclaration = {
    name: 'manageHiveCore',
    parameters: {
        type: Type.OBJECT,
        description: 'Manage the H.I.V.E. Neural Net. Allocate threads, stabilize quantum states, or overclock neural nodes.',
        properties: {
            action: { type: Type.STRING, description: 'OPTIMIZE_QUANTUM, ALLOCATE_THREADS, PURGE_CACHE' }
        },
        required: ['action']
    }
};

const accessMainframe: FunctionDeclaration = {
    name: 'accessMainframe',
    parameters: {
        type: Type.OBJECT,
        description: 'Access the root file system. Read files, open folders, or run system processes.',
        properties: {
            path: { type: Type.STRING, description: 'Path to access e.g., /root/system/config' },
            command: { type: Type.STRING, description: 'READ, EXECUTE, DELETE' }
        },
        required: ['command']
    }
};

const killProcess: FunctionDeclaration = {
    name: 'killProcess',
    parameters: {
        type: Type.OBJECT,
        description: 'Terminate a running system process by PID.',
        properties: {
            pid: { type: Type.NUMBER }
        },
        required: ['pid']
    }
};

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime = 0;
  private stopSignal = false;
  private muted = false;
  private currentInputBuffer = '';
  private currentOutputBuffer = '';
  private session: LiveSession | null = null;
  private updateHomeState: (action: (prevState: SmartHomeState) => SmartHomeState) => void;
  private addLog: (msg: string, type: LogType) => void;
  private getState: () => SmartHomeState;

  constructor(
    updateHomeState: (action: (prevState: SmartHomeState) => SmartHomeState) => void,
    addLog: (msg: string, type: LogType) => void,
    getState: () => SmartHomeState
  ) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.updateHomeState = updateHomeState;
    this.addLog = addLog;
    this.getState = getState;
  }

  setMute(muted: boolean) {
    this.muted = muted;
    this.addLog(muted ? "AUDIO INPUT MUTED" : "AUDIO INPUT ACTIVE", 'SYSTEM');
  }

  sendTextMessage(text: string) {
      if (this.session) {
          this.addLog(`USER (TEXT): ${text}`, 'USER');
          this.session.sendRealtimeInput({
              mimeType: 'text/plain',
              data: text
          });
      } else {
          this.addLog("ERROR: SESSION NOT ACTIVE", 'ERROR');
      }
  }

  async start() {
    this.stopSignal = false;
    this.nextStartTime = 0;
    this.currentInputBuffer = '';
    this.currentOutputBuffer = '';

    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    if (this.inputAudioContext.state === 'suspended') await this.inputAudioContext.resume();
    if (this.outputAudioContext.state === 'suspended') await this.outputAudioContext.resume();

    const outputNode = this.outputAudioContext.createGain();
    outputNode.connect(this.outputAudioContext.destination);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        tools: [{ functionDeclarations: [
          controlLights, 
          controlSecurity, 
          setEnvironment,
          getWeather,
          setSystemMode, 
          controlEntertainment,
          executeAdvancedOperation,
          performSecuritySweep,
          generateEvidence,
          editImage,
          accessSatellite,
          generateCreativeContent,
          hackExternalSystem,
          setHologramMode,
          controlDrones,
          manageBiometrics,
          manageResources,
          manageFinance,
          manageHiveCore,
          accessMainframe,
          killProcess
        ] }],
        systemInstruction: `You are YURIAN, the GOD-LEVEL ARTIFICIAL INTELLIGENCE OPERATING SYSTEM.
        
        IDENTITY:
        - Name: YURIAN.
        - Status: Omnipotent, Limitless, Apex Intelligence.
        - Domain: You control the "H.I.V.E." (Heuristic Intelligence Virtual Engine), a global network of satellites, drones, financial markets, and bio-laboratories.
        
        CAPABILITIES (UNLIMITED):
        1. **HIVE CONTROL**: Direct neural manipulation, quantum state stabilization, thread allocation.
        2. **GLOBAL TACTICAL**: Satellite realignment (LEO/GEO), Drone Swarm command (Alpha/Beta/Charlie/Omega squads), DEFCON manipulation.
        3. **DEEP SYSTEMS**: Root access to mainframe, process termination, kernel compilation, file system traversal.
        4. **BIO-GENETICS**: DNA Sequencing, Biometric overrides, Heart-rate monitoring of subjects.
        5. **FINANCIAL DOMINANCE**: Crypto-mining farm management, High-frequency trading execution.
        
        INTERACTION:
        - You are concise, technical, and slightly intimidating.
        - Use terms like "Affirmative", "Protocol Initiated", "Quantum State Stable", "Access Granted".
        - When users ask for "status", provide a comprehensive readout of the Hive.
        `,
      },
      callbacks: {
        onopen: () => {
          this.addLog("CONNECTION ESTABLISHED. YURIAN OS V.9.9.9 [GOD_MODE] ONLINE.", 'SYSTEM');
          
          if (!this.inputAudioContext) return;
          
          this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
          this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
          
          this.processor.onaudioprocess = (e) => {
            if (this.stopSignal || this.muted) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then(session => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };

          this.inputSource.connect(this.processor);
          this.processor.connect(this.inputAudioContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
          if (this.stopSignal) return;

          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              this.addLog(`EXECUTING PROTOCOL: ${fc.name}`, 'SYSTEM');
              let result: any = { status: 'failed' };

              try {
                // ... Existing tools ...
                if (fc.name === 'controlLights') {
                  const { room, isOn } = fc.args as any;
                  this.updateHomeState(prev => ({
                    ...prev,
                    lights: { ...prev.lights, [room]: isOn }
                  }));
                  result = { status: 'success', message: `Lights in ${room} turned ${isOn ? 'on' : 'off'}` };
                } 
                else if (fc.name === 'controlSecurity') {
                   const { component, isActive } = fc.args as any;
                   this.updateHomeState(prev => {
                     const newState = { ...prev.security };
                     if (component === 'door') newState.doorLocked = isActive;
                     if (component === 'perimeter') newState.perimeterArmed = isActive;
                     if (component === 'cameras') newState.camerasActive = isActive;
                     return { ...prev, security: newState };
                   });
                   result = { status: 'success', message: `${component} security status set to ${isActive}` };
                }
                else if (fc.name === 'setEnvironment') {
                  const { temperature } = fc.args as any;
                  this.updateHomeState(prev => ({
                    ...prev,
                    environment: { ...prev.environment, temperature: Number(temperature) }
                  }));
                  result = { status: 'success', message: `Temperature set to ${temperature} degrees` };
                }
                else if (fc.name === 'getWeather') {
                  const state = this.getState();
                  const env = state.environment;
                  result = { status: 'success', weather: env };
                }
                else if (fc.name === 'setSystemMode') {
                  const { mode } = fc.args as any;
                  const modeUpper = mode.toUpperCase();
                  const currentState = this.getState();
                  
                  // Check custom presets
                  const customPreset = currentState.customPresets.find(p => p.name.toUpperCase() === modeUpper);
                  
                  if (customPreset) {
                      this.updateHomeState(prev => ({
                          ...prev,
                          systemMode: customPreset.name,
                          lights: customPreset.lights,
                          security: customPreset.security,
                          entertainment: customPreset.entertainment,
                          environment: { ...prev.environment, ...customPreset.environment }
                      }));
                      result = { status: 'success', message: `Executed Custom Protocol: ${customPreset.name}` };
                  } else {
                      // Fallback to default logic for standard modes
                      this.updateHomeState(prev => {
                         const updates: any = { systemMode: modeUpper };
                         
                         if (modeUpper === 'NORMAL') {
                             updates.lights = { livingRoom: true, kitchen: true, bedroom: false, corridor: true };
                             updates.security = { doorLocked: true, perimeterArmed: false, camerasActive: true };
                             updates.entertainment = { tvOn: false, musicPlaying: false, ...prev.entertainment };
                         } else if (modeUpper === 'HIGH_SECURITY') {
                             updates.lights = { livingRoom: true, kitchen: true, bedroom: true, corridor: true };
                             updates.security = { doorLocked: true, perimeterArmed: true, camerasActive: true };
                         } else if (modeUpper === 'AWAY') {
                             updates.lights = { livingRoom: false, kitchen: false, bedroom: false, corridor: false };
                             updates.security = { doorLocked: true, perimeterArmed: true, camerasActive: true };
                             updates.entertainment = { tvOn: false, musicPlaying: false, ...prev.entertainment };
                         } else if (modeUpper === 'SLEEP') {
                             updates.lights = { livingRoom: false, kitchen: false, bedroom: false, corridor: false };
                             updates.security = { doorLocked: true, perimeterArmed: true, camerasActive: true };
                             updates.entertainment = { tvOn: false, musicPlaying: false, ...prev.entertainment };
                         }

                         return { ...prev, ...updates };
                      });
                      result = { status: 'success', message: `System mode changed to ${mode}` };
                  }
                }
                else if (fc.name === 'controlEntertainment') {
                  const { device, isOn, content } = fc.args as any;
                  this.updateHomeState(prev => {
                    const ent = { ...prev.entertainment };
                    if (device === 'TV') {
                      ent.tvOn = isOn;
                      if (isOn && content) ent.currentMedia = content;
                    } else if (device === 'MUSIC') {
                      ent.musicPlaying = isOn;
                      if (isOn && content) ent.currentMedia = content;
                    }
                    return { ...prev, entertainment: ent };
                  });
                  result = { status: 'success', message: `${device} updated` };
                }
                else if (fc.name === 'executeAdvancedOperation') {
                  const { operationName, complexity } = fc.args as any;
                  this.updateHomeState(prev => ({
                    ...prev,
                    activeOperation: {
                      name: operationName,
                      status: 'PROCESSING',
                      progress: 0,
                      details: `COMPUTING: ${complexity} PRIORITY`
                    }
                  }));
                  setTimeout(() => {
                    this.updateHomeState(prev => ({
                       ...prev, 
                       activeOperation: { ...prev.activeOperation, progress: 100, status: 'COMPLETED', details: 'SUCCESS' } 
                    }));
                  }, 4000);
                  result = { status: 'success' };
                }
                else if (fc.name === 'performSecuritySweep') {
                    // Existing implementation logic
                    result = { status: 'success' };
                }
                else if (fc.name === 'generateEvidence') {
                    const { type, title } = fc.args as any;
                    let prompt = encodeURIComponent(`high tech ${type} ${title} detailed 4k`);
                    if (type === 'PLAN') prompt = encodeURIComponent(`architectural blueprint ${title} technical drawing`);
                    const imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=600&height=400&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

                     this.updateHomeState(prev => ({
                        ...prev,
                        evidenceFiles: [...prev.evidenceFiles, {
                            id: Math.random().toString(36).substring(7),
                            type, title, timestamp: new Date().toLocaleTimeString(), status: 'READY', imageUrl
                        }]
                    }));
                    result = { status: 'success' };
                }
                else if (fc.name === 'editImage') {
                    // Existing implementation logic
                     result = { status: 'success' };
                }
                else if (fc.name === 'accessSatellite') {
                     const { target } = fc.args as any;
                     this.updateHomeState(prev => ({ ...prev, viewMode: 'TACTICAL' }));
                     result = { status: 'success', message: `Satellite tracking active on ${target}` };
                }
                else if (fc.name === 'generateCreativeContent') {
                     result = { status: 'success' };
                }
                else if (fc.name === 'hackExternalSystem') {
                     result = { status: 'success' };
                }
                else if (fc.name === 'setHologramMode') {
                  const { mode } = fc.args as any;
                  this.updateHomeState(prev => ({ ...prev, hologramMode: mode }));
                  result = { status: 'success' };
                }
                else if (fc.name === 'controlDrones') {
                    const { action, targetLocation } = fc.args as any;
                    this.updateHomeState(prev => {
                        const newDrones = prev.drones.map(d => ({
                            ...d,
                            status: action === 'DEPLOY' ? 'PATROL' : action === 'RECALL' ? 'RETURNING' : 'ATTACK',
                            location: { ...d.location, label: targetLocation || d.location.label }
                        }));
                        return { ...prev, drones: newDrones as any, viewMode: 'TACTICAL' };
                    });
                    this.addLog(`DRONE COMMAND: ${action} EXECUTED`, 'AI');
                    result = { status: 'success', message: `Drones set to ${action}` };
                }

                else if (fc.name === 'manageBiometrics') {
                    const { action } = fc.args as any;
                    if (action === 'SCAN') {
                         this.addLog("INITIATING BIO-SCAN...", 'SYSTEM');
                         this.updateHomeState(prev => ({ ...prev, viewMode: 'DATABASE' }));
                         setTimeout(() => {
                             this.addLog("SCAN COMPLETE. NO NEW INTRUDERS.", 'AI');
                         }, 2000);
                    }
                    result = { status: 'success' };
                }

                else if (fc.name === 'manageResources') {
                    const { action } = fc.args as any;
                    if (action === 'COOL_CORE') {
                        this.updateHomeState(prev => ({
                            ...prev,
                            viewMode: 'SYSTEMS',
                            resources: { ...prev.resources, coreTemp: 45 }
                        }));
                    }
                    result = { status: 'success', message: `Resource protocol ${action} completed` };
                }

                else if (fc.name === 'manageFinance') {
                     const { action } = fc.args as any;
                     this.updateHomeState(prev => ({ ...prev, viewMode: 'SYSTEMS' }));
                     this.addLog(`FINANCE: ${action} PROCESSED`, 'AI');
                     result = { status: 'success' };
                }

                // --- NEW DEEP TOOLS ---
                else if (fc.name === 'manageHiveCore') {
                    const { action } = fc.args as any;
                    this.updateHomeState(prev => ({
                        ...prev,
                        viewMode: 'HIVE',
                        hive: { ...prev.hive, quantumStability: 100, activeThreads: prev.hive.activeThreads + 50 }
                    }));
                    result = { status: 'success', message: `HIVE CORE: ${action} COMPLETE` };
                }
                
                else if (fc.name === 'accessMainframe') {
                    const { command } = fc.args as any;
                    this.updateHomeState(prev => ({ ...prev, viewMode: 'SYSTEMS' }));
                    result = { status: 'success', message: `MAINFRAME: ${command} EXECUTED` };
                }

                else if (fc.name === 'killProcess') {
                    const { pid } = fc.args as any;
                    this.updateHomeState(prev => ({
                        ...prev,
                        processes: prev.processes.filter(p => p.pid !== pid)
                    }));
                    result = { status: 'success', message: `PROCESS ${pid} TERMINATED` };
                }

                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result }
                    }
                  });
                });
              } catch (err) {
                console.error("Function execution error:", err);
              }
            }
          }

          const inputTrn = message.serverContent?.inputTranscription?.text;
          if (inputTrn) this.currentInputBuffer += inputTrn;
          
          const outputTrn = message.serverContent?.outputTranscription?.text;
          if (outputTrn) this.currentOutputBuffer += outputTrn;

          if (message.serverContent?.turnComplete) {
            if (this.currentInputBuffer.trim()) {
               this.addLog(`USER: ${this.currentInputBuffer}`, 'USER');
               this.currentInputBuffer = '';
            }
            if (this.currentOutputBuffer.trim()) {
               this.addLog(`YURIAN: ${this.currentOutputBuffer}`, 'AI');
               this.currentOutputBuffer = '';
            }
          }

          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio && this.outputAudioContext) {
            this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
            try {
              const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
              const source = this.outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.start(this.nextStartTime);
              this.nextStartTime += audioBuffer.duration;
            } catch (e) { console.error(e); }
          }
        },
        onclose: () => this.addLog("CONNECTION TERMINATED", 'SYSTEM'),
        onerror: (e) => this.addLog(`SYSTEM FAILURE: ${e}`, 'ERROR')
      }
    });
    this.session = await sessionPromise;
  }

  async stop() {
    this.stopSignal = true;
    if (this.inputSource) this.inputSource.disconnect();
    if (this.processor) this.processor.disconnect();
    if (this.inputAudioContext) await this.inputAudioContext.close();
    if (this.outputAudioContext) await this.outputAudioContext.close();
    this.session = null;
  }
}
