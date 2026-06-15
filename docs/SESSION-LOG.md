# SESSION-LOG - Bluepilot

> Anker nach `docs/CLAUDE-CONTEXT.md` lesen. Neueste Eintraege oben.
> Jeder Eintrag: Datum, was entschieden oder gebaut wurde, Ergebnis, roter Faden fuer den naechsten Block.

---

## 2026-06-15 - BPK-167 bis BPK-170 Permit / Approved Action Consume Execution Receipt Record Audit

- Gebaut: vier side-effect-freie Consume-Execution-Receipt-Record-Audit-Schichten:
  `cockpitPatchPermitConsumeExecutionReceiptRecordAudit`,
  `memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit`,
  `runtimePatchPermitConsumeExecutionReceiptRecordAudit` und
  `releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit`.
- Verhalten: Ready-Consume-Execution-Receipt-Record-Audit-Authority-Artefakte erzeugen
  in-memory Audit-Artefakte. Es wird kein Audit dauerhaft geschrieben, kein Receipt dauerhaft
  persistiert, kein Permit konsumiert, keine Action konsumiert, kein Patch angewendet, kein Export
  geschrieben, keine Runtime ausgefuehrt und kein Merge oder externe Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Receipt-Record-Audit-Tests, Typecheck,
  Task-Lock-Verify, Diff-Check und voller Builder-Testlauf sind gruen.
- Roter Faden weiter: Naechste Hauptbloecke koennen Audit-Receipt-Preflight vorbereiten,
  weiterhin ohne durable Receipt-Persistenz, Runtime-Execution, Merge oder externe Aktion.

## 2026-06-15 - BPK-163 bis BPK-166 Permit / Approved Action Consume Execution Receipt Record Audit Authority

- Gebaut: vier side-effect-freie Consume-Execution-Receipt-Record-Audit-Authority-Schichten:
  `cockpitPatchPermitConsumeExecutionReceiptRecordAuditAuthority`,
  `memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditAuthority`,
  `runtimePatchPermitConsumeExecutionReceiptRecordAuditAuthority` und
  `releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthority`.
- Verhalten: Ready-Consume-Execution-Receipt-Record-Audit-Preflight-Artefakte erzeugen
  side-effect-freie Audit-Authorization-Artefakte. Es wird kein Audit geschrieben, kein Receipt
  dauerhaft persistiert, kein Permit konsumiert, keine Action konsumiert, kein Patch angewendet,
  kein Export geschrieben, keine Runtime ausgefuehrt und kein Merge oder externe Release-Aktion
  ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Receipt-Record-Audit-Authority-Tests, Typecheck,
  Task-Lock-Verify, Diff-Check und voller Builder-Testlauf sind gruen.
- Roter Faden weiter: Naechste Hauptbloecke koennen Receipt-Record-Audit-Artefakte erzeugen,
  weiterhin ohne durable Receipt-Persistenz, Runtime-Execution, Merge oder externe Aktion.

## 2026-06-15 - BPK-159 bis BPK-162 Permit / Approved Action Consume Execution Receipt Record Audit Preflight

- Gebaut: vier side-effect-freie Consume-Execution-Receipt-Record-Audit-Preflight-Schichten:
  `cockpitPatchPermitConsumeExecutionReceiptRecordAuditPreflight`,
  `memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflight`,
  `runtimePatchPermitConsumeExecutionReceiptRecordAuditPreflight` und
  `releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflight`.
- Verhalten: Recorded-Consume-Execution-Receipt-Record-Artefakte werden fuer spaetere Audit-
  Authorization vorgeprueft. Es wird kein Audit geschrieben, kein Receipt dauerhaft persistiert,
  kein Permit konsumiert, keine Action konsumiert, kein Patch angewendet, kein Export geschrieben,
  keine Runtime ausgefuehrt und kein Merge oder externe Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Receipt-Record-Audit-Preflight-Tests, Typecheck,
  Task-Lock-Verify, Diff-Check und voller Builder-Testlauf sind gruen.
- Roter Faden weiter: Naechste Hauptbloecke koennen Receipt-Record-Audit-Authority vorbereiten,
  weiterhin ohne Audit-Write, durable Receipt-Persistenz, Runtime-Execution, Merge oder externe
  Aktion.

## 2026-06-15 - BPK-155 bis BPK-158 Permit / Approved Action Consume Execution Receipt Record

- Gebaut: vier side-effect-freie Consume-Execution-Receipt-Record-Schichten:
  `cockpitPatchPermitConsumeExecutionReceiptRecord`,
  `memoryCacheAuditExportPermitConsumeExecutionReceiptRecord`,
  `runtimePatchPermitConsumeExecutionReceiptRecord` und
  `releaseGovernanceApprovedActionConsumeExecutionReceiptRecord`.
- Verhalten: Ready-Consume-Execution-Receipt-Record-Authority-Artefakte erzeugen in-memory
  Receipt-Record-Artefakte. `executionReceiptRecorded` wird nur im zurueckgegebenen Artefakt
  gesetzt; es gibt keinen dauerhaften Receipt-Write, keinen Datei-Write, keine DB und keine
  externe Aktion.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Receipt-Record-Tests, Typecheck, Task-Lock-Verify, Diff-Check
  und voller Builder-Testlauf sind gruen.
- Roter Faden weiter: Naechste Hauptbloecke koennen Receipt-Record-Audit-Preflight vorbereiten,
  weiterhin ohne durable Receipt-Persistenz, Runtime-Execution, Merge oder externe Aktion.

## 2026-06-15 - BPK-151 bis BPK-154 Permit / Approved Action Consume Execution Receipt Record Authority

- Gebaut: vier side-effect-freie Consume-Execution-Receipt-Record-Authority-Schichten:
  `cockpitPatchPermitConsumeExecutionReceiptRecordAuthority`,
  `memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthority`,
  `runtimePatchPermitConsumeExecutionReceiptRecordAuthority` und
  `releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthority`.
- Verhalten: Ready-Consume-Execution-Receipt-Record-Preflights erzeugen side-effect-freie
  Receipt-Record-Authorization-Artefakte. Es wird kein Permit konsumiert, keine Action konsumiert,
  kein Receipt geschrieben, kein Patch angewendet, kein Export geschrieben, keine Runtime
  ausgefuehrt und kein Merge oder externe Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Receipt-Record-Authority-Tests, Typecheck, Task-Lock-Verify,
  Diff-Check und voller Builder-Testlauf sind gruen.
- Roter Faden weiter: Naechste Hauptbloecke koennen Consume-Execution-Receipt-Record selbst
  vorbereiten. Das waere der erste Receipt-Write-nahe Schritt und braucht einen eigenen engen Lock.

## 2026-06-15 - BPK-147 bis BPK-150 Permit / Approved Action Consume Execution Receipt Record Preflight

- Gebaut: vier side-effect-freie Consume-Execution-Receipt-Record-Preflight-Schichten:
  `cockpitPatchPermitConsumeExecutionReceiptRecordPreflight`,
  `memoryCacheAuditExportPermitConsumeExecutionReceiptRecordPreflight`,
  `runtimePatchPermitConsumeExecutionReceiptRecordPreflight` und
  `releaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflight`.
- Verhalten: Ready-Consume-Execution-Receipt-Authority-Artefakte werden fuer spaetere
  Receipt-Erfassung vorgeprueft. Es wird kein Permit konsumiert, keine Action konsumiert, kein
  Receipt geschrieben, kein Patch angewendet, kein Export geschrieben, keine Runtime ausgefuehrt
  und kein Merge oder externe Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Receipt-Record-Preflight-Tests, Typecheck, Task-Lock-Verify,
  Diff-Check und voller Builder-Testlauf sind gruen.
- Roter Faden weiter: Naechste Hauptbloecke koennen Consume-Execution-Receipt-Record-Authority
  vorbereiten, weiterhin ohne Permit-Konsum, Action-Konsum, Receipt-Write, Runtime-Execution oder
  Merge.

## 2026-06-15 - BPK-143 bis BPK-146 Permit / Approved Action Consume Execution Receipt Authority

- Gebaut: vier side-effect-freie Consume-Execution-Receipt-Authority-Schichten:
  `cockpitPatchPermitConsumeExecutionReceiptAuthority`,
  `memoryCacheAuditExportPermitConsumeExecutionReceiptAuthority`,
  `runtimePatchPermitConsumeExecutionReceiptAuthority` und
  `releaseGovernanceApprovedActionConsumeExecutionReceiptAuthority`.
- Verhalten: Ready-Consume-Execution-Receipt-Preflights erzeugen side-effect-freie Receipt-
  Authorization-Artefakte. Es wird kein Permit konsumiert, keine Action konsumiert, kein Receipt
  geschrieben, kein Patch angewendet, kein Export geschrieben, keine Runtime ausgefuehrt und kein
  Merge oder externe Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Receipt-Authority-Tests, Typecheck, Task-Lock-Verify,
  Diff-Check und voller Builder-Testlauf sind gruen.
- Roter Faden weiter: Naechste Hauptbloecke koennen Consume-Execution-Receipt-Record-Preflight
  vorbereiten, weiterhin ohne Permit-Konsum, Action-Konsum, Receipt-Write, Runtime-Execution oder
  Merge.

## 2026-06-15 - BPK-139 bis BPK-142 Permit / Approved Action Consume Execution Receipt Preflight

- Gebaut: vier side-effect-freie Consume-Execution-Receipt-Preflight-Schichten:
  `cockpitPatchPermitConsumeExecutionReceiptPreflight`,
  `memoryCacheAuditExportPermitConsumeExecutionReceiptPreflight`,
  `runtimePatchPermitConsumeExecutionReceiptPreflight` und
  `releaseGovernanceApprovedActionConsumeExecutionReceiptPreflight`.
- Verhalten: Ready-Consume-Execution-Authority-Artefakte werden fuer spaetere Receipt-Erfassung
  vorgeprueft. Es wird kein Permit konsumiert, keine Action konsumiert, kein Receipt geschrieben,
  kein Patch angewendet, kein Export geschrieben, keine Runtime ausgefuehrt und kein Merge oder
  externe Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Receipt-Preflight-Tests, Typecheck, Task-Lock-Verify, Diff-Check
  und voller Builder-Testlauf sind gruen.
- Roter Faden weiter: Naechste Hauptbloecke koennen Consume-Execution-Receipt-Authority
  vorbereiten, weiterhin ohne Permit-Konsum, Action-Konsum, Receipt-Write, Runtime-Execution oder
  Merge.

## 2026-06-15 - BPK-135 bis BPK-138 Permit / Approved Action Consume Execution Authority

- Gebaut: vier side-effect-freie Consume-Execution-Authority-Schichten:
  `cockpitPatchPermitConsumeExecutionAuthority`,
  `memoryCacheAuditExportPermitConsumeExecutionAuthority`,
  `runtimePatchPermitConsumeExecutionAuthority` und
  `releaseGovernanceApprovedActionConsumeExecutionAuthority`.
- Verhalten: Ready-Consume-Execution-Preflights erzeugen side-effect-freie Execution-
  Authorization-Artefakte. Es wird kein Permit konsumiert, keine Action konsumiert, kein Patch
  angewendet, kein Export geschrieben, keine Runtime ausgefuehrt und kein Merge oder externe
  Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Execution-Authority-Tests, Typecheck, Task-Lock-Verify, Diff-Check
  und voller Builder-Testlauf sind gruen.
- Roter Faden weiter: Naechste Hauptbloecke koennen Consume-Execution-Receipt-Preflight
  vorbereiten, weiterhin ohne Permit-Konsum, Action-Konsum, Write, Runtime-Execution oder Merge.

## 2026-06-15 - BPK-131 bis BPK-134 Permit / Approved Action Consume Execution Preflight

- Gebaut: vier side-effect-freie Consume-Execution-Preflight-Schichten:
  `cockpitPatchPermitConsumeExecutionPreflight`,
  `memoryCacheAuditExportPermitConsumeExecutionPreflight`,
  `runtimePatchPermitConsumeExecutionPreflight` und
  `releaseGovernanceApprovedActionConsumeExecutionPreflight`.
- Verhalten: Ready-Consume-Application-Authority-Artefakte werden fuer spaetere Execution
  vorgeprueft. Es wird kein Permit konsumiert, keine Action konsumiert, kein Patch angewendet,
  kein Export geschrieben, keine Runtime ausgefuehrt und kein Merge oder externe Release-Aktion
  ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Execution-Preflight-Tests, Typecheck, Task-Lock-Verify, Diff-Check
  und voller Builder-Testlauf sind gruen.
