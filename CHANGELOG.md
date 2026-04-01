# CHANGELOG

All notable changes to **BerekeAI — AgroLedger Modülü** are documented in this file.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/).

---

## [1.1.0] — 2026-03-10

### 🔒 Security

- **fix(auth): resolve git merge conflict and remove unsafe `as any` cast**  
  Removed unresolved `<<<<<<< HEAD` markers from `lib/auth.ts`. Replaced `PrismaAdapter(prisma) as any` with the proper `Adapter` type from `next-auth/adapters`. Added `session.maxAge` (30 days) and `token.id` propagation.

- **feat(cron): add CRON_SECRET Bearer token authentication to all cron endpoints**  
  `/api/cron/gateway-heartbeat` and `/api/cron/sla-check` now validate `Authorization: Bearer <CRON_SECRET>` before executing. Returns `401 Unauthorized` for missing or invalid secrets.

- **feat(api): add session authentication guard to anomaly and savings routes**  
  `/api/anomaly/check` and `/api/savings/calculate` now call `getServerSession(authOptions)`. Unauthenticated requests receive `401 Unauthorized` immediately.

- **docs(security): add .env.example with safe placeholder values**  
  Created `.env.example` documenting required variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`) without exposing real credentials. Safe to commit to git.

---

### ⚡ Performance

- **perf(dashboard): replace full table scan with parallel aggregate queries**  
  `GET /api/dashboard/stats` previously loaded the entire `WaterSaving` table into Node.js memory via `findMany`. Replaced with 6 parallel DB-side `aggregate`/`groupBy` queries using `Promise.all`. Daily trend now uses `DATE_TRUNC('day', ...)` via `$queryRaw` for correct grouping.

- **perf(gateway): eliminate N+1 update loop with `$transaction` batch**  
  `GatewayService.updateHeartbeat` previously issued one `UPDATE` per gateway in a sequential loop. All updates are now batched into a single `prisma.$transaction([...])` call, reducing round-trips from N to 1.

- **perf(cron): convert sequential cooperative loop to `Promise.all`**  
  `GET /api/cron/gateway-heartbeat` processed cooperatives one by one. Converted to `Promise.all(cooperatives.map(...))` for concurrent execution.

- **perf(water-savings): limit sensor readings query to last 1000 records**  
  `WaterSavingsService.calculateBaseline` previously fetched all `SensorReading` rows (`include: { readings: true }`). Added `take: 1000, orderBy: { timestamp: 'desc' }` to prevent unbounded memory growth.

---

### 🌾 Agro-Tech Compatibility

- **fix(water-savings-baseline): derive regionNorm and weatherFactor from real data**  
  Replaced hardcoded `regionNorm = 100 m³/ha` and `weatherFactor = 1.2` constants with live DB queries:
  - `regionNorm`: average of historic `WaterSaving.baselineUsage` per region
  - `weatherFactor`: derived from last 30 days of `WeatherLog` (rainfall thresholds: `≥50mm → 0.8`, `≥20mm → 1.0`, `hot+dry → 1.5`, default `1.2`)

- **fix(water-savings-payment): dynamic payment rate from Contract.savingsSharePct**  
  Replaced the hardcoded `0.15 TL/m³` constant with a dynamic rate sourced from the farm's active `Contract.savingsSharePct`. Falls back to `0.15 TL/m³` when no contract exists.

- **fix(gateway): remove Math.random() battery simulation**  
  `GatewayService.updateHeartbeat` previously generated random battery and capture rate values (`Math.random() * 100`). These values now come from a `sensorData: Map<gatewayId, {batteryLevel, captureRate}>` parameter — ready for real LoRaWAN/MQTT payload integration.

- **fix(gateway): remove hardcoded mock IDs from maintenance tickets**  
  Replaced `sensorId: 1` and `userId: 'super-admin-id'` with live queries: `prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } })` and `prisma.sensor.findFirst()`.

---

### 🐛 Bug Fixes

- **fix(prisma): change default export to named export**  
  `lib/prisma.ts` used `export default prisma` while all consumers used `import { prisma }` (named import). This mismatch silently resolved to `undefined` in some runtimes. Changed to `export const prisma`.

- **fix(seed): correct WaterSaving field names to match Prisma schema**  
  `prisma/seed.ts` referenced removed field `savingsPct`. Updated to use `actualUsage`, `baselineUsage`, and `savings` per the current schema.

- **fix(anomaly): add farmerId ownership check to respondToAnomaly**  
  `AnomalyService.respondToAnomaly` now verifies the calling `farmerId` matches the anomaly record's `farmerId`. Returns an `Error` for unauthorized access attempts.

---

### ♻️ Refactor

- **refactor(anomaly): extract FACTOR_WEIGHTS constant and parallelize DB queries**  
  Moved confidence score weights to a module-level `FACTOR_WEIGHTS` constant. The 3 independent factor queries (rainfall, neighbor anomalies, historical accuracy) now run via `Promise.all`.

- **refactor(anomaly): replace SMS console.log with structured notification method**  
  Extracted `sendFarmerNotification()` private method as a proper service boundary. Logs structurally; ready for Twilio/SMTP injection without changing the public API.

- **refactor(gateway): extract pure helper functions for testability**  
  Created `resolveHeartbeatInterval(batteryLevel)` and `resolveGatewayStatus(battery, captureRate)` as pure functions, making them independently unit-testable without DB mocking.

- **refactor(cron/sla-check): only freeze non-frozen contracts**  
  Added `where: { slaFrozen: false }` to the `updateMany` call so re-runs don't produce misleading counts.

- **refactor(*): replace all `any` return types with explicit interfaces**  
  `GatewayHealth`, `AnomalyLog`, `WaterSaving` Prisma types and dedicated result interfaces (`HeartbeatResult`, `CalculateSavingsResult`, `CreateAnomalyResult`, etc.) replace all `Promise<any>`.

---

### 🧪 Tests

- **test: add Jest + ts-jest unit test infrastructure**  
  Installed `jest`, `@types/jest`, `ts-jest`, `jest-environment-node`. Created `jest.config.ts` with `@/` path alias and Node environment. Created `__mocks__/@prisma/client.ts` with full model mock stubs.

- **test(anomaly): 10 unit tests for confidence score and authorization**  
  Covers all 5 factor paths (rainfall, neighbors, manual irrigation, battery, historical), the `shouldAlert` threshold, error cases, and `respondToAnomaly` authorization guard.

- **test(water-savings): 8 unit tests for baseline type determination and validation rules**  
  Covers PROXY/HYBRID/REAL baseline selection, negative/zero/excess consumption validation, DB error propagation.

- **test(decision-guard): 6 unit tests + 3 shadowMode + 1 recordShadowDecision**  
  Covers all 4 `canDecide` status paths (`NO_SENSORS`, `REAL_TIME`, `DELAYED`, `SENSOR_OFFLINE`), multi-sensor latest-wins logic, null `lastReadingAt` edge case.

- **test(gateway): 8 unit tests for heartbeat status logic and transaction batching**  
  Covers HEALTHY/WARNING/CRITICAL status classification, interval calculation, N+1 fix verification (`$transaction` called once for N gateways), duplicate ticket prevention.

---

## [1.0.0] — Initial Release

- Next.js 14 + Prisma 5 + Neon PostgreSQL base setup
- NextAuth v4 with `CredentialsProvider` and JWT strategy
- Prisma schema: 20 models covering farms, sensors, anomalies, gateways, water savings
- `AnomalyService`, `WaterSavingsService`, `GatewayService`, `decisionGuard`, `shadowMode`
- Admin, farmer, and cooperative manager role-based routing via middleware
- `ConfidenceScoreChart` and `LiveWaterSavingsCounter` dashboard components
- Leaflet map integration and Recharts visualization

---

**BerekeAI — AgroLedger Modülü**  
*Orta Asya Tarımının İşletim Sistemi*

[1.1.0]: https://github.com/umutcetiner07/AgroLedger-Iaap/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/umutcetiner07/AgroLedger-Iaap/releases/tag/v1.0.0
