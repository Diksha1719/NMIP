# Reproducible synthetic demo

Use a fresh seed to show the Proof Board's empty state before benchmarking. The seed creates 60 materials, three synthetic organizations, all four roles, configured rules, evidence, generated candidates and one previously reviewed fastener identity. Password is documented only in the README.

1. Sign in as **Engineer**. Open Overview and inspect database-driven totals, outcome distribution and activity.
2. Sign out, then sign in as **Steward** for ingestion. The separation follows the requested permission table.
3. Upload `samples/synthetic_import.csv` under CPSE-A. Preview the source rows.
4. Map material code, description, category and optional fields; run validation. The fixture has six valid records and three intentional invalid rows (missing code, repeated source code, invalid unit). Download the report.
5. Import valid rows. Run Normalization, then Attribute extraction, then Enrichment. Open a source record and inspect raw/canonical values and evidence.
6. Open Candidate center, retrieve candidates, and show all four outcome filters. Retrieval scores come from the database records.
7. Sign in as **Engineer**. Open Review queue and select a pending valve IDENTITY_MATCH. Compare Gate Valve 2 inch CS CL150 against the 50.8 mm Carbon Steel variant.
8. Inspect critical attributes and evidence. Add a meaningful review comment, then approve. Open the generated `NMC-VLV-…` identity and show both unchanged legacy codes.
9. Publish to the NMIP catalog and export the JSON mapping. Explain that ERP transport is not configured.
10. Open Duplicate prevention; check the approved description/category. Inspect the matched identity, engineering comparison and source record evidence. Only Steward/Admin may create an additional source code with a recorded override reason.
11. Show bearing 6205-2RS vs 6205-2Z: high textual similarity still produces DO_NOT_MERGE. Acknowledging the outcome creates no identity.
12. Show an incomplete pump pair and request model/configuration/pressure. A source-backed attribute can be added through the material page; this creates evidence and reruns decisions.
13. Show a fastener coating difference producing POTENTIAL_SUBSTITUTE; this never becomes identity on approval.
14. Open Audit & versioning. Search ENGINEER_APPROVE, COMMON_ID_CREATED or DUPLICATE_OVERRIDE; inspect actor, reason, time and old/new values.
15. Open Proof Board. Before a run it says “Awaiting benchmark dataset.” Upload `samples/benchmark.csv`, run, then inspect actual computed precision/recall/F1/retrieval/false-merge/abstention metrics and confusion counts. These are synthetic-fixture metrics, not real CPSE accuracy.

Common-ID suffixes are collision-resistant generated values, not hardcoded demo IDs. Record/candidate order may differ. Choose by description, category and outcome. An approved/rejected recommendation is terminal; use another pending pair for a repeated demonstration. Reprocessing or editing a rule makes previous pending recommendations stale and requires “Rerun decision.”