- Roter Faden weiter: Naechste Hauptbloecke koennen Consume-Execution-Authority vorbereiten,
  weiterhin ohne Permit-Konsum, Action-Konsum, Write, Runtime-Execution oder Merge.

## 2026-06-14 - BPK-127 bis BPK-130 Permit / Approved Action Consume Application Authority

- Gebaut: vier side-effect-freie Consume-Application-Authority-Schichten:
  `cockpitPatchPermitConsumeApplicationAuthority`,
  `memoryCacheAuditExportPermitConsumeApplicationAuthority`,
  `runtimePatchPermitConsumeApplicationAuthority` und
  `releaseGovernanceApprovedActionConsumeApplicationAuthority`.
- Verhalten: Ready-Consume-Application-Preflights erzeugen side-effect-freie Application-
  Authorization-Artefakte. Es wird kein Permit konsumiert, keine Action konsumiert, kein Patch
  angewendet, kein Export geschrieben, keine Runtime ausgefuehrt und kein Merge oder externe
  Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Application-Authority-Tests und Typecheck sind vor
  Review-Finalisierung gruen; Task-Lock-Verify, Diff-Check und voller Builder-Testlauf muessen vor
  Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke koennen Consume-Execution-Preflight vorbereiten,
  weiterhin ohne Permit-Konsum, Action-Konsum, Write, Execution oder Merge.

## 2026-06-14 - BPK-123 bis BPK-126 Permit / Approved Action Consume Application Preflight

- Gebaut: vier side-effect-freie Consume-Application-Preflight-Schichten:
  `cockpitPatchPermitConsumeApplicationPreflight`,
  `memoryCacheAuditExportPermitConsumeApplicationPreflight`,
  `runtimePatchPermitConsumeApplicationPreflight` und
  `releaseGovernanceApprovedActionConsumeApplicationPreflight`.
- Verhalten: Consume-Authorization-Artefakte werden fuer spaetere Anwendung vorgeprueft. Es wird
  kein Permit konsumiert, keine Action konsumiert, kein Patch angewendet, kein Export geschrieben,
  keine Runtime ausgefuehrt und kein Merge oder externe Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Application-Preflight-Tests und Typecheck sind vor
  Review-Finalisierung gruen; Task-Lock-Verify, Diff-Check und voller Builder-Testlauf muessen vor
  Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke koennen Consume-Application-Authority vorbereiten,
  weiterhin ohne Permit-Konsum, Action-Konsum, Write, Execution oder Merge.

## 2026-06-14 - BPK-119 bis BPK-122 Permit / Approved Action Consume Authority

- Gebaut: vier side-effect-freie Consume-Authority-Schichten:
  `cockpitPatchPermitConsumeAuthority`, `memoryCacheAuditExportPermitConsumeAuthority`,
  `runtimePatchPermitConsumeAuthority` und `releaseGovernanceApprovedActionConsumeAuthority`.
- Verhalten: Ready-Consume-Preflights erzeugen side-effect-freie Consume-Authorization-
  Artefakte. Es wird kein Permit konsumiert, keine Action konsumiert, kein Patch angewendet, kein
  Export geschrieben, keine Runtime ausgefuehrt und kein Merge oder externe Release-Aktion
  ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Consume-Authority-Tests und Typecheck sind vor Review-Finalisierung
  gruen; Task-Lock-Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke koennen Consume-Application-Preflight vorbereiten,
  weiterhin ohne Permit-Konsum, Action-Konsum, Write, Execution oder Merge.

## 2026-06-14 - BPK-115 bis BPK-118 Permit / Approved Action Consume Preflight

- Gebaut: vier side-effect-freie Consume-Preflight-Schichten:
  `cockpitPatchPermitConsumePreflight`, `memoryCacheAuditExportPermitConsumePreflight`,
  `runtimePatchPermitConsumePreflight` und `releaseGovernanceApprovedActionConsumePreflight`.
- Verhalten: Permit- und Approved-Action-Artefakte werden fuer spaeteren Konsum vorgeprueft. Es
  wird kein Permit konsumiert, keine Action konsumiert, kein Patch angewendet, kein Export
  geschrieben, keine Runtime ausgefuehrt und kein Merge oder externe Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Consume-Preflight-Tests und Typecheck sind vor Review-Finalisierung
  gruen; Task-Lock-Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke koennen Consume-Authority vorbereiten, weiterhin ohne
  Permit-Konsum, Action-Konsum, Write, Execution oder Merge.

## 2026-06-14 - BPK-111 bis BPK-114 Permit Issue / Approved Action Authority

- Gebaut: vier side-effect-freie Authority-Artefakt-Schichten:
  `cockpitPatchPermitIssueAuthority`, `memoryCacheAuditExportPermitIssueAuthority`,
  `runtimePatchPermitIssueAuthority` und `releaseGovernanceApprovedActionAuthority`.
- Verhalten: Ready-Preflights erzeugen side-effect-freie Permit- oder Action-Artefakte. Es wird
  kein Permit konsumiert, kein Patch angewendet, kein Export geschrieben, keine Runtime
  ausgefuehrt und kein Merge oder externe Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Authority-Tests und Typecheck sind vor Review-Finalisierung gruen;
  Task-Lock-Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke koennen Consume-Preflight vorbereiten, ohne
  Permit-Konsum, Write, Execution oder Merge.

## 2026-06-14 - BPK-107 bis BPK-110 Permit Issue / Approved Action Preflight

- Gebaut: vier reine Preflight-Schichten:
  `cockpitPatchPermitIssuePreflight`, `memoryCacheAuditExportPermitIssuePreflight`,
  `runtimePatchPermitIssuePreflight` und `releaseGovernanceApprovedActionPreflight`.
- Verhalten: Approved Authority-Decision-Gates werden fuer Permit-Issue oder Approved-Action
  vorgeprueft. Es wird kein Permit ausgestellt, kein Patch angewendet, kein Export geschrieben,
  keine Runtime ausgefuehrt und keine Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke koennen Permit-Issue-Authority oder Approved-Action-
  Authority vorbereiten, ohne Issuance, Write, Execution oder Merge.

## 2026-06-14 - BPK-103 bis BPK-106 Authority Review Decision Gates

- Gebaut: vier reine Authority-Review-Decision-Gates:
  `cockpitPatchAuthorityReviewDecisionGate`,
  `memoryCacheAuditExportAuthorityReviewDecisionGate`,
  `runtimePatchAuthorityReviewDecisionGate` und
  `releaseGovernanceAuthorityReviewDecisionGate`.
- Verhalten: Authority-Review-Intake wird in explizite `approve`, `defer` oder `reject`
  Entscheidungen ueberfuehrt. Nur `approve` kann den naechsten Task-Lock oeffnen; es wird kein
  Permit ausgestellt, kein Patch angewendet, kein Export geschrieben, keine Runtime ausgefuehrt
  und keine Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sollten Permit-Issue- oder Approved-Action-Preflight
  vorbereiten, weiterhin ohne Issuance, Write, Execution oder Merge.

## 2026-06-14 - BPK-099 bis BPK-102 Authority Review Intake

- Gebaut: vier reine Authority-Review-Intake-Schichten:
  `cockpitPatchAuthorityReviewIntake`, `memoryCacheAuditExportAuthorityReviewIntake`,
  `runtimePatchAuthorityReviewIntake` und `releaseGovernanceAuthorityReviewIntake`.
- Verhalten: Request-Packets werden fuer spaetere Authority-Review angenommen und mit Authority-
  Review-, Reviewer- und Intake-Evidence-Bezuegen versehen; es wird kein Permit ausgestellt,
  kein Patch angewendet, kein Export geschrieben, keine Runtime ausgefuehrt und keine Release-
  Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sollten Authority-Review-Decision-Gates vorbereiten,
  ohne Issuance, Write, Execution oder Merge.

## 2026-06-14 - BPK-095 bis BPK-098 Issuance / Approved Action Request Packets

- Gebaut: vier reine Request-Packet-Schichten:
  `cockpitPatchPermitIssuanceRequestPacket`,
  `memoryCacheAuditExportPermitIssuanceRequestPacket`,
  `runtimePatchPermitIssuanceRequestPacket` und
  `releaseGovernanceApprovedActionRequestPacket`.
- Verhalten: Readiness-Artefakte werden in Request-Packets fuer spaetere Authority-Review
  uebersetzt; es wird kein Permit ausgestellt, kein Patch angewendet, kein Export geschrieben,
  keine Runtime ausgefuehrt und keine Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sollten Authority-Review-Intake fuer diese Request-
  Packets vorbereiten, ohne Issuance oder Ausfuehrung.

## 2026-06-14 - BPK-091 bis BPK-094 Permit Issuance / Approved Action Readiness

- Gebaut: vier reine Readiness-Schichten:
  `cockpitPatchPermitIssuanceReadiness`, `memoryCacheAuditExportPermitIssuanceReadiness`,
  `runtimePatchPermitIssuanceReadiness` und `releaseGovernanceApprovedActionReadiness`.
- Verhalten: Permit-Prep-Evidence und Handoff-Prep-Evidence werden gegen Issuer-/Policy- oder
  Approver-/Policy-Bezuege als readiness bewertet; es wird kein Permit ausgestellt, kein Patch
  angewendet, kein Export geschrieben, keine Runtime ausgefuehrt und keine Release-Aktion
  ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sollten Permit-Issuance-Request-Packets und
  Release-Action-Request-Packets vorbereiten, ohne Issuance oder Ausfuehrung.

## 2026-06-14 - BPK-087 bis BPK-090 Permit / Handoff Prep Evidence

- Gebaut: vier reine Evidence-Pack-Schichten:
  `cockpitPatchPermitPrepEvidence`, `memoryCacheAuditExportPermitPrepEvidence`,
  `runtimePatchPermitPrepEvidence` und `releaseGovernanceHandoffPrepEvidence`.
- Verhalten: Permit-Prep- und Handoff-Prep-Metadaten werden mit Evidence- und Reviewer-Bezuegen
  fuer Operator-Review gebuendelt; es wird kein Permit ausgestellt, kein Patch angewendet, kein
  Export geschrieben, keine Runtime ausgefuehrt und keine Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke koennen Permit-Issuance-Readiness und Approved-
  Action-Readiness vorbereiten, weiterhin ohne Issuance, Write, Execution oder Merge.

## 2026-06-14 - BPK-083 bis BPK-086 Approved Action Permit / Handoff Prep

- Gebaut: vier reine Prep-Schichten:
  `cockpitPatchApprovedActionPermitPrep`, `memoryCacheAuditExportApprovedActionPermitPrep`,
  `runtimePatchApprovedActionPermitPrep` und `releaseGovernanceApprovedActionHandoffPrep`.
- Verhalten: Approved Decisions werden in Permit-Request- oder Handoff-Metadaten fuer spaetere
  Task-Locks uebersetzt; es wird kein Permit ausgestellt, kein Patch angewendet, kein Export
  geschrieben und keine Release-Aktion ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke koennen Permit-/Handoff-Prep-Evidence buendeln,
  bevor echte Permit-Ausstellung, Writes oder Release-Aktionen beruehrt werden.

## 2026-06-14 - BPK-079 bis BPK-082 Operator / Final Decision Gates

- Gebaut: vier reine Decision-Gate-Schichten:
  `cockpitPatchOperatorDecisionGate`, `memoryCacheAuditExportDecisionGate`,
  `runtimePatchOperatorDecisionGate` und `releaseGovernanceFinalDecisionGate`.
- Verhalten: Cockpit-/Runtime-Dry-Run-Evidence, Memory-Cache-Preview-Evidence und Release-
  Runbook-Evidence koennen in explizite `approve`, `defer` oder `reject` Entscheidungen
  ueberfuehrt werden; `approve` oeffnet nur den naechsten Task-Lock, keine Aktion.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sollten Approved-Action-Permit-Prep-Schichten bauen,
  also Genehmigungen in neue Permit-/Task-Lock-Vorbereitungen uebersetzen, ohne auszufuehren.

## 2026-06-14 - BPK-075 bis BPK-078 Dry Run / Preview / Runbook Evidence

- Gebaut: vier reine Evidence-Schichten:
  `cockpitPatchOperatorDryRunEvidence`, `memoryCacheAuditExportPreviewEvidence`,
  `runtimePatchOperatorDryRunEvidence` und `releaseGovernanceRunbookEvidence`.
