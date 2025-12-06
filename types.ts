
export interface EvidenceFile {
  id: string;
  type: 'IMAGE' | 'PDF' | 'DATA_LOG' | 'VIDEO' | 'PLAN' | 'WEBSITE_PREVIEW';
  title: string;
  timestamp: string;
  status: 'ANALYZING' | 'READY';
  imageUrl?: string;
}

export interface Drone {
  id: string;
  name: string;
  status: 'IDLE' | 'PATROL' | 'ATTACK' | 'RETURNING' | 'OFFLINE';
  battery: number;
  location: { x: number; y: number; label: string };
  loadout: string;
}

export interface BiometricProfile {
  id: string;
  name: string;
  role: 'ADMIN' | 'GUEST' | 'UNKNOWN' | 'HOSTILE';
  accessLevel: number; // 1-5
  status: 'AUTHORIZED' | 'DENIED' | 'DETECTED';
  lastSeen: string;
  imageUrl?: string;
  dnaSequence?: string; // Hex representation
  heartRate?: number;
}

export interface ResourceStats {
  cpuLoad: number;
  memoryUsage: number; // in TB
  powerOutput: number; // percentage
  coreTemp: number; // Celsius
  encryptionIntegrity: number; // percentage
  networkUpload: number; // TB/s
  uplinkStability: number; // %
}

export interface FinanceState {
  balance: number;
  currency: string;
  miningRate: number; // hash/s
  marketTrend: 'BULL' | 'BEAR' | 'STABLE';
  assets: { symbol: string; value: number; change: number; volume: string }[];
}

export interface HiveNode {
    id: string;
    status: 'ACTIVE' | 'IDLE' | 'CORRUPT' | 'LOCKED';
    load: number;
    function: string;
}

export interface Process {
    pid: number;
    name: string;
    user: string;
    cpu: number;
    mem: number;
    status: 'RUNNING' | 'SLEEPING' | 'ZOMBIE';
}

export interface FileNode {
    id: string;
    name: string;
    type: 'FOLDER' | 'FILE';
    size?: string;
    permissions: string;
    children?: FileNode[];
    content?: string;
}

export interface Satellite {
    id: string;
    designation: string;
    orbit: 'LEO' | 'GEO' | 'MEO';
    status: 'ONLINE' | 'OFFLINE' | 'REALIGNING';
    target: string;
    coverage: number; 
}

export interface SystemPreset {
  id: string;
  name: string;
  lights: {
    livingRoom: boolean;
    kitchen: boolean;
    bedroom: boolean;
    corridor: boolean;
  };
  security: {
    doorLocked: boolean;
    perimeterArmed: boolean;
    camerasActive: boolean;
  };
  entertainment: {
    tvOn: boolean;
    musicPlaying: boolean;
    volume: number;
    currentMedia: string;
  };
  environment: {
      temperature: number;
  };
}

export interface SmartHomeState {
  viewMode: 'DASHBOARD' | 'HIVE' | 'TACTICAL' | 'DATABASE' | 'SYSTEMS' | 'PROTOCOLS';
  systemMode: string;
  customPresets: SystemPreset[];
  hologramMode: 'AUTO' | 'CODE' | 'WRITING' | 'MUSIC' | 'CRITICAL' | 'PROCESSING' | 'EDITING' | 'BATCH_EDITING' | 'DEFAULT';
  powerSavingMode: boolean; 
  activeOperation: {
    name: string | null;
    progress: number;
    status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    details: string;
  };
  networkHealth: {
    status: 'SECURE' | 'WARNING' | 'CRITICAL';
    threatLevel: number; // 0-100
    activeIntrusions: number;
    defcon: 1 | 2 | 3 | 4 | 5;
  };
  lights: {
    livingRoom: boolean;
    kitchen: boolean;
    bedroom: boolean;
    corridor: boolean;
  };
  security: {
    doorLocked: boolean;
    perimeterArmed: boolean;
    camerasActive: boolean;
  };
  environment: {
    temperature: number;
    airQuality: 'GOOD' | 'FAIR' | 'CRITICAL';
    humidity: number;
    condition: string;
    location: string;
  };
  entertainment: {
    tvOn: boolean;
    musicPlaying: boolean;
    volume: number;
    currentMedia: string;
  };
  evidenceFiles: EvidenceFile[];
  selectedEvidenceIds: string[];
  
  // --- NEW ADVANCED MODULES ---
  drones: Drone[];
  biometrics: BiometricProfile[];
  resources: ResourceStats;
  finance: FinanceState;
  
  // Hive Mind
  hive: {
      quantumStability: number; // %
      neuralDensity: number; // nodes/ms
      activeThreads: number;
      nodes: HiveNode[];
  };

  // Systems
  processes: Process[];
  fileSystem: FileNode[]; // Root
  currentPath: string[]; // Navigation stack

  // Tactical
  satellites: Satellite[];
}

export type LogType = 'SYSTEM' | 'USER' | 'AI' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: LogType;
}

export enum ConnectionStatus {
  DISCONNECTED = 'OFFLINE',
  CONNECTING = 'INITIALIZING',
  CONNECTED = 'ONLINE',
  ERROR = 'CRITICAL FAILURE'
}
