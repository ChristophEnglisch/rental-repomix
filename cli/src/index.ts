#!/usr/bin/env node

/**
 * Repomix CLI - Unified entry point for packing project modules
 * 
 * Usage:
 *   repomix-cli pack backend/buchung              # Pack single backend module
 *   repomix-cli pack backend/buchung --deps       # With API dependencies
 *   repomix-cli pack backend/buchung --deps=full  # With full dependencies
 *   repomix-cli pack frontend/customer            # Pack frontend module
 *   repomix-cli pack frontend                     # Pack all frontend
 *   repomix-cli pack infrastructure/authentik     # Pack infrastructure service
 *   repomix-cli pack infrastructure               # Pack all infrastructure
 *   repomix-cli pack --all                        # Pack everything
 *   repomix-cli list                              # List all available modules
 */

import { Command } from 'commander';
import chalk from 'chalk';

import { config } from './config.js';
import { discoverBackendModules, buildDependencyGraph, resolveDependencies } from './backend.js';
import { discoverFrontendModules } from './frontend.js';
import { discoverInfrastructureModules } from './infrastructure.js';
import { discoverDBMigrationModule } from './dbmigration.js';
import { 
  buildBackendConfig, 
  buildFrontendConfig, 
  buildInfrastructureConfig,
  buildFullInfrastructureConfig,
  buildFullFrontendConfig,
  buildDBMigrationConfig
} from './config-builder.js';
import { runRepomix, runMultiple, cleanupOutputs } from './runner.js';
import type { DependencyMode, RepomixConfig } from './types.js';

const program = new Command();

program
  .name('repomix-cli')
  .description('Unified Repomix CLI for Rental project - pack backend, frontend, and infrastructure modules')
  .version('2.0.0');

