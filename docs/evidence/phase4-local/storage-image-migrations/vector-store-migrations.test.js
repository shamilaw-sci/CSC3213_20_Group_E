"use strict";
var import_vitest = require("vitest");
var import_migrate = require("./migrate.js");
const {
  mockClientConfigs,
  mockPgClients,
  mockLoadMigrationFilesCached,
  mockRunMigrationStep,
  mockValidateMigrationHashes
} = import_vitest.vi.hoisted(() => ({
  mockClientConfigs: [],
  mockPgClients: [],
  mockLoadMigrationFilesCached: import_vitest.vi.fn(),
  mockRunMigrationStep: import_vitest.vi.fn(),
  mockValidateMigrationHashes: import_vitest.vi.fn()
}));
import_vitest.vi.mock("../../../config", () => ({
  MultitenantMigrationStrategy: {
    ON_REQUEST: "ON_REQUEST",
    PROGRESSIVE: "PROGRESSIVE",
    FULL_FLEET: "FULL_FLEET"
  },
  getConfig: () => ({
    isMultitenant: false,
    multitenantDatabaseUrl: "",
    pgQueueEnable: false,
    databaseSSLRootCert: "",
    dbMigrationStrategy: "ON_REQUEST",
    dbAnonRole: "anon",
    dbAuthenticatedRole: "authenticated",
    dbSuperUser: "postgres",
    dbServiceRole: "service_role",
    dbInstallRoles: false,
    dbRefreshMigrationHashesOnMismatch: false,
    dbMigrationFreezeAt: void 0,
    icebergShards: [],
    multitenantDatabaseQueryTimeout: 1e3,
    vectorBucketProvider: "pgvector",
    vectorDatabaseCreate: false,
    vectorDatabaseURL: "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
    vectorStoreMigrationsEnabled: true
  })
}));
import_vitest.vi.mock("pg", () => ({
  Client: import_vitest.vi.fn(function MockClient(config) {
    const client = mockPgClients.shift();
    if (!client) {
      throw new Error(`Unexpected pg Client for ${String(config.connectionString)}`);
    }
    mockClientConfigs.push(config);
    return client;
  })
}));
import_vitest.vi.mock("postgres-migrations/dist/run-migration", () => ({
  runMigration: import_vitest.vi.fn(() => async (migration) => {
    mockRunMigrationStep(migration);
    return migration;
  })
}));
import_vitest.vi.mock("postgres-migrations/dist/validation", () => ({
  validateMigrationHashes: mockValidateMigrationHashes
}));
import_vitest.vi.mock("@storage/events", () => ({
  RunMigrationsOnTenants: class {
    static batchSend = import_vitest.vi.fn();
  },
  ResetMigrationsOnTenant: class {
    static batchSend = import_vitest.vi.fn();
  }
}));
import_vitest.vi.mock("../../monitoring", () => ({
  logger: {},
  logSchema: {
    info: import_vitest.vi.fn(),
    warning: import_vitest.vi.fn(),
    error: import_vitest.vi.fn()
  }
}));
import_vitest.vi.mock("../multitenant-pg", () => ({
  multitenantPgExecutor: {
    query: import_vitest.vi.fn(),
    beginTransaction: import_vitest.vi.fn()
  }
}));
import_vitest.vi.mock("../tenant", () => ({
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
  lastLocalMigrationName: import_vitest.vi.fn(),
  loadMigrationFilesCached: mockLoadMigrationFilesCached,
  localMigrationFiles: import_vitest.vi.fn()
}));
import_vitest.vi.mock("./progressive", () => ({
  ProgressiveMigrations: class {
    start() {
      return void 0;
    }
  }
}));
function queryText(query) {
  if (query && typeof query === "object") {
    if ("text" in query && typeof query.text === "string") {
      return query.text;
    }
    if ("sql" in query && typeof query.sql === "string") {
      return query.sql;
    }
  }
  return String(query);
}
function createMockPgClient(options) {
  const queries = [];
  return {
    connect: import_vitest.vi.fn().mockResolvedValue(void 0),
    end: import_vitest.vi.fn().mockResolvedValue(void 0),
    on: import_vitest.vi.fn(),
    queries,
    query: import_vitest.vi.fn(async (query) => {
      const text = queryText(query);
      queries.push(text);
      if (text === "SHOW default_table_access_method") {
        return { rows: [{ default_table_access_method: options.defaultAccessMethod ?? "heap" }] };
      }
      if (text.includes("SELECT 1 FROM pg_database")) {
        return { rows: options.databaseExists ? [{ exists: 1 }] : [] };
      }
      if (text.includes("pg_try_advisory_lock")) {
        return { rows: [{ pg_try_advisory_lock: true }] };
      }
      if (text.includes("pg_catalog.pg_class")) {
        return { rows: [{ exists: options.migrationTableExists ?? false }] };
      }
      if (text.includes("information_schema.schemata")) {
        return { rows: [{ exists: options.schemaExists ?? false }] };
      }
      return { rows: [] };
    })
  };
}
(0, import_vitest.describe)("runVectorStoreMigrations", () => {
  (0, import_vitest.beforeEach)(() => {
    mockClientConfigs.length = 0;
    mockPgClients.length = 0;
    mockLoadMigrationFilesCached.mockResolvedValue([
      {
        id: 1,
        name: "create-vector-store",
        hash: "hash",
        sql: "CREATE TABLE vector_store_test(id int);",
        contents: "CREATE TABLE vector_store_test(id int);"
      }
    ]);
  });
  (0, import_vitest.it)("configures a dedicated vector database for Oriole before running vector migrations", async () => {
    const maintenanceClient = createMockPgClient({
      defaultAccessMethod: "orioledb",
      databaseExists: false
    });
    const vectorSetupClient = createMockPgClient({});
    const migrationClient = createMockPgClient({});
    mockPgClients.push(maintenanceClient, vectorSetupClient, migrationClient);
    await (0, import_migrate.runVectorStoreMigrations)({
      databaseUrl: "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
      createDatabase: true,
      waitForLock: false
    });
    (0, import_vitest.expect)(mockClientConfigs.map((config) => config.connectionString)).toEqual([
      "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
      "postgresql://postgres:postgres@127.0.0.1:5432/storage_vectors",
      "postgresql://postgres:postgres@127.0.0.1:5432/storage_vectors"
    ]);
    (0, import_vitest.expect)(maintenanceClient.queries).toContain('CREATE DATABASE "storage_vectors"');
    (0, import_vitest.expect)(vectorSetupClient.queries).toContain("CREATE EXTENSION IF NOT EXISTS orioledb");
    (0, import_vitest.expect)(vectorSetupClient.queries).toContain(
      `ALTER DATABASE "storage_vectors" SET default_table_access_method = 'orioledb'`
    );
    (0, import_vitest.expect)(migrationClient.queries[0]).toBe("SET statement_timeout TO '12h'");
  });
  (0, import_vitest.it)("runs single-tenant vector migrations in the configured database when database creation is disabled", async () => {
    const tenantMigrationClient = createMockPgClient({});
    const vectorMigrationClient = createMockPgClient({});
    mockPgClients.push(tenantMigrationClient, vectorMigrationClient);
    await (0, import_migrate.runMigrationsOnTenant)({
      databaseUrl: "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
      waitForLock: false
    });
    (0, import_vitest.expect)(mockClientConfigs.map((config) => config.connectionString)).toEqual([
      "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
      "postgresql://postgres:postgres@127.0.0.1:5432/postgres"
    ]);
    (0, import_vitest.expect)(tenantMigrationClient.queries).not.toContain('CREATE DATABASE "storage_vectors"');
    (0, import_vitest.expect)(vectorMigrationClient.queries[0]).toBe("SET statement_timeout TO '12h'");
  });
});
//# sourceMappingURL=vector-store-migrations.test.js.map