- Verhalten: Cockpit- und Runtime-Operator-Dry-Runs werden beweisbar gebuendelt, aber nicht
  angewendet; Memory-Cache-Audit-Preview wird als Evidence-Pack konserviert, aber nicht
  geschrieben; Release-Governance-Runbooks bekommen Review-/Handoff-Evidence, aber keine Aktion.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke koennen die Evidence-Schichten zu Operator-Decision-
  Gates verdichten, ohne echte Anwendung, Datei-Ausgabe oder Release-Aktion zu oeffnen.

## 2026-06-14 - BPK-071 bis BPK-074 Operator Dry Runs / Render Dry Run / Runbook

- Gebaut: vier reine Dry-Run-/Runbook-Schichten:
  `cockpitServerPatchOperatorDryRun`, `memoryCacheAuditExportRenderDryRun`,
  `runtimeServerPatchOperatorDryRun` und `releaseGovernanceOperatorActionRunbook`.
- Verhalten: Cockpit- und Runtime-Patch-Anwendung werden als Operator-Dry-Run simuliert, aber
  nicht angewendet; Memory-Cache-Audit-Export wird als Preview gerendert, aber nicht geschrieben;
  Release-Governance-Operator-Aktionen werden als Runbook beschrieben, aber nicht ausgefuehrt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sollten eine explizite Operator-Evidence-Schicht
  vorbereiten, bevor irgendeine echte Anwendung, Datei-Ausgabe oder Release-Aktion geoeffnet wird.

## 2026-06-14 - BPK-067 bis BPK-070 Application Readiness / Evidence / Approval

- Gebaut: vier reine Readiness-/Evidence-/Approval-Schichten:
  `cockpitServerPatchApplicationReadiness`, `memoryCacheAuditExportEvidencePack`,
  `runtimeServerPatchApplicationReadiness` und `releaseGovernanceOperatorApprovalGate`.
- Verhalten: Cockpit- und Runtime-Patch-Kandidaten werden fuer spaetere Anwendung bewertet,
  aber nicht angewendet; Memory-Cache-Audit-Export wird als Evidence-Pack gebuendelt, aber nicht
  geschrieben; Release-Governance-Handoff wird hinter ein explizites Operator-Approval-Gate
  gelegt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sollten weiterhin trocken bleiben: Cockpit Server
  Patch Operator Dry Run, Memory Cache Audit Export Render Dry Run, Runtime Server Patch Operator
  Dry Run und Release Governance Operator Action Runbook.

## 2026-06-14 - BPK-063 bis BPK-066 Patch Candidates / Audit Export / Handoff

- Gebaut: vier reine Candidate-/Export-/Handoff-Schichten:
  `cockpitServerPatchCandidate`, `memoryCacheAuditExportContract`,
  `runtimeServerPatchCandidate` und `releaseGovernanceHandoffPacket`.
- Verhalten: Cockpit- und Runtime-Patch-Preflights werden in konkrete Patch-Kandidaten
  ueberfuehrt, aber nicht angewendet; Memory-Cache-Audit-Trails bekommen einen Export-Contract
  ohne Datei-Write; Release-Governance-Entscheidungen werden in ein Operator-Handoff-Packet
  gebuendelt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sind die Anwendungsvorbereitung und Operator-Gates
  vor jeder echten Mutation: Cockpit Server Patch Application Readiness, Memory Cache Audit
  Export Evidence Pack, Runtime Server Patch Application Readiness und Release Governance
  Operator Approval Gate.

## 2026-06-14 - BPK-059 bis BPK-062 Patch Preflight / Audit / Release Decision

- Gebaut: vier reine Preflight-/Audit-/Decision-Schichten:
  `cockpitMountPatchPreflight`, `memoryCacheInvalidationAuditTrail`,
  `runtimeMountPatchPreflight` und `prReceiptGovernanceReleaseDecision`.
- Verhalten: Cockpit- und Runtime-Mount-Patches werden gegen Plan, Route, Env-Gate und geplante
  Dateien vorgeprueft, aber nicht angewendet; Memory-Invalidation bekommt einen auditierbaren
  Trail; PR-Receipt-Promotion wird als Release-Governance-Entscheidung bewertet.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sind die letzten Pre-Implementation-Gates vor echter
  Server-Mutation: Cockpit Server Patch Candidate, Memory Cache Audit Export Contract, Runtime
  Server Patch Candidate und Release Governance Handoff Packet.

## 2026-06-14 - BPK-055 bis BPK-058 Implementation Plans / Evidence Promotion

- Gebaut: vier reine Plan-/Gate-Schichten:
  `cockpitMountImplementationPlan`, `memoryCacheInvalidationEvidenceBinding`,
  `runtimeMountImplementationPlan` und `prReceiptEvidencePromotionGate`.
- Verhalten: Cockpit- und Runtime-Mounts bekommen Implementation-Plaene, aber keine Datei wird
  gemountet; Memory-Invalidation-Evidence wird an Store/Facade-Binding geknuepft; PR-Receipt-
  Evidence kann in Release-Governance promoted werden, aber ohne Merge oder externe Aktion.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sind Implementation-Preflight und Governance:
  Cockpit Mount Patch Preflight, Memory Cache Invalidation Audit Trail, Runtime Mount Patch
  Preflight und PR Receipt Governance Release Decision.

## 2026-06-13 - BPK-051 bis BPK-054 Default-off Mounts / Invalidation / Evidence

- Gebaut: vier reine Contract-/Evidence-Schichten:
  `cockpitDefaultOffMountContract`, `memoryCacheOperatorInvalidationContract`,
  `runtimeDefaultOffMountContract` und `prReceiptLoaderEvidencePack`.
- Verhalten: Cockpit- und Runtime-Mounts werden nur als default-off Contract-Formen beschrieben,
  ohne Server zu aendern; Memory-Cache-Invalidation ist operator-gated und nur in-process; PR-
  Receipt-Loader-Evidence wird review-only gebuendelt.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sind die ersten Implementation-Readiness-Schritte fuer
  default-off Mounts und Operator-Verfahren: Cockpit Mount Implementation Plan, Memory Cache
  Invalidation Evidence Binding, Runtime Mount Implementation Plan und PR Receipt Evidence
  Promotion Gate.

## 2026-06-13 - BPK-047 bis BPK-050 Mount Readiness / Binding / Runbook

- Gebaut: vier kontrollierte Adoption-Schichten:
  `cockpitHandlerMountReadiness`, `memoryCacheFacadeStoreBinding`,
  `runtimeHandlerMountReadiness` und `prReceiptLoaderOperatorRunbook`.
- Verhalten: Cockpit- und Runtime-Handler koennen als mount-ready bewertet werden, ohne Server
  oder Routen zu aendern; Store-Shell und Read-Facade werden ueber Lifecycle-Checks gebunden;
  PR-Receipt-Loader-Nutzung wird als Operator-Runbook-Contract beschrieben.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sind Server-Mount-Entscheidungen und Live-Operator-
  Verfahren nur als Default-off-/Policy-Schichten: Cockpit Default-off Mount Contract, Memory
  Cache Operator Invalidation Contract, Runtime Default-off Mount Contract und PR Receipt Loader
  Evidence Pack.

## 2026-06-13 - BPK-043 bis BPK-046 Handler/Store/Loader Implementations

- Gebaut: vier eng begrenzte Implementierungsschichten:
  `cockpitRouteSourceHandlerSkeleton`, `liveAicosMemoryCacheStoreShell`,
  `runtimeExecutionRouteHandlerSkeleton` und `prReceiptFileLoaderImplementation`.
- Verhalten: Cockpit kann zwischen Sample- und geliefertem Live-Modell waehlen, ohne Route zu
  mounten; Live-AICOS-Entries koennen in einem Prozessspeicher gehalten und gelesen werden;
  Runtime-Execution-Requests werden gegen bestehende Contracts validiert, ohne auszufuehren;
  PR-Receipt-JSON-Dateien koennen lokal unter Root-/Path-/Max-Byte-Guard geladen und durch den
  bestehenden BPK-031-Import geschickt werden.
- Sicherheitsentscheidung: Keine Server-Mounts, keine Renderer-Aenderung, keine Durable
  Persistenz, keine DB, kein Provider, keine GitHub-Aktion, keine PR-Erstellung, kein Merge, kein
  Write, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sind kontrollierte Adoption-Schritte: Cockpit
  Handler Mount Readiness, Memory Cache Facade Store Binding, Runtime Handler Mount Readiness und
  PR Receipt Loader Operator Runbook.

## 2026-06-13 - BPK-039 bis BPK-042 Mount/Facade/Loader Contracts

- Gebaut: vier side-effect-freie Contract-/Facade-Schichten:
  `cockpitRouteSourceMountPrep`, `liveAicosMemoryCacheReadFacade`,
  `runtimeExecutionRouteMountContract` und `prReceiptFileLoaderContract`.
- Verhalten: Cockpit-Source-Mount wird vorbereitet, Memory-Cache-Read wird als read-only
  Fassade gebuendelt, Runtime-Execution-Route bekommt einen Mount-Contract, und PR-Receipt-
  File-Loader bekommt einen Request/Response-Contract.
- Sicherheitsentscheidung: Keine Route-Aenderung, kein File-Read, keine GitHub-Aktion, keine
  Persistenz, keine DB, kein Provider, keine Runtime-Ausfuehrung, kein Deploy und keine Package-
  Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sind die echten, aber weiterhin default-off
  Integrationsschichten: Cockpit Route Source Handler, Memory Cache Store Shell, Runtime
  Execution Route Handler Skeleton und PR Receipt File Loader Implementation.

## 2026-06-13 - BPK-035 bis BPK-038 Route/Cache/Runtime/File Decisions

- Gebaut: vier side-effect-freie Readiness-/Decision-Schichten:
  `cockpitLiveModelRouteSourceContract`, `liveAicosMemoryCacheLifecycleGuard`,
  `runtimeExecutionRouteMountReadiness` und `prReceiptArtifactFileLoaderDecision`.
- Verhalten: Cockpit-Live-Modelle koennen als kuenftige Quelle fuer `/cockpit/read-only`
  klassifiziert werden; Memory-Cache-Eintraege bekommen Max-Age/Stale/Invalidation-Regeln;
  Runtime-Execution-Mount-Readiness kombiniert Preflight und Route-Contract; PR-Receipt-Dateien
  werden nur als kuenftige Leseentscheidung bewertet.
- Sicherheitsentscheidung: Keine Route-Aenderung, kein File-Read, keine GitHub-Aktion, keine
  Persistenz, keine DB, kein Provider, keine Runtime-Ausfuehrung, kein Deploy und keine Package-
  Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sind die ersten tatsaechlichen Mount-/Loader-
  Vorbereitungen, weiterhin einzeln und default-off: Cockpit Route Source Mount Prep, Memory
  Cache Read Facade, Runtime Execution Route Mount Contract und PR Receipt File Loader Contract.

## 2026-06-13 - BPK-031 bis BPK-034 Adapter/Contract Implementation Bundle

- Gebaut: vier enge Implementierungsbausteine:
  `prReceiptArtifactImport`, `cockpitLiveModelAdapter`, `liveAicosMemoryCacheAdapter` und
  `runtimeExecutionRouteContract`.
- Verhalten: PR-Receipt-Artefakte werden nur aus uebergebenen Objekten/JSON-Strings importiert;
  Cockpit-Live-Modelle werden materialisiert, aber nicht geroutet; Live-AICOS-Cache-Eintraege
  bleiben explizite In-Memory-Objekte; Runtime-Execution-Route bleibt Request/Response-Contract
  mit `executionAllowed:false`.
- Sicherheitsentscheidung: Keine Datei-Artefakt-Lader, keine GitHub-Aktion, keine PR-Erstellung,
  kein Merge, kein Route-Mount, keine Cockpit-Verdrahtung, kein Durable Store, keine DB, kein
  Provider, keine Runtime-Ausfuehrung, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sind kontrollierte Wiring-Readiness: Cockpit Live
  Model Route Source Contract, Memory Cache Lifecycle Guard, Runtime Execution Route Mount
  Readiness und PR Receipt Artifact File Loader Decision.

## 2026-06-13 - BPK-027 bis BPK-030 Operational Preflight Bundle

- Gebaut: vier side-effect-freie Operationalisierungs-Planer:
  `branchPrReceiptIntakeReport`, `cockpitLiveModelAdapterPlan`,
  `liveAicosMemoryCacheAdapterPlan` und `runtimeExecutionMountPreflight`.
