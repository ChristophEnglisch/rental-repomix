/**
 * Repomix runner - executes repomix with temporary configs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { writeFile, mkdir, unlink, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { config } from './config.js';
import type { RepomixConfig } from './types.js';

const execAsync = promisify(exec);

export interface RunResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  duration?: number;
}

/**
 * Run repomix with a dynamically generated config
 * Uses a temporary file that is deleted after execution
 */
export async function runRepomix(
  repomixConfig: RepomixConfig,
  options: { dryRun?: boolean; verbose?: boolean } = {}
): Promise<RunResult> {
  const startTime = Date.now();
  
  // Generate unique temp file name
  const tempFileName = `repomix-${Date.now()}-${Math.random().toString(36).substring(7)}.json`;
  const tempConfigPath = join(tmpdir(), tempFileName);
  
  try {
    // Write temporary config
    await writeFile(tempConfigPath, JSON.stringify(repomixConfig, null, 2));
    
    if (options.dryRun) {
      console.log('\n📋 Generated config (dry-run):');
      console.log(JSON.stringify(repomixConfig, null, 2));
      return {
        success: true,
        outputPath: repomixConfig.output.filePath,
        duration: Date.now() - startTime,
      };
    }
    
    // Ensure output directory exists
    const outputDir = join(config.projectRoot, repomixConfig.output.filePath.replace(/\/[^/]+$/, ''));
    await mkdir(outputDir, { recursive: true });
    
    // Run repomix
    const command = `repomix --config "${tempConfigPath}"`;
    
    if (options.verbose) {
      console.log(`\n🔧 Running: ${command}`);
    }
    
    const { stdout, stderr } = await execAsync(command, { 
      cwd: config.projectRoot,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    if (options.verbose && stdout) {
      console.log(stdout);
    }
    
    return {
      success: true,
      outputPath: repomixConfig.output.filePath,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  } finally {
    // Always cleanup temp file
    try {
      await unlink(tempConfigPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Run multiple configs in sequence
 */
export async function runMultiple(
  configs: RepomixConfig[],
  options: { dryRun?: boolean; verbose?: boolean } = {}
): Promise<{ results: RunResult[]; successCount: number; totalCount: number }> {
  const results: RunResult[] = [];
  let successCount = 0;
  
  for (const repomixConfig of configs) {
    const result = await runRepomix(repomixConfig, options);
    results.push(result);
    if (result.success) successCount++;
  }
  
  return {
    results,
    successCount,
    totalCount: configs.length,
  };
}

/**
 * Cleanup old outputs (optional utility)
 */
export async function cleanupOutputs(): Promise<void> {
  const outputPath = join(config.projectRoot, config.outputDir);
  try {
    await rm(outputPath, { recursive: true, force: true });
    await mkdir(outputPath, { recursive: true });
  } catch {
    // Ignore errors
  }
}
