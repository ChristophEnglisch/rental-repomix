#!/usr/bin/env node
/**
 * Repomix CLI - Unified entry point for packing project modules
 *
 * Usage:
 *   repomix-cli pack backend/buchung              # Pack single backend module
 *   repomix-cli pack backend/buchung --deps       # With API dependencies
 *   repomix-cli pack backend/buchung --deps=full  # With full dependencies
 *   repomix-cli pack frontend/customer            # Pack frontend module
 *   repomix-cli pack infrastructure/authentik     # Pack infrastructure service
 *   repomix-cli pack infrastructure               # Pack all infrastructure
 *   repomix-cli pack --all                        # Pack everything
 *   repomix-cli list                              # List all available modules
 */
export {};
