import type { ServerComponentInteraction } from '@matreshka/client-bff-protocol/types/server-component-interaction';
import { ComponentHubService } from '../../../services/component-hub.service';
import { ContextHubService } from '../../../services/context-hub.service';
import { PopupService } from '../../../services/popup.service';
import {
  applyContextPatch,
  applyContextValueUpdates,
  resolveLocalActionOperand,
} from './apply-context-value-updates';
import type { ComponentAnimationPayload } from './run-component-animations';

export type LocalInteractionRuntime = {
  contextHub: ContextHubService;
  componentHub: ComponentHubService;
  popupService: PopupService;
};

/** Выполняет одно локальное действие из сериализованного interaction. `animate-component` только складывает в карту. */
export function executeLocalInteraction(
  interaction: ServerComponentInteraction,
  runtime: LocalInteractionRuntime,
  animateByTarget?: Map<string, ComponentAnimationPayload[]>,
): void {
  if (interaction.class.startsWith('component-local-')) {
    const target = (interaction.payload as { target: string }).target;
    for (const component of runtime.componentHub.getInstancesByComponentId(
      target,
    )) {
      void Promise.resolve(
        component.runSerializedLocalAction(interaction),
      ).catch((error: unknown) => {
        console.error(
          `Local component action failed: ${interaction.class}`,
          error,
        );
      });
    }
    return;
  }

  switch (interaction.class) {
    case 'write-text-to-clipboard':
      void navigator.clipboard.writeText(
        runtime.contextHub.replacePlaceholders(
          (interaction.payload as { text: string }).text,
        ),
      );
      return;
    case 'set-context': {
      const payload = interaction.payload as {
        context: string;
        patch: Record<string, unknown>;
      };
      applyContextPatch(runtime.contextHub, payload.context, payload.patch);
      return;
    }
    case 'toggle-context-value': {
      const payload = interaction.payload as { ref: string };
      applyContextValueUpdates(runtime.contextHub, [
        {
          ref: payload.ref,
          value: !runtime.contextHub.value(payload.ref),
        },
      ]);
      return;
    }
    case 'inc-context-value':
    case 'dec-context-value': {
      const payload = interaction.payload as { ref: string; step?: unknown };
      const current = runtime.contextHub.value(payload.ref);
      const resolvedStep = resolveLocalActionOperand(
        runtime.contextHub,
        payload.step ?? { kind: 'literal', value: 1 },
      );
      const step = typeof resolvedStep === 'number' ? resolvedStep : 1;
      const sign = interaction.class === 'inc-context-value' ? 1 : -1;
      applyContextValueUpdates(runtime.contextHub, [
        {
          ref: payload.ref,
          value: (typeof current === 'number' ? current : 0) + sign * step,
        },
      ]);
      return;
    }
    case 'close-entry': {
      const payload = interaction.payload as { target: string };
      for (const instance of runtime.componentHub.getInstancesByComponentId(
        payload.target,
      )) {
        runtime.popupService.close$.next(instance.id());
      }
      return;
    }
    case 'animate-component': {
      if (!animateByTarget) {
        return;
      }
      const payload = interaction.payload as ComponentAnimationPayload;
      const rawId = payload.componentId;
      const targetId =
        rawId !== undefined && rawId !== ''
          ? runtime.contextHub.replacePlaceholders(rawId)
          : '';
      if (targetId === '') {
        return;
      }
      const batch = animateByTarget.get(targetId);
      if (batch) {
        batch.push(payload);
      } else {
        animateByTarget.set(targetId, [payload]);
      }
      return;
    }
    default:
      console.error('Unknown interaction = ' + interaction.class);
  }
}
