/**
 * Parser for Spring Modulith package-info.java files
 * Extracts module metadata and dependencies
 */

import { readFile } from 'fs/promises';
import { glob } from 'glob';
import { join } from 'path';
import { config } from './config.js';
import type { BackendModuleInfo, DependencyInfo } from './types.js';

/**
 * Parse a single package-info.java file
 */
export async function parsePackageInfo(filePath: string): Promise<BackendModuleInfo | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    
    // Extract module name from package declaration
    const packageMatch = content.match(/package\s+[\w.]+\.(\w+);/);
    if (!packageMatch) return null;
    
    const moduleName = packageMatch[1];
    
    // Extract displayName
    const displayNameMatch = content.match(/displayName\s*=\s*"([^"]+)"/);
    const displayName = displayNameMatch ? displayNameMatch[1] : moduleName;
    
    // Extract description from JavaDoc
    const javadocMatch = content.match(/\/\*\*\s*([\s\S]*?)\s*\*\//);
    let description = '';
    if (javadocMatch) {
      description = javadocMatch[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, '').trim())
        .filter(line => line && !line.startsWith('@') && !line.startsWith('<p>') && !line.startsWith('</p>'))
        .slice(0, 2)
        .join(' ')
        .trim();
    }
    
    // Extract dependencies from allowedDependencies
    const dependencies = parseDependencies(content);
    
    // Determine module type
    const typeMatch = content.match(/type\s*=\s*[\w.]+\.Type\.(\w+)/);
    const type = typeMatch?.includes('OPEN') ? 'shared' : 
                 moduleName === 'bootstrap' ? 'bootstrap' : 'bounded-context';
    
    // Calculate path
    const path = join(config.backendSrc, moduleName);
    
    // Define layer patterns
    const layers = {
      domain: `${moduleName}/core/domain/**/*.java`,
      application: `${moduleName}/core/application/**/*.java`,
      adapter: `${moduleName}/core/adapter/**/*.java`,
    };
    
    return {
      name: moduleName,
      displayName,
      description,
      category: 'backend',
      path,
      dependencies,
      type,
      layers,
    };
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return null;
  }
}

/**
 * Parse dependencies from allowedDependencies annotation
 */
function parseDependencies(content: string): DependencyInfo[] {
  const deps: DependencyInfo[] = [];
  
  // Match allowedDependencies = { "...", "..." }
  const depsMatch = content.match(/allowedDependencies\s*=\s*\{([^}]*)\}/s);
  if (!depsMatch) return deps;
  
  // Extract individual dependency strings
  const depStrings = depsMatch[1].match(/"([^"]+)"/g);
  if (!depStrings) return deps;
  
  for (const depStr of depStrings) {
    const dep = depStr.replace(/"/g, '');
    
    if (dep.includes('::api')) {
      // API-only dependency: "warenbestand::api"
      deps.push({
        module: dep.replace('::api', ''),
        scope: 'api',
      });
    } else {
      // Full dependency: "common"
      deps.push({
        module: dep,
        scope: 'full',
      });
    }
  }
  
  return deps;
}

/**
 * Discover all modules in the backend
 */
export async function discoverBackendModules(): Promise<BackendModuleInfo[]> {
  const backendPath = join(config.projectRoot, config.backendSrc);
  
  // Find all package-info.java files
  const pattern = join(backendPath, '*/package-info.java');
  const files = await glob(pattern, { windowsPathsNoEscape: true });
  
  const modules: BackendModuleInfo[] = [];
  
  for (const file of files) {
    const moduleInfo = await parsePackageInfo(file);
    if (moduleInfo) {
      modules.push(moduleInfo);
    }
  }
  
  return modules.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Build a dependency graph
 */
export function buildDependencyGraph(modules: BackendModuleInfo[]): Map<string, BackendModuleInfo> {
  const graph = new Map<string, BackendModuleInfo>();
  
  for (const mod of modules) {
    graph.set(mod.name, mod);
  }
  
  return graph;
}

/**
 * Resolve all dependencies for a module (direct only, no transitive)
 */
export function resolveDependencies(
  moduleName: string,
  graph: Map<string, BackendModuleInfo>,
  scope: 'api' | 'full' = 'api'
): DependencyInfo[] {
  const module = graph.get(moduleName);
  if (!module) return [];
  
  const resolved: DependencyInfo[] = [];
  
  for (const dep of module.dependencies) {
    const effectiveScope = scope === 'full' ? 'full' : dep.scope;
    resolved.push({ 
      module: dep.module, 
      scope: effectiveScope 
    });
  }
  
  return resolved;
}
