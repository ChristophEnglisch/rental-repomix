/**
 * Dynamic Repomix config builder
 * Generates configs on-the-fly without persisting them
 */

import { config } from './config.js';
import type { 
  RepomixConfig, 
  BackendModuleInfo, 
  FrontendModuleInfo, 
  InfrastructureModuleInfo,
  DBMigrationModuleInfo,
  DependencyInfo,
  DependencyMode,
  Layer
} from './types.js';
import { resolveDependencies, buildDependencyGraph } from './backend.js';
import { getSharedPaths, getConfigPaths } from './frontend.js';

/**
 * Create base repomix config
 */
function createBaseConfig(
  outputPath: string,
  headerText: string,
  includes: string[],
  ignorePatterns: string[]
): RepomixConfig {
  return {
    output: {
      filePath: outputPath,
      style: config.repomixDefaults.style,
      headerText,
      removeComments: config.repomixDefaults.removeComments,
      removeEmptyLines: config.repomixDefaults.removeEmptyLines,
      topFilesLength: config.repomixDefaults.topFilesLength,
      showLineNumbers: config.repomixDefaults.showLineNumbers,
      copyToClipboard: config.repomixDefaults.copyToClipboard,
    },
    include: includes,
    ignore: {
      useGitignore: true,
      useDefaultPatterns: true,
      customPatterns: ignorePatterns,
    },
    security: {
      enableSecurityCheck: true,
    },
  };
}

/**
 * Format dependency list for header
 */
function formatDepsHeader(deps: DependencyInfo[]): string {
  if (deps.length === 0) return '';
  
  const apiDeps = deps.filter(d => d.scope === 'api').map(d => d.module);
  const fullDeps = deps.filter(d => d.scope === 'full').map(d => d.module);
  
  const parts: string[] = [];
  if (apiDeps.length > 0) parts.push(`API: ${apiDeps.join(', ')}`);
  if (fullDeps.length > 0) parts.push(`Full: ${fullDeps.join(', ')}`);
  
  return ` + Dependencies (${parts.join('; ')})`;
}

/**
 * Generate backend include patterns
 */
function generateBackendIncludes(
  module: BackendModuleInfo,
  dependencies: DependencyInfo[],
  layers?: Layer[],
  includeYaml: boolean = true
): string[] {
  const includes: string[] = [];
  
  // API is always included
  includes.push(`rental-backend/src/main/java/de/cenglisch/rentalbackend/${module.name}/api/**/*.java`);
  
  // Main module - layer filtering
  if (layers && layers.length > 0) {
    // Include only specified layers
    for (const layer of layers) {
      includes.push(`rental-backend/src/main/java/de/cenglisch/rentalbackend/${module.layers[layer]}`);
    }
  } else {
    // Include all layers (default)
    includes.push(`rental-backend/src/main/java/de/cenglisch/rentalbackend/${module.name}/core/**/*.java`);
  }
  
  // Dependencies
  for (const dep of dependencies) {
    if (dep.scope === 'api') {
      includes.push(`rental-backend/src/main/java/de/cenglisch/rentalbackend/${dep.module}/api/**/*.java`);
    } else {
      includes.push(`rental-backend/src/main/java/de/cenglisch/rentalbackend/${dep.module}/**/*.java`);
    }
  }
  
  // Config files
  if (includeYaml) {
    includes.push('rental-backend/src/main/resources/application*.yml');
  }
  
  return includes;
}

/**
 * Generate frontend include patterns
 */
function generateFrontendIncludes(module: FrontendModuleInfo): string[] {
  const includes: string[] = [];
  
  // Module files
  includes.push(`${module.path}/**/*.tsx`);
  includes.push(`${module.path}/**/*.ts`);
  
  // Shared files
  if (module.includeShared) {
    includes.push(...getSharedPaths());
  }
  
  // Config files
  includes.push(...getConfigPaths());
  
  return includes;
}

