import { Subscription, timer } from "rxjs";
import {
  BffToClientMessage,
  TargetedBffToClientMessage,
} from "./bff-to-client/bff-to-client-message";
import {
  PingableBffToClientMessage,
  PingableTargetedBffToClientMessage,
} from "./bff-to-client/pingable-bff-to-client-message";
import {
  isReliableBffToClientMessage,
  ReliableBffToClientMessage,
  ReliableTargetedBffToClientMessage,
} from "./bff-to-client/reliable-bff-to-client-message";
import {
  ClientToBffMessage,
  TargetedClientToBffMessage,
} from "./client-to-bff/client-to-bff-message";
import {
  PingableClientToBffMessage,
  PingableTargetedClientToBffMessage,
} from "./client-to-bff/pingable-client-to-bff-message";
import {
  isReliableClientToBffMessage,
  ReliableClientToBffMessage,
  ReliableTargetedClientToBffMessage,
} from "./client-to-bff/reliable-client-to-bff-message";
import { MessageReceivedPayload } from "./reliable-message";

type AnyIncomingMessage =
  | BffToClientMessage
  | ClientToBffMessage
  | TargetedBffToClientMessage
  | TargetedClientToBffMessage;
type AnyOutgoingMessage = AnyIncomingMessage;
type AnyReliableMessage =
  | ReliableBffToClientMessage
  | ReliableClientToBffMessage
  | ReliableTargetedBffToClientMessage
  | ReliableTargetedClientToBffMessage;
type AnyPingableMessage =
  | PingableBffToClientMessage
  | PingableClientToBffMessage
  | PingableTargetedBffToClientMessage
  | PingableTargetedClientToBffMessage;

type PendingEntry<OUTGOING extends AnyOutgoingMessage> = {
  message: OUTGOING & AnyReliableMessage;
  sentAt: number;
  timer: Subscription;
};

type PingSink = {
  next(value: number | undefined): void;
};

type ReliableDeliveryConfig<
  INCOMING extends AnyIncomingMessage,
  OUTGOING extends AnyOutgoingMessage,
> = {
  emitOutgoing: (message: OUTGOING) => void;
  createReceipt: (payload: MessageReceivedPayload) => OUTGOING;
  isReceiptMessage: (message: INCOMING) => boolean;
  ping$: PingSink;
  retryTimeoutMs?: number;
  maxReceivedIds?: number;
};

const DEFAULT_RETRY_TIMEOUT_MS = 2_000;
const DEFAULT_MAX_RECEIVED_IDS = 1_000;

/**
 * Универсальный трекер надёжной доставки для обеих сторон канала.
 *
 * Класс не знает ничего про конкретный транспорт: он не шлёт данные в сокет
 * напрямую, а просит внешний код эмитить исходящие сообщения через `emitOutgoing`.
 *
 * Что делает:
 * - отслеживает исходящие reliable-сообщения, пока на них не пришло подтверждение;
 * - планирует повторную отправку по таймауту;
 * - на входящее reliable-сообщение шлёт подтверждение получения;
 * - не пропускает повторную прикладную обработку одного и того же `message.id`;
 * - считает RTT только для pingable-сообщений и только по подтверждению актуальной попытки.
 */
export class ReliableDelivery<
  INCOMING extends AnyIncomingMessage,
  OUTGOING extends AnyOutgoingMessage,
