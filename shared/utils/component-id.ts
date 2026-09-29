const COMPONENT_INSTANCE_ID =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(\d+)$/i;

/**
 * Базовый id компонента без суффикса использования сериализации.
 * `550e8400-e29b-41d4-a716-446655440000-0` → `550e8400-e29b-41d4-a716-446655440000`.
 * Id без суффикса возвращается без изменений.
 */
export function componentBaseId(id: string): string {
  const match = id.match(COMPONENT_INSTANCE_ID);
  return match ? match[1] : id;
}

/** `true`, если id содержит суффикс использования (`uuid-0`). */
export function hasComponentInstanceSuffix(id: string): boolean {
  return COMPONENT_INSTANCE_ID.test(id);
}

/**
 * Id с сервера относится к использованию: совпадает с instance id
 * или это базовый id (все использования одного server-компонента).
 * Подходит для target сообщения, id якоря popover и т.п.
 */
export function componentIdMatchesInstance(
  receivedId: string,
  instanceId: string,
): boolean {
  if (receivedId === instanceId) {
    return true;
  }
  return (
    !hasComponentInstanceSuffix(receivedId) &&
    receivedId === componentBaseId(instanceId)
  );
}
