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
var import_concurrency = require("../../concurrency/index.js");
var import_vitest = require("vitest");
var import_tenant = require("../tenant.js");
var import_migrate = require("./migrate.js");
const {
  mockRunBatchSend,
  mockResetBatchSend,
  mockInfo,
  mockBeginTransaction,
  mockWarning,
  mockQuery,
  mockLastLocalMigrationName,
  mockLoadMigrationFilesCached,
  mockLocalMigrationFiles,
  mockPgClientConstructor,
  mockProgressiveStart,
  mockConfigState
} = import_vitest.vi.hoisted(() => ({
  mockRunBatchSend: import_vitest.vi.fn(),
  mockResetBatchSend: import_vitest.vi.fn(),
  mockInfo: import_vitest.vi.fn(),
  mockBeginTransaction: import_vitest.vi.fn(),
  mockWarning: import_vitest.vi.fn(),
  mockQuery: import_vitest.vi.fn(),
  mockLastLocalMigrationName: import_vitest.vi.fn(),
  mockLoadMigrationFilesCached: import_vitest.vi.fn(),
  mockLocalMigrationFiles: import_vitest.vi.fn(),
  mockPgClientConstructor: import_vitest.vi.fn(),
  mockProgressiveStart: import_vitest.vi.fn(),
  mockConfigState: {
    migrationStrategy: "ON_REQUEST"
  }
}));
import_vitest.vi.mock("../../../config", () => ({
  MultitenantMigrationStrategy: {
    ON_REQUEST: "ON_REQUEST",
    PROGRESSIVE: "PROGRESSIVE",
    FULL_FLEET: "FULL_FLEET"
  },
  getConfig: () => ({
    isMultitenant: true,
    multitenantDatabaseUrl: "",
    pgQueueEnable: true,
    databaseSSLRootCert: "",
    dbMigrationStrategy: mockConfigState.migrationStrategy,
    dbAnonRole: "anon",
    dbAuthenticatedRole: "authenticated",
    dbSuperUser: "postgres",
    dbServiceRole: "service_role",
    dbInstallRoles: false,
    dbRefreshMigrationHashesOnMismatch: false,
    dbMigrationFreezeAt: void 0,
    icebergShards: [],
    multitenantDatabaseQueryTimeout: 1e3
  })
}));
import_vitest.vi.mock("@storage/events", () => ({
  RunMigrationsOnTenants: class {
    static batchSend = mockRunBatchSend;
    payload;
    constructor(payload) {
      this.payload = payload;
    }
  },
  ResetMigrationsOnTenant: class {
    static batchSend = mockResetBatchSend;
    payload;
    constructor(payload) {
      this.payload = payload;
    }
  }
}));
import_vitest.vi.mock("../../monitoring", () => ({
  logger: {},
  logSchema: {
    info: mockInfo,
    warning: mockWarning,
    error: import_vitest.vi.fn()
  }
}));
import_vitest.vi.mock("pg", () => ({
  Client: class {
    constructor(...args) {
      return mockPgClientConstructor(...args);
    }
  }
}));
import_vitest.vi.mock("../multitenant-pg", () => ({
  multitenantPgExecutor: {
    beginTransaction: mockBeginTransaction,
    query: mockQuery
  }
}));
import_vitest.vi.mock("../tenant", () => ({
  deleteTenantConfig: import_vitest.vi.fn(),
  getTenantConfig: import_vitest.vi.fn(),
  TenantMigrationStatus: {
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    FAILED_STALE: "FAILED_STALE"
  }
}));
import_vitest.vi.mock("../pool", () => ({
  searchPath: ["storage", "public"]
}));
import_vitest.vi.mock("./files", () => ({
  lastLocalMigrationName: mockLastLocalMigrationName,
  loadMigrationFilesCached: mockLoadMigrationFilesCached,
  localMigrationFiles: mockLocalMigrationFiles
}));
import_vitest.vi.mock("./progressive", () => ({
  ProgressiveMigrations: class {
    start(...args) {
      return mockProgressiveStart(...args);
    }
  }
}));
function getQueryText(statement) {
  if (typeof statement === "string") {
    return statement;
  }
  if (statement && typeof statement === "object" && "text" in statement) {
    return String(statement.text);
  }
  return String(statement);
}
function normalizeSql(sql) {
  return sql.replace(/\s+/g, " ").trim();
}
function createMigrationClient(migrations) {
  const client = {
    connect: import_vitest.vi.fn().mockResolvedValue(void 0),
    end: import_vitest.vi.fn().mockResolvedValue(void 0),
    on: import_vitest.vi.fn(),
    query: import_vitest.vi.fn(async (statement) => {
      const text = getQueryText(statement);
      if (text === "SELECT pg_try_advisory_lock(-8525285245963000605);") {
        return { rows: [{ pg_try_advisory_lock: true }] };
      }
      if (text === "SELECT * from migrations") {
        return { rows: migrations };
      }
      return { rows: [], rowCount: 0 };
    })
  };
  mockPgClientConstructor.mockReturnValue(client);
  return client;
}
function createMigrationRunnerClient(indexRows, accessMethod = "heap", generatedRows = []) {
  return {
    connect: import_vitest.vi.fn().mockResolvedValue(void 0),
    end: import_vitest.vi.fn().mockResolvedValue(void 0),
    on: import_vitest.vi.fn(),
    query: import_vitest.vi.fn(async (statement) => {
      const text = normalizeSql(getQueryText(statement));
      if (text.startsWith("-- storage-migrations generate-sql")) {
        return { rows: generatedRows };
      }
      if (text === "SHOW default_table_access_method") {
        return { rows: [{ default_table_access_method: accessMethod }] };
      }
      if (text === "SELECT pg_try_advisory_lock(-8525285245963000605);") {
        return { rows: [{ pg_try_advisory_lock: true }] };
      }
      if (text.includes("c.relkind = 'r'")) {
        return { rows: [{ exists: true }] };
      }
      if (text.startsWith("SELECT * FROM migrations WHERE id <=")) {
        return { rows: [] };
      }
      if (text.includes("pg_catalog.to_regclass")) {
        return { rows: indexRows };
      }
      return { rows: [], rowCount: 1 };
    })
  };
}
function setPendingConcurrentIndexMigration(options = {}) {
  const sql = `-- postgres-migrations disable-transaction
CREATE ${options.unique ? "UNIQUE " : ""}INDEX CONCURRENTLY IF NOT EXISTS idx_objects_test
  ON storage.objects (bucket_id, name);`;
  const contents = options.generated ? `-- storage-migrations generate-sql
SELECT $sql$${sql}$sql$ AS sql;` : sql;
  mockLoadMigrationFilesCached.mockResolvedValue([
    {
      id: 1,
      name: "objects-test-index",
      fileName: "0001-objects-test-index.sql",
      hash: "hash-1",
      contents,
      sql: contents
    }
  ]);
  return sql;
}
function runTestMigrations(client) {
  return (0, import_migrate.migrate)({
    client,
    migrationsDirectory: "./migrations/test",
    migrationsTableSchema: "storage",
    waitForLock: false
  });
}
function migrationQueryTexts(client) {
  return client.query.mock.calls.map(([statement]) => normalizeSql(getQueryText(statement)));
}
function getMigrationQueryCall(client, sql) {
  return client.query.mock.calls.find(([statement]) => {
    return normalizeSql(getQueryText(statement)).startsWith(sql);
  });
}
function createTenantQueryMock(batches) {
  let batchIndex = 0;
  return import_vitest.vi.fn(async () => ({
    rows: batches[batchIndex++] ?? []
  }));
}
function makeTransaction() {
  return {
    query: import_vitest.vi.fn().mockResolvedValue({
      rows: [{ locked: true }]
    }),
    commit: import_vitest.vi.fn(),
    rollback: import_vitest.vi.fn()
  };
}
async function loadStartAsyncMigrations(migrationStrategy) {
  mockConfigState.migrationStrategy = migrationStrategy;
  import_vitest.vi.resetModules();
  return (await import("./migrate.js")).startAsyncMigrations;
}
const queueStrategies = ["ON_REQUEST", "PROGRESSIVE"];
describe("startAsyncMigrations", () => {
  beforeEach(() => {
    mockConfigState.migrationStrategy = "ON_REQUEST";
  });
  it.each(queueStrategies)("starts queue-driven scheduling for %s", async (strategy) => {
    const signal = new import_concurrency.AsyncAbortController().signal;
    const startForStrategy = await loadStartAsyncMigrations(strategy);
    startForStrategy(signal);
    expect(mockProgressiveStart).toHaveBeenCalledWith(signal);
  });
  it("lets asynchronous shutdown wait for an in-flight full-fleet enqueue", async () => {
    const deferredBatch = Promise.withResolvers();
    const transaction = makeTransaction();
    mockBeginTransaction.mockResolvedValue(transaction);
    mockLastLocalMigrationName.mockResolvedValue("storage-schema");
    mockQuery.mockImplementation(createTenantQueryMock([[{ id: "tenant-a", cursor_id: 1 }], []]));
    mockRunBatchSend.mockReturnValueOnce(deferredBatch.promise);
    const startFullFleetMigrations = await loadStartAsyncMigrations("FULL_FLEET");
    const abortController = new import_concurrency.AsyncAbortController();
    startFullFleetMigrations(abortController.signal);
    expect(mockProgressiveStart).toHaveBeenCalledWith(abortController.signal);
    await import_vitest.vi.waitFor(() => expect(mockRunBatchSend).toHaveBeenCalledOnce());
    let abortSettled = false;
    const abortPromise = abortController.abortAsync().then(() => {
      abortSettled = true;
    });
    await Promise.resolve();
    expect(abortSettled).toBe(false);
    deferredBatch.resolve();
    await abortPromise;
    expect(abortSettled).toBe(true);
    expect(transaction.commit).toHaveBeenCalledOnce();
  });
});
describe("migration helper request id propagation", () => {
  beforeEach(() => {
    mockLastLocalMigrationName.mockResolvedValue("storage-schema");
    mockLocalMigrationFiles.mockResolvedValue([]);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
  });
  it("passes sbReqId into fleet migration jobs and scheduler logs", async () => {
    const trx = makeTransaction();
    mockBeginTransaction.mockResolvedValue(trx);
    mockQuery.mockImplementation(
      createTenantQueryMock([
        [
          { id: "tenant-a", cursor_id: 1 },
          { id: "tenant-b", cursor_id: 2 }
        ],
        []
      ])
    );
    await expect(
      (0, import_migrate.runMigrationsOnAllTenants)({ signal: new AbortController().signal, sbReqId: "sb-req-123" })
    ).resolves.toBeUndefined();
    expect(mockRunBatchSend).toHaveBeenCalledTimes(1);
    const [[batch]] = mockRunBatchSend.mock.calls;
    expect(batch[0].payload).toMatchObject({
      tenantId: "tenant-a",
      sbReqId: "sb-req-123",
      tenant: {
        host: "",
        ref: "tenant-a"
      }
    });
    expect(batch[1].payload).toMatchObject({
      tenantId: "tenant-b",
      sbReqId: "sb-req-123",
      tenant: {
        host: "",
        ref: "tenant-b"
      }
    });
    expect(mockInfo).toHaveBeenCalledWith(
      expect.anything(),
      "[Migrations] Instance acquired the lock",
      expect.objectContaining({
        type: "migrations",
        sbReqId: "sb-req-123"
      })
    );
    expect(mockInfo).toHaveBeenCalledWith(
      expect.anything(),
      "[Migrations] Async migrations jobs completed",
      expect.objectContaining({
        type: "migrations",
        sbReqId: "sb-req-123"
      })
    );
  });
  it("passes sbReqId into fleet reset jobs and scheduler logs", async () => {
    const trx = makeTransaction();
    mockBeginTransaction.mockResolvedValue(trx);
    mockQuery.mockImplementation(createTenantQueryMock([[{ id: "tenant-c", cursor_id: 1 }], []]));
    await expect(
      (0, import_migrate.resetMigrationsOnTenants)({
        till: "storage-schema",
        markCompletedTillMigration: "create-migrations-table",
        signal: new AbortController().signal,
        sbReqId: "sb-req-123"
      })
    ).resolves.toBeUndefined();
    expect(mockResetBatchSend).toHaveBeenCalledTimes(1);
    const [[batch]] = mockResetBatchSend.mock.calls;
    expect(batch[0].payload).toMatchObject({
      tenantId: "tenant-c",
      untilMigration: "storage-schema",
      markCompletedTillMigration: "create-migrations-table",
      sbReqId: "sb-req-123",
      tenant: {
        host: "",
        ref: "tenant-c"
      }
    });
    expect(mockInfo).toHaveBeenCalledWith(
      expect.anything(),
      "[Migrations] reset migrations jobs scheduled",
      expect.objectContaining({
        type: "migrations",
        sbReqId: "sb-req-123"
      })
    );
  });
  it("preserves lock callback errors when rollback fails", async () => {
    const error = new Error("migration callback failed");
    const rollbackError = new Error("rollback failed");
    const trx = makeTransaction();
    trx.rollback.mockRejectedValue(rollbackError);
    mockBeginTransaction.mockResolvedValue(trx);
    await expect(
      (0, import_migrate.obtainLockOnMultitenantDB)(
        async () => {
          throw error;
        },
        { sbReqId: "sb-req-123" }
      )
    ).rejects.toBe(error);
    expect(trx.rollback).toHaveBeenCalledTimes(1);
    expect(mockWarning).toHaveBeenCalledWith(
      expect.anything(),
      "[Migrations] Failed to rollback transaction",
      expect.objectContaining({
        type: "migrations",
        sbReqId: "sb-req-123",
        error: rollbackError
      })
    );
  });
});
describe("concurrent index migration recovery", () => {
  it.each([false, true])(
    "repairs an invalid index before creating it (generated=%s)",
    async (generated) => {
      const sql = setPendingConcurrentIndexMigration({ unique: true, generated });
      const client = createMigrationRunnerClient(
        [
          {
            schema_name: "storage",
            index_name: "idx_objects_test",
            indisvalid: false,
            on_table: true
          }
        ],
        "heap",
        [{ sql }]
      );
      await expect(runTestMigrations(client)).resolves.toHaveLength(1);
      const queryTexts = migrationQueryTexts(client);
      const catalogCheck = queryTexts.findIndex((text) => text.includes("pg_catalog.to_regclass"));
      const invalidIndexDrop = queryTexts.indexOf(
        'DROP INDEX CONCURRENTLY IF EXISTS "storage"."idx_objects_test"'
      );
      const createIndex = queryTexts.indexOf(normalizeSql(sql));
      const recordMigration = queryTexts.findIndex(
        (text) => text.startsWith("INSERT INTO migrations")
      );
      const catalogCall = client.query.mock.calls[catalogCheck]?.[0];
      expect(catalogCheck).toBeGreaterThan(-1);
      expect(catalogCall).toMatchObject({
        values: ["storage.objects", "idx_objects_test"]
      });
      expect(invalidIndexDrop).toBeGreaterThan(catalogCheck);
      expect(createIndex).toBeGreaterThan(invalidIndexDrop);
      expect(recordMigration).toBeGreaterThan(createIndex);
      expect(queryTexts).not.toContain("START TRANSACTION");
      expect(getMigrationQueryCall(client, "INSERT INTO migrations")?.[0]).toMatchObject({
        values: [1, "objects-test-index", "hash-1"]
      });
      expect(mockWarning).toHaveBeenCalledWith(
        expect.anything(),
        "[Migrations] Removed invalid indexes before retry",
        expect.objectContaining({
          type: "migrations",
          metadata: JSON.stringify({
            migrationId: 1,
            migrationName: "objects-test-index",
            indexes: [{ schemaName: "storage", indexName: "idx_objects_test" }]
          })
        })
      );
    }
  );
  it.each([false, true])(
    "keeps a valid index when its migration record was lost (generated=%s)",
    async (generated) => {
      const sql = setPendingConcurrentIndexMigration({ generated });
      const client = createMigrationRunnerClient(
        [
          {
            schema_name: "storage",
            index_name: "idx_objects_test",
            indisvalid: true,
            on_table: true
          }
        ],
        "heap",
        [{ sql }]
      );
      await expect(runTestMigrations(client)).resolves.toHaveLength(1);
      const queryTexts = migrationQueryTexts(client);
      expect(queryTexts.some((text) => text.startsWith("DROP INDEX"))).toBe(false);
      expect(queryTexts).toContain(normalizeSql(sql));
      expect(queryTexts.some((text) => text.startsWith("INSERT INTO migrations"))).toBe(true);
    }
  );
  it("fails closed when the name belongs to an index on another table", async () => {
    const sql = setPendingConcurrentIndexMigration();
    const client = createMigrationRunnerClient([
      {
        schema_name: "storage",
        index_name: "idx_objects_test",
        indisvalid: true,
        on_table: false
      }
    ]);
    await expect(runTestMigrations(client)).rejects.toThrow(
      "its name is used by a different relation"
    );
    const queryTexts = migrationQueryTexts(client);
    expect(queryTexts).not.toContain(normalizeSql(sql));
    expect(queryTexts.some((text) => text.startsWith("INSERT INTO migrations"))).toBe(false);
  });
  it.each([false, true])(
    "applies Oriole handling before index repair (generated=%s)",
    async (generated) => {
      const sql = setPendingConcurrentIndexMigration({ generated });
      const client = createMigrationRunnerClient([], "orioledb", [{ sql }]);
      await expect(runTestMigrations(client)).resolves.toHaveLength(1);
      const queryTexts = migrationQueryTexts(client);
      expect(queryTexts.some((text) => text.includes("pg_catalog.to_regclass"))).toBe(false);
      expect(queryTexts).toContain(
        "CREATE INDEX IF NOT EXISTS idx_objects_test ON storage.objects (bucket_id, name);"
      );
      expect(queryTexts).toContain("START TRANSACTION");
      expect(queryTexts).toContain("COMMIT");
    }
  );
  it.each([
    { rows: [] },
    { rows: [{ sql: null }] },
    { rows: [{ sql: 1 }] },
    { rows: [{ sql: "  " }] },
    { rows: [{ sql: "SELECT 1" }, { sql: "SELECT 2" }] }
  ])("does not record a migration with invalid generated SQL: $rows", async ({ rows }) => {
    setPendingConcurrentIndexMigration({ generated: true });
    const client = createMigrationRunnerClient([], "heap", rows);
    await expect(runTestMigrations(client)).rejects.toThrow(
      "Generated migration must return exactly one non-empty sql string"
    );
    expect(
      migrationQueryTexts(client).some((text) => text.startsWith("INSERT INTO migrations"))
    ).toBe(false);
  });
  it("does not record a generated migration when its index creation fails", async () => {
    const sql = setPendingConcurrentIndexMigration({ generated: true });
    const client = createMigrationRunnerClient([], "heap", [{ sql }]);
    const query = client.query.getMockImplementation();
    client.query.mockImplementation((statement) => {
      if (getQueryText(statement) === sql) {
        throw new Error("index build failed");
      }
      return query(statement);
    });
    await expect(runTestMigrations(client)).rejects.toThrow("index build failed");
    expect(
      migrationQueryTexts(client).some((text) => text.startsWith("INSERT INTO migrations"))
    ).toBe(false);
  });
});
describe("resetMigration", () => {
  beforeEach(() => {
    mockLastLocalMigrationName.mockResolvedValue("storage-schema");
    mockLocalMigrationFiles.mockResolvedValue([]);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
  });
  it("uses the advisory lock and marks skipped migrations as completed", async () => {
    const client = createMigrationClient([
      { id: 0, name: "create-migrations-table" },
      { id: 1, name: "initialmigration" },
      { id: 5, name: "add-size-functions" }
    ]);
    mockLocalMigrationFiles.mockResolvedValue([
      { id: 3, name: "pathtoken-column", hash: "hash-3" },
      { id: 4, name: "add-migrations-rls", hash: "hash-4" }
    ]);
    await expect(
      (0, import_migrate.resetMigration)({
        tenantId: "tenant-reset",
        untilMigration: "storage-schema",
        markCompletedTillMigration: "add-migrations-rls",
        databaseUrl: "postgres://tenant"
      })
    ).resolves.toBe(true);
    const queryTexts = client.query.mock.calls.map(
      ([statement]) => normalizeSql(getQueryText(statement))
    );
    expect(queryTexts).toEqual([
      "SELECT pg_try_advisory_lock(-8525285245963000605);",
      "SET search_path TO storage,public",
      "SELECT * from migrations",
      "BEGIN",
      "DELETE FROM migrations WHERE id > $1",
      "INSERT INTO migrations(id, name, hash, executed_at) VALUES ($1, $2, $3, NOW()),($4, $5, $6, NOW())",
      "COMMIT",
      "SELECT pg_advisory_unlock(-8525285245963000605);"
    ]);
    const deleteCall = getMigrationQueryCall(client, "DELETE FROM migrations WHERE id >");
    expect(deleteCall?.[0]).toMatchObject({
      text: "DELETE FROM migrations WHERE id > $1",
      values: [2]
    });
    const insertCall = getMigrationQueryCall(client, "INSERT INTO migrations");
    expect(insertCall?.[0]).toMatchObject({
      values: [3, "pathtoken-column", "hash-3", 4, "add-migrations-rls", "hash-4"]
    });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("UPDATE tenants"),
        values: ["COMPLETED", "add-migrations-rls", "tenant-reset"]
      }),
      expect.objectContaining({
        signal: expect.any(AbortSignal)
      })
    );
    expect(client.end).toHaveBeenCalledTimes(1);
  });
  it("does not open a transaction for no-op resets", async () => {
    const client = createMigrationClient([
      { id: 0, name: "create-migrations-table" },
      { id: 1, name: "initialmigration" },
      { id: 2, name: "storage-schema" }
    ]);
    await expect(
      (0, import_migrate.resetMigration)({
        tenantId: "tenant-reset",
        untilMigration: "storage-schema",
        databaseUrl: "postgres://tenant"
      })
    ).resolves.toBe(false);
    const queryTexts = client.query.mock.calls.map(
      ([statement]) => normalizeSql(getQueryText(statement))
    );
    expect(queryTexts).toEqual([
      "SELECT pg_try_advisory_lock(-8525285245963000605);",
      "SET search_path TO storage,public",
      "SELECT * from migrations",
      "SELECT pg_advisory_unlock(-8525285245963000605);"
    ]);
    expect(mockQuery).not.toHaveBeenCalled();
    expect(client.end).toHaveBeenCalledTimes(1);
  });
  it("replays storage-schema on a tenant past drop-bucketid-objname-index", async () => {
    const client = createMigrationClient([
      { id: 0, name: "create-migrations-table" },
      { id: 72, name: "drop-bucketid-objname-index" }
    ]);
    await expect(
      (0, import_migrate.resetMigration)({
        tenantId: "tenant-reset",
        untilMigration: "initialmigration",
        databaseUrl: "postgres://tenant"
      })
    ).resolves.toBe(true);
    const deleteCall = getMigrationQueryCall(client, "DELETE FROM migrations WHERE id >");
    expect(deleteCall?.[0]).toMatchObject({
      values: [1]
    });
  });
  it("resets to a migration in the middle of the history", async () => {
    const client = createMigrationClient([
      { id: 0, name: "create-migrations-table" },
      { id: 72, name: "drop-bucketid-objname-index" }
    ]);
    await expect(
      (0, import_migrate.resetMigration)({
        tenantId: "tenant-reset",
        untilMigration: "objects-delete-marker-index",
        databaseUrl: "postgres://tenant"
      })
    ).resolves.toBe(true);
    const deleteCall = getMigrationQueryCall(client, "DELETE FROM migrations WHERE id >");
    expect(deleteCall?.[0]).toMatchObject({
      values: [71]
    });
  });
  it("marks the skipped migrations completed when resetting below storage-schema", async () => {
    const client = createMigrationClient([
      { id: 0, name: "create-migrations-table" },
      { id: 72, name: "drop-bucketid-objname-index" }
    ]);
    mockLocalMigrationFiles.mockResolvedValue([
      { id: 1, name: "initialmigration", hash: "hash-1" },
      { id: 2, name: "storage-schema", hash: "hash-2" }
    ]);
    await expect(
      (0, import_migrate.resetMigration)({
        tenantId: "tenant-reset",
        untilMigration: "create-migrations-table",
        markCompletedTillMigration: "storage-schema",
        databaseUrl: "postgres://tenant"
      })
    ).resolves.toBe(true);
    const deleteCall = getMigrationQueryCall(client, "DELETE FROM migrations WHERE id >");
    expect(deleteCall?.[0]).toMatchObject({
      values: [0]
    });
    const insertCall = getMigrationQueryCall(client, "INSERT INTO migrations");
    expect(insertCall?.[0]).toMatchObject({
      values: [1, "initialmigration", "hash-1", 2, "storage-schema", "hash-2"]
    });
  });
  it("replays object-versioning-core on a tenant past unlock-object-versioning", async () => {
    const client = createMigrationClient([
      { id: 0, name: "create-migrations-table" },
      { id: 74, name: "unlock-object-versioning" }
    ]);
    await expect(
      (0, import_migrate.resetMigration)({
        tenantId: "tenant-reset",
        untilMigration: "mark-filename-immutable",
        databaseUrl: "postgres://tenant"
      })
    ).resolves.toBe(true);
    const deleteCall = getMigrationQueryCall(client, "DELETE FROM migrations WHERE id >");
    expect(deleteCall?.[0]).toMatchObject({
      values: [61]
    });
  });
  it("marks object-versioning-core completed without replaying it", async () => {
    const client = createMigrationClient([
      { id: 0, name: "create-migrations-table" },
      { id: 74, name: "unlock-object-versioning" }
    ]);
    mockLocalMigrationFiles.mockResolvedValue([
      { id: 62, name: "object-versioning-core", hash: "hash-62" }
    ]);
    await expect(
      (0, import_migrate.resetMigration)({
        tenantId: "tenant-reset",
        untilMigration: "mark-filename-immutable",
        markCompletedTillMigration: "object-versioning-core",
        databaseUrl: "postgres://tenant"
      })
    ).resolves.toBe(true);
    const deleteCall = getMigrationQueryCall(client, "DELETE FROM migrations WHERE id >");
    expect(deleteCall?.[0]).toMatchObject({
      values: [61]
    });
    const insertCall = getMigrationQueryCall(client, "INSERT INTO migrations");
    expect(insertCall?.[0]).toMatchObject({
      values: [62, "object-versioning-core", "hash-62"]
    });
  });
  it("rolls back, unlocks, and closes the client when mark-completed migration files are missing", async () => {
    const client = createMigrationClient([
      { id: 0, name: "create-migrations-table" },
      { id: 1, name: "initialmigration" },
      { id: 5, name: "add-size-functions" }
    ]);
    mockLocalMigrationFiles.mockResolvedValue([{ id: 3, name: "pathtoken-column", hash: "hash-3" }]);
    await expect(
      (0, import_migrate.resetMigration)({
        tenantId: "tenant-reset",
        untilMigration: "storage-schema",
        markCompletedTillMigration: "add-migrations-rls",
        databaseUrl: "postgres://tenant"
      })
    ).rejects.toThrow("Migration add-migrations-rls not found");
    const queryTexts = client.query.mock.calls.map(
      ([statement]) => normalizeSql(getQueryText(statement))
    );
    expect(queryTexts).toContain("BEGIN");
    expect(queryTexts).toContain("ROLLBACK");
    expect(queryTexts).not.toContain("COMMIT");
    expect(queryTexts.at(-1)).toBe("SELECT pg_advisory_unlock(-8525285245963000605);");
    expect(mockQuery).not.toHaveBeenCalled();
    expect(client.end).toHaveBeenCalledTimes(1);
  });
});
describe("migration state for a tenant recorded by a newer release", () => {
  beforeEach(() => {
    mockLastLocalMigrationName.mockResolvedValue("storage-schema");
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
  });
  it("treats an ahead tenant as up to date regardless of its status", async () => {
    import_vitest.vi.mocked(import_tenant.getTenantConfig).mockResolvedValue({
      migrationVersion: "storage-schema",
      migrationVersionAhead: true,
      migrationStatus: import_tenant.TenantMigrationStatus.FAILED
    });
    await expect((0, import_migrate.areMigrationsUpToDate)("tenant-ahead")).resolves.toBe(true);
  });
  it("still reports a known tenant behind the local latest as outdated", async () => {
    import_vitest.vi.mocked(import_tenant.getTenantConfig).mockResolvedValue({
      migrationVersion: "initialmigration",
      migrationVersionAhead: false,
      migrationStatus: import_tenant.TenantMigrationStatus.COMPLETED
    });
    await expect((0, import_migrate.areMigrationsUpToDate)("tenant-behind")).resolves.toBe(false);
  });
  it("writes completion through the known-version guard", async () => {
    await expect(
      (0, import_migrate.updateTenantMigrationsState)("tenant-ahead", {
        migration: "storage-schema",
        state: import_tenant.TenantMigrationStatus.COMPLETED
      })
    ).resolves.toBe(0);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining("migrations_version = ANY($4::text[])"),
        values: expect.arrayContaining(["tenant-ahead", "storage-schema", "COMPLETED"])
      }),
      expect.anything()
    );
    expect(import_tenant.deleteTenantConfig).toHaveBeenCalledWith("tenant-ahead");
    expect(mockInfo).toHaveBeenCalledWith(
      expect.anything(),
      "[Migrations] Skipped state update for a tenant recorded by a newer release",
      expect.objectContaining({ project: "tenant-ahead" })
    );
  });
  it("keeps the cached config when the guarded write applies", async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
    await (0, import_migrate.updateTenantMigrationsState)("tenant-known", {
      migration: "storage-schema",
      state: import_tenant.TenantMigrationStatus.COMPLETED
    });
    expect(import_tenant.deleteTenantConfig).not.toHaveBeenCalled();
  });
});
//# sourceMappingURL=migrate.test.js.map