- Verhalten: PR-Receipts werden nur normalisiert und berichtet; Live-AICOS-Cards werden nur als
  kuenftiges read-only Cockpit-Modell geplant; Memory-Cache wird nur als TTL-/Expiry-Plan
  berechnet; Runtime-Ausfuehrung bekommt nur einen Mount-Preflight fuer eine spaetere neue Route.
- Sicherheitsentscheidung: Keine GitHub-Aktion, keine PR-Erstellung, kein Merge, keine Route,
  keine Cockpit-Verdrahtung, keine Persistenz, keine DB, kein Provider, keine Runtime-
  Ausfuehrung, kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechste Hauptbloecke sind echte, eng begrenzte Adapter-Implementierungen:
  PR-Receipt-Artifact-Import, Cockpit-Live-Model-Adapter, Memory-only Cache-Adapter und Runtime-
  Execution-Route-Contract, weiterhin ohne automatische Writes.

## 2026-06-13 - BPK-023 bis BPK-026 Decision Bundle

- Gebaut: vier side-effect-freie Entscheidungsschichten:
  `bpkBranchPrConsolidation`, `cockpitLiveModelSourceDecision`,
  `liveAicosCachePersistenceDecision` und `runtimeExecutionDecision`.
- Verhalten: Branch/PR-Konsolidierung kombiniert vorhandene Sequenz- und Receipt-Pruefung ohne
  GitHub-Aufruf. Cockpit-Live-Quelle bleibt read-only und braucht accepted Network Intake plus
  Operator-Review. AICOS-Cache erlaubt nur kuenftige Memory-only-Bereitschaft; durable Cache bleibt
  blockiert. Runtime-Ausfuehrung bleibt contract-only, ausser ein spaeterer Dry-run-Execution-Pfad
  bringt Operator-, Maya-Gate-, Provider-Isolation- und Laufzeit-Evidence.
- Sicherheitsentscheidung: Keine PR-Erstellung, kein Merge, keine Route, keine Cockpit-Wiring-
  Aenderung, keine Persistenz, keine DB, kein GitHub, kein Provider, keine Runtime-Ausfuehrung,
  kein Deploy und keine Package-Aenderung.
- Beweis: vier fokussierte Tests und Typecheck sind vor Review-Finalisierung gruen; Task-Lock-
  Verify, Diff-Check und voller Builder-Testlauf muessen vor Commit gruen sein.
- Roter Faden weiter: Naechster Hauptblock ist kontrollierte Operationalisierung: PR-Receipt-
  Intake/Report, Cockpit-Live-Model-Adapter-Plan, Memory-only-Cache-Adapter-Plan und Runtime-
  Execution-Mount-Preflight, weiterhin ohne automatische Writes.

## 2026-06-13 - BPK-022 Live AICOS Network Connector

- Gebaut: `builder/src/liveAicosNetworkConnector.ts` als isolierter Netzwerk-Connector fuer
  Live-AICOS-Card-Payloads.
- Verhalten: Der Connector fetched nur bei ready BPK-015-Vertrag, `liveFetchAllowed`, expliziter
  HTTPS-URL ohne eingebettete Credentials und Auth-Token-Provider. Das Ergebnis wird sofort durch
  den bestehenden BPK-019-Intake-Adapter geleitet.
- Sicherheitsentscheidung: Keine Route, kein Scheduler, kein Cache-Write, keine DB, kein GitHub,
  keine Cockpit-Live-Datenquelle und keine Runtime-Ausfuehrung. Tokenwerte werden nur fuer den
  Request-Header genutzt und nicht im Result serialisiert.
- Beweis: fokussierter Network-Connector-Test, Typecheck, Task-Lock-Verify und Diff-Check muessen
  vor Commit gruen sein.
- Roter Faden weiter: Naechster gebuendelter Hauptblock ist Branch/PR Consolidation plus Cockpit
  Live Model Source Decision, bevor Runtime Execution geoeffnet wird.

## 2026-06-13 - BPK-021 Cockpit Route Mounting Read-Only

- Gebaut: `builder/src/cockpitReadOnlyRoute.ts` und Mount in `builder/src/server.ts` fuer
  `/cockpit/read-only`.
- Verhalten: Die Route ist default-off hinter `BLUEPILOT_COCKPIT_READ_ONLY_ROUTE_ENABLED=true`.
  GET rendert eine sichere Sample-Preview, POST rendert ein uebergebenes Cockpit-Modell nach
  Minimalvalidierung.
- Sicherheitsentscheidung: Read-only HTML, keine ausfuehrbaren Actions, keine Runtime-Aktion,
  kein Provider, keine DB, kein GitHub-Write, kein Deploy und kein Live-AICOS.
- Beweis: fokussierter Route-Test, Typecheck, lokaler Playwright-Screenshot, Task-Lock-Verify,
  Diff-Check und voller Builder-Testlauf waren vor Commit gruen.
- Roter Faden weiter: Naechster Hauptblock ist Live AICOS Network Connector, nicht Runtime
  Execution.

## 2026-06-13 - BPK-020 Runtime Route Mounting Dry Run

- Gebaut: `builder/src/runtimeDryRunRoute.ts` und Mount in `builder/src/server.ts` fuer
  `POST /probe/runtime-dry-run`.
- Verhalten: Die Route ist default-off hinter `BLUEPILOT_RUNTIME_DRY_RUN_ROUTE_ENABLED=true`.
  Wenn offen, validiert sie den BPK-017-Request-Contract und gibt nur einen BPK-013-Dry-Run-
  Plan zurueck.
- Sicherheitsentscheidung: Kein Orchestrator-Aufruf, kein Provider, keine DB, kein GitHub-Write,
  kein Deploy, kein Live-AICOS. Dies ist eine gemountete Contract-Oberflaeche, keine Ausfuehrung.
- Beweis: fokussierter Route-Test und Typecheck muessen vor Commit gruen sein.
- Roter Faden weiter: Naechster Hauptblock ist Cockpit Route Mounting, nicht Runtime Execution.

## 2026-06-13 - BPK-019 Live AICOS Connector Through Intake

- Gebaut: `builder/src/liveAicosConnectorThroughIntake.ts` als side-effect-freier Adapter fuer
  bereits gelieferte AICOS-Payloads.
- Verhalten: Ein Payload wird nur bei ready BPK-015-Fetch-/Cache-Vertrag angenommen und immer
  durch BPK-010-Intake normalisiert. Intake-Quarantaene wird `review_required`, nicht still
  akzeptiert.
- Sicherheitsentscheidung: Kein Live-Fetch, kein Cache-Write, kein Provider, keine DB, keine
  Route, kein GitHub-Write, keine Runtime und keine UI.
- Beweis: fokussierter Connector-through-Intake-Test, Typecheck und voller Builder-Testlauf
  muessen vor Commit gruen sein.
- Roter Faden weiter: Die angeforderte Fortsetzung ist nach BPK-019-Verify/Commit/Push
  abgeschlossen. Naechste Hauptbloecke: Runtime Route Mounting, Cockpit Route Mounting, Live
  AICOS Network Connector, Branch/PR Consolidation.

## 2026-06-13 - BPK-018 Cockpit Read-Only UI

- Gebaut: `builder/src/cockpitReadOnlyHtml.ts` als side-effect-freier HTML-Renderer fuer
  BPK-009-Cockpit-Projektionen.
- Verhalten: Ready-, Review- und Blocked-Zustaende werden als statisches Cockpit HTML gerendert;
  alle Actions bleiben disabled und Modelltexte werden escaped.
- Sicherheitsentscheidung: Keine gemountete Route, keine Runtime-Aktion, kein Provider, keine DB,
  kein GitHub-Write, kein Deploy und kein Live-AICOS-Aufruf.
- Beweis: fokussierter Renderer-Test, Typecheck und temporaerer Static-Preview-Check muessen vor
  Commit gruen sein.
- Roter Faden weiter: Live AICOS Connector through Intake darf erst nach BPK-018-Verify und
  Review-Packet geoeffnet werden.

## 2026-06-13 - BPK-017 Runtime Dry-Run Route Contract

- Gebaut: `builder/src/runtimeDryRunRouteContract.ts` als side-effect-freier Request/Response-
  Vertrag fuer eine spaetere Runtime-Dry-Run-Route.
- Verhalten: POST, Confirm-Phrase, passende Instruction und ein `ready` BPK-013-Plan sind
  Pflicht. Blockierte oder review-pflichtige Plaene werden nicht als Erfolg dargestellt.
- Sicherheitsentscheidung: Keine gemountete Route, kein `server.ts`, kein `probeDryRun.ts`, kein
  Orchestrator, kein Provider, keine DB, kein GitHub-Write und keine UI.
- Beweis: fokussierter Runtime-Dry-Run-Route-Contract-Test und Typecheck muessen vor Commit
  gruen sein.
- Roter Faden weiter: Cockpit Read-Only UI darf erst nach BPK-017-Verify und Review-Packet
  geoeffnet werden.

## 2026-06-13 - BPK-016 PR Review Manual Receipts

- Gebaut: `builder/src/bpkPrReviewManualReceipts.ts` als side-effect-freier Normalizer fuer
  manuell uebergebene PR-/Review-Receipts.
- Verhalten: Gueltige Receipts werden zu BPK-012-kompatiblen Review-Records; ungueltige PR-URLs,
  Decisions, Checks, fehlende Commits oder doppelte Tasks werden quarantaenisiert.
- Sicherheitsentscheidung: Kein GitHub-Connector, keine PR-Erstellung, kein Merge, kein Workflow,
  keine Runtime und keine UI.
- Beweis: fokussierter Manual-Receipt-Test und Typecheck muessen vor Commit gruen sein.
- Roter Faden weiter: Runtime Dry-Run Route Contract darf erst nach BPK-016-Verify und
  Review-Packet geoeffnet werden.

## 2026-06-13 - BPK-015 Live AICOS Fetch/Cache Contract

- Gebaut: `builder/src/liveAicosFetchCacheContract.ts` als side-effect-freier Readiness-Vertrag
  fuer einen spaeteren Live-AICOS-Fetch-/Cache-Connector.
- Verhalten: Endpoint-Referenz, Auth-Referenz, Cache-TTL, Stale-Verhalten, Quarantaene und
  Fetch-Limits werden geprueft. Token-aehnliche Auth-Werte werden blockiert.
- Sicherheitsentscheidung: Kein Live-AICOS-Aufruf, kein Cache-Write, keine Persistenz, keine
  Route, kein Provider, keine DB, kein GitHub-Write, keine UI und kein Deploy.
- Beweis: fokussierter Fetch/Cache-Contract-Test, Typecheck und voller Builder-Testlauf muessen
  vor Commit gruen sein.
- Roter Faden weiter: Die angeforderte Viererfolge ist nach BPK-015-Verify/Commit/Push
  abgeschlossen. Naechste Hauptbloecke: PR/Review Connector oder manuelle PR-Ausfuehrung,
  Runtime Dry-Run Route, Cockpit Read-Only UI, Live AICOS Connector.

## 2026-06-13 - BPK-014 Cockpit UI Implementation Plan

- Gebaut: `builder/src/cockpitUiImplementationPlan.ts` als side-effect-freier Planer fuer eine
  spaetere Cockpit-UI-Umsetzung.
- Verhalten: Der Plan erzeugt Screens, deaktivierte Controls, Visual-Evidence-Gates und
  naechste Aktionen aus dem Cockpit-Projection-Vertrag. Invalides Modell oder aktivierte
  Executable Actions blockieren.
- Sicherheitsentscheidung: Keine UI-Dateien, kein CSS/HTML/React, keine Route, kein Screenshot,
  keine Runtime-Aktion und keine Package-/Deploy-Aenderung.
- Beweis: fokussierter Cockpit-UI-Plan-Test und Typecheck muessen vor Commit gruen sein.
- Roter Faden weiter: Live AICOS Fetch/Cache Contract darf erst nach BPK-014-Verify und
  Review-Packet geoeffnet werden.

## 2026-06-13 - BPK-013 Runtime Dry-Run Adapter Contract

- Gebaut: `builder/src/runtimeDryRunAdapterContract.ts` als side-effect-freier Adapter-Vertrag
  fuer trockene Runtime-Invocation.
- Verhalten: Nur `runtime_candidate` mit `dryRunAllowed:true` kann `ready` werden. Blockierte,
  review-pflichtige oder write-faehige Integrationen werden nicht in diesen Dry-Run-Adapter
  gehoben.
