# Decision engine

The engine is a pure backend function, independent of React and any embedding/LLM vendor.

| Condition, evaluated in order | Outcome |
|---|---|
| Any configured CRITICAL attribute differs | DO_NOT_MERGE |
| No applicable critical rules, missing critical values, or missing critical evidence | INSUFFICIENT_INFORMATION |
| An additional observed engineering attribute is missing on one side | INSUFFICIENT_INFORMATION |
| Critical values align but another observed attribute differs | POTENTIAL_SUBSTITUTE |
| All configured critical and observed attributes align with supporting evidence | IDENTITY_MATCH recommendation |

Exact rules compare normalized values; numeric rules apply an explicit nonnegative tolerance. Unknown categories abstain. Text similarity is not passed to `decide`, so even 100% text similarity cannot override a critical conflict. Potential substitution is only a review lead, not certified functional interchangeability.

Examples: bearing 6205-2RS vs 6205-2Z conflicts on seal type; 415V vs 230V motor conflicts on voltage; incomplete pump records abstain. Inch/mm and explicit carbon-steel abbreviations can support a valve recommendation under the demo rule scope. SS304 vs unspecified Stainless Steel abstains rather than assuming a grade.

Review writes include actor and reason. Request-information keeps a traceable review; source-backed attribute corrections increment revision and create new decision snapshots. Approval requires the most recent decision, unchanged material revisions and unchanged active-rule versions. Non-identity approval acknowledges that outcome without creating mappings. Duplicate terminal reviews are rejected.

Common identity creation is atomic with review and legacy mappings. Already assigned materials cannot be attached to a different common identity. Existing identities are never automatically merged. A material being added to an existing identity must also match its canonical attributes. Original legacy codes are never modified or deleted.

Published identities remain local catalog records; exports can be used by an external integration. The prototype deliberately blocks editing verified material sources until a governed identity revision/revocation workflow is added.
