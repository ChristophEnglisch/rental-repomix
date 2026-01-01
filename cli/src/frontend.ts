/**
 * Frontend module discovery
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { config } from './config.js';
import type { FrontendModuleInfo } from './types.js';

// Known frontend modules with metadata
const FRONTEND_MODULES: Record<string, { displayName: string; description: string }> = {
  employee: {
    displayName: 'Employee',
    description: 'Employee dashboard, vehicle management, bookings',
  },
  customer: {
    displayName: 'Customer', 
    description: 'Customer portal, booking wizard, profile',
  },
};

/**
 * Discover frontend modules
 */
export async function discoverFrontendModules(): Promise<FrontendModuleInfo[]> {
  const modulesPath = join(config.projectRoot, config.frontendSrc, 'modules');
  const modules: FrontendModuleInfo[] = [];
  
  try {
    const entries = await readdir(modulesPath);
    
    for (const entry of entries) {
      const entryPath = join(modulesPath, entry);
      const stats = await stat(entryPath);
      
      if (stats.isDirectory()) {
        const metadata = FRONTEND_MODULES[entry] || {
          displayName: entry.charAt(0).toUpperCase() + entry.slice(1),
          description: `${entry} module`,
        };
        
        modules.push({
          name: entry,
          displayName: metadata.displayName,
          description: metadata.description,
          category: 'frontend',
          path: `${config.frontendSrc}/modules/${entry}`,
          includeShared: true,
        });
      }
    }
  } catch (error) {
    console.error('Error discovering frontend modules:', error);
  }
  
  return modules.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get shared frontend paths
 */
export function getSharedPaths(): string[] {
  return [
    `${config.frontendSrc}/shared/**/*.tsx`,
    `${config.frontendSrc}/shared/**/*.ts`,
    `${config.frontendSrc}/App.tsx`,
    `${config.frontendSrc}/main.tsx`,
  ];
}

/**
 * Get config file paths for frontend
 */
export function getConfigPaths(): string[] {
  return [
    'rental-frontend/package.json',
    'rental-frontend/vite.config.*',
    'rental-frontend/tailwind.config.*',
  ];
}
