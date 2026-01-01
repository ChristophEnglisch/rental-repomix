# Repomix CLI

Unified CLI tool for packing Rental project modules using [Repomix](https://github.com/yamadashy/repomix).

## Features

- **Dynamic config generation** - No static config files
- **Three module categories**: Backend, Frontend, Infrastructure
- **Auto-discovery** - Parses `package-info.java` and `docker-compose.yaml`
- **Dependency resolution** - Include API or full dependencies
- **Layer filtering** - Select specific backend layers (domain, application, adapter)

## Installation

```bash
cd cli
npm install
npm run build
npm link
```

Now `repomix-cli` is available globally.

**Uninstall**: `npm unlink -g repomix-cli`

## Usage

### Backend Modules

```bash
# Basic packing
repomix-cli pack backend/buchung

# With dependencies
repomix-cli pack backend/buchung --deps              # API only
repomix-cli pack backend/buchung --deps=full         # Full code

# Layer filtering
repomix-cli pack backend/buchung --layers domain
repomix-cli pack backend/buchung --layers domain,application
repomix-cli pack backend/buchung --layers adapter

# Combined
repomix-cli pack backend/buchung --deps --layers domain,application
```

### Frontend & Infrastructure

```bash
# Frontend
repomix-cli pack frontend/customer
repomix-cli pack frontend/employee

# Infrastructure
repomix-cli pack infrastructure                      # All
repomix-cli pack infrastructure/postgres             # Single service
```

### Batch Operations

```bash
repomix-cli pack --all                               # Everything
repomix-cli pack --all-backend                       # All backend
repomix-cli pack --all-backend --layers domain       # All backend, domain only
```

### Discovery

```bash
repomix-cli list                                     # All modules
repomix-cli list --backend                           # Backend only
repomix-cli deps buchung                             # Show dependencies
```

### Utility

```bash
repomix-cli clean                                    # Clean outputs
repomix-cli pack target --dry-run                    # Preview
```

## Output Structure

```
.repomix/outputs/
├── backend/
│   ├── buchung-packed.txt
│   ├── buchung-deps-packed.txt
│   ├── buchung-domain-packed.txt
│   └── buchung-deps-domain-application-packed.txt
├── frontend/
│   └── customer-packed.txt
└── infrastructure/
    └── all-packed.txt
```

## Layer Filtering

Backend modules use DDD architecture with three layers:

- **domain**: Domain model, aggregates, value objects
- **application**: Application services, use cases
- **adapter**: REST controllers, persistence, external services

The `api` package is always included, regardless of layer selection.

### Examples

```bash
# Only domain layer
repomix-cli pack backend/buchung --layers domain

# Domain + Application
repomix-cli pack backend/buchung --layers domain,application

# All layers (default)
repomix-cli pack backend/buchung
```

## Architecture

```
cli/
├── src/
│   ├── index.ts           # CLI commands
│   ├── backend.ts         # Backend module discovery
│   ├── frontend.ts        # Frontend module discovery
│   ├── infrastructure.ts  # Infrastructure discovery
│   ├── config-builder.ts  # Dynamic config generation
│   ├── runner.ts          # Repomix execution
│   ├── config.ts          # Configuration
│   └── types.ts           # Type definitions
└── fig/
    └── repomix-cli.ts     # Shell completion
```

## Module Discovery

**Backend**: Scans `package-info.java` files for Spring Modulith metadata
**Frontend**: Uses predefined module configurations
**Infrastructure**: Parses `docker-compose.yaml` for services