- Sicherheitsentscheidung: Kein Server-Route, kein Orchestrator-Aufruf, kein Provider, keine DB,
  kein GitHub-Write, kein Deploy, keine UI. Die Invocation bleibt ein Datenvertrag.
- Beweis: fokussierter Runtime-Dry-Run-Adapter-Test und Typecheck muessen vor Commit gruen sein.
- Roter Faden weiter: Cockpit UI Implementation Plan darf erst nach BPK-013-Verify und
  Review-Packet geoeffnet werden.

## 2026-06-13 - BPK-012 PR/Review Execution Contract

- Gebaut: `builder/src/bpkPrReviewExecution.ts` als side-effect-freier Receipt-Evaluator fuer
  uebergebene PR-/Review-Metadaten.
- Verhalten: Missing PR, ungueltige PR-URL, Commit-Mismatch, nicht-gruene Checks und
  Changes-Requested blockieren Merge-Readiness; Pending Review bleibt review-pflichtig.
- Sicherheitsentscheidung: Kein PR-Create, kein GitHub-API-Aufruf, kein Merge, kein Push nach
  `main`, keine Workflow-, Runtime- oder UI-Aenderung.
- Beweis: fokussierter PR/Review-Execution-Test und Typecheck muessen vor Commit gruen sein.
- Roter Faden weiter: Runtime Dry-Run Adapter darf erst nach BPK-012-Verify und Review-Packet
  geoeffnet werden.

## 2026-06-13 - BPK-011 BPK Branch Merge/Release Sequencing

- Gebaut: `builder/src/bpkBranchMergeReleaseSequencing.ts` als side-effect-freier Planer fuer
  BPK-Branch-Reihenfolge, Blocker, Review-Items und Release-Notiz-Bullets.
- Verhalten: Fehlende Vorgaenger, doppelte Task-IDs, blockierte Kandidaten und nicht-gruene
  Checks blockieren Release-Readiness; review-pflichtige Kandidaten halten den Plan in Review.
- Sicherheitsentscheidung: Kein Git-Merge, kein Push nach `main`, keine PR-Erstellung, kein
  GitHub-API-Aufruf, kein Workflow, kein Deploy und keine Runtime/UI-Aenderung.
- Beweis: fokussierter Sequencing-Test, Typecheck und danach voller Builder-Testlauf muessen vor
  Commit gruen sein.
- Roter Faden weiter: Die angeforderte Viererfolge ist nach BPK-011-Verify/Commit/Push
  abgeschlossen. Naechste Hauptbloecke: PR/Review Execution, Runtime Dry-Run Adapter, Cockpit UI
  Implementation, Live AICOS Fetch/Cache.

## 2026-06-13 - BPK-010 Live AICOS/Card Binding Intake

- Gebaut: `builder/src/aicosCardBindingIntake.ts` als side-effect-freier Intake-Normalizer fuer
  angelieferte AICOS-Card-Snapshots.
- Verhalten: Gueltige Snapshots werden zu `DispatchConditionCard`-kompatiblen Daten; ungueltige,
  doppelte, unsafe-path oder evidence-lose Snapshots werden mit deterministischen Gruenden
  quarantaenisiert.
- Sicherheitsentscheidung: Kein Live-AICOS-Aufruf, kein Cache, keine Persistenz, keine Route,
  kein Provider, keine DB, kein GitHub-Write und keine UI. Dispatch-Semantik bleibt unveraendert.
- Beweis: fokussierter AICOS-Card-Intake-Test und Typecheck muessen vor Commit gruen sein.
- Roter Faden weiter: BPK Branch Merge/Release Sequencing darf erst nach BPK-010-Verify und
  Review-Packet geoeffnet werden.

## 2026-06-13 - BPK-009 Cockpit Projection Adoption Contract

- Gebaut: `builder/src/cockpitProjectionAdoptionContract.ts` als side-effect-freier Cockpit-
  Adoptionsvertrag fuer spaetere UI-Nutzung.
- Verhalten: Readiness-Projektion und Runtime-Integrationsvertrag werden zu einem
  cockpit-faehigen Modell mit `ready`, `review`, `blocked` oder `invalid`.
- Sicherheitsentscheidung: Blockierte und Review-Zustaende sind fuer Operator-Inspection
  renderbar, aber alle ausfuehrbaren Aktionen bleiben deaktiviert. Keine UI-Dateien, keine
  Route, keine Runtime-Aktion.
- Beweis: fokussierter Cockpit-Adoption-Test und Typecheck muessen vor Commit gruen sein.
- Roter Faden weiter: Live AICOS/Card Binding Intake darf erst nach BPK-009-Verify und
  Review-Packet geoeffnet werden.

## 2026-06-13 - BPK-008 Runtime Dispatch Integration Contract

- Gebaut: `builder/src/runtimeDispatchIntegrationContract.ts` als side-effect-freier
  Integrationsvertrag fuer spaetere Runtime-Adoption.
- Verhalten: BPK-007-Readiness-Projektionen werden als `runtime_candidate`, `operator_review`
  oder `blocked` klassifiziert. Dry-run und write-faehiger Runtime-Dispatch bleiben getrennt.
- Sicherheitsentscheidung: Write-faehige Adoption verlangt eine explizite Authority-Referenz.
  Der Block fuegt keine Route, keinen Orchestrator-Aufruf, keinen Provider, keine DB, keinen
  GitHub-Write und keine UI hinzu.
- Beweis: fokussierter Runtime-Integration-Contract-Test und Typecheck muessen vor Commit gruen
  sein.
- Roter Faden weiter: Cockpit Projection Adoption darf erst nach BPK-008-Verify und
  Review-Packet geoeffnet werden.

## 2026-06-13 - BPK-007 Dispatch / Frontend zuletzt

- Gebaut: `builder/src/dispatchFrontendReadiness.ts` als side-effect-freie Projektion aus
  WLP-Contract-Draft, Card-Conditioned-Dispatch-Plan und Pre-Registered-Claims-Gate.
- Verhalten: Die Projektion liefert `dispatch_ready`, `frontend_review` oder `blocked`.
  Dispatch ist nur erlaubt, wenn Card-Gate und Claim-Gate erlauben und der Contract explizite
  Evidence-Anforderungen hat.
- Sicherheitsentscheidung: Frontend bekommt nur ein spaeter konsumierbares Statusmodell; keine
  UI-Datei, keine Server-Route, kein Orchestrator, kein Provider, kein Push, kein Live-Write.
- Beweis: fokussierter Readiness-Test und Typecheck muessen vor Commit gruen sein.
- Roter Faden weiter: Die angeforderte BPK-Sequenz ist nach Verify/Commit/Push abgeschlossen.
  Naechste Hauptbloecke sind Runtime Adoption Sequencing, Cockpit Projection Adoption, Live
  AICOS/Card Binding und Merge/Release Sequencing.

## 2026-06-13 - BPK-006 CLI-Deduplizierung / Schema-Generierung

- Gebaut: `builder/scripts/generate-bpk-governance-manifest.mjs` erzeugt ein deterministisches
  Manifest fuer BPK-003 bis BPK-006: deduplizierte `required_commands` plus Schema-Definitionen
  fuer WorkerPacket/WLP-Draft, Card-Conditioned Dispatch und Pre-Registered Claims.
- Gebaut: `builder/data/bpk-governance-manifest.json` als committed Generator-Artefakt.
- Korrigiert: `builder/data/builder-repo-index.json` wurde mit dem bestehenden Generator
  normalisiert; der zuvor rote Repo-Index-Check ist wieder gruen.
- Beweis: `npm test` in `builder/` laeuft vollstaendig gruen mit 58/58 Tests. Zusaetzlich sind
  Manifest-Check, Repo-Index-Check und Typecheck gruen.
- Roter Faden weiter: Dispatch / Frontend zuletzt darf erst nach BPK-006-Verify und
  Review-Packet geoeffnet werden.

## 2026-06-13 - BPK-005 Pre-Registered Claims

- Gebaut: `builder/src/preRegisteredClaims.ts` als side-effect-freier Claim-Gate vor Dispatch.
- Verhalten: Alle Contract-Claims muessen exakt vorregistriert sein und mindestens eine Evidence-
  Referenz haben. Fehlende, unerwartete, doppelte oder evidence-lose Registrierungen blockieren.
- Sicherheitsentscheidung: Ein `review_required` oder `blocked` Card-Dispatch-Plan kann durch
  Claim-Registrierung nicht zu `allow` gehoben werden. Keine Runtime-Integration.
- Beweis: `npx tsx --test tests/preRegisteredClaims.test.ts` und `npm run typecheck` sind gruen.
- Roter Faden weiter: CLI-Deduplizierung / Schema-Generierung darf erst nach BPK-005-Verify und
  Review-Packet geoeffnet werden.

## 2026-06-13 - BPK-004 Card-Conditioned Dispatch

- Gebaut: `builder/src/cardConditionedDispatch.ts` als side-effect-freier Dispatch-Planer,
  der WLP-Contract-Drafts an explizite Card-Snapshots bindet.
- Verhalten: Der Planer entscheidet deterministisch `allow`, `review_required` oder `blocked`.
  Fehlende, ungueltige, blockierte, deprecated oder pfad-inkompatible Cards blockieren;
  Review-Cards stufen auf Review-only herunter.
- Sicherheitsentscheidung: Keine AICOS-Live-Abfrage, kein Worker-Dispatch, kein Provider,
  keine Server-Route, kein Push und kein Frontend.
- Beweis: `npx tsx --test tests/cardConditionedDispatch.test.ts` und `npm run typecheck`
  sind gruen.
- Roter Faden weiter: Pre-Registered Claims darf erst nach BPK-004-Verify und Review-Packet
  geoeffnet werden.

## 2026-06-13 - BPK-003 WorkerPacket-to-WLP-Adapter

- Gebaut: `builder/src/workerPacketWlpAdapter.ts` als side-effect-freier Adapter von
  WorkerPacket/EditEnvelope-Daten zu einem WLP-Contract-Draft.
- Sicherheitsentscheidung: Der Adapter schreibt keine Dateien, startet keine Worker, ruft keinen
  Provider auf, pusht nicht und ist nicht in `orchestrateTask` oder Runtime-Routen integriert.
- Fail-closed: Ungueltige Task-Metadaten, leere Edits, doppelte Edit-Pfade, unsichere Pfade,
  fehlende UI-Persona und geschuetzte Pfade werden mit deterministischen Fehlercodes abgelehnt.
- Beweis: `npx tsx --test tests/workerPacketWlpAdapter.test.ts` und `npm run typecheck` sind
  gruen. Der vollstaendige `npm test`-Lauf wurde versucht; 53/54 Tests waren gruen, der
  bestehende Repo-Index-Normalisierungscheck scheiterte unabhaengig von BPK-003.
- Roter Faden weiter: Card-Conditioned Dispatch darf erst nach BPK-003-Verify und Review-Packet
  geoeffnet werden.

## 2026-06-13 - BPK-002 Permit-Generalisierung

- Gebaut: `POST /probe/sandbox-write` verlangt fuer Write-Operationen jetzt eine
  syntaktisch enge `permitId`, bevor GitHub-Dateistatus oder Schreibkorridor beruehrt werden.
- Gebaut: Der Endpoint nutzt nach read-only State-Inspection den bestehenden
  `smartPush(..., { targetRepo, writePermit })`-Pfad als einzigen Consume-/Write-Korridor.
  Neue Dateien werden als Permit-Op `create` gebunden, bestehende Dateien als `update`
  mit aktueller `baseSha`.
- Sicherheitsentscheidung: Delete/Undo wird in diesem Block bewusst vor jeder GitHub-Mutation
  mit `sandbox_delete_requires_dedicated_permit` blockiert. Dafuer braucht es spaeter einen
  eigenen Permit-Vertrag.
- Beweis: `npm test` und `npm run typecheck` in `builder/` sind gruen. Die neuen Tests decken
  Missing-Permit, Create/Update-Permit-Wiring, SmartPush-Blockpropagation und Delete-Block ab.
- Roter Faden weiter: BPK-003 darf erst nach gruenem BPK-002-Verify und Review-Packet
  geoeffnet werden.

## 2026-06-13 - BPK-001 Doc-Drift-Hygiene

