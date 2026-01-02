/**
 * Database migration module for Liquibase/Flyway changelogs
 */

import { join } from 'path';
import { config } from './config.js';
import type { DBMigrationModuleInfo } from './types.js';

/**
 * Discover database migration files
 */
export async function discoverDBMigrationModule(): Promise<DBMigrationModuleInfo> {
  const basePath = join(
    config.projectRoot,
    config.backendResourcesPath,
    'db/changelog'
  );
  
  // Generate patterns relative to project root
  const relativePath = join(config.backendResourcesPath, 'db/changelog');
  
  return {
    name: 'dbmigration',
    displayName: 'Database Migrations',
    description: 'Liquibase/Flyway database migration files',
    category: 'dbmigration',
    basePath,
    patterns: [
      `${relativePath}/**/*.sql`,
      `${relativePath}/**/*.xml`,
      `${relativePath}/**/*.yaml`,
      `${relativePath}/**/*.yml`,
      `${relativePath}/**/*.json`,
    ],
  };
}
