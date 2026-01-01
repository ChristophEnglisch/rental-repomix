/**
 * Parser for Spring Modulith package-info.java files
 * Extracts module metadata and dependencies
 */
import type { BackendModuleInfo, DependencyInfo } from './types.js';
/**
 * Parse a single package-info.java file
 */
export declare function parsePackageInfo(filePath: string): Promise<BackendModuleInfo | null>;
/**
 * Discover all modules in the backend
 */
export declare function discoverBackendModules(): Promise<BackendModuleInfo[]>;
/**
 * Build a dependency graph
 */
export declare function buildDependencyGraph(modules: BackendModuleInfo[]): Map<string, BackendModuleInfo>;
/**
 * Resolve all dependencies for a module (direct only, no transitive)
 */
export declare function resolveDependencies(moduleName: string, graph: Map<string, BackendModuleInfo>, scope?: 'api' | 'full'): DependencyInfo[];
