# Repomix CLI

Unified CLI tool for packing Rental project modules using [Repomix](https://github.com/yamadashy/repomix).

## Quick Start

```bash
# Install
npm run setup

# Use
repomix-cli pack backend/buchung
repomix-cli pack frontend
repomix-cli list
```

## Features

- **Dynamic config generation** - No static config files
- **Four module categories**: Backend, Frontend, Infrastructure, Database Migrations
- **Auto-discovery** - Parses `package-info.java` and `docker-compose.yaml`
- **Dependency resolution** - Include API or full dependencies for backend
- **Layer filtering** - Select specific backend layers (domain, application, adapter)

## Installation

```bash
npm run setup
```

This will install dependencies, build the CLI, and make it globally available.

**Uninstall**: `npm run uninstall`

## Basic Usage

```bash
# List all available modules
repomix-cli list

# Pack a specific module
repomix-cli pack backend/buchung
repomix-cli pack frontend/customer
repomix-cli pack infrastructure/postgres

# Pack everything in a category
repomix-cli pack frontend
repomix-cli pack infrastructure

# Pack everything
repomix-cli pack --all
```

## Backend Features

### Dependencies
```bash
repomix-cli pack backend/buchung --deps              # API only
repomix-cli pack backend/buchung --deps=full         # Full code
```

### Layer Filtering
```bash
repomix-cli pack backend/buchung --layers domain
repomix-cli pack backend/buchung --layers domain,application
```

Backend modules use DDD architecture:
- **domain**: Domain model, aggregates, value objects
- **application**: Application services, use cases
- **adapter**: REST controllers, persistence, external services

The `api` package is always included.

### Database Migrations
```bash
repomix-cli pack backend/dbmigration
```

## Additional Commands

```bash
repomix-cli deps buchung                             # Show dependencies
repomix-cli clean                                    # Clean outputs
repomix-cli pack target --dry-run                    # Preview
repomix-cli completion                               # Install shell completion
```

## Output

All generated files are saved to `.repomix/outputs/`:

```
.repomix/outputs/
├── backend/
│   ├── dbmigration-packed.txt
│   ├── buchung-packed.txt
│   └── buchung-deps-packed.txt
├── frontend/
│   ├── all-packed.txt
│   └── customer-packed.txt
└── infrastructure/
    └── all-packed.txt
```

## Architecture

The CLI discovers modules automatically:
- **Backend**: Scans `package-info.java` files for Spring Modulith metadata
- **Database Migrations**: Packs Liquibase/Flyway files from `db/changelog`
- **Frontend**: Uses predefined module configurations
- **Infrastructure**: Parses `docker-compose.yaml` for services

For more details, see the implementation in `cli/src/`.