// ============================================
// PACK command - Main entry point
// ============================================
program
  .command('pack [target]')
  .description('Pack a module or group of modules')
  .option('-d, --deps [mode]', 'Include dependencies (api or full)', false)
  .option('-l, --layers <layers>', 'Backend layers to include (domain,application,adapter)', (value) => value.split(',') as ('domain' | 'application' | 'adapter')[])
  .option('--all', 'Pack all modules')
  .option('--all-backend', 'Pack all backend modules')
  .option('--all-frontend', 'Pack all frontend modules')
  .option('--all-infrastructure', 'Pack all infrastructure modules')
  .option('--dry-run', 'Show what would be generated without running')
  .option('-v, --verbose', 'Verbose output')
  .action(async (target, options) => {
    const dryRun = options.dryRun || false;
    const verbose = options.verbose || false;
    
    // Determine dependency mode
    let depsMode: DependencyMode = 'none';
    if (options.deps === true || options.deps === 'api') {
      depsMode = 'api';
    } else if (options.deps === 'full') {
      depsMode = 'full';
    }
    
    // Load all modules
    const backendModules = await discoverBackendModules();
    const frontendModules = await discoverFrontendModules();
    const infrastructureModules = await discoverInfrastructureModules();
    const dbMigrationModule = await discoverDBMigrationModule();
    
    const configs: RepomixConfig[] = [];
    
    // Handle --all flags
    if (options.all) {
      console.log(chalk.blue.bold('\n📦 Packing all modules\n'));
      
      for (const mod of backendModules) {
        configs.push(buildBackendConfig(mod, backendModules, depsMode, options.layers));
      }
      for (const mod of frontendModules) {
        configs.push(buildFrontendConfig(mod));
      }
      configs.push(buildFullInfrastructureConfig());
      
    } else if (options.allBackend) {
      console.log(chalk.blue.bold('\n📦 Packing all backend modules\n'));
      
      for (const mod of backendModules) {
        configs.push(buildBackendConfig(mod, backendModules, depsMode, options.layers));
      }
      
    } else if (options.allFrontend) {
      console.log(chalk.blue.bold('\n📦 Packing all frontend modules\n'));
      
      for (const mod of frontendModules) {
        configs.push(buildFrontendConfig(mod));
      }
      
    } else if (options.allInfrastructure) {
      console.log(chalk.blue.bold('\n📦 Packing all infrastructure modules\n'));
      
      for (const mod of infrastructureModules) {
        if (mod.patterns.length > 1) { // Has actual patterns beyond docker-compose
          configs.push(buildInfrastructureConfig(mod));
        }
      }
      configs.push(buildFullInfrastructureConfig());
      
    } else if (target) {
      // Parse target: category/module
      const [category, moduleName] = target.includes('/') 
        ? target.split('/') 
        : [null, target];
      
      // Special cases for "all" commands without /
      if (target === 'frontend') {
        console.log(chalk.blue('\n📦 Packing all frontend\n'));
        configs.push(buildFullFrontendConfig());
      } else if (target === 'infrastructure') {
        console.log(chalk.blue('\n📦 Packing all infrastructure\n'));
        configs.push(buildFullInfrastructureConfig());
      } else if (moduleName === 'dbmigration' || (category === 'backend' && moduleName === 'dbmigration')) {
        console.log(chalk.blue(`\n📦 Packing backend/dbmigration (Database Migrations)\n`));
        configs.push(buildDBMigrationConfig(dbMigrationModule));
        
      } else if (category === 'backend' || (!category && backendModules.some(m => m.name === moduleName))) {
        const mod = backendModules.find(m => m.name === moduleName);
        if (!mod) {
          console.log(chalk.red(`Backend module not found: ${moduleName}`));
          listAvailableModules(backendModules, frontendModules, infrastructureModules);
          return;
        }
        const layerInfo = options.layers ? ` layers: ${options.layers.join(',')}` : '';
        console.log(chalk.blue(`\n📦 Packing backend/${mod.name} (deps: ${depsMode}${layerInfo})\n`));
        configs.push(buildBackendConfig(mod, backendModules, depsMode, options.layers));
        
      } else if (category === 'frontend') {
        const mod = frontendModules.find(m => m.name === moduleName);
        if (!mod) {
          console.log(chalk.red(`Frontend module not found: ${moduleName}`));
          listAvailableModules(backendModules, frontendModules, infrastructureModules);
          return;
        }
        console.log(chalk.blue(`\n📦 Packing frontend/${mod.name}\n`));
        configs.push(buildFrontendConfig(mod));
        
      } else if (category === 'infrastructure') {
        const mod = infrastructureModules.find(m => m.name === moduleName);
        if (!mod) {
          console.log(chalk.red(`Infrastructure module not found: ${moduleName}`));
          listAvailableModules(backendModules, frontendModules, infrastructureModules);
          return;
        }
        console.log(chalk.blue(`\n📦 Packing infrastructure/${mod.name}\n`));
        configs.push(buildInfrastructureConfig(mod));
        
      } else {
        console.log(chalk.red(`Unknown target: ${target}`));
        listAvailableModules(backendModules, frontendModules, infrastructureModules);
        return;
      }
      
    } else {
      console.log(chalk.yellow('No target specified. Use --help for usage.\n'));
      listAvailableModules(backendModules, frontendModules, infrastructureModules);
      return;
    }
    
    // Execute
    if (configs.length === 0) {
      console.log(chalk.yellow('No configs to run.'));
      return;
    }
    
    if (configs.length === 1) {
      const result = await runRepomix(configs[0], { dryRun, verbose });
      if (result.success) {
        console.log(chalk.green(`✓ Generated: ${result.outputPath}`));
        console.log(chalk.gray(`  Duration: ${result.duration}ms`));
      } else {
        console.log(chalk.red(`✗ Failed: ${result.error}`));
      }
    } else {
      const { results, successCount, totalCount } = await runMultiple(configs, { dryRun, verbose });
      
      for (const result of results) {
        if (result.success) {
          console.log(chalk.green(`✓ ${result.outputPath}`));
        } else {
          console.log(chalk.red(`✗ ${result.error}`));
        }
      }
      
      console.log(chalk.blue.bold(`\n✅ Completed ${successCount}/${totalCount} packs\n`));
    }
  });

