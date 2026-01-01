/**
 * Types for the Repomix CLI
 */

// ============================================
// Module Types
// ============================================

export type ModuleCategory = 'backend' | 'frontend' | 'infrastructure';

export interface BaseModuleInfo {
  name: string;
  displayName: string;
  description: string;
  category: ModuleCategory;
}

export type Layer = 'domain' | 'application' | 'adapter';

export interface BackendModuleInfo extends BaseModuleInfo {
  category: 'backend';
  path: string;
  dependencies: DependencyInfo[];
  type: 'bounded-context' | 'shared' | 'bootstrap';
  layers: Record<Layer, string>;
}

export interface FrontendModuleInfo extends BaseModuleInfo {
  category: 'frontend';
  path: string;
  includeShared: boolean;
}

export interface InfrastructureModuleInfo extends BaseModuleInfo {
  category: 'infrastructure';
  serviceName: string;
  basePath: string;
  patterns: string[];
}

export type ModuleInfo = BackendModuleInfo | FrontendModuleInfo | InfrastructureModuleInfo;

// ============================================
// Dependencies
// ============================================

export interface DependencyInfo {
  module: string;
  scope: 'api' | 'full';
}

export type DependencyMode = 'none' | 'api' | 'full';

// ============================================
// Repomix Config
// ============================================

export interface RepomixConfig {
  output: {
    filePath: string;
    style: 'xml' | 'markdown' | 'plain';
    headerText: string;
    removeComments: boolean;
    removeEmptyLines: boolean;
    topFilesLength: number;
    showLineNumbers: boolean;
    copyToClipboard: boolean;
  };
  include: string[];
  ignore: {
    useGitignore: boolean;
    useDefaultPatterns: boolean;
    customPatterns: string[];
  };
  security: {
    enableSecurityCheck: boolean;
  };
}

// ============================================
// CLI Options
// ============================================

export interface PackOptions {
  deps?: DependencyMode;
  layers?: Layer[];
  output?: string;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface ListOptions {
  backend?: boolean;
  frontend?: boolean;
  infrastructure?: boolean;
}

// ============================================
// Docker Compose Types
// ============================================

export interface DockerComposeService {
  name: string;
  image?: string;
  container_name?: string;
  volumes?: string[];
}

export interface DockerCompose {
  services: Record<string, DockerComposeService>;
}
