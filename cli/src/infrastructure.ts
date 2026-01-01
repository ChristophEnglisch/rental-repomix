/**
 * Infrastructure module discovery from docker-compose.yaml
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import { config } from './config.js';
import type { InfrastructureModuleInfo, DockerCompose } from './types.js';

/**
 * Parse docker-compose.yaml and extract services
 */
export async function parseDockerCompose(): Promise<DockerCompose> {
  const composePath = join(config.projectRoot, config.dockerComposePath);
  const content = await readFile(composePath, 'utf-8');
  return parseYaml(content) as DockerCompose;
}

/**
 * Discover infrastructure modules from docker-compose
 */
export async function discoverInfrastructureModules(): Promise<InfrastructureModuleInfo[]> {
  const compose = await parseDockerCompose();
  const modules: InfrastructureModuleInfo[] = [];
  const seenServices = new Set<string>();
  
  for (const [serviceName, serviceConfig] of Object.entries(compose.services)) {
    const mapping = config.infrastructureServiceMappings[serviceName];
    
    // Skip if marked to skip (e.g., authentik-worker is part of authentik-server)
    if (mapping?.skip) {
      continue;
    }
    
    // Use displayName from mapping or derive from service name
    const displayName = mapping?.displayName || serviceName.split('-')[0];
    
    // Avoid duplicates (e.g., authentik-server and authentik-worker both map to "authentik")
    if (seenServices.has(displayName)) {
      continue;
    }
    seenServices.add(displayName);
    
    const folders = mapping?.folders || [];
    const patterns = mapping?.patterns || ['**/*'];
    
    // Build include patterns
    const includePatterns: string[] = [];
    
    if (folders.length > 0) {
      for (const folder of folders) {
        for (const pattern of patterns) {
          includePatterns.push(`${config.infrastructurePath}/${folder}/${pattern}`);
        }
      }
    }
    
    // Always include docker-compose.yaml for reference
    includePatterns.push(`${config.infrastructurePath}/docker-compose.yaml`);
    
    // Extract description from image
    const image = serviceConfig.image || 'custom';
    const description = `Docker service: ${image}`;
    
    modules.push({
      name: displayName,
      displayName: capitalize(displayName),
      description,
      category: 'infrastructure',
      serviceName,
      basePath: config.infrastructurePath,
      patterns: includePatterns,
    });
  }
  
  return modules.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all infrastructure include patterns (for full infrastructure pack)
 */
export function getAllInfrastructurePatterns(): string[] {
  return [
    `${config.infrastructurePath}/**/*.yaml`,
    `${config.infrastructurePath}/**/*.yml`,
    `${config.infrastructurePath}/**/*.json`,
    `${config.infrastructurePath}/**/*.sql`,
    `${config.infrastructurePath}/**/*.sh`,
    `${config.infrastructurePath}/**/*.md`,
    `${config.infrastructurePath}/**/*.env*`,
  ];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
