export type MessageClass<T> = {
  new (...args: any[]): T;
  type: string;
};

export class MessageRegistry<T> {
  private readonly registry = new Map<string, MessageClass<T>>();

  register(messageClass: MessageClass<T>) {
    if (this.registry.has(messageClass.type)) {
      throw new Error(`Message type ${messageClass.type} already registered`);
    }
    this.registry.set(messageClass.type, messageClass);
  }

  findByType(type: string) {
    return this.registry.get(type);
  }
}
