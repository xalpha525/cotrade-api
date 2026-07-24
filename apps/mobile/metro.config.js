const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// 2. Resolve modules from project root first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Support TypeScript and JS source extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'ts',
  'tsx',
  'mjs',
  'cjs',
];

// 4. Force @tanstack/query-core to use compiled build instead of raw TS src/index.ts
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@tanstack/query-core' || moduleName.startsWith('@tanstack/query-core/')) {
    try {
      const pkgPath = require.resolve('@tanstack/query-core/package.json', {
        paths: [projectRoot, monorepoRoot],
      });
      const pkgDir = path.dirname(pkgPath);
      const cjsBuild = path.resolve(pkgDir, 'build/legacy/index.cjs');
      if (require('fs').existsSync(cjsBuild)) {
        return { filePath: cjsBuild, type: 'sourceFile' };
      }
    } catch (_) {}
  }

  // 1. Intercept pnpm-hashed module paths
  if (moduleName && moduleName.includes('node_modules/.pnpm/')) {
    try {
      const resolved = require.resolve(moduleName, {
        paths: [projectRoot, monorepoRoot],
      });
      return { filePath: resolved, type: 'sourceFile' };
    } catch (_) {}
  }

  // 2. Try default resolver
  try {
    if (defaultResolveRequest) {
      return defaultResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  } catch (err) {
    if (moduleName && !moduleName.startsWith('.') && !moduleName.startsWith('/')) {
      try {
        const resolved = require.resolve(moduleName, {
          paths: [projectRoot, monorepoRoot, path.resolve(monorepoRoot, 'node_modules')],
        });
        return { filePath: resolved, type: 'sourceFile' };
      } catch (_) {}
    }
    throw err;
  }
};

module.exports = config;
