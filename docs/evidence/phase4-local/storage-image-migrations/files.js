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
var files_exports = {};
__export(files_exports, {
  lastLocalMigrationName: () => lastLocalMigrationName,
  loadMigrationFilesCached: () => loadMigrationFilesCached,
  localMigrationFiles: () => localMigrationFiles
});
module.exports = __toCommonJS(files_exports);
var import_errors = require("../../errors/index.js");
var import_postgres_migrations = require("postgres-migrations");
var import_config = require("../../../config.js");
const { dbMigrationFreezeAt } = (0, import_config.getConfig)();
const migrationFilesCache = /* @__PURE__ */ new Map();
function loadMigrationFilesCached(directory) {
  let promise = migrationFilesCache.get(directory);
  if (!promise) {
    promise = (0, import_postgres_migrations.loadMigrationFiles)(directory).catch((error) => {
      migrationFilesCache.delete(directory);
      throw error;
    });
    migrationFilesCache.set(directory, promise);
  }
  return promise;
}
const localMigrationFiles = () => loadMigrationFilesCached("./migrations/tenant");
async function lastLocalMigrationName() {
  const migrations = await localMigrationFiles();
  const latestMigration = migrations.at(-1);
  if (!latestMigration) {
    throw import_errors.ERRORS.InternalError(void 0, "No local migrations found");
  }
  if (!dbMigrationFreezeAt) {
    return latestMigration.name;
  }
  const frozenMigration = migrations.find((m) => m.name === dbMigrationFreezeAt);
  if (!frozenMigration) {
    throw import_errors.ERRORS.InternalError(void 0, `Migration ${dbMigrationFreezeAt} not found`);
  }
  return frozenMigration.name;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  lastLocalMigrationName,
  loadMigrationFilesCached,
  localMigrationFiles
});
//# sourceMappingURL=files.js.map
