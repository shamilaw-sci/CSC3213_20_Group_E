"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_vitest = require("vitest");
function createMigration(id, name = `migration-${id}`) {
  return {
    id,
    name,
    hash: `hash-${id}`,
    sql: `-- ${name}`,
    contents: `-- ${name}`
  };
}
async function loadFilesModule(loadMigrationFiles = import_vitest.vi.fn()) {
  import_vitest.vi.resetModules();
  import_vitest.vi.doMock("postgres-migrations", () => ({
    loadMigrationFiles
  }));
  import_vitest.vi.doMock("../../../config", () => ({
    getConfig: () => ({
      dbMigrationFreezeAt: void 0
    })
  }));
  const files = await import("./files.js");
  return {
    files,
    loadMigrationFiles
  };
}
describe("loadMigrationFilesCached", () => {
  afterEach(() => {
    import_vitest.vi.doUnmock("postgres-migrations");
    import_vitest.vi.doUnmock("../../../config");
    import_vitest.vi.resetModules();
  });
  it("reuses the cached result for repeated calls to the same directory", async () => {
    const migrations = [createMigration(1)];
    const { files, loadMigrationFiles } = await loadFilesModule(
      import_vitest.vi.fn().mockResolvedValue(migrations)
    );
    await expect(files.loadMigrationFilesCached("./migrations/tenant")).resolves.toEqual(migrations);
    await expect(files.loadMigrationFilesCached("./migrations/tenant")).resolves.toEqual(migrations);
    expect(loadMigrationFiles).toHaveBeenCalledTimes(1);
    expect(loadMigrationFiles).toHaveBeenCalledWith("./migrations/tenant");
  });
  it("shares the same in-flight promise for concurrent callers", async () => {
    const migrations = [createMigration(1)];
    let resolve;
    const pending = new Promise((innerResolve) => {
      resolve = innerResolve;
    });
    const { files, loadMigrationFiles } = await loadFilesModule(import_vitest.vi.fn().mockReturnValue(pending));
    const firstLoad = files.loadMigrationFilesCached("./migrations/tenant");
    const secondLoad = files.loadMigrationFilesCached("./migrations/tenant");
    expect(loadMigrationFiles).toHaveBeenCalledTimes(1);
    resolve(migrations);
    await expect(Promise.all([firstLoad, secondLoad])).resolves.toEqual([migrations, migrations]);
  });
  it("keeps separate cache entries per directory", async () => {
    const { files, loadMigrationFiles } = await loadFilesModule(
      import_vitest.vi.fn().mockResolvedValueOnce([createMigration(1, "tenant-migration")]).mockResolvedValueOnce([createMigration(1, "multitenant-migration")])
    );
    await files.loadMigrationFilesCached("./migrations/tenant");
    await files.loadMigrationFilesCached("./migrations/multitenant");
    await files.loadMigrationFilesCached("./migrations/tenant");
    expect(loadMigrationFiles).toHaveBeenCalledTimes(2);
    expect(loadMigrationFiles.mock.calls).toEqual([
      ["./migrations/tenant"],
      ["./migrations/multitenant"]
    ]);
  });
});
//# sourceMappingURL=files.test.js.map