// ============================================
// LIST command - Show available modules
// ============================================
program
  .command('list')
  .description('List all available modules')
  .option('-b, --backend', 'Show only backend modules')
  .option('-f, --frontend', 'Show only frontend modules')
  .option('-i, --infrastructure', 'Show only infrastructure modules')
  .option('--json', 'Output as JSON (for shell completion)')
  .action(async (options) => {
    const backendModules = await discoverBackendModules();
    const frontendModules = await discoverFrontendModules();
    const infrastructureModules = await discoverInfrastructureModules();
    const dbMigrationModule = await discoverDBMigrationModule();
    
    // JSON output for completion
    if (options.json) {
      const targets: string[] = [];
      
      if (!options.frontend && !options.infrastructure) {
        targets.push(...backendModules.map(m => `backend/${m.name}`));
        targets.push('backend/dbmigration');
      }
      if (!options.backend && !options.infrastructure) {
        targets.push(...frontendModules.map(m => `frontend/${m.name}`));
        targets.push('frontend');
      }
      if (!options.backend && !options.frontend) {
        targets.push('infrastructure');
        targets.push(...infrastructureModules.filter(m => m.patterns.length > 1).map(m => `infrastructure/${m.name}`));
      }
      
      console.log(JSON.stringify(targets));
      return;
    }
    
    const showAll = !options.backend && !options.frontend && !options.infrastructure;
    
    if (showAll || options.backend) {
      console.log(chalk.blue.bold('\n📦 Backend Bounded Contexts\n'));
      const graph = buildDependencyGraph(backendModules);
      
      // Show DB Migration module first
      console.log(`🗄️  ${chalk.green.bold(dbMigrationModule.displayName)} ${chalk.gray('(backend/dbmigration)')}`);
      console.log(`   ${chalk.gray(dbMigrationModule.description)}`);
      console.log();
      
      for (const mod of backendModules) {
        const typeIcon = mod.type === 'shared' ? '🔧' : 
                        mod.type === 'bootstrap' ? '🚀' : '📁';
        console.log(`${typeIcon} ${chalk.green.bold(mod.displayName)} ${chalk.gray(`(backend/${mod.name})`)}`);
        
        if (mod.description) {
          console.log(`   ${chalk.gray(mod.description)}`);
        }
        
        if (mod.dependencies.length > 0) {
          console.log(`   ${chalk.yellow('Dependencies:')}`);
          for (const dep of mod.dependencies) {
            const scopeLabel = dep.scope === 'api' ? chalk.cyan('api') : chalk.magenta('full');
            console.log(`     → ${dep.module} [${scopeLabel}]`);
          }
        }
        console.log();
      }
    }
    
    if (showAll || options.frontend) {
      console.log(chalk.blue.bold('\n🖥️  Frontend Modules\n'));
      
      for (const mod of frontendModules) {
        console.log(`📱 ${chalk.green.bold(mod.displayName)} ${chalk.gray(`(frontend/${mod.name})`)}`);
        console.log(`   ${chalk.gray(mod.description)}`);
        console.log();
      }
      
      console.log(chalk.gray('Tip: Use "frontend" without module name to pack everything.\n'));
    }
    
    if (showAll || options.infrastructure) {
      console.log(chalk.blue.bold('\n🐳 Infrastructure Services\n'));
      
      for (const mod of infrastructureModules) {
        const hasPatterns = mod.patterns.length > 1;
        const icon = hasPatterns ? '📦' : '⚡';
        console.log(`${icon} ${chalk.green.bold(mod.displayName)} ${chalk.gray(`(infrastructure/${mod.name})`)}`);
        console.log(`   ${chalk.gray(mod.description)}`);
        if (!hasPatterns) {
          console.log(`   ${chalk.gray('(No custom config files)')}`);
        }
        console.log();
      }
      
      console.log(chalk.gray('Tip: Use "infrastructure" without module name to pack everything.\n'));
    }
  });

