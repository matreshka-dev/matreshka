export type MessageClass<T> = {
    new (...args: any[]): T;
    type: string;
};
export declare class MessageRegistry<T> {
    private readonly registry;
    register(messageClass: MessageClass<T>): void;
    findByType(type: string): MessageClass<T> | undefined;
}
