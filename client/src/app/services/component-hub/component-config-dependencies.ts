import type { Condition } from '@shared/types/condition';
import { fetchFromObject } from '@shared/utils/fetch-from-object';
import { collectConditionPayloadRefs } from '@shared/utils/serialized-operand';
import {
  ComponentDependencies,
  ServerComponentConfig,
} from '../../components/server/server-component-config';
import { collectContextRefDependencies } from '../../utils/collect-context-ref-dependencies';
import { findContextKeys } from '../../utils/find-context-keys';
import { mergeOverride } from '../../utils/merge-override';
import { parseContextPath } from '../../utils/parse-context-path';
import type { ContextHubService } from '../context-hub.service';
import {
  ACTIONS_DEPENDENCIES_KEY,
  CONDITIONS_DEPENDENCIES_KEY,
  type ConfigEntry,
  PathContextDependency,
  RULES_DEPENDENCIES_KEY,
} from './component-config-entry.types';

/** У condition есть объект payload (а не только type). */
function hasConditionPayload(
  condition: Condition,
): condition is Condition & { payload: Record<string, unknown> } {
  return (
    typeof condition === 'object' &&
    condition !== null &&
    'payload' in condition &&
    typeof (condition as { payload?: unknown }).payload === 'object' &&
    (condition as { payload?: unknown }).payload !== null
  );
}

/** Ссылки на поля контекста внутри payload условия. */
function getConditionContextLinkRefs(condition: Condition): string[] {
  if (!hasConditionPayload(condition)) {
    return [];
  }
  return collectConditionPayloadRefs(condition.payload);
}

/** Условие «нужно загрузить целый контекст» (payload.contextId). */
function isContextIdCondition(
  condition: Condition,
): condition is Condition & { payload: { contextId: string } } {
  if (!hasConditionPayload(condition)) {
    return false;
  }
  const payload = condition.payload as { [key: string]: unknown };
  return typeof payload['contextId'] === 'string';
}

/** Зависимости от ref в условии, с флагом rerender. */
function prepareConditionRefDependencies(
  ref: string,
  rerender: boolean,
): PathContextDependency[] {
  return collectContextRefDependencies(ref).map((dep) => ({
    ...dep,
    rerender,
  }));
}

/** Зависимости от плейсхолдеров @{ctx.key} в строковом поле конфига. */
function preparePlaceholdersDependencies(
  config: ServerComponentConfig,
  path: string,
  rerender: boolean,
): PathContextDependency[] {
  const deps: PathContextDependency[] = [];
  const value = fetchFromObject(config.properties, path);
  if (typeof value === 'string') {
    const keys = findContextKeys(value);
    keys.forEach((key) => {
      const parts = parseContextPath(key);
      deps.push({ contextId: parts.contextId, key: parts.key, rerender });
    });
  }
  return deps;
}

/** Все conditions из interactions (клики, hide и т.д.). */
function getActionConditions(config: ServerComponentConfig): Condition[] {
  return Object.values(config.interactions || {}).flatMap((interactions) =>
    interactions.flatMap((interaction) => interaction.conditions || []),
  );
}

type ServerComponentSettings = Record<
  string,
  { dependencies: ComponentDependencies }
>;

/**
 * Строит карту: «откуда в конфиге берутся данные контекста».
 * Учитывает conditions, rules, actions, ref-поля и плейсхолдеры в properties;
 * для уже загруженных значений разворачивает вложенные плейсхолдеры в строках.
 */