- Gebaut: Der neue Arbeitsanker `docs/CODEX-RICHTUNGSBRIEF-optimized.md` wurde aus dem
  externen Claude/Codex-Richtungsbrief bereinigt: Encoding repariert, Repo-Kontext geklaert,
  FORBIDDEN_FILES/GOAL_DELTA/Push-Regel/API-Test/Autonomie operationalisiert.
- Gebaut: `docs/CLAUDE-CONTEXT.md` wurde auf die echte BP-149-Wahrheit aus `STATE.md`
  gehoben. Der Anker beschreibt jetzt Builder-Subpackage, Render-Service
  `bluepilot-builder`, BP-147 Permit-Write-Proof, retired Legacy-Endpunkte und den
  BP-149-Pfad `POST /probe/sandbox-write`.
- Geprueft: Echte Anfrage an
  `https://maya-core.onrender.com/api/maya/memory?origin=bluepilot` lieferte HTTP 401
  mit `{"error":"unauthorized"}`. Harte Bewertung: `live-auth-required`.
- Sicherheitsentscheidung: Kein Runtime-Code, kein Builder-Code, keine Auth-/Token-/DB- oder
  Deploy-Aenderung. Ohne Gate-Token wird kein authentifizierter Bluepilot-Memory-Erfolg
  behauptet; lokaler Offline-Fallback bleibt korrekt.
- Roter Faden weiter: BPK-002 darf erst nach gruenem BPK-001-Verify geoeffnet werden.

## 2026-06-06 - BP-149 Maya sandbox write door

- Gebaut: Der alte Permit-Demo-Trigger `/probe/sandbox-permit-write` wurde durch
  `POST /probe/sandbox-write` ersetzt.
- Die Env-Wache `BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED=true` bleibt erhalten, aber
  Losungswort, Permit-ID und fester Dateiname sind entfernt.
- Der neue Handler akzeptiert nur `{ path, contentBase64 }`, validiert den Pfad,
  schreibt ausschliesslich nach `G-Dislioglu/bluepilot-sandbox` und entscheidet per
  GitHub-SHA zwischen create und update.
- `/probe/sandbox-real-write` bleibt retired und zeigt nun auf `/probe/sandbox-write`.

## 2026-06-02 - Legacy-Schreibpfade entschaerft (BP-148)

- Gebaut: Der alte `POST /probe/sandbox-real-write`-Pfad ist dauerhaft retired und antwortet
  mit HTTP 410 plus Verweis auf den Permit-Pfad. Das alte Flag
  `BLUEPILOT_SANDBOX_REAL_WRITE_ENABLED` kann diesen Pfad nicht mehr oeffnen.
- Gebaut: `POST /probe/sandbox-write-check` bleibt als Diagnose fuer GitHub-Schreibrechte in
  `G-Dislioglu/bluepilot-sandbox` erhalten, ist aber default-off hinter
  `BLUEPILOT_SANDBOX_WRITE_CHECK_ENABLED=true`.
- Sicherheitsentscheidung: Nach dem ersten echten Permit-Write gibt es keinen
  permit-umgehenden Content-Write-Probe mehr. Echte Inhalts-Writes laufen ueber
  `/probe/sandbox-permit-write` und spaeter ueber Policy-ausgestellte One-Shot-Permits.
- Korrektur am Claude-Paket: Das Ziel ist nicht, Maya dauerhaft unnoetig zu beschraenken.
  Mayas spaetere direkte Schreibfaehigkeit soll unbuerokratisch innerhalb eines erlaubten
  Policy-Rahmens passieren, aber nicht ueber Legacy-Bypass-Endpunkte.
- Beweis: Lokaler Scan fand keine automatisierten Aufrufer fuer `/probe/sandbox-write-check`,
  nur Contracts, Doku und Tests.
- Roter Faden weiter: Naechster bewusster Schritt ist die Entscheidung, ob Permit-Enforcement
  Dauerregel wird und wie Maya innerhalb enger Regeln selbst One-Shot-Permits ausstellen darf.

## 2026-06-02 - First Permit-Gated Sandbox Write (BP-147)

- Geprueft: Die Kette BP-143..146 wurde live ausgeloest. Maya-core stellte Permit
  `5b4121c2-d991-4b9b-afc8-d16e28d31aa3` fuer
  `G-Dislioglu/bluepilot-sandbox` / `.bluepilot/phase-3c-permit-write.md` aus
  (`op=create`, `contentHash=sha256:4e459ee4...`, `contentLen=86`).
- Ergebnis: Der erste Aufruf von `POST /probe/sandbox-permit-write` landete mit
  `write_succeeded`, `pushed=true`, `landed=true`, Commit
  `5327082bb0804ff1728ee39b2744fcec79d32906`. Der zweite Aufruf mit demselben
  Permit wurde mit `already_consumed` blockiert.
- Extern verifiziert: `bluepilot-sandbox/main` zeigt auf Commit `5327082...`; die Datei
  `.bluepilot/phase-3c-permit-write.md` existiert dort und ist 86 UTF-8-Bytes gross.
- Sicherheitsentscheidung: Das Bluepilot-Schreibfenster wurde wieder geschlossen; der
  Abschluss-Check lieferte HTTP 403 `sandbox_permit_write_disabled`. Die maya-core-
  Write-Flags muessen ebenfalls geschlossen bleiben.
- Roter Faden weiter: Permit-Gating ist einmal live bewiesen, aber permanentes Enforcement ist
  eine spaetere ausdrueckliche Entscheidung. Naechste separate Blocks: Legacy-Write-Pfad
  entschaerfen und Permit-Pfad fuer echte Builder-Aufgaben erweitern.

## 2026-06-02 - Permit-gated Sandbox Write Trigger (BP-146 Stage 3C prep)

- Gebaut: `POST /probe/sandbox-permit-write` als enger Live-Trigger fuer genau einen
  permit-gebundenen Sandbox-Write. Der Endpunkt ist geschlossen ohne
  `BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED=true`, verlangt die Confirm-Phrase
  `permit-write-to-bluepilot-sandbox` und akzeptiert nur `permitId` plus `contentBase64`.
- Ergebnis: Repo, Branch, Pfad, Operation und Base-SHA sind im Code fest verdrahtet:
  `G-Dislioglu/bluepilot-sandbox`, `main`, `.bluepilot/phase-3c-permit-write.md`,
  `create`, leere Base-SHA. Der Aufrufer kann das Ziel nicht ueber den Body umbiegen.
- Sicherheitsentscheidung: Kein Orchestrator-/Provider-Pfad, kein Live-Write im Task. Der Handler
  ruft `smartPush` direkt mit `writePermit` auf, sodass die BP-145 Byte-Output- und
  Korridor-Consume-Guards die eigentliche Freigabe pruefen.
- Korrektur am Claude-Paket: Der alte `/probe/sandbox-real-write`-Pfad ist fuer 3C ungeeignet,
  weil er `orchestrateTask` nutzt und keinen Permit an `smartPush` durchreicht. 3C braucht eine
  feste Content-Quelle und einen direkten Permit-Write-Trigger.
- Beweis: `npm test` in `builder/` laeuft mit 51 Tests gruen.
- Roter Faden weiter: Nach Merge/Deploy stellt maya-core den Permit mit dem echten Store aus;
  Bluepilot schreibt nur mit diesem Permit. Danach Reuse-Test und alle Write-Fenster wieder zu.

## 2026-06-02 - Write Permit Enforcement Byte Output (BP-145 Stage 3B)

- Gebaut: Bluepilot reicht die One-Shot-Permit-Felder bis zum Maya-Korridor weiter und berechnet
  den `contentHash` aus dem finalen UTF-8-Content direkt vor dem GitHub-Write. Der Permit-Pfad
  ist auf genau einen Whole-File-Create/Update begrenzt; Patch-Jobs werden in dieser Stufe nicht
  geraten oder still erlaubt.
- Ergebnis: `putFileContent` behaelt das alte Auto-Create/Update-Verhalten ohne Mode, kann fuer
  Permit-Writes aber explizit `create` ohne `sha` oder `update` mit `expectedBaseSha` ausfuehren.
  Damit wird GitHub selbst zur zweiten Schranke gegen TOCTOU.
- Sicherheitsentscheidung: Kein Live-Write, kein neuer Endpoint, keine Runtime-Flag-Aenderung,
  kein maya-core-Code. Der GitHub-PUT wird nur aufgerufen, wenn der Korridor mit
  `reason: "permit_consumed"` erlaubt.
- Korrektur am Claude-Paket: Die finale Byte-Grenze wurde lokal am echten Code geprueft:
  `Buffer.from(content).toString('base64')` bedeutet Hash ueber UTF-8-Content vor Base64. Der
  Permit-Pfad bleibt bewusst eng, statt Patch-Finalbytes zu erraten.
- Beweis: `npm test` in `builder/` laeuft mit 45 Tests gruen; `npm run typecheck` ist gruen.
  Neue Tests beweisen Permit-Payload-Weitergabe, create-only/update-only und Write-Block bei
  Korridor-Ablehnung.
- Roter Faden weiter: Stage 3C ist der eine echte Sandbox-Write mit bewusst ausgestelltem Permit
  und Reuse-Beweis. Erst danach wieder alle Write-Schalter geschlossen halten.

## 2026-06-02 - Write Permit contentHash Canon (BP-144 Stage 1)

- Gebaut: `builder/src/writePermitContentHash.ts` als seiteneffektfreie Hash-Kanonisierung fuer
  den kommenden One-Shot-Write-Permit. Die Funktion laengen-praefixiert Repo, Branch, Pfad,
  Operation, Base-SHA und finale Content-Bytes und hasht diese kanonischen Bytes mit SHA-256.
- Ergebnis: Bluepilot trifft den gemeinsam festgelegten Testvektor
  `sha256:4cf2991e34c573d82852a5293d9fae147c0bec2249fa9c71cae75b8ef7728576`. Dadurch hat
  Bluepilot dieselbe Sprache fuer `contentHash`, die maya-core als Aussteller ebenfalls
  implementiert.
- Sicherheitsentscheidung: Keine Permit-Registry, kein Consume, keine Korridor-, SmartPush-,
  Provider-, Route-, Flag- oder Deploy-Aenderung. Dies ist nur Stufe 1 der gemeinsamen
  Kanonisierung.
- Korrektur am Claude-Paket: Der Testvektor wurde lokal unabhaengig reproduziert und die neue
  Hilfsfunktion bewusst nicht mit altem Opus-Namensmuster benannt.
- Beweis: `npm test` und `npm run typecheck` in `builder/`, `node tools/verify-task-lock.cjs
  BP-144 --verify` und `git diff --check` sind fuer den lokalen Abschluss auszufuehren.
- Roter Faden weiter: Erst wenn Bluepilot und maya-core denselben Vektor gruen treffen, folgt
  die naechste Stufe: maya-core Permit-Register + atomarer Consume.

## 2026-06-01 - Non-default Whole-file Write Adapter (BP-142)

- Gebaut: `putFileContent` in `opusPatchMode.ts` als direkter GitHub-Contents-API-Write fuer
  ganze Dateien. Die Funktion legt neue Dateien ohne `sha` an und aktualisiert bestehende
  Dateien mit `sha`.
- Ergebnis: `smartPush` routet Overwrite/Create-Jobs fuer Nicht-Default-Ziele nicht mehr in den
  alten `/push`-Blocker, sondern schreibt direkt ins aufgeloeste Ziel-Repo. Fuer das Default-
  Ziel `soulmatch` bleibt der bestehende `/push`-Pfad unveraendert.
- Sicherheitsentscheidung: Kein neuer Endpoint, keine Profil-, Orchestrator-, Provider- oder
  Maya-Gate-Aenderung. Der Fix oeffnet nur den fehlenden Adapterpfad, nachdem BP-141 bereits
  Ziel, Datei, Confirm und Maya-Korridor absichert.
- Korrektur am Claude-Paket: Der Vorschlag war inhaltlich richtig, wurde aber WLP-kompatibel
  gemacht und ohne Live-GitHub-Write getestet. Token-Werte erscheinen nur in Request-Headern der
  Mocks, nicht in Resultaten oder Fehlern.
- Beweis: `npm test` in `builder/` laeuft mit 41 Tests gruen; `npm run typecheck` ist gruen.
  Neue Tests beweisen Create ohne `sha`, Update mit `sha`, Nicht-Default-Overwrite via direktem
  Whole-file-Write, fehlenden Token als klaren Fehler und unveraenderten Default-`/push`-Pfad.
