#!/usr/bin/env node
/**
 * Публикует публичные пакеты workspace, у которых локальная version
 * отличается от version в npm registry. Логин не выполняет: нужен
 * уже сохранённый `npm login` или NPM_TOKEN / //registry.npmjs.org/:_authToken в ~/.npmrc.
 *
 * Пакеты без зависимостей друг на друга публикуются параллельно.
 * Между волнами нет опроса registry: npm publish завершается после приёма tarball.
 * После workspace-пакетов собирает и публикует production-бандлы клиента
 * (@matreshka/client-<platform>). dist-tag совместимости ставится только на
 * пакеты, опубликованные в этом запуске (bff и/или client-*).
 */
import { execFile, spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "client");
const clientBuildOut = path.join(clientDir, "dist", "matreshka", "browser");
const dryRun = process.argv.includes("--dry-run");

const packages = {
  "@matreshka/client-bff-protocol":
    "protocols/client-bff-protocol/package.json",
  "@matreshka/gateway-bff-protocol":
    "protocols/gateway-bff-protocol/package.json",
  "@matreshka/shared": "shared/package.json",
  "@matreshka/gateway": "gateway/package.json",
  "@matreshka/bff": "bff/package.json",
};

const waves = [
  ["@matreshka/client-bff-protocol", "@matreshka/gateway-bff-protocol"],
  ["@matreshka/shared", "@matreshka/gateway"],
  ["@matreshka/bff"],
];

// TODO: вернуть android, ios, telegram, max
const clientPlatforms = ["browser"];

function clientPackageName(platform) {
  return `@matreshka/client-${platform}`;
}

function pad(value, width) {
  const text = String(value);
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

function logSection(title) {
  console.log("");
  console.log(title);
}

function logRow(columns, widths) {
  console.log(columns.map((value, i) => pad(value, widths[i])).join("  "));
}

function logKv(key, value) {
  console.log(`${pad(key, 12)}  ${value}`);
}

function logLine(text) {
  console.log(`  ${text}`);
}

function printDecisionTable(items) {
  const widths = [34, 10, 10, 8];
  logRow(["package", "local", "registry", "action"], widths);
  logRow(
    widths.map((width) => "-".repeat(width)),
    widths,
  );
  for (const item of items) {
    const action = item.remote === item.local ? "skip" : "publish";
    logRow([item.name, item.local, item.remote ?? "—", action], widths);
  }
}

async function npm(args, { allowFailure = false, cwd = root } = {}) {
  try {
    const { stdout } = await execFileAsync("npm", args, {
      cwd,
      env: process.env,
    });
    return stdout.trim();
  } catch (error) {
    if (allowFailure) return null;
    const stderr = error.stderr?.toString().trim() ?? "";
    const stdout = error.stdout?.toString().trim() ?? "";
    throw new Error(
      [`npm ${args.join(" ")}`, stdout, stderr].filter(Boolean).join("\n"),
    );
  }
}

async function localVersion(name) {
  const file = path.join(root, packages[name]);
  const manifest = JSON.parse(await readFile(file, "utf8"));
  if (typeof manifest.version !== "string") {
    throw new Error(`${name}: в ${packages[name]} нет строкового version`);
  }
  return manifest.version;
}

async function clientAppVersion() {
  const file = path.join(clientDir, "package.json");
  const manifest = JSON.parse(await readFile(file, "utf8"));
  if (typeof manifest.version !== "string") {
    throw new Error(
      "@matreshka/client: в client/package.json нет строкового version",
    );
  }
  return manifest.version;
}

async function remoteVersion(name) {
  const stdout = await npm(["view", `${name}@latest`, "version"], {
    allowFailure: true,
  });
  return stdout || null;
}

function npmInteractive(args, { cwd = root } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", args, {
      cwd,
      env: process.env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else
        reject(new Error(`npm ${args.join(" ")} завершился с кодом ${code}`));
    });
  });
}

function explainNpmAuthPrompt() {
  console.log(
    "npm может запросить подтверждение в браузере (Enter → npmjs.com → вернуться в терминал).",
  );
}

async function publish(name, version) {
  if (dryRun) {
    logLine(`${name}@${version}  (dry-run)`);
    return;
  }
  logLine(`${name}@${version}`);
  await npmInteractive(["publish", "-w", name]);
  logLine(`ok  ${name}@${version}`);
}

