/**
 * Infrastructure module discovery from docker-compose.yaml
 */
import type { InfrastructureModuleInfo, DockerCompose } from './types.js';
/**
 * Parse docker-compose.yaml and extract services
 */
export declare function parseDockerCompose(): Promise<DockerCompose>;
/**
 * Discover infrastructure modules from docker-compose
 */
export declare function discoverInfrastructureModules(): Promise<InfrastructureModuleInfo[]>;
/**
 * Get all infrastructure include patterns (for full infrastructure pack)
 */
export declare function getAllInfrastructurePatterns(): string[];
