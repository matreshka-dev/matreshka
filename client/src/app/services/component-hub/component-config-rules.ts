import type { Condition } from '@shared/types/condition';
import { getDeviceTypeFromUserAgent } from '@shared/utils/user-agent';
import { ServerComponentConfig } from '../../components/server/server-component-config';
import {
  evaluateConditions,
  UNLOADED_CONTEXT_VALUE,
} from '../../utils/evaluate-conditions';
import { mergeOverride } from '../../utils/merge-override';
import { parseContextPath } from '../../utils/parse-context-path';
import {
  ContextHubService,
  ContextNotLoadedError,
} from '../context-hub.service';
import type { ConfigEntry } from './component-config-entry.types';

/**
 * Правила (`rules`) и условия (`conditions`): проверка, выбор overrides,
 * сбор итогового конфига и пересчёт зависимостей от контекста.
 */
export class ComponentConfigRules {
  constructor(
    private readonly contextHub: ContextHubService,
    private readonly document: Document,
    private readonly calculateConfigContextDependencies: (
      config: ServerComponentConfig,
    ) => ConfigEntry['contextDependencies'],
  ) {}

  /** Читает значение из контекста для условия; если контекст ещё не загружен — специальная «пустая» метка. */
  private conditionValue(ref: string): unknown {
    const pathInfo = parseContextPath(ref);
    if (!this.contextHub.loaded(pathInfo.contextId)) {
      return UNLOADED_CONTEXT_VALUE;
    }
    try {
      return this.contextHub.value(ref);
    } catch (error) {
      if (error instanceof ContextNotLoadedError) {
        return UNLOADED_CONTEXT_VALUE;
      }
      throw error;
    }
  }

  /** Тип устройства из user agent (для условий вроде «только mobile»). */
  private deviceType() {
    return getDeviceTypeFromUserAgent(
      this.document.defaultView?.navigator.userAgent ?? '',
    );
  }

  /** Выполняются ли все переданные условия (видимость, actions, rules). */
  conditionsMet(conditions: Condition[]): boolean {
    return evaluateConditions(conditions, {
      getContextValue: (ref) => this.conditionValue(ref),
      getDeviceType: () => this.deviceType(),
      unloadedValue: UNLOADED_CONTEXT_VALUE,
    });
  }

  /**
   * Строка-ключ активных rules: индексы правил, чьи conditions сейчас true,
   * через запятую (например `"0,2"`).
   */
  getActiveRulesKey(config: ServerComponentConfig): string {
    return (config.rules || [])
      .flatMap((rule, index) =>
        this.conditionsMet(rule.conditions) ? [String(index)] : [],
      )
      .join(',');
  }

  /**
   * Конфиг с применёнными overrides активных rules; результат кешируется в entry.resolvedConfigs.
   */
  getResolvedConfig(
    entry: ConfigEntry,
    activeRulesKey: string,
  ): ServerComponentConfig {
    const cached = entry.resolvedConfigs.get(activeRulesKey);
    if (cached) {
      return cached;
    }

    const resolvedConfig = structuredClone(entry.sourceConfig);
    const properties = structuredClone(entry.sourceConfig.properties || {});

    if (activeRulesKey) {
      activeRulesKey.split(',').forEach((ruleIndex) => {
        const rule = entry.sourceConfig.rules?.[parseInt(ruleIndex, 10)];
        if (rule) {
          mergeOverride(properties, rule.overrides);
        }
      });
    }

    if (entry.sourceConfig.properties || Object.keys(properties).length > 0) {
      resolvedConfig.properties = properties;
    }

    entry.resolvedConfigs.set(activeRulesKey, resolvedConfig);
    return resolvedConfig;
  }

  /** Копирует поля из source в target и удаляет из target ключи, которых нет в source. */
  syncConfig(target: ServerComponentConfig, source: ServerComponentConfig) {
    Object.keys(target).forEach((key) => {
      if (!(key in source)) {
        delete (target as Record<string, unknown>)[key];
      }
    });
    Object.assign(target, source);
  }

  /**
   * Пересчитывает активные rules, обновляет entry.config и граф contextDependencies.
   * @returns true, если конфиг или зависимости реально изменились.
   */
  updateResolvedConfig(entry: ConfigEntry, force = false): boolean {
    const activeRulesKey = this.getActiveRulesKey(entry.sourceConfig);
    if (!force && activeRulesKey === entry.activeRulesKey) {
      return false;
    }

    entry.activeRulesKey = activeRulesKey;
    this.syncConfig(
      entry.config,
      this.getResolvedConfig(entry, activeRulesKey),
    );
    entry.contextDependencies = this.calculateConfigContextDependencies(
      entry.config,
    );
    return true;
  }
}
