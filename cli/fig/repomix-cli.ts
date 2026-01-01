// Fig Autocomplete Spec for repomix-cli
// Install: cp this file to ~/.fig/autocomplete/repomix-cli.ts
// Or for Warp: Settings -> Features -> Autocomplete -> Add custom spec

const backendModulesGenerator: Fig.Generator = {
  script: ["repomix-cli", "list", "--backend", "--json"],
  postProcess: (output) => {
    try {
      const modules = JSON.parse(output);
      return modules.map((m: string) => ({
        name: m,
        description: `Backend module: ${m.split('/')[1]}`,
        icon: "📦",
      }));
    } catch {
      return [];
    }
  },
  cache: { ttl: 60000 }, // Cache for 1 minute
};

const frontendModulesGenerator: Fig.Generator = {
  script: ["repomix-cli", "list", "--frontend", "--json"],
  postProcess: (output) => {
    try {
      const modules = JSON.parse(output);
      return modules.map((m: string) => ({
        name: m,
        description: `Frontend module: ${m.split('/')[1]}`,
        icon: "🖥️",
      }));
    } catch {
      return [];
    }
  },
  cache: { ttl: 60000 },
};

const infrastructureModulesGenerator: Fig.Generator = {
  script: ["repomix-cli", "list", "--infrastructure", "--json"],
  postProcess: (output) => {
    try {
      const modules = JSON.parse(output);
      return modules.map((m: string) => ({
        name: m,
        description: m === 'infrastructure' ? 'All infrastructure' : `Service: ${m.split('/')[1]}`,
        icon: "🐳",
      }));
    } catch {
      return [];
    }
  },
  cache: { ttl: 60000 },
};

const allModulesGenerator: Fig.Generator = {
  script: ["repomix-cli", "list", "--json"],
  postProcess: (output) => {
    try {
      const modules = JSON.parse(output);
      return modules.map((m: string) => {
        const [category, name] = m.includes('/') ? m.split('/') : [m, null];
        let icon = "📦";
        let description = m;
        
        if (category === 'backend') {
          icon = "📦";
          description = `Backend: ${name}`;
        } else if (category === 'frontend') {
          icon = "🖥️";
          description = `Frontend: ${name}`;
        } else if (category === 'infrastructure' || m === 'infrastructure') {
          icon = "🐳";
          description = name ? `Infrastructure: ${name}` : 'All infrastructure';
        }
        
        return { name: m, description, icon };
      });
    } catch {
      return [];
    }
  },
  cache: { ttl: 60000 },
};

const backendModuleNamesGenerator: Fig.Generator = {
  script: ["repomix-cli", "list", "--backend", "--json"],
  postProcess: (output) => {
    try {
      const modules = JSON.parse(output);
      return modules.map((m: string) => ({
        name: m.split('/')[1], // Just the module name without "backend/"
        description: `Backend module`,
        icon: "📦",
      }));
    } catch {
      return [];
    }
  },
  cache: { ttl: 60000 },
};

const completionSpec: Fig.Spec = {
  name: "repomix-cli",
  description: "Unified Repomix CLI for Rental project - pack backend, frontend, and infrastructure modules",
  subcommands: [
    {
      name: "pack",
      description: "Pack a module or group of modules",
      args: {
        name: "target",
        description: "Module to pack (e.g., backend/buchung, frontend/customer, infrastructure/authentik)",
        isOptional: true,
        generators: allModulesGenerator,
        suggestions: [
          { name: "backend/", description: "Backend modules...", icon: "📦" },
          { name: "frontend/", description: "Frontend modules...", icon: "🖥️" },
          { name: "infrastructure", description: "All infrastructure", icon: "🐳" },
          { name: "infrastructure/", description: "Infrastructure services...", icon: "🐳" },
        ],
      },
      options: [
        {
          name: ["--deps", "-d"],
          description: "Include dependencies",
          args: {
            name: "mode",
            isOptional: true,
            suggestions: [
              { name: "api", description: "Include API dependencies only" },
              { name: "full", description: "Include full dependency code" },
            ],
          },
        },
        {
          name: "--all",
          description: "Pack all modules (backend + frontend + infrastructure)",
        },
        {
          name: "--all-backend",
          description: "Pack all backend modules",
        },
        {
          name: "--all-frontend",
          description: "Pack all frontend modules",
        },
        {
          name: "--all-infrastructure",
          description: "Pack all infrastructure modules",
        },
        {
          name: "--dry-run",
          description: "Show what would be generated without running repomix",
        },
        {
          name: ["--verbose", "-v"],
          description: "Verbose output",
        },
      ],
    },
    {
      name: "list",
      description: "List all available modules",
      options: [
        {
          name: ["--backend", "-b"],
          description: "Show only backend modules",
        },
        {
          name: ["--frontend", "-f"],
          description: "Show only frontend modules",
        },
        {
          name: ["--infrastructure", "-i"],
          description: "Show only infrastructure modules",
        },
        {
          name: "--json",
          description: "Output as JSON (for shell completion)",
        },
      ],
    },
    {
      name: "deps",
      description: "Show dependency tree for a backend module",
      args: {
        name: "module",
        description: "Backend module name",
        generators: backendModuleNamesGenerator,
      },
      options: [
        {
          name: ["--full", "-f"],
          description: "Show full dependencies (not just API)",
        },
      ],
    },
    {
      name: "clean",
      description: "Clean all generated outputs",
    },
  ],
  options: [
    {
      name: ["--help", "-h"],
      description: "Show help",
      isPersistent: true,
    },
    {
      name: ["--version", "-V"],
      description: "Show version",
    },
  ],
};

export default completionSpec;
