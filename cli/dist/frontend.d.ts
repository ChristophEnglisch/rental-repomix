/**
 * Frontend module discovery
 */
import type { FrontendModuleInfo } from './types.js';
/**
 * Discover frontend modules
 */
export declare function discoverFrontendModules(): Promise<FrontendModuleInfo[]>;
/**
 * Get shared frontend paths
 */
export declare function getSharedPaths(): string[];
/**
 * Get config file paths for frontend
 */
export declare function getConfigPaths(): string[];
