export type Row = { id: string; [key: string]: any };
export type User = { id: string; name: string; email: string; role: 'ADMIN'|'ENGINEER'|'DATA_STEWARD'|'VIEWER' };
export type Material = Row & { legacy_material_code: string; original_description: string; normalized_description: string; category: string; organization: string; status: string; data_quality_score: number; common_identity: string|null; common_identity_id: string|null; updated_at: string };
export type Candidate = Row & { material_a: Material; material_b: Material; decision: Row; critical_conflicts: number; missing_attributes: number; evidence_count: number; status: string; final_score: number; semantic_score: number; attribute_score: number };

export type HarmonizationResult = {
  original_text: string;
  harmonized_title: string;
  harmonized_category: string;
  taxonomy_node_code: string | null;
  confidence_score: number;
  extracted_attributes: Record<string, { raw: string; normalized: string; unit: string | null; confidence: number }>;
  improvements: string[];
};

export type DoNotMergeRule = Row & {
  name: string;
  category: string;
  attribute_a: string;
  attribute_b: string;
  condition: 'DIFFERENT' | 'VALUE_MISMATCH' | 'EXPLICIT_BLOCK';
  severity: 'CRITICAL' | 'IMPORTANT' | 'BLOCK';
  reason: string;
  is_active: boolean;
  created_at: string;
};

export type TaxonomyNode = Row & {
  code: string;
  name: string;
  parent_id: string | null;
  level: number;
  description: string;
  attribute_schema: Array<{ name: string; type: string }>;
  direct_material_count?: number;
  total_material_count?: number;
  children?: TaxonomyNode[];
};

