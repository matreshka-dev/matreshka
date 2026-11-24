import { ActionConfig } from "./action";

/**
 * Config локальной записи Context.
 * `sync: false` пишет только клиентское зеркало и не шлёт `context-values`.
 * Поле не входит в общий {@link ActionConfig}, чтобы не появиться у прочих действий.
 */
export type ContextLocalActionConfig = ActionConfig & {
  sync?: boolean;
};

/** В payload попадает только явное отключение синхронизации. */
export function contextLocalSyncField(
  sync: boolean | undefined,
): { sync: false } | Record<string, never> {
  return sync === false ? { sync: false } : {};
}
