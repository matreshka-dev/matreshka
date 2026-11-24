#!/usr/bin/env node
/**
 * Публикует публичные пакеты workspace, у которых локальная version
 * отличается от version в npm registry. Логин не выполняет: нужен
 * уже сохранённый `npm login` или NPM_TOKEN / //registry.npmjs.org/:_authToken в ~/.npmrc.
 *
 * Пакеты без зависимостей друг на друга публикуются параллельно.
 * Между волнами нет опроса registry: npm publish завершается после приёма tarball.
 * dist-tag для @matreshka/bff ставится в конце, с повторами на случай задержки registry.
 */
import { execFile, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

async function npm(args, { allowFailure = false } = {}) {
  try {
    const { stdout } = await execFileAsync("npm", args, {
      cwd: root,
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

async function remoteVersion(name) {
  const stdout = await npm(["view", `${name}@latest`, "version"], {
    allowFailure: true,
  });
  return stdout || null;
}

function npmInteractive(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", args, {
      cwd: root,
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

async function publish(name, version) {
  if (dryRun) {
    console.log(`  будет опубликован ${name}@${version}`);
    return;
  }
  console.log(`  публикация ${name}@${version}…`);
  await npmInteractive(["publish", "-w", name]);
  console.log(`  опубликован ${name}@${version}`);
}

async function waitForPublishedVersion(name, version) {
  console.log(`  ожидание публикации ${name}@${version}…`);
  for (let attempt = 1; ; attempt += 1) {
    const seen = await npm(["view", `${name}@${version}`, "version"], {
      allowFailure: true,
    });
    if (seen === version) return;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

async function distTag(bffVersion, tag) {
  const args = ["dist-tag", "add", `@matreshka/bff@${bffVersion}`, tag];
  if (dryRun) {
    console.log(`  будет dist-tag ${tag} → @matreshka/bff@${bffVersion}`);
    return;
  }
  await npmInteractive(args);
  console.log(`dist-tag ${tag} → @matreshka/bff@${bffVersion}`);
}

const who = await npm(["whoami"], { allowFailure: true });
if (!who && !dryRun) {
  console.error(
    "npm не авторизован. Один раз выполните npm login или положите токен в ~/.npmrc (//registry.npmjs.org/:_authToken).",
  );
  process.exit(1);
}
if (who) console.log(`npm: ${who}`);
if (dryRun) {
  console.log("режим dry-run: в registry ничего не отправляется");
}

const published = [];
const skipped = [];

for (const wave of waves) {
  const decisions = await Promise.all(
    wave.map(async (name) => {
      const local = await localVersion(name);
      const remote = await remoteVersion(name);
      return { name, local, remote };
    }),
  );

  const toPublish = [];
  for (const item of decisions) {
    if (item.remote === item.local) {
      skipped.push(item);
      console.log(
        `пропуск ${item.name}@${item.local}: эта версия уже в registry`,
      );
    } else {
      toPublish.push(item);
      if (item.remote) {
        console.log(
          `${item.name}: registry ${item.remote} → локально ${item.local}`,
        );
      } else {
        console.log(
          `${item.name}: в registry нет latest, локально ${item.local}`,
        );
      }
    }
  }

  for (const item of toPublish) {
    await publish(item.name, item.local);
  }
  published.push(...toPublish);
}

const bffVersion = await localVersion("@matreshka/bff");
const clientProtocol = await localVersion("@matreshka/client-bff-protocol");
const gatewayProtocol = await localVersion("@matreshka/gateway-bff-protocol");

if (!dryRun) {
  await waitForPublishedVersion("@matreshka/bff", bffVersion);
}

await distTag(bffVersion, `client-bff-protocol-${clientProtocol}`);
await distTag(bffVersion, `gateway-bff-protocol-${gatewayProtocol}`);

const summary = published
  .map((item) => `${item.name}@${item.local}`)
  .join(", ");
if (dryRun) {
  console.log(
    published.length
      ? `dry-run, ничего не опубликовано. К публикации: ${summary}`
      : "dry-run: новых версий нет, публиковать нечего",
  );
} else {
  console.log(
    published.length ? `опубликовано: ${summary}` : "новых версий нет",
  );
}
if (skipped.length) {
  console.log(`без изменений: ${skipped.map((item) => item.name).join(", ")}`);
}