- Roter Faden weiter: Nach VAL-K2, Merge und Deploy den BP-141-Live-Write einmal ausfuehren,
  dann alle Write-Env-Flags wieder schliessen.

## 2026-06-01 - Guarded Sandbox Real Write Trigger (BP-141)

- Gebaut: `POST /probe/sandbox-real-write` als eng bewachter Trigger fuer den ersten echten
  Sandbox-Write. Der Endpunkt bleibt geschlossen, bis
  `BLUEPILOT_SANDBOX_REAL_WRITE_ENABLED=true` gesetzt ist und die Confirm-Phrase stimmt.
- Ergebnis: Der Trigger erzwingt `targetProfileId: bluepilot-sandbox`, `dryRun:false`, eine
  feste Datei `.bluepilot/phase-b-real-write.md` und `skipInlinePostPushChecks:true`.
  `skipDeploy:true` wird bewusst NICHT gesetzt, weil das im Orchestrator den Push ueberspringt.
- Sicherheitsentscheidung: Nur das Sandbox-Profil wird auf `sandbox_real_write` /
  `pushAllowed:true` gestellt. Der Repo-Guard prueft vor Orchestrierung hart auf
  `G-Dislioglu/bluepilot-sandbox`. Request-Body-Felder wie Ziel, Scope, Datei oder Dry-Run
  werden nicht akzeptiert. Maya-Kill-Switch und Operator-Freigabe bleiben manuelle Env-Gates.
- Korrektur am Claude-Paket: Der Contract wurde WLP-kompatibel gemacht und enger gefasst:
  feste Sandbox-Datei statt frei interpretierbarer Instruction, kein `skipDeploy:true`, und
  der alte BP-139-Test wurde nur an die neue Profilwahrheit angepasst.
- Beweis: Der Live-Readiness-Probe aus BP-139 meldete vor dem Build `status: writable`.
  `npm test` in `builder/` laeuft mit 40 Tests gruen; `npm run typecheck` ist gruen.
- Roter Faden weiter: Nach VAL-K2, Merge und Deploy gestaffelt pruefen: zuerst Env aus -> 403,
  dann Builder-Env an bei geschlossenem Maya-Korridor -> kein Commit, erst danach bewusst
  Maya-Kill-Switch + Operator-Freigabe fuer genau einen Sandbox-Write.

## 2026-06-01 - Target-aware SmartPush (BP-140)

- Gebaut: Der bestehende SmartPush-Schreibadapter akzeptiert jetzt ein optionales
  `targetRepo` und nutzt dieses Ziel fuer direkte GitHub-Patches und Raw-Content-Fallbacks.
  Ohne Ziel bleibt der Default unveraendert `G-Dislioglu/soulmatch`.
- Ergebnis: `orchestrateTask` reicht das aufgeloeste `targetProfile.repo` an SmartPush weiter.
  Ein Sandbox-Profil kann damit spaeter auf `G-Dislioglu/bluepilot-sandbox` zeigen, statt
  trotz Profilwahl in Soulmatch zu landen.
- Sicherheitsentscheidung: Kein Kill-Switch, kein echter Write, kein neuer Endpoint und keine
  Profil-Aenderung. Nicht-target-aware Legacy-Dispatches ueber `/push` werden fuer
  Nicht-Default-Repos fail-safe blockiert.
- Korrektur am Claude-Paket: Der erste BP-140-Entwurf haette das Sandbox-Profil scharf gestellt,
  obwohl der echte Schreibadapter noch hart auf Soulmatch zeigte. Dieser Block ist deshalb nur
  der Ziel-Durchreichungs-Fix; der echte Mini-Write bleibt BP-141.
- Beweis: `npm test` in `builder/` laeuft mit 31 Tests gruen; `npm run typecheck`,
  `node tools/verify-task-lock.cjs BP-140 --verify` und `git diff --check` sind gruen.
- Roter Faden weiter: Nach VAL-K2 und Merge kann BP-141 den ersten echten Sandbox-Mini-Write
  gestaffelt vorbereiten.

## 2026-06-01 - Sandbox Write Readiness (BP-139)

- Gebaut: `bluepilot-sandbox` als eigenes, write-disabled Target-Profil und
  `POST /probe/sandbox-write-check` als guarded Readiness-Probe fuer den deployten
  GitHub-Token.
- Ergebnis: Der Probe schreibt nach expliziter Bestaetigung nur in
  `G-Dislioglu/bluepilot-sandbox`, legt eine kleine temporaere Datei unter `.bluepilot/`
  an und loescht sie wieder. Repo, Owner und Pfad werden nicht aus dem Request gelesen;
  Token-Werte werden nicht serialisiert.
- Sicherheitsentscheidung: Der Maya-Kill-Switch bleibt geschlossen. `opusSmartPush`,
  Orchestrator, Provider, Maya-Gate und Default-Target bleiben unveraendert, weil SmartPush
  derzeit noch hart auf `G-Dislioglu/soulmatch` zeigt.
- Beweis: `node tools/verify-task-lock.cjs BP-139 --preflight`, `npm test`,
  `npm run typecheck`, `node tools/verify-task-lock.cjs BP-139 --verify` und
  `git diff --check` sind gruen.
- Roter Faden weiter: Nach Merge und Deploy den Sandbox-Write-Probe live ausfuehren. Erst wenn
  er `writable` meldet, BP-140 fuer einen echten, eng begrenzten Sandbox-Mini-Write schneiden.

## 2026-06-01 - Builder Repo Index Runtime Artifact (BP-138)

- Gebaut: `builder/data/builder-repo-index.json` als Runtime-Artefakt fuer den Phase-A-Dry-Run
  und `builder/scripts/generate-repo-index.mjs` als Generator/Normalizer.
- Ergebnis: Der erste Live-Blocker aus BP-137 ist adressiert. `builderScopeResolver` findet jetzt
  den Index unter dem Render-Root `builder/` und kann Scope-Aufloesung starten, statt sofort mit
  `builder-repo-index.json not found` zu werfen.
- Korrektur am Claude-Paket: Der Index darf nicht Bluepilots eigenes `builder/src` beschreiben,
  weil der Orchestrator aktuell auf das Default-Target `soulmatch` zeigt und danach Dateien aus
  `G-Dislioglu/soulmatch` holt. BP-138 erzeugt deshalb einen Soulmatch-Zielindex mit Pfaden wie
  `server/src/lib/opusTaskOrchestrator.ts`.
- Beweis: `npm test` in `builder/` laeuft mit 25 Tests gruen; der neue Test prueft Artifact-Form,
  Generator-Check und `resolveScope` ohne Missing-Index-Fehler. `npm run typecheck` ist gruen.
- Roter Faden weiter: Nach Merge und Render-Deploy `POST /probe/dry-run` erneut mit einem echten
  indexed Soulmatch-Pfad testen. Falls danach Provider- oder Orchestrator-Fehler sichtbar werden,
  ist das die naechste Schicht und kein Rueckfall.

## 2026-06-01 - Phase-A Dry-Run Trigger (BP-137)

- Gebaut: `POST /probe/dry-run` im Bluepilot-Builder. Der Endpunkt nimmt `{ instruction }`
  entgegen und ruft den bestehenden `orchestrateTask`-Pfad mit serverseitig erzwungenem
  `dryRun: true` und `skipDeploy: true` auf.
- Ergebnis: Phase A bekommt einen echten externen Startknopf ohne Render-Shell. Der Endpunkt
  gibt `status`, `runId`, `summary`, extrahierte `scopeFiles`, Phasenuebersicht und eine lokale
  Safety-Zusammenfassung zurueck.
- Korrektur am Claude-Paket: `OpusTaskResult` hat kein direktes `scopeFiles`-Feld; die Dateien
  werden aus der `scope`-Phase extrahiert. Ausserdem beweist der Orchestrator-Dry-Run nicht
  nochmals die externe Maya-Gate-Reachability, weil der Dry-Run vor realem SmartPush endet.
  Maya-Gate-Reachability ist der separate BP-135/BP-136-Beweis.
- Beweis: `npm test` in `builder/` laeuft mit 22 Tests gruen, inklusive erzwungenem Dry-Run und
  400/405-Guards. `npm run typecheck` ist gruen.
- Roter Faden weiter: Nach Merge und Render-Deploy `POST /probe/dry-run` live mit einer kleinen
  harmlosen Instruction testen. Erwartet ist `status: "dry_run"` und `safety.pushAllowed: false`.

## 2026-06-01 - Maya-Gate Readiness Probe (BP-135)

- Gebaut: `GET /health/maya-gate` im Bluepilot-Builder. Der Endpunkt ruft die bestehenden
  Gate-Client-Funktionen `assessBudget`, `assessCorridor` und `recordCost` mit synthetischen
  Probe-Daten auf.
- Ergebnis: Der Free-Render-Dienst braucht keine Shell mehr, um das Bluepilot -> maya-core
  Token-Binding zu pruefen. Die Antwort enthaelt `mayaCoreConfigured` und pro Gate
  `reachable`/`reason`, aber keine Secret-Werte.
- Korrektur am Claude-Paket: Der Probe ist nicht streng read-only, weil `recordCost` einen
  kleinen Cost-Record in maya-core erzeugen kann. Das ist als best-effort Readiness-Side-Effect
  dokumentiert. `assessCorridor` nutzt korrekt `actionKind: 'push'` plus `dryRun: true`.
- Beweis: `npm test` in `builder/` laeuft mit 18 Tests gruen, inklusive Token-Abwesenheitscheck
  in der serialisierten Probe-Antwort. `npm run typecheck` ist gruen.
- Roter Faden weiter: Nach Merge und Render-Deploy `/health/maya-gate` live abrufen. Wenn Budget
  und Corridor `reachable: true` und Cost `recorded: true` melden, ist das Maya-Gate-Binding
  bewiesen und Phase-A-Probelauf kann separat geplant werden.

## 2026-06-01 - BP-131 Identifier Scrub (BP-134)

- Gebaut: Die verbliebenen konkreten DB-Ressourcenkennungen in `contracts/BP-131.json` und
  `review-packets/BP-131.md` wurden durch neutrale Platzhalter ersetzt.
- Ergebnis: Der aktuelle Arbeitsbaum enthaelt die vier bekannten Kennungen nicht mehr. Defaults
  wie `neondb` und `neondb_owner` bleiben bewusst stehen, weil sie Produktdefaults und keine
  konkreten Ressourcenkoordinaten sind.
- Korrektur am Claude-Paket: Der gelieferte BP-134-Contract wiederholte die konkreten Kennungen
  in `assumptions`/`dod`; das haette den eigenen `git grep` scheitern lassen. Der Contract wurde
  vor dem Bootstrap so neutralisiert, dass er die Werte nicht erneut commitet.
- Beweis: `git grep` ueber den ganzen Arbeitsbaum findet die vier bekannten Kennungen nicht.
  `contracts/BP-131.json` bleibt valides JSON.
- Roter Faden weiter: Jetzt kann Maya-Gate-Infra als eigener Block folgen. Git-Historie ist
  bewusst unveraendert; ein History-Rewrite waere eine separate Entscheidung.

## 2026-05-31 - Builder Live-Deploy-Anker (BP-133)

- Gebaut: `docs/BUILDER_RENDER_DEPLOY_STATE.md` haelt den ersten Live-Deploy des
  Bluepilot-Builder-Dienstes fest: Render-Service, Public URL, Branch, Root, Build-/Start-Command
  und Health-Pfad.
- Ergebnis: `GET /health` liefert live HTTP 200 mit `status: ok`; `GET /health/db` liefert live
  HTTP 200 mit `status: reachable`. Die gesetzte DB-Variable wird nur als Name dokumentiert.
- Korrektur am Claude-Paket: Der Ansatz war richtig. Zusaetzlich wurden alte konkrete
  DB-Ressourcenkennungen aus den geaenderten Ankerdateien neutralisiert, damit der
  No-Identifier-Scan fuer BP-133 wirklich greift.
- Beweis: Live-Curl gegen `https://bluepilot-builder.onrender.com` bestaetigt beide Routen.
  Geaenderte BP-133-Dateien enthalten keine Connection Strings, Hosts, Projekt-/Branch-IDs,
  Rollen oder konkreten DB-Namen.
- Roter Faden weiter: Als naechstes Maya-Gate-Infra angehen, nicht sofort E2E. Erst wenn
  maya-core erreichbar ist und Token gesetzt sind, kann der Builder kontrolliert erlauben statt
  nur fail-closed zu blocken.

