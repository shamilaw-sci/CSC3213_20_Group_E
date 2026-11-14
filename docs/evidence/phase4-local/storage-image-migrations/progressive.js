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
var progressive_exports = {};
__export(progressive_exports, {
  ProgressiveMigrations: () => ProgressiveMigrations
});
module.exports = __toCommonJS(progressive_exports);
var import_migrate = require("./migrate.js");
var import_errors = require("../../errors/index.js");
var import_events = require("../../../storage/events/index.js");
var import_config = require("../../../config.js");
var import_monitoring = require("../../monitoring/index.js");
var import_tenant = require("../tenant.js");
const { dbMigrationFreezeAt } = (0, import_config.getConfig)();
const maxBatchSendBackoffMs = 6e4;
const progressiveMigrationsMetadata = JSON.stringify({ strategy: "progressive" });
class ProgressiveMigrations {
  constructor(options) {
    this.options = options;
  }
  options;
  tenants = /* @__PURE__ */ new Set();
  inFlightCreateJobs;
  consecutiveBatchSendFailures = 0;
  nextBatchSendAttemptAt = 0;
  batchSendTimer;
  shutdownSignal;
  start(signal) {
    this.shutdownSignal = signal;
    signal.addEventListener("abort", () => {
      import_monitoring.logSchema.info(import_monitoring.logger, "[Migrations] Stopping", {
        type: "migrations"
      });
      return this.drain();
    });
  }
  async drain() {
    await this.inFlightCreateJobs?.catch(() => {
    });
    this.resetBatchSendBackoff();
    return this.createJobsAndLogErrors(this.tenants.size);
  }
  addTenant(tenant) {
    if (this.tenants.has(tenant)) {
      return;
    }
    this.tenants.add(tenant);
    if (this.inFlightCreateJobs) {
      return;
    }
    if (this.tenants.size < this.options.maxSize) {
      this.scheduleNextBatch();
      return;
    }
    if (this.isBatchSendBackoffActive()) {
      return;
    }
    this.clearBatchSendSchedule();
    void this.createJobsAndLogErrors(this.options.maxSize);
  }
  createJobs(maxJobs) {
    if (this.inFlightCreateJobs) {
      return this.inFlightCreateJobs;
    }
    this.inFlightCreateJobs = this.createJobsBatch(maxJobs).finally(() => {
      this.inFlightCreateJobs = void 0;
    });
    return this.inFlightCreateJobs;
  }
  createJobsAndLogErrors(maxJobs) {
    return this.createJobs(maxJobs).catch((e) => {
      import_monitoring.logSchema.error(import_monitoring.logger, "[Migrations] Error creating migration jobs", {
        type: "migrations",
        error: e,
        metadata: progressiveMigrationsMetadata
      });
      this.scheduleNextBatch();
    });
  }
  async createJobsBatch(maxJobs) {
    if (this.isBatchSendBackoffActive()) {
      return;
    }
    const tenantsBatch = [];
    for (const tenant of this.tenants) {
      if (tenantsBatch.length >= maxJobs) {
        break;
      }
      tenantsBatch.push(tenant);
    }
    const jobs = await Promise.allSettled(
      tenantsBatch.map(async (tenant) => {
        const tenantConfig = await (0, import_tenant.getTenantConfig)(tenant);
        const migrationsUpToDate = await (0, import_migrate.areMigrationsUpToDate)(tenant);
        if (migrationsUpToDate || tenantConfig.syncMigrationsDone) {
          return;
        }
        const scheduleAt = /* @__PURE__ */ new Date();
        scheduleAt.setMinutes(scheduleAt.getMinutes() + 5);
        const scheduleForLater = tenantConfig.migrationStatus === import_tenant.TenantMigrationStatus.FAILED_STALE ? scheduleAt : void 0;
        return new import_events.RunMigrationsOnTenants({
          tenantId: tenant,
          scheduleAt: scheduleForLater,
          upToMigration: dbMigrationFreezeAt,
          tenant: {
            host: "",
            ref: tenant
          }
        });
      })
    );
    const { retryableFailedTenants, sendableJobs } = this.classifyPreparedJobs(tenantsBatch, jobs);
    if (sendableJobs.length > 0) {
      try {
        await import_events.RunMigrationsOnTenants.batchSend(sendableJobs.map(({ job }) => job));
        this.resetBatchSendBackoff();
      } catch (e) {
        for (const { tenant } of sendableJobs) {
          retryableFailedTenants.add(tenant);
        }
        const retryDelayMs = this.deferBatchSendRetry();
        import_monitoring.logSchema.error(import_monitoring.logger, "[Migrations] Error sending migration jobs batch", {
          type: "migrations",
          error: e,
          metadata: JSON.stringify({
            strategy: "progressive",
            consecutiveFailures: this.consecutiveBatchSendFailures,
            retryDelayMs
          })
        });
      }
    }
    this.reconcileTenants(tenantsBatch, retryableFailedTenants);
    if (this.tenants.size === 0) {
      this.resetBatchSendBackoff();
    } else {
      this.scheduleNextBatch();
    }
  }
  classifyPreparedJobs(tenantsBatch, jobs) {
    const retryableFailedTenants = /* @__PURE__ */ new Set();
    const sendableJobs = [];
    for (const [index, job] of jobs.entries()) {
      const tenant = tenantsBatch[index];
      if (job.status === "rejected") {
        const dropTenant = (0, import_errors.isStorageError)(import_errors.ErrorCode.TenantNotFound, job.reason);
        if (!dropTenant) {
          retryableFailedTenants.add(tenant);
        }
        import_monitoring.logSchema.warning(
          import_monitoring.logger,
          dropTenant ? `[Migrations] Failed to prepare migration job for tenant ${tenant}; dropping tenant from queue because it no longer exists` : `[Migrations] Failed to prepare migration job for tenant ${tenant}; keeping tenant queued for retry`,
          {
            type: "migrations",
            error: job.reason,
            project: tenant,
            metadata: progressiveMigrationsMetadata
          }
        );
        continue;
      }
      if (job.value) {
        sendableJobs.push({ tenant, job: job.value });
      }
    }
    return { retryableFailedTenants, sendableJobs };
  }
  reconcileTenants(tenantsBatch, retryableFailedTenants) {
    for (const tenant of tenantsBatch) {
      this.tenants.delete(tenant);
      if (retryableFailedTenants.has(tenant)) {
        this.tenants.add(tenant);
      }
    }
  }
  now() {
    return performance.now();
  }
  random() {
    return Math.random();
  }
  get baseDelayMs() {
    return Math.max(this.options.interval, 1);
  }
  isBatchSendBackoffActive() {
    return this.now() < this.nextBatchSendAttemptAt;
  }
  deferBatchSendRetry() {
    this.consecutiveBatchSendFailures++;
    const maximumDelayMs = Math.max(this.baseDelayMs, maxBatchSendBackoffMs);
    const upperDelayMs = Math.min(
      maximumDelayMs,
      this.baseDelayMs * 2 ** this.consecutiveBatchSendFailures
    );
    const lowerDelayMs = Math.max(this.baseDelayMs, Math.floor(upperDelayMs / 2));
    const retryDelayMs = Math.round(lowerDelayMs + (upperDelayMs - lowerDelayMs) * this.random());
    this.nextBatchSendAttemptAt = this.now() + retryDelayMs;
    return retryDelayMs;
  }
  scheduleNextBatch() {
    if (this.tenants.size === 0 || !this.shutdownSignal || this.shutdownSignal.aborted || this.batchSendTimer) {
      return;
    }
    const delayMs = this.isBatchSendBackoffActive() ? Math.max(this.nextBatchSendAttemptAt - this.now(), 1) : this.baseDelayMs;
    const timer = setTimeout(() => {
      this.clearBatchSendSchedule();
      void this.createJobsAndLogErrors(this.options.maxSize);
    }, delayMs);
    this.batchSendTimer = timer;
    timer.unref();
  }
  clearBatchSendSchedule() {
    this.cancelBatchSendTimer();
    this.nextBatchSendAttemptAt = 0;
  }
  cancelBatchSendTimer() {
    if (this.batchSendTimer) {
      clearTimeout(this.batchSendTimer);
      this.batchSendTimer = void 0;
    }
  }
  resetBatchSendBackoff() {
    this.clearBatchSendSchedule();
    this.consecutiveBatchSendFailures = 0;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ProgressiveMigrations
});
//# sourceMappingURL=progressive.js.map
