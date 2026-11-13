"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var migrate_exports = {};
__export(migrate_exports, {
  VECTOR_DATABASE_NAME: () => import_vector_store_url2.VECTOR_DATABASE_NAME,
  areMigrationsUpToDate: () => areMigrationsUpToDate,
  deriveVectorDatabaseUrl: () => import_vector_store_url2.deriveVectorDatabaseUrl,
  listTenantsToMigrate: () => listTenantsToMigrate,
  listTenantsToResetMigrations: () => listTenantsToResetMigrations,
  migrate: () => migrate,
  obtainLockOnMultitenantDB: () => obtainLockOnMultitenantDB,
  progressiveMigrations: () => progressiveMigrations,
  resetMigration: () => resetMigration,
  resetMigrationsOnTenants: () => resetMigrationsOnTenants,
  runMigrationsOnAllTenants: () => runMigrationsOnAllTenants,
  runMigrationsOnTenant: () => runMigrationsOnTenant,
  runMultitenantMigrations: () => runMultitenantMigrations,
  runVectorStoreMigrations: () => runVectorStoreMigrations,
  startAsyncMigrations: () => startAsyncMigrations,
  tenantHasMigrations: () => tenantHasMigrations,
  updateTenantMigrationsState: () => updateTenantMigrationsState
});
module.exports = __toCommonJS(migrate_exports);
var import_errors = require("../../errors/index.js");
var import_events = require("../../../storage/events/index.js");
var import_pg = require("pg");
var import_postgres_migrations = require("postgres-migrations");
var import_run_migration = require("postgres-migrations/dist/run-migration");
var import_validation = require("postgres-migrations/dist/validation");
var import_sql_template_strings = __toESM(require("sql-template-strings"));
var import_config = require("../../../config.js");
var import_monitoring = require("../../monitoring/index.js");
var import_multitenant_pg = require("../multitenant-pg.js");
var import_pool = require("../pool.js");
var import_ssl = require("../postgres/ssl.js");
var import_tenant = require("../tenant.js");
var import_tenant_store_pg = require("../tenant-store-pg.js");
var import_vector_store_url = require("../vector-store-url.js");
var import_concurrent_index_guard = require("./concurrent-index-guard.js");
var import_files = require("./files.js");
var import_progressive = require("./progressive.js");
var import_transformers = require("./transformers/index.js");
var import_types2 = require("./types.js");
var import_vector_store_url2 = require("../vector-store-url.js");
const {
  isMultitenant,
  multitenantDatabaseUrl,
  pgQueueEnable,
  databaseSSLRootCert,
  dbMigrationStrategy,
  dbAnonRole,
  dbAuthenticatedRole,
  dbSuperUser,
  dbServiceRole,
  dbInstallRoles,
  dbRefreshMigrationHashesOnMismatch,
  dbMigrationFreezeAt,
  icebergShards,
  vectorBucketProvider,
  vectorDatabaseCreate,
  vectorStoreMigrationsEnabled,
  vectorDatabaseURL
} = (0, import_config.getConfig)();
const tenantConfigStorePg = new import_tenant_store_pg.TenantConfigStorePg(import_multitenant_pg.multitenantPgExecutor);
const backportMigrations = [
  {
    index: 2,
    from: "pathtoken-column",
    to: "storage-schema"
  }
];
const progressiveMigrations = new import_progressive.ProgressiveMigrations({
  maxSize: 200,
  interval: 1e3 * 5
  // 5s
});
function startAsyncMigrations(signal) {
  if (signal.aborted) {
    throw import_errors.ERRORS.Aborted("Migration aborted");
  }
  switch (dbMigrationStrategy) {
    case import_config.MultitenantMigrationStrategy.ON_REQUEST:
    case import_config.MultitenantMigrationStrategy.PROGRESSIVE:
      progressiveMigrations.start(signal);
      break;
    case import_config.MultitenantMigrationStrategy.FULL_FLEET: {
      progressiveMigrations.start(signal);
      const fullFleetMigrationRun = runMigrationsOnAllTenants({ signal }).catch((e) => {
        import_monitoring.logger.error(
          {
            type: "migrations",
            error: e
          },
          "migration error"
        );
      });
      signal.addEventListener("abort", () => fullFleetMigrationRun, { once: true });
      break;
    }
    default:
      throw new Error(`Unknown migration strategy: ${dbMigrationStrategy}`);
  }
}
async function tenantHasMigrations(tenantId, migration) {
  const migrationVersion = isMultitenant ? (await (0, import_tenant.getTenantConfig)(tenantId)).migrationVersion : await (0, import_files.lastLocalMigrationName)();
  if (migrationVersion) {
    return import_types2.DBMigration[migrationVersion] >= import_types2.DBMigration[migration];
  }
  return false;
}
async function* listTenantsToMigrate(signal) {
  let lastCursor = 0;
  while (!signal.aborted) {
    const migrationVersion = await (0, import_files.lastLocalMigrationName)();
    const data = await tenantConfigStorePg.listTenantsToMigrateBatch(
      migrationVersion,
      lastCursor,
      [import_tenant.TenantMigrationStatus.FAILED, import_tenant.TenantMigrationStatus.FAILED_STALE],
      200,
      signal
    );
    if (data.length === 0) {
      break;
    }
    lastCursor = data[data.length - 1].cursor_id;
    yield data.map((tenant) => tenant.id);
  }
}
async function* listTenantsToResetMigrations(migration, signal) {
  let lastCursor = 0;
  while (!signal.aborted) {
    const afterMigrations = Object.keys(import_types2.DBMigration).filter((migrationName) => {
      return import_types2.DBMigration[migrationName] > import_types2.DBMigration[migration];
    });
    const data = await tenantConfigStorePg.listTenantsToResetMigrationsBatch(
      afterMigrations,
      lastCursor,
      200,
      signal
    );
    if (data.length === 0) {
      break;
    }
    lastCursor = data[data.length - 1].cursor_id;
    yield data.map((tenant) => tenant.id);
  }
}
async function updateTenantMigrationsState(tenantId, options) {
  const migrationVersion = options?.migration || await (0, import_files.lastLocalMigrationName)();
  const state = options?.state || import_tenant.TenantMigrationStatus.COMPLETED;
  const migrationState = {
    migrations_version: [import_tenant.TenantMigrationStatus.FAILED, import_tenant.TenantMigrationStatus.FAILED_STALE].includes(
      state
    ) ? void 0 : migrationVersion,
    migrations_status: state
  };
  const updated = await tenantConfigStorePg.updateMigrationsState(
    tenantId,
    migrationState,
    options?.tnx ?? import_multitenant_pg.multitenantPgExecutor
  );
  if (updated === 0) {
    (0, import_tenant.deleteTenantConfig)(tenantId);
    import_monitoring.logSchema.info(
      import_monitoring.logger,
      "[Migrations] Skipped state update for a tenant recorded by a newer release",
      {
        type: "migrations",
        project: tenantId,
        metadata: JSON.stringify(migrationState)
      }
    );
  }
  return updated;
}
async function areMigrationsUpToDate(tenantId) {
  const latestMigrationVersion = await (0, import_files.lastLocalMigrationName)();
  const tenant = await (0, import_tenant.getTenantConfig)(tenantId);
  if (tenant.migrationVersionAhead) {
    return true;
  }
  return tenant.migrationVersion && import_types2.DBMigration[latestMigrationVersion] <= import_types2.DBMigration[tenant.migrationVersion] && tenant.migrationStatus === import_tenant.TenantMigrationStatus.COMPLETED;
}
async function obtainLockOnMultitenantDB(fn, options) {
  const trx = await import_multitenant_pg.multitenantPgExecutor.beginTransaction();
  try {
    const result = await trx.query({
      text: `SELECT pg_try_advisory_xact_lock($1) AS locked;`,
      values: [-8575985245963001e3]
    });
    const lockAcquired = result.rows.shift()?.locked || false;
    if (!lockAcquired) {
      try {
        await trx.rollback();
      } catch (rollbackError) {
        import_monitoring.logSchema.warning(import_monitoring.logger, "[Migrations] Failed to rollback transaction", {
          type: "migrations",
          sbReqId: options?.sbReqId,
          error: rollbackError,
          metadata: JSON.stringify({
            reason: "lock not acquired"
          })
        });
      }
      return;
    }
    import_monitoring.logSchema.info(import_monitoring.logger, "[Migrations] Instance acquired the lock", {
      type: "migrations",
      sbReqId: options?.sbReqId
    });
    const fnResult = await fn(trx);
    await trx.commit();
    return fnResult;
  } catch (e) {
    try {
      await trx.rollback();
    } catch (rollbackError) {
      import_monitoring.logSchema.warning(import_monitoring.logger, "[Migrations] Failed to rollback transaction", {
        type: "migrations",
        sbReqId: options?.sbReqId,
        error: rollbackError,
        metadata: JSON.stringify({ originalError: String(e) })
      });
    }
    throw e;
  }
}
async function resetMigrationsOnTenants(options) {
  await obtainLockOnMultitenantDB(
    async () => {
      import_monitoring.logSchema.info(import_monitoring.logger, "[Migrations] Listing all tenants", {
        type: "migrations",
        sbReqId: options.sbReqId
      });
      const tenants = listTenantsToResetMigrations(options.till, options.signal);
      for await (const tenantBatch of tenants) {
        await import_events.ResetMigrationsOnTenant.batchSend(
          tenantBatch.map((tenant) => {
            return new import_events.ResetMigrationsOnTenant({
              tenantId: tenant,
              untilMigration: options.till,
              markCompletedTillMigration: options.markCompletedTillMigration,
              sbReqId: options.sbReqId,
              tenant: {
                host: "",
                ref: tenant
              }
            });
          })
        );
      }
      import_monitoring.logSchema.info(import_monitoring.logger, "[Migrations] reset migrations jobs scheduled", {
        type: "migrations",
        sbReqId: options.sbReqId
      });
    },
    { sbReqId: options.sbReqId }
  );
}
async function runMigrationsOnAllTenants(options) {
  if (!pgQueueEnable) {
    return;
  }
  await obtainLockOnMultitenantDB(
    async () => {
      import_monitoring.logSchema.info(import_monitoring.logger, "[Migrations] Listing all tenants", {
        type: "migrations",
        sbReqId: options.sbReqId
      });
      const tenants = listTenantsToMigrate(options.signal);
      for await (const tenantBatch of tenants) {
        await import_events.RunMigrationsOnTenants.batchSend(
          tenantBatch.map((tenant) => {
            return new import_events.RunMigrationsOnTenants({
              tenantId: tenant,
              sbReqId: options.sbReqId,
              tenant: {
                host: "",
                ref: tenant
              }
            });
          })
        );
      }
      import_monitoring.logSchema.info(import_monitoring.logger, "[Migrations] Async migrations jobs completed", {
        type: "migrations",
        sbReqId: options.sbReqId
      });
    },
    { sbReqId: options.sbReqId }
  );
}
async function runMultitenantMigrations() {
  import_monitoring.logSchema.info(import_monitoring.logger, "[Migrations] Running multitenant migrations", {
    type: "migrations"
  });
  await connectAndMigrate({
    databaseUrl: multitenantDatabaseUrl,
    migrationsDirectory: "./migrations/multitenant",
    migrationsTableSchema: "public",
    shouldCreateStorageSchema: false,
    waitForLock: true
  });
  import_monitoring.logSchema.info(import_monitoring.logger, "[Migrations] Completed", {
    type: "migrations"
  });
}
async function runMigrationsOnTenant({
  databaseUrl,
  tenantId,
  waitForLock,
  upToMigration
}) {
  if (typeof waitForLock === "undefined") {
    waitForLock = true;
  }
  await connectAndMigrate({
    databaseUrl,
    migrationsDirectory: "./migrations/tenant",
    migrationsTableSchema: "storage",
    ssl: (0, import_ssl.getSslSettings)({ connectionString: databaseUrl, databaseSSLRootCert }),
    shouldCreateStorageSchema: true,
    tenantId,
    waitForLock,
    upToMigration
  });
  if (vectorBucketProvider === "pgvector" && vectorStoreMigrationsEnabled) {
    if (isMultitenant) {
      await runVectorStoreMigrations({ databaseUrl, waitForLock });
    } else if (vectorDatabaseURL) {
      await runVectorStoreMigrations({
        databaseUrl: vectorDatabaseURL,
        createDatabase: vectorDatabaseCreate,
        waitForLock
      });
    }
  }
}
async function ensureVectorDatabaseExists(maintenanceUrl, ssl) {
  let defaultAccessMethod = "";
  const client = await connect({
    connectionString: maintenanceUrl,
    ssl
  });
  try {
    defaultAccessMethod = await getDefaultAccessMethod(client);
    const exists = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [
      import_vector_store_url.VECTOR_DATABASE_NAME
    ]);
    if (exists.rows.length === 0) {
      await client.query(`CREATE DATABASE "${import_vector_store_url.VECTOR_DATABASE_NAME}"`);
      import_monitoring.logSchema.info(import_monitoring.logger, `[Migrations] Created database ${import_vector_store_url.VECTOR_DATABASE_NAME}`, {
        type: "migrations"
      });
    }
  } finally {
    await client.end();
  }
  await configureVectorDatabaseAccessMethod({
    databaseUrl: (0, import_vector_store_url.deriveVectorDatabaseUrl)(maintenanceUrl),
    defaultAccessMethod,
    ssl
  });
}
async function configureVectorDatabaseAccessMethod({
  databaseUrl,
  defaultAccessMethod,
  ssl
}) {
  if (defaultAccessMethod !== "orioledb") {
    return;
  }
  const client = await connect({
    connectionString: databaseUrl,
    ssl
  });
  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS orioledb");
    await client.query(
      `ALTER DATABASE "${import_vector_store_url.VECTOR_DATABASE_NAME}" SET default_table_access_method = 'orioledb'`
    );
    import_monitoring.logSchema.info(import_monitoring.logger, `[Migrations] Configured database ${import_vector_store_url.VECTOR_DATABASE_NAME} for Oriole`, {
      type: "migrations"
    });
  } finally {
    await client.end();
  }
}
async function runVectorStoreMigrations({
  databaseUrl,
  createDatabase = false,
  waitForLock = true
}) {
  import_monitoring.logSchema.info(import_monitoring.logger, "[Migrations] Running vector_store migrations", {
    type: "migrations"
  });
  const ssl = (0, import_ssl.getSslSettings)({ connectionString: databaseUrl, databaseSSLRootCert });
  let migrationsTarget = databaseUrl;
  if (createDatabase) {
    await ensureVectorDatabaseExists(databaseUrl, ssl);
    migrationsTarget = (0, import_vector_store_url.deriveVectorDatabaseUrl)(databaseUrl);
  }
  await connectAndMigrate({
    databaseUrl: migrationsTarget,
    migrationsDirectory: "./migrations/vector_store",
    // Schema-scoped tracking: storage_vectors.migrations lives in its own
    // schema, so it can't collide with the storage.migrations table used by
    // the standard tenant migrations even though both share the default
    // table name. postgres-migrations bundles a `0_create-migrations-table`
    // bootstrap that hardcodes the literal name `migrations`, so we cannot
    // rename it without forking the library.
    migrationsTableSchema: "storage_vectors",
    ssl,
    // Bootstrap the storage_vectors schema before postgres-migrations tries to
    // create its tracking table inside it.
    shouldCreateStorageSchema: true,
    waitForLock
  });
}
async function resetMigration(options) {
  const dbConfig = {
    connectionString: options.databaseUrl,
    connectionTimeoutMillis: 6e4,
    options: `-c search_path=${import_pool.searchPath}`
  };
  dbConfig.ssl = (0, import_ssl.getSslSettings)({ connectionString: options.databaseUrl, databaseSSLRootCert });
  const client = await connect(dbConfig);
  try {
    const queryWithAdvisory = withAdvisoryLock(false, async (pgClient) => {
      await pgClient.query(`SET search_path TO ${import_pool.searchPath.join(",")}`);
      const migrationsRowsResult = await pgClient.query(`SELECT * from migrations`);
      const currentTenantMigrations = migrationsRowsResult.rows;
      if (!currentTenantMigrations.length) {
        return false;
      }
      const currentLastMigration = currentTenantMigrations[currentTenantMigrations.length - 1];
      const localMigration = import_types2.DBMigration[options.untilMigration];
      const markCompletedMigration = options.markCompletedTillMigration ? import_types2.DBMigration[options.markCompletedTillMigration] : void 0;
      if (currentLastMigration.id === localMigration && (markCompletedMigration === void 0 || currentLastMigration.id >= markCompletedMigration)) {
        return false;
      }
      if (currentLastMigration.id < localMigration) {
        return false;
      }
      await pgClient.query(`BEGIN`);
      try {
        await pgClient.query(import_sql_template_strings.default`DELETE FROM migrations WHERE id > ${localMigration}`);
        let latestRunMigration = options.untilMigration;
        if (options.markCompletedTillMigration) {
          const markCompletedTillMigration = import_types2.DBMigration[options.markCompletedTillMigration];
          const aheadMigrations = Object.keys(import_types2.DBMigration).filter((migrationName) => {
            return import_types2.DBMigration[migrationName] > import_types2.DBMigration[options.untilMigration] && import_types2.DBMigration[migrationName] <= markCompletedTillMigration;
          });
          if (aheadMigrations.length) {
            const localFileMigrations = await (0, import_files.localMigrationFiles)();
            const query = import_sql_template_strings.default`INSERT INTO `.append("migrations").append("(id, name, hash, executed_at) VALUES ");
            aheadMigrations.forEach((migrationName, index) => {
              const migration = localFileMigrations.find(
                (m) => m.id === import_types2.DBMigration[migrationName]
              );
              if (!migration) {
                throw Error(`Migration ${migrationName} not found`);
              }
              query.append(import_sql_template_strings.default`(${migration.id}, ${migration.name}, ${migration.hash}, NOW())`);
              if (index !== aheadMigrations.length - 1) {
                query.append(",");
              }
            });
            await pgClient.query(query);
            latestRunMigration = options.markCompletedTillMigration;
          }
        }
        if (options.tenantId) {
          await tenantConfigStorePg.update(options.tenantId, {
            migrations_version: latestRunMigration,
            migrations_status: import_tenant.TenantMigrationStatus.COMPLETED
          });
        }
        await pgClient.query(`COMMIT`);
        return true;
      } catch (e) {
        await pgClient.query(`ROLLBACK`);
        throw e;
      }
    });
    return await queryWithAdvisory(client);
  } finally {
    await client.end();
  }
}
async function connect(options) {
  const { ssl, tenantId, connectionString } = options;
  const dbConfig = {
    connectionString,
    connectionTimeoutMillis: 6e4,
    // Migrations run trusted dynamic PL/pgSQL that a multigres gateway
    // rejects by default; only this connection opts into multigres
    // per-connection bypass, instead of the whole gateway being unsafe.
    // No-op against a plain postgres backend (accepted as a placeholder GUC).
    // direct_connection is also accepted, but multigres.unsafe_connection is
    // more explicit and less likely to be confused with a real connection mode.
    options: `-c search_path=${import_pool.searchPath} -c multigres.unsafe_connection=on`,
    ssl
  };
  const client = new import_pg.Client(dbConfig);
  client.on("error", (err) => {
    import_monitoring.logSchema.error(import_monitoring.logger, "Error on database connection", {
      type: "error",
      error: err,
      project: tenantId
    });
  });
  await client.connect();
  return client;
}
async function connectAndMigrate(options) {
  const { shouldCreateStorageSchema, migrationsDirectory, ssl, databaseUrl, waitForLock } = options;
  const dbConfig = {
    connectionString: databaseUrl,
    connectionTimeoutMillis: 6e4,
    options: `-c search_path=${import_pool.searchPath}`,
    statement_timeout: 1e3 * 60 * 60 * 12,
    // 12 hours
    ssl
  };
  const client = await connect(dbConfig);
  try {
    await client.query(`SET statement_timeout TO '12h'`);
    await migrate({
      client,
      migrationsDirectory,
      migrationsTableSchema: options.migrationsTableSchema,
      waitForLock: Boolean(waitForLock),
      shouldCreateStorageSchema,
      upToMigration: options.upToMigration
    });
  } finally {
    await client.end();
  }
}
async function migrate({
  client,
  migrationsDirectory,
  migrationsTableSchema,
  waitForLock,
  shouldCreateStorageSchema,
  upToMigration
}) {
  const accessMethod = await getDefaultAccessMethod(client);
  return withAdvisoryLock(
    waitForLock,
    runMigrations({
      migrationsDirectory,
      migrationsTableSchema,
      shouldCreateStorageSchema,
      upToMigration,
      // Remove concurrent index creation if we're using oriole db as it does not support it currently
      transformers: accessMethod === "orioledb" ? [new import_transformers.DisableConcurrentIndexTransformer()] : []
    })
  )(client);
}
function runMigrations({
  migrationsDirectory,
  migrationsTableSchema,
  shouldCreateStorageSchema,
  upToMigration,
  transformers = []
}) {
  return async (client) => {
    let intendedMigrations = await (0, import_files.loadMigrationFilesCached)(migrationsDirectory);
    let lastMigrationId = intendedMigrations[intendedMigrations.length - 1].id;
    if (upToMigration) {
      const migrationIndex = intendedMigrations.findIndex((m) => m.name === upToMigration);
      if (migrationIndex === -1) {
        throw import_errors.ERRORS.InternalError(void 0, `Migration ${dbMigrationFreezeAt} not found`);
      }
      intendedMigrations = intendedMigrations.slice(0, migrationIndex + 1);
      lastMigrationId = intendedMigrations[migrationIndex].id;
    }
    try {
      const migrationTableName = "migrations";
      const effectiveSearchPath = migrationsTableSchema && !import_pool.searchPath.includes(migrationsTableSchema) ? [migrationsTableSchema, ...import_pool.searchPath] : import_pool.searchPath;
      await client.query(`SET search_path TO ${effectiveSearchPath.join(",")}`);
      let appliedMigrations = [];
      if (await doesTableExist({
        client,
        schemaName: migrationsTableSchema,
        tableName: migrationTableName
      })) {
        const selectQueryCurrentMigration = import_sql_template_strings.default`SELECT * FROM `.append(migrationTableName).append(import_sql_template_strings.default` WHERE id <= ${lastMigrationId} ORDER BY id`);
        const { rows } = await client.query(selectQueryCurrentMigration);
        appliedMigrations = rows;
        if (rows.length > 0) {
          appliedMigrations = await refreshMigrationPosition(
            client,
            migrationTableName,
            appliedMigrations,
            intendedMigrations
          );
        }
      } else if (shouldCreateStorageSchema) {
        const targetSchema = migrationsTableSchema ?? "storage";
        const schemaExists = await doesSchemaExists(client, targetSchema);
        if (!schemaExists) {
          await client.query(`CREATE SCHEMA IF NOT EXISTS ${targetSchema}`);
        }
      }
      try {
        (0, import_validation.validateMigrationHashes)(intendedMigrations, appliedMigrations);
      } catch (e) {
        if (!dbRefreshMigrationHashesOnMismatch) {
          throw e;
        }
        await refreshMigrationHash(
          client,
          migrationTableName,
          intendedMigrations,
          appliedMigrations
        );
      }
      const migrationsToRun = filterMigrations(intendedMigrations, appliedMigrations);
      const completedMigrations = [];
      const icebergShardVar = `{${icebergShards.map((s) => `"${s}"`).join(",")}}`;
      const icebergDefaultShard = icebergShards.length > 0 ? icebergShards[0] : "";
      if (migrationsToRun.length > 0) {
        const lit = (v) => `'${String(v).replace(/'/g, "''")}'`;
        await client.query(`SELECT
          set_config('storage.install_roles', ${lit(dbInstallRoles)}, false),
          set_config('storage.multitenant', ${lit(isMultitenant ? "true" : "false")}, false),
          set_config('storage.anon_role', ${lit(dbAnonRole)}, false),
          set_config('storage.authenticated_role', ${lit(dbAuthenticatedRole)}, false),
          set_config('storage.service_role', ${lit(dbServiceRole)}, false),
          set_config('storage.super_user', ${lit(dbSuperUser)}, false),
          set_config('storage.iceberg_default_shard', ${lit(icebergDefaultShard)}, false),
          set_config('storage.iceberg_shards', ${lit(icebergShardVar)}, false),
          set_config('storage.vector_bucket_provider', ${lit(vectorBucketProvider)}, false);
        `);
      }
      for (const migration of migrationsToRun) {
        try {
          const ignore = migration.sql.includes("-- postgres-migrations ignore");
          let runnableMigration = ignore ? {
            ...migration,
            sql: "SELECT 1;",
            contents: "SELECT 1;"
          } : migration;
          if (runnableMigration.sql.includes("-- storage-migrations generate-sql")) {
            const { rows } = await client.query(runnableMigration.sql);
            const sql = rows[0]?.sql;
            if (rows.length !== 1 || typeof sql !== "string" || sql.trim().length === 0) {
              throw new Error("Generated migration must return exactly one non-empty sql string");
            }
            runnableMigration = { ...runnableMigration, sql };
          }
          const transformedMigration = runMigrationTransformers(runnableMigration, transformers);
          const repairedIndexes = await (0, import_concurrent_index_guard.repairInvalidConcurrentIndexes)(client, transformedMigration);
          if (repairedIndexes.length > 0) {
            import_monitoring.logSchema.warning(import_monitoring.logger, "[Migrations] Removed invalid indexes before retry", {
              type: "migrations",
              metadata: JSON.stringify({
                migrationId: migration.id,
                migrationName: migration.name,
                indexes: repairedIndexes
              })
            });
          }
          const result = await (0, import_run_migration.runMigration)(migrationTableName, client)(transformedMigration);
          completedMigrations.push(result);
        } catch (e) {
          throw import_errors.ERRORS.DatabaseError(
            `Migration failed. Reason: ${e.message}`,
            e
          ).withMetadata({
            currentMigrations: appliedMigrations.map((migration2) => ({
              id: migration2.id,
              name: migration2.name,
              hash: migration2.hash
            })),
            migrationsToRun: migrationsToRun.map((migration2) => ({
              id: migration2.id,
              name: migration2.name,
              hash: migration2.hash
            })),
            migrationId: migration.id,
            migrationName: migration.name,
            migrationHash: migration.hash
          });
        }
      }
      return completedMigrations;
    } catch (e) {
      if (e instanceof import_postgres_migrations.MigrationError) {
        throw new import_postgres_migrations.MigrationError(`Migration failed. Reason: ${e.message}`, {
          cause: e
        });
      }
      throw e;
    }
  };
}
function filterMigrations(migrations, appliedMigrations) {
  const notAppliedMigration = (migration) => !appliedMigrations[migration.id];
  return migrations.filter(notAppliedMigration);
}
function runMigrationTransformers(migration, transformers) {
  for (const transformer of transformers) {
    migration = transformer.transform(migration);
  }
  return migration;
}
async function getDefaultAccessMethod(client) {
  const result = await client.query(`SHOW default_table_access_method`);
  return result.rows?.[0]?.default_table_access_method || "";
}
async function doesTableExist({
  client,
  schemaName,
  tableName
}) {
  const result = await client.query(
    import_sql_template_strings.default`SELECT EXISTS (
  SELECT 1
  FROM   pg_catalog.pg_class c
  JOIN   pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE  c.relname = ${tableName}
  AND    c.relkind = 'r'
`.append(schemaName ? import_sql_template_strings.default`AND n.nspname = ${schemaName}` : "").append(`);`)
  );
  return result.rows.length > 0 && result.rows[0].exists;
}
async function doesSchemaExists(client, schemaName) {
  const result = await client.query(import_sql_template_strings.default`SELECT EXISTS (
      SELECT 1
      FROM information_schema.schemata
      WHERE schema_name = ${schemaName}
  );`);
  return result.rows.length > 0 && result.rows[0].exists;
}
function withAdvisoryLock(waitForLock, f) {
  return async (client) => {
    try {
      let acquired = false;
      let tries = 1;
      const timeout = 3e3;
      const start = Date.now();
      while (!acquired) {
        const elapsed = Date.now() - start;
        if (elapsed > timeout) {
          throw import_errors.ERRORS.LockTimeout();
        }
        const lockResult = await client.query("SELECT pg_try_advisory_lock(-8525285245963000605);");
        if (lockResult.rows[0].pg_try_advisory_lock === true) {
          acquired = true;
        } else {
          if (waitForLock) {
            await new Promise((res) => setTimeout(res, 20 * tries));
          } else {
            throw import_errors.ERRORS.LockTimeout();
          }
        }
        tries++;
      }
      return await f(client);
    } finally {
      try {
        await client.query("SELECT pg_advisory_unlock(-8525285245963000605);");
      } catch {
      }
    }
  };
}
async function refreshMigrationHash(client, migrationTableName, intendedMigrations, appliedMigrations) {
  const invalidHash = (migration) => {
    const appliedMigration = appliedMigrations[migration.id];
    return appliedMigration != null && appliedMigration.hash !== migration.hash;
  };
  const invalidHashes = intendedMigrations.filter(invalidHash);
  if (invalidHashes.length > 0) {
    await client.query("BEGIN");
    try {
      await Promise.all(
        invalidHashes.map((migration) => {
          const query = import_sql_template_strings.default`UPDATE `.append(migrationTableName).append(import_sql_template_strings.default` SET hash = ${migration.hash} WHERE id = ${migration.id}`);
          return client.query(query);
        })
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  }
  return invalidHashes;
}
async function refreshMigrationPosition(client, migrationTableName, appliedMigrations, intendedMigrations) {
  let newMigrations = [...appliedMigrations];
  let shouldUpdateMigrations = false;
  backportMigrations.forEach((migration) => {
    const existingMigration = newMigrations?.[migration.index];
    if (!existingMigration || existingMigration && existingMigration.name !== migration.from) {
      return;
    }
    const migrations = newMigrations.slice(0, migration.index);
    migrations.push(intendedMigrations[migration.index]);
    const afterMigration = newMigrations.slice(migration.index).map((m) => ({
      ...m,
      id: m.id + 1,
      hash: intendedMigrations[m.id].hash
    }));
    migrations.push(...afterMigration);
    newMigrations = migrations;
    shouldUpdateMigrations = true;
  });
  if (shouldUpdateMigrations) {
    await client.query(`BEGIN`);
    try {
      await client.query(`DELETE FROM ${migrationTableName} WHERE id is not NULL`);
      const query = import_sql_template_strings.default`INSERT INTO `.append(migrationTableName).append("(id, name, hash, executed_at) VALUES ");
      newMigrations.forEach((migration) => {
        console.log(`Migration applied: ${migration.id} - ${migration.name}`);
      });
      newMigrations.forEach((migration, index) => {
        query.append(import_sql_template_strings.default`(${migration.id}, ${migration.name}, ${migration.hash}, NOW())`);
        if (index !== newMigrations.length - 1) {
          query.append(",");
        }
      });
      await client.query(query);
      await client.query(`COMMIT`);
    } catch (e) {
      await client.query(`ROLLBACK`);
      throw e;
    }
  }
  return newMigrations;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VECTOR_DATABASE_NAME,
  areMigrationsUpToDate,
  deriveVectorDatabaseUrl,
  listTenantsToMigrate,
  listTenantsToResetMigrations,
  migrate,
  obtainLockOnMultitenantDB,
  progressiveMigrations,
  resetMigration,
  resetMigrationsOnTenants,
  runMigrationsOnAllTenants,
  runMigrationsOnTenant,
  runMultitenantMigrations,
  runVectorStoreMigrations,
  startAsyncMigrations,
  tenantHasMigrations,
  updateTenantMigrationsState
});
//# sourceMappingURL=migrate.js.map
