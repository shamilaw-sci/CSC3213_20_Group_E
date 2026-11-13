"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var guards_exports = {};
__export(guards_exports, {
  highestKnownMigrationName: () => highestKnownMigrationName,
  isDBMigrationName: () => isDBMigrationName,
  isUnrecognizedMigration: () => isUnrecognizedMigration,
  knownMigrationVersions: () => knownMigrationVersions
});
module.exports = __toCommonJS(guards_exports);
var import_types = require("./types.js");
function isDBMigrationName(value) {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(import_types.DBMigration, value);
}
function isUnrecognizedMigration(value) {
  return typeof value === "string" && value.length > 0 && !isDBMigrationName(value);
}
const knownMigrationNames = Object.keys(import_types.DBMigration);
const highestKnownMigration = knownMigrationNames.reduce(
  (highest, name) => import_types.DBMigration[name] > import_types.DBMigration[highest] ? name : highest
);
function knownMigrationVersions() {
  return knownMigrationNames;
}
function highestKnownMigrationName() {
  return highestKnownMigration;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  highestKnownMigrationName,
  isDBMigrationName,
  isUnrecognizedMigration,
  knownMigrationVersions
});
//# sourceMappingURL=guards.js.map
