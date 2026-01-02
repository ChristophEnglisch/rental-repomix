import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const config = {
  // Project root (relative to cli folder)
  projectRoot: resolve(__dirname, '../../..'),
  
  // Backend source path
  backendSrc: 'rental-backend/src/main/java/de/cenglisch/rentalbackend',
  
  // Backend resources path
  backendResourcesPath: 'rental-backend/src/main/resources',
  
  // Frontend source path
  frontendSrc: 'rental-frontend/src',
  
  // Infrastructure path
  infrastructurePath: 'rental-infrastructure',
  
  // Docker compose file
  dockerComposePath: 'rental-infrastructure/docker-compose.yaml',
  
  // Repomix output directory (the only output we keep)
  outputDir: '.repomix/outputs',
  
  // Temp directory for configs
  tempDir: '.repomix/.temp',
  
  // Common module name (always included as dependency)
  commonModule: 'common',
  
  // Default repomix settings
  repomixDefaults: {
    style: 'xml' as const,
    removeComments: true,
    removeEmptyLines: true,
    topFilesLength: 3,
    showLineNumbers: false,
    copyToClipboard: false,
  },
  
  // Backend ignore patterns
  backendIgnorePatterns: [
    '**/target/**',
    '**/.idea/**',
    '**/*.iml',
    '**/.git/**',
    '**/*.class',
    '**/test/**',
    '**/package-info.java',
  ],
  
  // Frontend ignore patterns
  frontendIgnorePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.git/**',
    '**/build/**',
    '**/*.css',
  ],
  
  // Infrastructure ignore patterns
  infrastructureIgnorePatterns: [
    '**/.git/**',
    '**/data/**',
    '**/volumes/**',
    '**/*.log',
  ],
  
  // DB Migration ignore patterns
  dbMigrationIgnorePatterns: [
    '**/.git/**',
    '**/target/**',
  ],
  
  // Infrastructure service mappings (service name -> folder mappings)
  infrastructureServiceMappings: {
    'postgres': {
      folders: ['postgres'],
      patterns: ['**/*.sql', '**/*.sh'],
    },
    'authentik-server': {
      displayName: 'authentik',
      folders: ['authentik'],
      patterns: ['**/*.yaml', '**/*.yml', '**/*.env*'],
    },
    'authentik-worker': {
      skip: true, // Part of authentik-server
    },
    'redis': {
      folders: [],
      patterns: [],
    },
    'mailpit': {
      folders: [],
      patterns: [],
    },
  } as Record<string, { displayName?: string; folders?: string[]; patterns?: string[]; skip?: boolean }>,
};

export type Config = typeof config;
