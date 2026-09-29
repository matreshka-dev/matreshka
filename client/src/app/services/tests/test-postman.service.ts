import { Injectable } from '@angular/core';
import { BffToClientMessage } from '@shared/messages/bff-to-client/bff-to-client-message';
import { ClientToBffMessage } from '@shared/messages/client-to-bff/client-to-bff-message';
import { Subject } from 'rxjs';
import { SourceConfig } from '../../types/source-config';

/**
 * Тестовый двойник PostmanService.
 * Используется только в unit-тестах, чтобы иметь возможность
 * напрямую эмитить входящие сообщения через incomingMessage$.next(...).
 */
@Injectable()
export class TestPostmanService {
  incomingMessage$ = new Subject<BffToClientMessage>();
  outcomingMessage$ = new Subject<ClientToBffMessage>();

  attachSource(_source: SourceConfig) {
    // В тестовом сервисе соединение с реальным сервером не требуется.
  }

  detachSource() {
    // Нет активного соединения, которое нужно разрывать в тестах.
  }
}
