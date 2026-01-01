/**
 * Dynamic Repomix config builder
 * Generates configs on-the-fly without persisting them
 */
import type { RepomixConfig, BackendModuleInfo, FrontendModuleInfo, InfrastructureModuleInfo, DependencyMode, Layer } from './types.js';
/**
 * Build config for a backend module
 */
export declare function buildBackendConfig(module: BackendModuleInfo, allModules: BackendModuleInfo[], depsMode?: DependencyMode, layers?: Layer[]): RepomixConfig;
/**
 * Build config for a frontend module
 */
export declare function buildFrontendConfig(module: FrontendModuleInfo): RepomixConfig;
/**
 * Build config for an infrastructure module
 */
export declare function buildInfrastructureConfig(module: InfrastructureModuleInfo): RepomixConfig;
/**
 * Build config for all infrastructure
 */
export declare function buildFullInfrastructureConfig(): RepomixConfig;