> {
  /** Исходящие reliable-сообщения, для которых еще не пришло подтверждение. */
  private readonly pending = new Map<string, PendingEntry<OUTGOING>>();
  /**
   * Набор уже обработанных входящих `message.id`.
   *
   * Нужен именно для быстрого ответа на главный вопрос дедупликации:
   * "мы уже обрабатывали это логическое сообщение или нет?".
   *
   * Здесь важна скорость lookup, поэтому используется `Set`:
   * проверка `receivedIds.has(id)` выполняется за O(1) и не заставляет
   * каждый раз проходить по истории всех ранее полученных сообщений.
   *
   * Одного этого `Set` недостаточно, потому что он сам по себе не хранит
   * удобную для нас очередь очистки. Если просто складывать id сюда навсегда,
   * память будет расти бесконечно.
   */
  private readonly receivedIds = new Set<string>();
  /**
   * Порядок поступления уже обработанных id.
   *
   * Это companion-структура для `receivedIds`: она не отвечает за lookup,
   * а только хранит FIFO-порядок, в котором сообщения впервые считались
   * обработанными.
   *
   * Зачем она нужна:
   * - `receivedIds` умеет быстро отвечать "видели ли мы id";
   * - `receivedOrder` умеет быстро подсказать, какой id был самым старым
   *   и должен быть выброшен при переполнении дедуп-окна.
   *
   * Иначе пришлось бы либо:
   * - никогда не чистить `receivedIds`, что приведет к бесконечному росту памяти;
   * - либо пытаться искать "самый старый" id прямо внутри `Set`, что делает
   *   логику менее явной и неудобной для сопровождения.
   *
   * По сути эта пара (`receivedIds` + `receivedOrder`) реализует ограниченное
   * окно дедупликации: мы помним только последние `maxReceivedIds` логических
   * сообщений и удаляем самые старые по мере поступления новых.
   */
  private readonly receivedOrder: string[] = [];
  /** Таймаут, после которого неподтвержденное сообщение отправляется повторно. */
  private readonly retryTimeoutMs: number;
  /** Максимум id, которые храним в дедуп-окне для входящих сообщений. */
  private readonly maxReceivedIds: number;
  /**
   * Приостановлена ли фактическая отправка pending-сообщений.
   *
   * Используется на BFF во время grace period после disconnect:
   * retry-таймеры не эмитят, а `resume()` переотправляет всё pending.
   */
  private paused = false;

  /** Конфигурация связывает общий алгоритм с конкретным направлением сообщений. */
  constructor(
    private readonly config: ReliableDeliveryConfig<INCOMING, OUTGOING>,
  ) {
    this.retryTimeoutMs = config.retryTimeoutMs ?? DEFAULT_RETRY_TIMEOUT_MS;
    this.maxReceivedIds = config.maxReceivedIds ?? DEFAULT_MAX_RECEIVED_IDS;
  }

  /**
   * Регистрирует исходящее сообщение в pending-хранилище.
   *
   * Для обычных non-reliable сообщений метод ничего не делает.
   * Для reliable-сообщений:
   * - запоминает время текущей попытки;
   * - отменяет старый retry-таймер, если это повторная отправка;
   * - ставит новый таймер на следующую попытку.
   */
  observeOutgoing(message: OUTGOING): void {
    if (!isReliableMessage(message)) {
      return;
    }

    // При повторной отправке того же message id пересоздаем только таймер и sentAt.
    const existingEntry = this.pending.get(message.id);
    if (existingEntry) {
      existingEntry.timer.unsubscribe();
    }

    this.pending.set(message.id, {
      message,
      sentAt: Date.now(),
      timer: this.paused ? new Subscription() : this.createRetryTimer(message),
    });
  }

  /**
   * Приостанавливает retry и отложенную отправку pending-сообщений.
   *
   * Записи в `pending` сохраняются — их можно переотправить через `resume()`.
   */
  pause(): void {
    if (this.paused) {
      return;
    }

    this.paused = true;

    for (const entry of this.pending.values()) {
      entry.timer.unsubscribe();
    }
  }

  /**
   * Возобновляет отправку: re-emit всех pending-сообщений без `nextAttempt()`.
   *
   * Повторное прохождение через `observeOutgoing` обновит `sentAt` и retry-таймеры.
   */
  resume(): void {
    if (!this.paused) {
      return;
    }

    this.paused = false;

    for (const entry of this.pending.values()) {
      this.config.emitOutgoing(entry.message);
    }
  }

  /**
   * Обрабатывает входящее сообщение до прикладного кода.
   *
   * Возвращает:
   * - `undefined`, если сообщение является подтверждением или дубликатом;
   * - исходное сообщение, если его нужно отдать дальше в `incomingMessage$`.
   *
   * Для каждого reliable-сообщения подтверждение отправляется всегда,
   * даже если это дубликат: сеть могла потерять именно прошлое подтверждение.
   */
  handleIncoming(message: INCOMING): INCOMING | undefined {
    if (this.config.isReceiptMessage(message)) {
      this.handleReceipt(
        message as INCOMING & { payload: MessageReceivedPayload },
      );
      return undefined;
    }

    if (!isReliableMessage(message)) {
      return message;
    }

    this.config.emitOutgoing(
      this.config.createReceipt({
        id: message.id,
        attempt: message.attempt,
      }),
    );

    // Повторный пакет того же логического сообщения не обрабатываем повторно,
    // потому что прикладной код должен увидеть его только один раз.
    // Но подтверждение на него все равно отправляем: сеть могла потерять
    // именно прошлый receipt, а не само сообщение.
    if (this.receivedIds.has(message.id)) {
      return undefined;
    }

    this.rememberReceivedId(message.id);
    return message;
  }

  /**
   * Останавливает все активные retry-таймеры и очищает внутреннее состояние.
   *
   * Нужен при `detach`/`destroy`, чтобы старые попытки не продолжали жить
   * после отключения транспорта или уничтожения клиента.
   */
  destroy(): void {
    this.paused = false;

    for (const entry of this.pending.values()) {
      entry.timer.unsubscribe();
    }
    this.pending.clear();
    this.receivedIds.clear();
    this.receivedOrder.length = 0;
  }

  /**
   * Обрабатывает подтверждение получения для исходящего reliable-сообщения.
   *
   * Любое подтверждение по известному `id` завершает retry-цикл этого сообщения.
   * Пинг обновляем только когда:
   * - исходное сообщение pingable;
   * - подтверждение относится к текущей попытке, а не к более старой.
   */
  private handleReceipt(
    message: INCOMING & { payload: MessageReceivedPayload },
  ) {
    const pendingEntry = this.pending.get(message.payload.id);
    if (!pendingEntry) {
      return;
    }

    pendingEntry.timer.unsubscribe();
    this.pending.delete(message.payload.id);

    if (
      isPingableMessage(pendingEntry.message) &&
      message.payload.attempt === pendingEntry.message.attempt
    ) {
      // Старый receipt может прийти уже после новой попытки; такой ответ останавливает
      // повторы, но не должен искажать RTT текущей попытки.
      this.config.ping$.next(Date.now() - pendingEntry.sentAt);
    }
  }

  /**
   * Создает таймер, который инициирует следующую попытку отправки.
   *
   * Сам таймер не пишет в `pending` напрямую: он только увеличивает `attempt`
   * и снова эмитит то же сообщение наружу. Повторное попадание в `observeOutgoing`
   * уже обновит `sentAt` и поставит свежий таймер по обычному пути.
   */
  private createRetryTimer(
    message: OUTGOING & AnyReliableMessage,
  ): Subscription {
    return timer(this.retryTimeoutMs).subscribe(() => {
      if (this.paused || !this.pending.has(message.id)) {
        return;
      }

      // Повторяем тот же логический пакет с тем же id, но с новым номером попытки.
      message.nextAttempt();
      this.config.emitOutgoing(message);
    });
  }

  /**
   * Запоминает id уже обработанного входящего сообщения.
   *
   * После добавления поддерживает ограниченный размер окна:
   * как только лимит превышен, самый старый id удаляется и из очереди,
   * и из быстрого `Set`.
   *
   * Важно: новый id всегда добавляется сразу в две структуры:
   * - в `receivedIds`, чтобы последующие дубликаты находились быстро;
   * - в `receivedOrder`, чтобы позже можно было удалить именно самый старый id.
   *
   * Когда размер окна превышен, мы удаляем первый элемент из `receivedOrder`
   * и синхронно убираем этот же id из `receivedIds`. Так обе структуры
   * остаются согласованными и описывают одно и то же дедуп-окно.
   */
  private rememberReceivedId(id: string): void {
    if (this.receivedIds.has(id)) {
      return;
    }

    this.receivedIds.add(id);
    this.receivedOrder.push(id);

    if (this.receivedOrder.length > this.maxReceivedIds) {
      const oldestId = this.receivedOrder.shift();
      if (oldestId) {
        this.receivedIds.delete(oldestId);
      }
    }
  }
}

/** Проверяет, требует ли сообщение подтверждения и retry-логики. */
export function isReliableMessage(
  message: AnyIncomingMessage | AnyOutgoingMessage,
): message is AnyReliableMessage {
  return (
    isReliableBffToClientMessage(message) ||
    isReliableClientToBffMessage(message)
  );
}

/** Проверяет, можно ли использовать сообщение для расчета RTT/ping. */
export function isPingableMessage(
  message: AnyIncomingMessage | AnyOutgoingMessage,
): message is AnyPingableMessage {
  return (
    message instanceof PingableBffToClientMessage ||
    message instanceof PingableClientToBffMessage ||
    message instanceof PingableTargetedBffToClientMessage ||
    message instanceof PingableTargetedClientToBffMessage
  );
}
