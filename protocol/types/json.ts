// https://www.reddit.com/r/typescript/comments/13mssvc/types_for_json_and_writing_json/
/**
 * Примитивные значения, допустимые в JSON.
 *
 * Включает строки, числа, логические значения и null.
 */
export type JsonPrimitive = string | number | boolean | null;
/**
 * Массив значений JSON.
 *
 * Может содержать как примитивы, так и вложенные объекты или массивы.
 */
export type JsonArray = Json[];
/**
 * Составные типы JSON: массивы или объекты.
 */
export type JsonComposite = JsonArray | JsonObject;
/**
 * Любое допустимое значение JSON: примитив, массив или объект.
 */
export type Json = JsonPrimitive | JsonComposite;
/**
 * Объект JSON, состоящий из строковых ключей и значений JSON.
 */
export type JsonObject = { [key: string]: Json };