export function calculateConfigContextDependencies(
  config: ServerComponentConfig,
  contextHub: ContextHubService,
  serverComponents: ServerComponentSettings,
): Map<string, PathContextDependency[]> {
  const contextDependencies = new Map<string, PathContextDependency[]>();
  const entrySettings = serverComponents[config.class];

  const conditionsContexts = (config.conditions || [])
    .filter((condition) => isContextIdCondition(condition))
    .map((condition) => ({ contextId: condition.payload.contextId }));

  const conditionsContextsKeys = (config.conditions || []).flatMap(
    (condition) =>
      getConditionContextLinkRefs(condition).flatMap((ref) =>
        prepareConditionRefDependencies(ref, false),
      ),
  );
  if (conditionsContexts.length || conditionsContextsKeys.length) {
    contextDependencies.set(CONDITIONS_DEPENDENCIES_KEY, [
      ...conditionsContexts.map((dep) => ({ ...dep, rerender: false })),
      ...conditionsContextsKeys,
    ]);
  }

  const rulesContexts = (config.rules || [])
    .flatMap((rule) => rule.conditions)
    .filter((condition) => isContextIdCondition(condition))
    .map((condition) => ({
      contextId: condition.payload.contextId,
      rerender: false,
    }));

  const rulesContextsKeys = (config.rules || [])
    .flatMap((rule) => rule.conditions)
    .flatMap((condition) =>
      getConditionContextLinkRefs(condition).flatMap((ref) =>
        prepareConditionRefDependencies(ref, false),
      ),
    );
  if (rulesContexts.length || rulesContextsKeys.length) {
    contextDependencies.set(RULES_DEPENDENCIES_KEY, [
      ...rulesContexts,
      ...rulesContextsKeys,
    ]);
  }

  const actionConditions = getActionConditions(config);
  const actionsContexts = actionConditions
    .filter((condition) => isContextIdCondition(condition))
    .map((condition) => ({
      contextId: condition.payload.contextId,
      rerender: false,
    }));
  const actionsContextsKeys = actionConditions.flatMap((condition) =>
    getConditionContextLinkRefs(condition).flatMap((ref) =>
      prepareConditionRefDependencies(ref, false),
    ),
  );
  if (actionsContexts.length || actionsContextsKeys.length) {
    contextDependencies.set(ACTIONS_DEPENDENCIES_KEY, [
      ...actionsContexts,
      ...actionsContextsKeys,
    ]);
  }

  entrySettings.dependencies.requiredContextsPaths.forEach((path) => {
    const deps = contextDependencies.get(path) || [];
    const value = fetchFromObject(config.properties || {}, path);
    if (typeof value === 'string') {
      const pathInfo = parseContextPath(value);
      deps.push({
        contextId: pathInfo.contextId,
        rerender: false,
      });
      contextDependencies.set(path, deps);
    }
  });

  [
    ...entrySettings.dependencies.pathsWithPlaceholdersInTemplate,
    ...entrySettings.dependencies.pathsWithPlaceholdersInCode,
  ].forEach((path) => {
    const deps = preparePlaceholdersDependencies(
      config,
      path,
      entrySettings.dependencies.pathsWithPlaceholdersInTemplate.includes(path),
    );
    if (deps.length) {
      for (let i = 0; i < deps.length; i++) {
        const dep = deps[i];
        if ('key' in dep && contextHub.loaded(dep.contextId)) {
          const value = contextHub.value(dep.contextId + '.' + dep.key);
          if (typeof value === 'string') {
            for (const key of findContextKeys(value)) {
              const pathParts = parseContextPath(key);
              if (
                !deps.some(
                  (d) =>
                    'key' in d &&
                    d.contextId === pathParts.contextId &&
                    d.key === pathParts.key &&
                    d.rerender === dep.rerender,
                )
              ) {
                deps.push({
                  contextId: pathParts.contextId,
                  key: pathParts.key,
                  rerender: dep.rerender,
                });
              }
            }
          }
        }
      }
      contextDependencies.set(path, deps);
    }
  });

  return contextDependencies;
}

function collectContextIdsFromDependencies(
  contextDependencies: Map<string, PathContextDependency[]>,
): Set<string> {
  const ids = new Set<string>();
  contextDependencies.forEach((deps) => {
    deps.forEach((dep) => {
      ids.add(dep.contextId);
    });
  });
  return ids;
}

/**
 * Все contextId, которые нужно удерживать на клиенте, пока ConfigEntry в store.
 *
 * Объединяет зависимости базового sourceConfig и каждого rule (conditions + overrides),
 * в том числе из **неактивных** rules — чтобы context-destroy не evict snapshot,
 * пока компонент с таким конфигом зарегистрирован.
 *
 * Для ready$ / rerender по-прежнему используется {@link calculateConfigContextDependencies}
 * от resolved config (только активные overrides).
 */
export function calculateEntryHoldContextIds(
  entry: ConfigEntry,
  contextHub: ContextHubService,
  serverComponents: ServerComponentSettings,
): Set<string> {
  const ids = new Set<string>();

  const addFromConfig = (config: ServerComponentConfig) => {
    collectContextIdsFromDependencies(
      calculateConfigContextDependencies(config, contextHub, serverComponents),
    ).forEach((id) => ids.add(id));
  };

  addFromConfig(entry.sourceConfig);

  for (const rule of entry.sourceConfig.rules ?? []) {
    if (!rule.overrides || Object.keys(rule.overrides).length === 0) {
      continue;
    }
    const withRuleOverride: ServerComponentConfig = structuredClone(
      entry.sourceConfig,
    );
    const properties = structuredClone(entry.sourceConfig.properties ?? {});
    mergeOverride(properties, rule.overrides);
    withRuleOverride.properties = properties;
    addFromConfig(withRuleOverride);
  }

  return ids;
}
