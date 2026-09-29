import {
  ContextHubService,
  ContextNotLoadedError,
} from '../services/context-hub.service';

export function prepareText(
  valueBefore: string | number | undefined,
  contextHub: ContextHubService,
): string {
  if (typeof valueBefore === 'undefined') {
    return '';
  }
  if (typeof valueBefore === 'number') {
    return valueBefore.toString();
  }
  try {
    return contextHub.replacePlaceholders(valueBefore);
  } catch (error) {
    if (error instanceof ContextNotLoadedError) {
      return valueBefore;
    }
    throw error;
  }
}