async function waitForPublishedVersion(name, version) {
  logLine(`wait  ${name}@${version}`);
  for (;;) {
    const seen = await npm(["view", `${name}@${version}`, "version"], {
      allowFailure: true,
    });
    if (seen === version) return;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

async function distTag(name, version, tag) {
  const target = `${name}@${version}`;
  if (dryRun) {
    logLine(`${tag}  →  ${target}  (dry-run)`);
    return;
  }
  logLine(`${tag}  →  ${target}`);
  const args = ["dist-tag", "add", target, tag];
  // После publish registry/OTP иногда ещё не готовы — повторяем.
  for (let attempt = 1; ; attempt += 1) {
    try {
      await npmInteractive(args);
      logLine(`ok  ${tag}  →  ${target}`);
      return;
    } catch (error) {
      logLine(`retry dist-tag (${attempt}): ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

async function buildClientPlatform(platform) {
  logLine(`build  client ${platform},production`);
  await execFileAsync(
    "npx",
    ["ng", "build", `--configuration=${platform},production`],
    {
      cwd: clientDir,
      env: process.env,
      maxBuffer: 20 * 1024 * 1024,
    },
  );
}

async function clientPackageReadme(name, platform) {
  const template = await readFile(
    path.join(clientDir, "npm-readme.template.md"),
    "utf8",
  );
  return template
    .replaceAll("{{PACKAGE_NAME}}", name)
    .replaceAll("{{PLATFORM}}", platform);
}

async function prepareClientStaging(platform, version) {
  const name = clientPackageName(platform);
  const staging = path.join(clientDir, "dist", "npm", platform);
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  await cp(clientBuildOut, staging, { recursive: true });
  const manifest = {
    name,
    version,
    description: `Matreshka client production build for ${platform}`,
    files: ["*"],
    author: "Dmitriy Tretyakov <dmitriy.tretyakov.work@gmail.com>",
    license: "CC-BY-NC-4.0",
    repository: {
      type: "git",
      url: "git+https://github.com/matreshka-dev/matreshka.git",
      directory: "client",
    },
    bugs: {
      url: "https://github.com/matreshka-dev/matreshka/issues",
    },
    homepage:
      "https://github.com/matreshka-dev/matreshka/blob/main/docs/getting-started/client-from-npm.md",
    publishConfig: {
      access: "public",
    },
  };
  await writeFile(
    path.join(staging, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    path.join(staging, "README.md"),
    await clientPackageReadme(name, platform),
    "utf8",
  );
  return { name, staging };
}

async function publishClientPackage(name, version, staging) {
  if (dryRun) {
    logLine(`${name}@${version}  (dry-run)`);
    return;
  }
  logLine(`${name}@${version}`);
  await npmInteractive(["publish"], { cwd: staging });
  logLine(`ok  ${name}@${version}`);
}

const who = await npm(["whoami"], { allowFailure: true });
if (!who && !dryRun) {
  console.error(
    "npm не авторизован. Один раз выполните npm login или положите токен в ~/.npmrc (//registry.npmjs.org/:_authToken).",
  );
  process.exit(1);
}

logSection("session");
if (who) logKv("npm", who);
logKv("mode", dryRun ? "dry-run" : "publish");
if (!dryRun) explainNpmAuthPrompt();

const published = [];
const waveDecisions = [];

for (const wave of waves) {
  const decisions = await Promise.all(
    wave.map(async (name) => {
      const local = await localVersion(name);
      const remote = await remoteVersion(name);
      return { name, local, remote };
    }),
  );
  waveDecisions.push(decisions);
}

const bffVersion = await localVersion("@matreshka/bff");
const clientProtocol = await localVersion("@matreshka/client-bff-protocol");
const gatewayProtocol = await localVersion("@matreshka/gateway-bff-protocol");
const clientVersion = await clientAppVersion();
const protocolTag = `client-bff-protocol-${clientProtocol}`;

const clientDecisions = await Promise.all(
  clientPlatforms.map(async (platform) => {
    const name = clientPackageName(platform);
    const remote = await remoteVersion(name);
    return { name, platform, local: clientVersion, remote };
  }),
);

const allDecisions = [...waveDecisions.flat(), ...clientDecisions];
logSection("plan");
printDecisionTable(allDecisions);

const workspaceToPublish = waveDecisions.map((decisions) =>
  decisions.filter((item) => item.remote !== item.local),
);

const clientToPublish = clientDecisions.filter(
  (item) => item.remote !== item.local,
);

const willPublish =
  workspaceToPublish.some((wave) => wave.length > 0) ||
  clientToPublish.length > 0;

if (willPublish) {
  logSection("publish");
}

for (const toPublish of workspaceToPublish) {
  for (const item of toPublish) {
    await publish(item.name, item.local);
  }
  published.push(...toPublish);
}

for (const item of clientToPublish) {
  if (dryRun) {
    logLine(`${item.name}@${item.local}  build ${item.platform}  (dry-run)`);
  } else {
    await buildClientPlatform(item.platform);
    const { staging } = await prepareClientStaging(item.platform, item.local);
    await publishClientPackage(item.name, item.local, staging);
  }
  published.push(item);
}

const bffPublished = published.some((item) => item.name === "@matreshka/bff");
const clientsPublished = clientToPublish;

if (bffPublished || clientsPublished.length) {
  logSection("dist-tags");
}

if (bffPublished) {
  if (!dryRun) {
    await waitForPublishedVersion("@matreshka/bff", bffVersion);
  }
  await distTag("@matreshka/bff", bffVersion, protocolTag);
  await distTag(
    "@matreshka/bff",
    bffVersion,
    `gateway-bff-protocol-${gatewayProtocol}`,
  );
}

for (const item of clientsPublished) {
  if (!dryRun) {
    await waitForPublishedVersion(item.name, item.local);
  }
  await distTag(item.name, item.local, protocolTag);
}

logSection("summary");
if (dryRun) {
  logLine(
    published.length
      ? `dry-run, к публикации: ${published.map((item) => `${item.name}@${item.local}`).join(", ")}`
      : "dry-run, публиковать нечего",
  );
} else {
  logLine(
    published.length
      ? published.map((item) => `${item.name}@${item.local}`).join(", ")
      : "новых версий нет",
  );
}
console.log("");
