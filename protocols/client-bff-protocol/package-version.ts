import * as pkgNamespace from "./package.json";

type PackageJsonModule = { version: string; default?: { version: string } };

function loadPackageJsonModule(): PackageJsonModule {
  const mod = pkgNamespace as PackageJsonModule & {
    default?: PackageJsonModule;
  };
  if (typeof mod.version === "string") {
    return mod;
  }
  if (mod.default) {
    return mod.default;
  }
  throw new Error("package.json version not found");
}

/** Semver из `package.json`; работает и в CJS (`require`), и в ESM/Vite (default import). */
export function resolvePackageVersion(mod: PackageJsonModule): string {
  if (typeof mod.version === "string") {
    return mod.version;
  }
  const nested = mod.default?.version;
  if (typeof nested === "string") {
    return nested;
  }
  throw new Error("package.json version not found");
}

export const packageVersion = resolvePackageVersion(loadPackageJsonModule());
