export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = Json[];
export type JsonComposite = JsonArray | JsonObject;
export type Json = JsonPrimitive | JsonComposite;
export type JsonObject = {
    [key: string]: Json;
};
