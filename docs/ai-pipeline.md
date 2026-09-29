# AI and engineering pipeline

1. Validate structured source fields and source-code uniqueness.
2. Normalize case, spacing, selected punctuation, inch-to-mm dimensions, contextual valve class terminology and explicitly configured dictionary entries.
3. Extract known engineering attributes using category-aware patterns. Preserve the raw source and attach evidence. Missing required fields remain null/MISSING. When a normalized match no longer exists literally in the source, raw_value retains the original source expression instead of falsely claiming a transformed token was raw.
4. Enrich using versioned category-scoped terminology mappings. Grades are not implicitly interchangeable.
5. Retrieve within the category using 35% embedding cosine + 25% fuzzy token sort + 40% attribute alignment. Exact normalized equality naturally reaches the strongest text score. The prototype scans the database category in Python; vector storage is ready for later server-side retrieval.
6. Compare every known/configured attribute under the stored rule version, including optional observed attributes. Conflicts/missing values remain visible even when textual ranking is high.
7. Apply the deterministic decision hierarchy, save comparisons and snapshot source/rule revisions.
8. Show evidence, ask a human engineer to approve/reject/request information, and create identity links only for an approved identity match.
9. Publish the verified catalog record and export mappings for downstream integration.

`EmbeddingProvider` provides `embed_text` and `embed_batch`. The default uses reproducible SHA-256 token hashing into 384 dimensions and normalized cosine. It is **not a trained semantic model**. `SentenceTransformerEmbedding` loads an optional 384-dimensional transformer through a separate requirements file. Provider changes require corpus-wide re-embedding; mixed model vectors must never be compared.

`LLMProvider` provides `extract_attributes` and `explain_decision`. `RuleBasedProvider` is the working deterministic implementation. No network provider or API key is required. Real model adapters must validate source references before accepting model output and must abstain on missing values. Engineering decisions remain outside the provider.

Extraction confidence is 1.0 for a deterministic pattern hit, not a calibrated engineering certainty score. Data quality is required-attribute completeness. The UI names these measures separately from the retrieval score. Evidence is the original supplied text, not a generated rationale masquerading as a document.

Limits: pattern dictionaries are illustrative, PDF extraction needs selectable text, model versions are configured globally, and workloads run synchronously. Scale requires queues, explicit embedding-version metadata, document storage, provider observability and representative category-specific engineering evaluation.
