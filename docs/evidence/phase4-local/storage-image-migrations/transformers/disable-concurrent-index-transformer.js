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
var disable_concurrent_index_transformer_exports = {};
__export(disable_concurrent_index_transformer_exports, {
  DisableConcurrentIndexTransformer: () => DisableConcurrentIndexTransformer
});
module.exports = __toCommonJS(disable_concurrent_index_transformer_exports);
const CONCURRENT_INDEX_FIND = "INDEX CONCURRENTLY";
const CONCURRENT_INDEX_REPLACE = "INDEX";
const DISABLE_TRANSACTION_STRING = "-- postgres-migrations disable-transaction";
class DisableConcurrentIndexTransformer {
  transform(migration) {
    if (!migration.sql.includes(CONCURRENT_INDEX_FIND)) {
      return migration;
    }
    return {
      ...migration,
      // strip concurrently, and remove disable-transaction in sql and contents
      sql: migration.sql.replaceAll(CONCURRENT_INDEX_FIND, CONCURRENT_INDEX_REPLACE).replace(DISABLE_TRANSACTION_STRING, ""),
      contents: migration.contents.replaceAll(CONCURRENT_INDEX_FIND, CONCURRENT_INDEX_REPLACE).replace(DISABLE_TRANSACTION_STRING, "")
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DisableConcurrentIndexTransformer
});
//# sourceMappingURL=disable-concurrent-index-transformer.js.map