## 2026-05-31 - Builder Runtime Health Entry (BP-132)

- Gebaut: `builder/src/server.ts` startet einen minimalen HTTP-Prozess ueber Node `http`.
  `builder/src/health.ts` kapselt Liveness und DB-Readiness, damit die Logik ohne Port-Bindung
  testbar bleibt.
- Ergebnis: `GET /health` antwortet 200 und beruehrt die DB nicht. `GET /health/db` faengt
  fehlende oder unerreichbare DB-Konfiguration ab und antwortet mit JSON statt Prozess-Crash.
  Es gibt keine Build-Ausfuehrungsroute.
- Korrektur/Einordnung: Claudes BP-132-Contract war brauchbar, aber `baseline_ref: "HEAD"` wurde
  auf die echte BP-131-Basis `5716470` korrigiert. Der Live-DB-Secret-Check wurde nicht lokal in
  einen Shell-Befehl geschrieben; DB-Reichweite wurde ueber Neon-MCP mit `SELECT 1` bestaetigt.
- Beweis: `npm test` und `npm run typecheck` in `builder/` sind gruen. Lokaler `npm start`
  liefert `/health` 200 und `/health/db` 503 `not_configured`, wenn die Secret-Env-Var fehlt.
- Roter Faden weiter: Nach Merge kann der Render-Service mit Root Directory `builder/` angelegt
  und `BLUEPILOT_BUILDER_DATABASE_URL` als Secret gesetzt werden.

## 2026-05-31 - Builder Neon-DB-Infra (BP-131)

- Gebaut: Das bestehende Neon-Projekt `bluepilot-builder` wurde als Live-DB-Fundament fuer den
  migrierten Builder verwendet. In der dedizierten Builder-Datenbank wurden die 15 Tabellen aus
  `builder/src/schema/builder.ts` leer angelegt.
- Ergebnis: Die Datenbank ist separat von soulmatch, nutzt das Bluepilot-Ziel
  `BLUEPILOT_BUILDER_DATABASE_URL` und enthaelt keine Datenmigration. Secrets wurden nicht ins
  Repo geschrieben.
- Korrektur waehrend der Ausfuehrung: Der Screenshot zeigte noch die alte soulmatch-DB-Seite,
  aber das bestehende Builder-DB-Projekt wurde als Ziel bestaetigt und verwendet.
- Beweis: Neon listet 15 Builder-Tabellen; die Tabellenzaehlung fuer das definierte Builder-Set
  gibt `15` zurueck, und die erwarteten FKs zeigen auf `builder_tasks`.
- Roter Faden weiter: Nach Merge BP-131 kann der erste echte End-to-End-Probelauf mit gesetzter
  `BLUEPILOT_BUILDER_DATABASE_URL` geplant werden. Keine Secrets in Git.

## 2026-05-31 - Builder Spitze / Orchestrator-Tip (BP-130)

- Gebaut: die bestaetigte 9-Modul-Closure der Builder-Spitze nach `builder/src/` migriert:
  Orchestrator, Build-Pipeline, Architect, Judge, RenderBridge, SelfTest, ScopeResolver,
  ControlPlane und `devLogger`.
- Ergebnis: Keine zehnte Datei, kein `builderGithubBridge`, kein `builderExecutor`, keine
  Dependency-Aenderung. Die Spitze nutzt den bereits migrierten Smart-Push-Pfad.
- Beweis: Import-Smoke plus drei echte Spitzen-Tests (`architectPhase1`, `opusJudge`,
  `opusTaskOrchestratorScopeProposal`) laufen ohne Live-API-Keys, ohne Live-DB und ohne
  erreichbares maya-core. Typecheck ist gruen.
- Roter Faden weiter: Nach BP-130 keinen stillen Umzug mehr. Naechster sinnvoller Block ist ein
  expliziter End-to-End-Probelauf im Bluepilot-Builder und erst danach Anbindung/Abriss.

## 2026-05-31 - Builder Provider/Gate/Write-Pfad (BP-129)

- Gebaut: 9 Module der Provider-, Gate- und Write-Pfad-Welle nach `builder/src/` migriert,
  inklusive `providers`, `outboundHttp`, `opusSmartPush`, `opusPatchMode`,
  `opusErrorLearning` und `mayaBuilderGateClient`.
- Ergebnis: Die maschinelle Closure zieht keine Spitze nach. Kein Orchestrator, keine Pipeline,
  kein Judge, kein Architect und kein `builderGithubBridge` wurden migriert.
- Korrektur am Claude-Paket: `mayaBuilderGateClient` existiert lokal und ist Pflicht, weil
  `providers` und `opusSmartPush` ihn importieren. Der Contract wurde von 8 auf 9 Module
  korrigiert und WLP-gueltig gemacht.
- Beweis: Tests und Typecheck laufen ohne Live-API-Keys, ohne Live-DB und ohne erreichbares
  maya-core. Der Gate-Client-Test prueft fail-closed Verhalten und Gate-Token-Header mit Stub.
- Roter Faden weiter: Erst BP-129 reviewen/mergen. Danach die Spitze separat schneiden:
  Orchestrator/Pipeline/Judge/Architect nur nach neuer Closure-Pruefung.

## 2026-05-31 - Builder DB-Fundament (BP-128)

- Gebaut: eigenes Builder-DB-Fundament unter `builder/` mit kompletter Schema-Kopie,
  `builder/src/db.ts`, `BLUEPILOT_BUILDER_DATABASE_URL`, `.env.example` und den zwei DB-only
  Modulen `poolState` + `builderApprovalArtifacts`.
- Ergebnis: Keine Live-DB fuer lokale Verifikation noetig. `getDb()` scheitert ohne Env-Var klar,
  Tests und Typecheck laufen trotzdem gruen.
- Korrektur am Claude-Paket: `opusErrorLearning` bleibt draussen, weil es `providers` zieht.
  Die zwei migrierten DB-Module sind nicht bytegleich, sondern nur mit relativen Importpfaden ans
  neue `builder/src`-Layout angepasst. Das Schema selbst ist bytegleich.
- Roter Faden weiter: Naechste Welle kann Provider/Netz/Gates pruefen, aber erst wieder mit
  maschineller Closure. Keine DB-, Provider- oder Write-Pfad-Teile still vermischen.

## 2026-05-31 - Builder Umzugswelle 1: Logik-Closure (BP-127)

- Gebaut: 14 maschinell gepruefte pure-logic Builder-Module aus soulmatch wurden nach
  `builder/src/` kopiert. Die Moduldateien sind bytegleich mit den soulmatch-Quellen.
- Ergebnis: Kein Orchestrator, keine DB, kein Provider, kein Netz und kein Write-Pfad wurden
  migriert. `opusBuildPipeline` bleibt bewusst draussen.
- Beweis: `npm test` und `npm run typecheck` in `builder/` sind gruen. Der Import-Smoke-Test
  laedt alle 14 Module; `opusEnvelopeValidator.test.ts` ist als vorhandener Logiktest mitgezogen.
- Roter Faden weiter: Naechste Welle separat schneiden. Vorher wieder Import-Closure pruefen und
  nicht still Richtung Orchestrator, DB oder Write-Pfad wachsen lassen.

## 2026-05-31 - Builder TypeScript-Fundament (BP-126)

- Gebaut: `builder/` als eigenes TypeScript-Subpackage mit `package.json`, `tsconfig.json`,
  `tsx`/`typescript`, Smoke-Modul und Smoke-Test.
- Ergebnis: Bluepilots Root bleibt CJS/WLP-Governance; der kommende Builder bekommt ein eigenes
  TS-Stockwerk. Es wurde noch kein soulmatch-Builder-Modul kopiert oder bewegt.
- Korrektur am Claude-Paket: Der gelieferte Contract hatte noch keine gueltigen WLP-Felder
  `reuse_target` und `evidence_required`; die Matrix hatte Encoding-Mojibake und zu starke
  Aussagen zum geschlossenen Tier-1-Kern. BP-126 setzt beides korrigiert um.
- Roter Faden weiter: Vor dem ersten echten Modul-Umzug muss die Tier-1-Import-Closure weiter
  maschinell gegen den lokalen soulmatch-Code geprueft werden. Danach zuerst Logik-Blaetter,
  nicht Orchestrator-Spitze, migrieren.

## 2026-05-31 - Anker und Leseregel (BP-125)

- Gebaut: `docs/SESSION-LOG.md`, `STATE.md`, `docs/DEPLOY_MAYA_CORE_BINDING.md` und eine
  Pflicht-Lesereihenfolge in `AGENTS.md`.
- Ergebnis: Bluepilot hat jetzt dieselbe Anker-Disziplin wie soulmatch und maya-core:
  erst `docs/CLAUDE-CONTEXT.md`, dann dieses Log, dann `STATE.md`, dann Contract und relevante
  Dateien.
- Korrektur am Claude-Paket: Die gelieferte BP-124-Nummer war schon durch die Auth-Aufgabe belegt,
  das Contract-Feld `docs_task` waere ungueltig gewesen, und die gelieferten Dateien hatten
  Encoding-Mojibake. BP-125 uebernimmt die Absicht mit gueltigem WLP und aktuellem Repo-Stand.
- Roter Faden weiter: Erst nach diesen Ankern sollte der groessere Builder-Umzug oder der echte
  "Maya Review"-Sprechort in Bluepilot beginnen.

## 2026-05-31 - Maya Memory Server-to-Server Auth (BP-124)

- Gebaut: maya-core `/api/maya/memory` nutzt den bestehenden Builder-Gate-Auth-Helfer. Bluepilots
  BP-123-Client sendet bereits `x-maya-core-gate-token`; dieser Header passt jetzt zu einem echten
  maya-core-Auth-Pfad.
- Ergebnis: In `aicos-registry` liegt Branch `bp-124-maya-memory-auth` mit Commit `bf9407e`.
  Bluepilot dokumentiert den Stand in `contracts/BP-124.json` und `review-packets/BP-124.md`.
- Wichtig fuers Deploy: Der maya-core-Commit muss gemergt/deployt werden. Erst dann ist der
  Cross-App-Memory-Pfad live; sonst bleibt Bluepilot im lokalen Offline-Fallback.
- Roter Faden weiter: Memory ist deployfest vorbereitet. Persona/Stimme und Ethics/Builder-Gates
  bleiben separate spaetere Schritte.

## 2026-05-31 - Maya-Anbindung Stufe 1: Gedaechtnis (BP-123)

- Gebaut: Bluepilots Maya-Memory wurde vom lokalen JSON-Store zum Client des gemeinsamen
  Block-2-Gedaechtnisses in maya-core.
- Verhalten: Schreibt nur Vorschlaege (`review_status='pending'`) mit `app_origin='bluepilot'`,
  liest nur bestaetigte Eintraege und faellt bei nicht erreichbarem maya-core ehrlich auf lokales
  JSON zurueck (`storage='local_json_fallback'`, `offline=true`).
- Ergebnis: `bluepilot/main` erreichte `109ca7a`.
- Roter Faden weiter: Der Client war logisch gebaut, aber echter Deploy brauchte die Auth-Klaerung
  aus BP-124.

## 2026-05-31 - Anker-Bootstrap (BP-122)

- Gebaut: `docs/CLAUDE-CONTEXT.md` als erster roter Faden fuer Bluepilot.
- Inhalt: Zweck, MVP-Kette, WLP-Regeln, Phasenstand, offene Punkte und Maya-Anbindungsplan.
- Ergebnis: BP-122 wurde gemergt; der Contract wurde zuerst als Bootstrap-Commit gesetzt, weil der
  Verifier einen existierenden Contract fuer sauberen Preflight braucht.
- Roter Faden weiter: `SESSION-LOG.md` und `STATE.md` fehlten noch als Anker-Ergaenzung.

## Bis 2026-05-29 - Phasen C1-C5

- C1 Kernel: gruen.
- C2 Context Broker, Multi-Model-Pool, Council Session Guard: gruen (BP-094, 2026-05-28).
- C3 AICOS Auto-Query, Maya Memory v0, Parallel Executor: gruen (BP-098, 2026-05-28).
- C4 Browser-Preview, DiffLens, Human UI Review Gate, Screenshot/Visual: technisch gruen.
- C5 Integration: Entry freigegeben (BP-110 Human Review APPROVED, 2026-05-29).
- Hinweis: Dieses Log wurde erst am 2026-05-31 eingefuehrt. Fruehere Details liegen in den
  jeweiligen Contracts, Checkpoints und Review-Packets.