// ============================================
// DEPS command - Show dependency tree
// ============================================
program
  .command('deps <module>')
  .description('Show dependency tree for a backend module')
  .option('-f, --full', 'Show full dependencies (not just API)')
  .action(async (moduleName, options) => {
    const modules = await discoverBackendModules();
    const graph = buildDependencyGraph(modules);
    
    const module = graph.get(moduleName);
    if (!module) {
      console.log(chalk.red(`Module not found: ${moduleName}`));
      console.log(chalk.gray('Available backend modules:'));
      for (const m of modules) {
        console.log(chalk.gray(`  - ${m.name}`));
      }
      return;
    }
    
    const scope = options.full ? 'full' : 'api';
    const deps = resolveDependencies(moduleName, graph, scope);
    
    console.log(chalk.blue.bold(`\n🌳 Dependencies for ${module.displayName}\n`));
    console.log(chalk.gray(`Mode: ${scope === 'full' ? 'Full code' : 'API only'}\n`));
    
    if (deps.length === 0) {
      console.log(chalk.gray('  No dependencies'));
    } else {
      for (const dep of deps) {
        const depModule = graph.get(dep.module);
        const scopeLabel = dep.scope === 'api' ? chalk.cyan('[api]') : chalk.magenta('[full]');
        console.log(`  → ${depModule?.displayName || dep.module} ${scopeLabel}`);
      }
    }
    
    console.log();
  });

// ============================================
// CLEAN command - Clean outputs
// ============================================
program
  .command('clean')
  .description('Clean all generated outputs')
  .action(async () => {
    console.log(chalk.yellow('Cleaning outputs...'));
    await cleanupOutputs();
    console.log(chalk.green('✓ Outputs cleaned'));
  });

// ============================================
// COMPLETION command - Install shell completion
// ============================================
program
  .command('completion')
  .description('Install shell completion for Warp/Fig')
  .option('--print', 'Print the completion spec instead of installing')
  .action(async (options) => {
    const { readFile, writeFile, mkdir } = await import('fs/promises');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    const { homedir } = await import('os');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const specPath = join(__dirname, '..', 'fig', 'repomix-cli.ts');
    
    try {
      const specContent = await readFile(specPath, 'utf-8');
      
      if (options.print) {
        console.log(specContent);
        return;
      }
      
      // Try to find autocomplete directory
      const home = homedir();
      let targetDir = join(home, '.fig', 'autocomplete');
      
      // Check for Warp directory
      try {
        const { stat } = await import('fs/promises');
        await stat(join(home, '.warp'));
        targetDir = join(home, '.warp', 'autocomplete');
      } catch {
        // Use Fig directory
      }
      
      await mkdir(targetDir, { recursive: true });
      const targetPath = join(targetDir, 'repomix-cli.ts');
      await writeFile(targetPath, specContent);
      
      console.log(chalk.green('✅ Installed autocomplete spec to:'));
      console.log(chalk.gray(`   ${targetPath}`));
      console.log();
      console.log(chalk.yellow('🔄 Restart your terminal to activate'));
      console.log(chalk.gray('   Then type: repomix-cli [Tab]'));
      
    } catch (error) {
      console.log(chalk.red('❌ Failed to install completion'));
      console.log(chalk.gray(`   Error: ${error}`));
      console.log();
      console.log(chalk.yellow('Manual installation:'));
      console.log(chalk.gray('   cp .repomix/cli/fig/repomix-cli.ts ~/.fig/autocomplete/'));
    }
  });

// ============================================
// Helper functions
// ============================================

function listAvailableModules(
  backend: { name: string }[],
  frontend: { name: string }[],
  infrastructure: { name: string }[]
) {
  console.log(chalk.gray('\nAvailable targets:'));
  console.log(chalk.yellow('  Backend:'));
  console.log(chalk.gray('    backend/dbmigration'));
  for (const m of backend) {
    console.log(chalk.gray(`    backend/${m.name}`));
  }
  console.log(chalk.yellow('  Frontend:'));
  console.log(chalk.gray('    frontend (all)'));
  for (const m of frontend) {
    console.log(chalk.gray(`    frontend/${m.name}`));
  }
  console.log(chalk.yellow('  Infrastructure:'));
  console.log(chalk.gray('    infrastructure (all)'));
  for (const m of infrastructure) {
    console.log(chalk.gray(`    infrastructure/${m.name}`));
  }
}

program.parse();
