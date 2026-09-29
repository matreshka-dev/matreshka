import { PlatformWebAuthnCreateCredentialMessage } from '@shared/messages/bff-to-client/platforms/platform-webauthn-create-credential-message';
import { ErrorMessage } from '@shared/messages/client-to-bff/error-message';
import { PlatformWebAuthnCreateCredentialSuccessMessage } from '@shared/messages/client-to-bff/platforms/platform-webauthn-create-credential-success-message';
import { Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createWebAuthnCredential,
  handlePlatformWebAuthnCreateCredentialMessage,
  isWebAuthnSupported,
  webAuthnErrorMessage,
} from './webauthn';

vi.mock('@simplewebauthn/browser', () => ({
  startRegistration: vi.fn(async () => ({
    id: 'cred-id',
    rawId: 'cred-id',
    response: {
      clientDataJSON: 'clientDataJSON',
      attestationObject: 'attestationObject',
    },
    clientExtensionResults: {},
    type: 'public-key',
  })),
  startAuthentication: vi.fn(),
}));

describe('webauthn utils', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('webAuthnErrorMessage normalizes errors', () => {
    expect(webAuthnErrorMessage(new Error('fail'))).toBe('fail');
    expect(webAuthnErrorMessage('x')).toBe('x');
  });

  it('isWebAuthnSupported requires secure context and PublicKeyCredential', () => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('PublicKeyCredential', class {});

    expect(isWebAuthnSupported()).toBe(true);
  });

  it('createWebAuthnCredential delegates to startRegistration', async () => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('PublicKeyCredential', class {});

    const result = await createWebAuthnCredential({
      challenge: 'c',
      rp: { name: 'Test', id: 'localhost' },
      user: { id: 'u', name: 'n', displayName: 'd' },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    });

    expect(result.id).toBe('cred-id');
  });

  it('handlePlatformWebAuthnCreateCredentialMessage posts success message', async () => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('PublicKeyCredential', class {});

    const outcomingMessage$ = new Subject<unknown>();
    const messages: unknown[] = [];
    outcomingMessage$.subscribe((message) => messages.push(message));

    const scope = 'platform-action-test';
    handlePlatformWebAuthnCreateCredentialMessage(
      { outcomingMessage$ } as never,
      new PlatformWebAuthnCreateCredentialMessage(scope, {
        optionsJSON: {
          challenge: 'c',
          rp: { name: 'Test', id: 'localhost' },
          user: { id: 'u', name: 'n', displayName: 'd' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        },
      }),
    );

    await vi.waitFor(() => {
      expect(messages.length).toBe(1);
    });

    expect(messages[0]).toBeInstanceOf(
      PlatformWebAuthnCreateCredentialSuccessMessage,
    );
    expect(
      (messages[0] as PlatformWebAuthnCreateCredentialSuccessMessage).target,
    ).toBe(scope);
  });

  it('createWebAuthnCredential throws when unsupported', async () => {
    vi.stubGlobal('isSecureContext', false);

    await expect(
      createWebAuthnCredential({
        challenge: 'c',
        rp: { name: 'Test', id: 'localhost' },
        user: { id: 'u', name: 'n', displayName: 'd' },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      }),
    ).rejects.toThrow(/not supported/i);
  });

  it('handlePlatformWebAuthnCreateCredentialMessage posts ErrorMessage on failure', async () => {
    const { startRegistration } = await import('@simplewebauthn/browser');
    vi.mocked(startRegistration).mockRejectedValueOnce(new Error('cancelled'));

    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('PublicKeyCredential', class {});

    const outcomingMessage$ = new Subject<unknown>();
    const messages: unknown[] = [];
    outcomingMessage$.subscribe((message) => messages.push(message));

    handlePlatformWebAuthnCreateCredentialMessage(
      { outcomingMessage$ } as never,
      new PlatformWebAuthnCreateCredentialMessage('scope-err', {
        optionsJSON: {
          challenge: 'c',
          rp: { name: 'Test', id: 'localhost' },
          user: { id: 'u', name: 'n', displayName: 'd' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        },
      }),
    );

    await vi.waitFor(() => {
      expect(messages.length).toBe(1);
    });

    expect(messages[0]).toBeInstanceOf(ErrorMessage);
    expect((messages[0] as ErrorMessage).payload.message).toBe('cancelled');
  });
});
