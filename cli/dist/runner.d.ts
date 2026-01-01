/**
 * Repomix runner - executes repomix with temporary configs
 */
import type { RepomixConfig } from './types.js';
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
export declare function runRepomix(repomixConfig: RepomixConfig, options?: {
    dryRun?: boolean;
    verbose?: boolean;
}): Promise<RunResult>;
/**
 * Run multiple configs in sequence
 */
export declare function runMultiple(configs: RepomixConfig[], options?: {
    dryRun?: boolean;
    verbose?: boolean;
}): Promise<{
    results: RunResult[];
    successCount: number;
    totalCount: number;
}>;
/**
 * Cleanup old outputs (optional utility)
 */
export declare function cleanupOutputs(): Promise<void>;