// ============================================
// Public API - Build configs dynamically
// ============================================

/**
 * Build config for a backend module
 */
export function buildBackendConfig(
  module: BackendModuleInfo,
  allModules: BackendModuleInfo[],
  depsMode: DependencyMode = 'none',
  layers?: Layer[]
): RepomixConfig {
  const graph = buildDependencyGraph(allModules);
  
  let dependencies: DependencyInfo[] = [];
  let suffix = '';
  
  if (depsMode === 'api' && module.dependencies.length > 0) {
    dependencies = resolveDependencies(module.name, graph, 'api');
    suffix = '-deps';
  } else if (depsMode === 'full' && module.dependencies.length > 0) {
    dependencies = resolveDependencies(module.name, graph, 'full');
    suffix = '-deps-full';
  }
  
  if (layers && layers.length > 0) {
    suffix += `-${layers.join('-')}`;
  }
  
  const outputPath = `${config.outputDir}/backend/${module.name}${suffix}-packed.txt`;
  let headerText = `Bounded Context: ${module.displayName}`;
  
  // Layer disclaimer
  if (layers && layers.length > 0) {
    const included = layers.join(', ');
    const allLayers: Layer[] = ['domain', 'application', 'adapter'];
    const excluded = allLayers.filter(l => !layers.includes(l)).join(', ');
    
    headerText += `\n\n⚠️ PARTIAL VIEW - Only ${included} layer(s) included.`;
    if (excluded) {
      headerText += ` Missing: ${excluded}.`;
    }
    headerText += ` API package always included.`;
  }
  
  headerText += formatDepsHeader(dependencies);
  
  const includes = generateBackendIncludes(module, dependencies, layers);
  
  return createBaseConfig(outputPath, headerText, includes, config.backendIgnorePatterns);
}

/**
 * Build config for a frontend module
 */
export function buildFrontendConfig(module: FrontendModuleInfo): RepomixConfig {
  const outputPath = `${config.outputDir}/frontend/${module.name}-packed.txt`;
  const headerText = `Frontend: ${module.displayName} Module + Shared`;
  const includes = generateFrontendIncludes(module);
  
  return createBaseConfig(outputPath, headerText, includes, config.frontendIgnorePatterns);
}

/**
 * Build config for an infrastructure module
 */
export function buildInfrastructureConfig(module: InfrastructureModuleInfo): RepomixConfig {
  const outputPath = `${config.outputDir}/infrastructure/${module.name}-packed.txt`;
  const headerText = `Infrastructure: ${module.displayName} - ${module.description}`;
  
  return createBaseConfig(outputPath, headerText, module.patterns, config.infrastructureIgnorePatterns);
}

/**
 * Build config for all infrastructure
 */
export function buildFullInfrastructureConfig(): RepomixConfig {
  const outputPath = `${config.outputDir}/infrastructure/all-packed.txt`;
  const headerText = 'Infrastructure: Complete Docker & Services Setup';
  
  const includes = [
    `${config.infrastructurePath}/**/*.yaml`,
    `${config.infrastructurePath}/**/*.yml`,
    `${config.infrastructurePath}/**/*.json`,
    `${config.infrastructurePath}/**/*.sql`,
    `${config.infrastructurePath}/**/*.sh`,
    `${config.infrastructurePath}/**/*.md`,
  ];
  
  return createBaseConfig(outputPath, headerText, includes, config.infrastructureIgnorePatterns);
}

/**
 * Build config for database migrations
 */
export function buildDBMigrationConfig(module: DBMigrationModuleInfo): RepomixConfig {
  const outputPath = `${config.outputDir}/backend/${module.name}-packed.txt`;
  const headerText = `${module.displayName} - ${module.description}\n\nLiquibase/Flyway migration files from ${module.basePath}`;
  
  return createBaseConfig(outputPath, headerText, module.patterns, config.dbMigrationIgnorePatterns);
}
