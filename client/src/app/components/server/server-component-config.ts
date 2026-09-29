import type { Overlay as OverlayShape } from '@shared/types/container-overlay';
import type {
  ServerComponentConfig,
  ServerComponentRule,
} from '@shared/types/server-component-config';
import { fetchFromObject } from '@shared/utils/fetch-from-object';

export type { ServerComponentConfig, ServerComponentRule };

export type Overlay = OverlayShape<ServerComponentConfig>;

function collectNestedConfigs(value: unknown): ServerComponentConfig[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectNestedConfigs(item));
  }

  return value !== undefined ? [value as ServerComponentConfig] : [];
}

export function getNestedConfigsByPropertyKey(
  config: Pick<ServerComponentConfig, 'properties' | 'rules'>,
  key: string,
  mapValue: (value: unknown) => unknown = (value) => value,
): ServerComponentConfig[] {
  const values = [
    fetchFromObject((config.properties || {}) as Record<string, unknown>, key),
    ...(config.rules || []).map((rule) => fetchFromObject(rule.overrides, key)),
  ];

  const nestedConfigs = new Map<string, ServerComponentConfig>();

  values.forEach((value) => {
    collectNestedConfigs(mapValue(value)).forEach((nestedConfig) => {
      nestedConfigs.set(nestedConfig.id, nestedConfig);
    });
  });

  return Array.from(nestedConfigs.values());
}

export type ComponentDependencies = {
  pathsWithPlaceholdersInTemplate: string[];
  pathsWithPlaceholdersInCode: string[];
  requiredContextsPaths: string[];
  getNestedConfigsPaths: (config: any) => ServerComponentConfig[];
};

export const ServerComponentDependencies: ComponentDependencies = {
  pathsWithPlaceholdersInTemplate: ['link.value'],
  pathsWithPlaceholdersInCode: [],
  requiredContextsPaths: [],
  getNestedConfigsPaths: (config: ServerComponentConfig) =>
    getNestedConfigsByPropertyKey(config, 'overlays', (value) =>
      Array.isArray(value)
        ? value.map((overlay) =>
            typeof overlay === 'object' &&
            overlay !== null &&
            'component' in overlay
              ? (overlay as { component: unknown }).component
              : undefined,
          )
        : [],
    ),
};
