import { PlatformWebAuthnCreateCredentialMessage } from '@shared/messages/bff-to-client/platforms/platform-webauthn-create-credential-message';
import { PlatformWebAuthnGetCredentialMessage } from '@shared/messages/bff-to-client/platforms/platform-webauthn-get-credential-message';
import type { ClientToBffMessage } from '@shared/messages/client-to-bff/client-to-bff-message';
import { ErrorMessage } from '@shared/messages/client-to-bff/error-message';
import { PlatformWebAuthnCreateCredentialSuccessMessage } from '@shared/messages/client-to-bff/platforms/platform-webauthn-create-credential-success-message';
import { PlatformWebAuthnGetCredentialSuccessMessage } from '@shared/messages/client-to-bff/platforms/platform-webauthn-get-credential-success-message';
import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import type { Subject } from 'rxjs';

export function isWebAuthnSupported(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    globalThis.isSecureContext === true &&
    typeof PublicKeyCredential !== 'undefined'
  );
}

export function webAuthnErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export async function createWebAuthnCredential(
  optionsJSON: PublicKeyCredentialCreationOptionsJSON,
): Promise<RegistrationResponseJSON> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this environment');
  }
  return startRegistration({ optionsJSON });
}

export async function getWebAuthnCredential(
  optionsJSON: PublicKeyCredentialRequestOptionsJSON,
): Promise<AuthenticationResponseJSON> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported in this environment');
  }
  return startAuthentication({ optionsJSON });
}

type WebAuthnPostman = {
  outcomingMessage$: Subject<ClientToBffMessage>;
};

export function handlePlatformWebAuthnCreateCredentialMessage(
  postman: WebAuthnPostman,
  message: PlatformWebAuthnCreateCredentialMessage,
): void {
  void createWebAuthnCredential(message.payload.optionsJSON)
    .then((credentialJSON) => {
      postman.outcomingMessage$.next(
        new PlatformWebAuthnCreateCredentialSuccessMessage(message.target, {
          credentialJSON,
        }),
      );
    })
    .catch((error) => {
      postman.outcomingMessage$.next(
        new ErrorMessage(message.target, {
          message: webAuthnErrorMessage(error),
        }),
      );
    });
}

export function handlePlatformWebAuthnGetCredentialMessage(
  postman: WebAuthnPostman,
  message: PlatformWebAuthnGetCredentialMessage,
): void {
  void getWebAuthnCredential(message.payload.optionsJSON)
    .then((credentialJSON) => {
      postman.outcomingMessage$.next(
        new PlatformWebAuthnGetCredentialSuccessMessage(message.target, {
          credentialJSON,
        }),
      );
    })
    .catch((error) => {
      postman.outcomingMessage$.next(
        new ErrorMessage(message.target, {
          message: webAuthnErrorMessage(error),
        }),
      );
    });
}
