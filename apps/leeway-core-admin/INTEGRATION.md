# LeeWay Core Integration Matrix

> **Powered by Leeway Innovations — A Leeway Industries Product**

## 1. Integrated Canonical Components (Active)

| Component | Source Repository | Local Integration Path | Verification |
|---|---|---|---|
| Golden Formula `v1.0` Kernel | `4citeB4U/LeeWay-formula-live` (`d261796`) | `server/canonical/leeway-formula/v1/*` | 11/11 SHA-256 PASS |
| Formula Domain Adapters (`14`) | Constructed per Section 19–20 spec | `server/formulaAdapters.ts` | Verified in `npm test` |
| CRM-ERP Starter Schema | `4citeB4U/Leeway-Agentic-CRM-ERP` (`b940c46`) | Seeded in `server/store.ts` | Canonical IDs preserved |
| Tablet Workforce `W00–W17` | `4citeB4U/Leeway-Agent-Virtual-Tablet` (`8947bc3`) | Seeded in `server/store.ts` | Categories A–E modeled |
| Creator Diagnostics Surface | `4citeB4U/Leeway-Agent-Virtual-Tablet` (`8947bc3`) | `CreatorDiagnosticsSection.tsx` + `server/diagnostics.ts` | 8 canonical tabs preserved |
| Standards Laws & Rules `R01–R25` | `4citeB4U/LeeWay-Standards` (`e6f6b66`) | `src/data/knowledgeBase.ts` & source 5WH headers | Verified across codebase |

## 2. Configured Integration Boundaries (`UNBOUND` by Default)

| External System | Environment Variable | Current Behavior When Unbound |
|---|---|---|
| LeeWay Runtime Fabric | `LEEWAY_RUNTIME_URL` | Decisions record `EXTERNAL_RUNTIME_UNBOUND`; no fake execution claimed. |
| Zitadel OIDC Authority | `LEEWAY_ZITADEL_ISSUER` | Falls back cleanly to Creator scrypt + HMAC Bearer gate (`zitadelBinding: UNBOUND`). |
| Live CRM-ERP Endpoint | `LEEWAY_CRM_API_URL` | Operates on atomic local `data/core-state.json` seeded from starter fixtures. |
| LeeWay Continuum | `LEEWAY_CONTINUUM_URL` | Storage transformations evaluated cleanly locally; remote sync marked `UNBOUND`. |
| LeeWay Device Bridge | `LEEWAY_DEVICE_BRIDGE_URL` | Reports `deviceBridgeEnrollment: UNVERIFIED` and `HOST_PROCESS_ONLY`. |
| Independent Veritas | `LEEWAY_VERITAS_URL` | Marks all local receipts `NOT_VERIFIED_EXTERNALLY` and diagnostics `NOT_PROVIDED`. |
| Remote Receipt Authority | `LEEWAY_RECEIPT_AUTHORITY_URL` | Retains SHA-256 receipts locally under `data/core-state.json` and `server/canonical/receipts/`. |

## 3. Inaccessible Canonical Repository Notice

- `4citeB4U/LeeWay-Engineering` returned HTTP `404` when queried against GitHub. Contracts unique to that repository are explicitly omitted and documented as unverified rather than reconstructed from assumption.
