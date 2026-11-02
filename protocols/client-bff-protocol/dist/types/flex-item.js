"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDimensionalValue = isDimensionalValue;
exports.isFlexItemSpec = isFlexItemSpec;
exports.normalizeFlexItem = normalizeFlexItem;
const dimensional_unit_1 = require("../enums/dimensional-unit");
function isDimensionalValue(value) {
    return (typeof value === "object" &&
        value !== null &&
        "value" in value &&
        "unit" in value &&
        typeof value.value === "number" &&
        typeof value.unit === "string");
}
function isFlexItemSpec(value) {
    return (typeof value === "object" && value !== null && !isDimensionalValue(value));
}
function normalizeFlexItem(flexItem) {
    if (flexItem === undefined) {
        return undefined;
    }
    if (flexItem.basis === undefined) {
        return flexItem;
    }
    return {
        ...flexItem,
        basis: typeof flexItem.basis === "number"
            ? normalizeSizeNumber(flexItem.basis)
            : flexItem.basis,
    };
}
function normalizeSizeNumber(value) {
    if (value > 1) {
        return { value, unit: dimensional_unit_1.DimensionalUnit.Px };
    }
    return value;
}
