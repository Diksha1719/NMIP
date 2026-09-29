// In-memory & LocalStorage Mock Data Store for NMIP Frontend (Vercel-Ready)

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ENGINEER' | 'DATA_STEWARD' | 'VIEWER';
  organization_id: string;
  organization_name: string;
  is_active: boolean;
}

export interface MockMaterial {
  id: string;
  legacy_material_code: string;
  original_description: string;
  normalized_description: string;
  organization: string;
  organization_id: string;
  category: string;
  status: 'INGESTED' | 'NORMALIZED' | 'EXTRACTED' | 'VERIFIED' | 'PUBLISHED';
  common_identity?: string;
  common_identity_id?: string;
  data_quality_score: number;
  revision: number;
  updated_at: string;
  created_at: string;
  attributes: Array<{
    id: string;
    attribute_name: string;
    raw_value: string;
    normalized_value: string;
    unit?: string;
    source_evidence_id?: string;
  }>;
  evidence: Array<{
    id: string;
    evidence_type: string;
    extracted_value: string;
    source_text: string;
    source_file: string;
    source_type: string;
    confidence: number;
    row_number?: number;
    page_number?: number;
  }>;
}

export interface MockCandidate {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'INFORMATION_REQUESTED';
  material_a: MockMaterial;
  material_b: MockMaterial;
  final_score: number;
  semantic_score: number;
  attribute_score: number;
  critical_conflicts: number;
  missing_attributes: number;
  evidence_count: number;
  decision?: {
    id: string;
    decision_type: 'IDENTITY_MATCH' | 'POTENTIAL_SUBSTITUTE' | 'DO_NOT_MERGE' | 'INSUFFICIENT_INFORMATION';
    reason: string;
    snapshot?: {
      a_revision: number;
      b_revision: number;
    };
  };
  comparisons: Array<{
    id: string;
    attribute_name: string;
    value_a: string;
    value_b: string;
    comparison_result: 'MATCH' | 'CONFLICT' | 'MISSING' | 'SUBSTITUTE';
    criticality: 'CRITICAL' | 'IMPORTANT' | 'NON_CRITICAL';
  }>;
  reviews: Array<{
    id: string;
    action: string;
    comment: string;
    reviewer_id: string;
    created_at: string;
  }>;
  evidence: MockMaterial['evidence'];
}

export interface MockCommonIdentity {
  id: string;
  nmip_code: string;
  canonical_name: string;
  category: string;
  status: 'DRAFT' | 'VERIFIED' | 'PUBLISHED';
  mapping_count: number;
  canonical_attributes: Record<string, string>;
  mappings: Array<{
    id: string;
    organization: string;
    legacy_material_code: string;
    original_description: string;
  }>;
  reviews: Array<{
    id: string;
    action: string;
    comment: string;
    created_at: string;
  }>;
  evidence: MockMaterial['evidence'];
}

export interface MockAuditEntry {
  id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  reason: string;
  created_at: string;
  previous_value?: any;
  new_value?: any;
}

export interface MockDataset {
  id: string;
  filename: string;
  source_type: string;
  row_count: number;
  valid_rows: number;
  invalid_rows: number;
  status: 'UPLOADED' | 'VALIDATED' | 'IMPORTED';
  columns: string[];
  column_mapping: Record<string, string>;
  preview: Array<Record<string, string>>;
  validation_report: Array<{
    row: number;
    values: Record<string, string>;
    errors: string[];
  }>;
}

// Initial CPSE Organizations
const initialOrgs = [
  { id: 'org-1', code: 'CPSE-A', name: 'CPSE-A · ONGC India' },
  { id: 'org-2', code: 'CPSE-B', name: 'CPSE-B · NTPC Thermal' },
  { id: 'org-3', code: 'CPSE-C', name: 'CPSE-C · IOCL Refinery' },
  { id: 'org-4', code: 'CPSE-D', name: 'CPSE-D · BHEL Electricals' },
  { id: 'org-5', code: 'CPSE-E', name: 'CPSE-E · GAIL Pipelines' },
  { id: 'org-6', code: 'CPSE-F', name: 'CPSE-F · SAIL Steel' },
  { id: 'org-7', code: 'CPSE-G', name: 'CPSE-G · HPCL Energy' },
  { id: 'org-8', code: 'CPSE-H', name: 'CPSE-H · BPCL Petroleum' },
];

// Initial Users
const initialUsers: MockUser[] = [
  { id: 'u-admin', name: 'Admin · Demo', email: 'admin@nmip.local', role: 'ADMIN', organization_id: 'org-1', organization_name: 'CPSE-A · ONGC India', is_active: true },
  { id: 'u-engineer', name: 'Chief Engineer · Demo', email: 'engineer@nmip.local', role: 'ENGINEER', organization_id: 'org-2', organization_name: 'CPSE-B · NTPC Thermal', is_active: true },
  { id: 'u-steward', name: 'Data Steward · Demo', email: 'steward@nmip.local', role: 'DATA_STEWARD', organization_id: 'org-3', organization_name: 'CPSE-C · IOCL Refinery', is_active: true },
  { id: 'u-viewer', name: 'Auditor Viewer · Demo', email: 'viewer@nmip.local', role: 'VIEWER', organization_id: 'org-4', organization_name: 'CPSE-D · BHEL Electricals', is_active: true },
];

// Initial Taxonomy Tree
const initialTaxonomyTree = [
  {
    id: 'tax-root',
    code: 'CAT-ROOT',
    name: 'All Material Catalog',
    level: 0,
    description: 'Root Material Catalog Hierarchy',
    total_material_count: 22,
    attribute_schema: [],
    children: [
      {
        id: 'tax-pipe',
        code: 'CAT-PIPE',
        name: 'Piping & Valves',
        level: 1,
        description: 'Valves, Flanges, Pipe Fittings',
        total_material_count: 9,
        attribute_schema: [{ name: 'size', type: 'string' }, { name: 'pressure_class', type: 'string' }],
        children: [
          {
            id: 'tax-valves',
            code: 'VALVE-GATE',
            name: 'Valves',
            level: 2,
            description: 'Gate, Ball, Check Valves',
            total_material_count: 6,
            attribute_schema: [
              { name: 'size', type: 'string' },
              { name: 'material_grade', type: 'string' },
              { name: 'pressure_class', type: 'string' },
            ],
            children: [],
          },
          {
            id: 'tax-pipes',
            code: 'PIPE-SEAM',
            name: 'Pipes & Fittings',
            level: 2,
            description: 'Seamless & Welded Steel Pipes',
            total_material_count: 3,
            attribute_schema: [{ name: 'size', type: 'string' }, { name: 'schedule', type: 'string' }],
            children: [],
          },
        ],
      },
      {
        id: 'tax-mech',
        code: 'CAT-MECH',
        name: 'Mechanical Equipment',
        level: 1,
        description: 'Pumps, Bearings, Compressors, Filters',
        total_material_count: 7,
        attribute_schema: [{ name: 'model', type: 'string' }],
        children: [
          {
            id: 'tax-bearings',
            code: 'BEARING-BALL',
            name: 'Bearings',
            level: 2,
            description: 'Ball & Roller Bearings',
            total_material_count: 2,
            attribute_schema: [{ name: 'model', type: 'string' }, { name: 'seal_type', type: 'string' }],
            children: [],
          },
          {
            id: 'tax-pumps',
            code: 'PUMP-CENT',
            name: 'Pumps',
            level: 2,
            description: 'Centrifugal & Slurry Pumps',
            total_material_count: 3,
            attribute_schema: [{ name: 'power', type: 'string' }, { name: 'material_grade', type: 'string' }],
            children: [],
          },
          {
            id: 'tax-comp',
            code: 'COMP-RECIP',
            name: 'Compressors & Filters',
            level: 2,
            description: 'Air Compressors and Filter Cartridges',
            total_material_count: 2,
            attribute_schema: [{ name: 'capacity', type: 'string' }],
            children: [],
          },
        ],
      },
      {
        id: 'tax-elec',
        code: 'CAT-ELEC',
        name: 'Electrical & Instrumentation',
        level: 1,
        description: 'Motors, Transmitters, Sensors',
        total_material_count: 4,
        attribute_schema: [{ name: 'voltage', type: 'string' }, { name: 'power', type: 'string' }],
        children: [
          {
            id: 'tax-motors',
            code: 'ELEC-MOTOR',
            name: 'Electrical',
            level: 2,
            description: 'Electric Motors & Drives',
            total_material_count: 2,
            attribute_schema: [{ name: 'power', type: 'string' }, { name: 'voltage', type: 'string' }],
            children: [],
          },
          {
            id: 'tax-instr',
            code: 'ELEC-INSTR',
            name: 'Instrumentation',
            level: 2,
            description: 'Pressure Transmitters & RTDs',
            total_material_count: 2,
            attribute_schema: [{ name: 'range', type: 'string' }],
            children: [],
          },
        ],
      },
      {
        id: 'tax-fast',
        code: 'CAT-FAST',
        name: 'Fasteners & Hardware',
        level: 1,
        description: 'Bolts, Nuts, Washers, Gaskets',
        total_material_count: 2,
        attribute_schema: [{ name: 'diameter', type: 'string' }, { name: 'coating', type: 'string' }],
        children: [
          {
            id: 'tax-bolts',
            code: 'FAST-BOLT',
            name: 'Fasteners',
            level: 2,
            description: 'Hex Bolts, Nuts & Gaskets',
            total_material_count: 2,
            attribute_schema: [
              { name: 'size', type: 'string' },
              { name: 'material_grade', type: 'string' },
              { name: 'coating', type: 'string' },
            ],
            children: [],
          },
        ],
      },
    ],
  },
];

// Initial 22 Materials (Broad Indian CPSE Dataset) with Rich Source Evidence on EVERY record
const initialMaterials: MockMaterial[] = [
  {
    id: 'mat-101',
    legacy_material_code: 'MAT-10060',
    original_description: 'Gate V/V 2" CS CL150 NPT Threaded Flanged Body',
    normalized_description: 'Gate Valve 2 inch Carbon Steel Class 150 NPT Threaded',
    organization: 'CPSE-A',
    organization_id: 'org-1',
    category: 'Valves',
    status: 'VERIFIED',
    common_identity: 'NMIP-VALVE-001',
    common_identity_id: 'id-001',
    data_quality_score: 95,
    revision: 2,
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    attributes: [
      { id: 'a1', attribute_name: 'valve_type', raw_value: 'Gate V/V', normalized_value: 'Gate Valve', source_evidence_id: 'ev-1' },
      { id: 'a2', attribute_name: 'size', raw_value: '2"', normalized_value: '2 in', unit: 'in', source_evidence_id: 'ev-1' },
      { id: 'a3', attribute_name: 'material_grade', raw_value: 'CS', normalized_value: 'CS', source_evidence_id: 'ev-1' },
      { id: 'a4', attribute_name: 'pressure_class', raw_value: 'CL150', normalized_value: 'Class 150', source_evidence_id: 'ev-1' },
    ],
    evidence: [
      { id: 'ev-1', evidence_type: 'CATALOG_SPEC', extracted_value: 'Gate Valve 2in CS Class 150 NPT', source_text: 'Gate V/V 2" CS CL150 NPT Threaded Flanged Body', source_file: 'ONGC_Materials_Catalog_2025.pdf', source_type: 'PDF_SPEC', confidence: 0.98, page_number: 42 },
    ],
  },
  {
    id: 'mat-102',
    legacy_material_code: 'MAT-20045',
    original_description: '2 Inch Gate Valve Carbon Steel 150# ANSI Threaded',
    normalized_description: 'Gate Valve 2 inch Carbon Steel Class 150 ANSI',
    organization: 'CPSE-B',
    organization_id: 'org-2',
    category: 'Valves',
    status: 'VERIFIED',
    common_identity: 'NMIP-VALVE-001',
    common_identity_id: 'id-001',
    data_quality_score: 92,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    attributes: [
      { id: 'a5', attribute_name: 'valve_type', raw_value: 'Gate Valve', normalized_value: 'Gate Valve', source_evidence_id: 'ev-2' },
      { id: 'a6', attribute_name: 'size', raw_value: '2 Inch', normalized_value: '2 in', unit: 'in', source_evidence_id: 'ev-2' },
      { id: 'a7', attribute_name: 'material_grade', raw_value: 'Carbon Steel', normalized_value: 'CS', source_evidence_id: 'ev-2' },
      { id: 'a8', attribute_name: 'pressure_class', raw_value: '150#', normalized_value: 'Class 150', source_evidence_id: 'ev-2' },
    ],
    evidence: [
      { id: 'ev-2', evidence_type: 'INVOICE_ROW', extracted_value: '2 Inch Gate Valve Carbon Steel 150#', source_text: '2 Inch Gate Valve Carbon Steel 150# ANSI Threaded', source_file: 'NTPC_Procurement_Register.csv', source_type: 'CSV_IMPORT', confidence: 0.95, row_number: 118 },
    ],
  },
  {
    id: 'mat-103',
    legacy_material_code: 'MAT-30012',
    original_description: 'Ball Valve 3in SS316 Class 300 Flanged RF',
    normalized_description: 'Ball Valve 3 inch Stainless Steel 316 Class 300 RF',
    organization: 'CPSE-C',
    organization_id: 'org-3',
    category: 'Valves',
    status: 'NORMALIZED',
    data_quality_score: 88,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    attributes: [
      { id: 'a9', attribute_name: 'valve_type', raw_value: 'Ball Valve', normalized_value: 'Ball Valve', source_evidence_id: 'ev-103' },
      { id: 'a10', attribute_name: 'size', raw_value: '3in', normalized_value: '3 in', unit: 'in', source_evidence_id: 'ev-103' },
      { id: 'a11', attribute_name: 'material_grade', raw_value: 'SS316', normalized_value: 'SS316', source_evidence_id: 'ev-103' },
      { id: 'a12', attribute_name: 'pressure_class', raw_value: 'Class 300', normalized_value: 'Class 300', source_evidence_id: 'ev-103' },
    ],
    evidence: [
      { id: 'ev-103', evidence_type: 'CATALOG_SPEC', extracted_value: 'Ball Valve 3in SS316 Class 300', source_text: 'Ball Valve 3in SS316 Class 300 Flanged Raised Face', source_file: 'IOCL_Refinery_Valve_Specs.pdf', source_type: 'PDF_SPEC', confidence: 0.96, page_number: 18 },
    ],
  },
  {
    id: 'mat-104',
    legacy_material_code: 'MAT-40089',
    original_description: 'Centrifugal Water Pump 15HP 415V 3-Phase SS304 Impeller',
    normalized_description: 'Centrifugal Pump 15 HP 415 V 3 Phase SS304',
    organization: 'CPSE-D',
    organization_id: 'org-4',
    category: 'Pumps',
    status: 'VERIFIED',
    common_identity: 'NMIP-PUMP-002',
    common_identity_id: 'id-002',
    data_quality_score: 96,
    revision: 2,
    updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    attributes: [
      { id: 'a13', attribute_name: 'power', raw_value: '15HP', normalized_value: '15 HP', unit: 'HP', source_evidence_id: 'ev-3' },
      { id: 'a14', attribute_name: 'voltage', raw_value: '415V', normalized_value: '415 V', unit: 'V', source_evidence_id: 'ev-3' },
      { id: 'a15', attribute_name: 'material_grade', raw_value: 'SS304', normalized_value: 'SS304', source_evidence_id: 'ev-3' },
    ],
    evidence: [
      { id: 'ev-3', evidence_type: 'TECH_SHEET', extracted_value: 'Centrifugal Water Pump 15HP 415V', source_text: 'Centrifugal Water Pump 15HP 415V 3-Phase SS304 Impeller', source_file: 'BHEL_Motor_Spec_2025.pdf', source_type: 'PDF_SPEC', confidence: 0.97, page_number: 14 },
    ],
  },
  {
    id: 'mat-105',
    legacy_material_code: 'MAT-50031',
    original_description: 'Hex Bolt M12 x 50mm Stainless Steel 304 Galvanized',
    normalized_description: 'Hexagon Bolt M12 x 50 mm SS304 Galvanized',
    organization: 'CPSE-E',
    organization_id: 'org-5',
    category: 'Fasteners',
    status: 'EXTRACTED',
    data_quality_score: 85,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    attributes: [
      { id: 'a16', attribute_name: 'size', raw_value: 'M12 x 50mm', normalized_value: 'M12x50', source_evidence_id: 'ev-105' },
      { id: 'a17', attribute_name: 'material_grade', raw_value: 'Stainless Steel 304', normalized_value: 'SS304', source_evidence_id: 'ev-105' },
      { id: 'a18', attribute_name: 'coating', raw_value: 'Galvanized', normalized_value: 'Galvanized', source_evidence_id: 'ev-105' },
    ],
    evidence: [
      { id: 'ev-105', evidence_type: 'INVOICE_ROW', extracted_value: 'Hex Bolt M12x50 SS304 Galv', source_text: 'Hex Bolt M12 x 50mm Stainless Steel 304 Galvanized', source_file: 'GAIL_Hardware_Purchases.csv', source_type: 'CSV_IMPORT', confidence: 0.94, row_number: 44 },
    ],
  },
  {
    id: 'mat-106',
    legacy_material_code: 'MAT-10072',
    original_description: 'Check Valve 4" Cast Steel Class 300 Flanged Butt-Weld',
    normalized_description: 'Check Valve 4 inch Carbon Steel Class 300 BW',
    organization: 'CPSE-A',
    organization_id: 'org-1',
    category: 'Valves',
    status: 'VERIFIED',
    common_identity: 'NMIP-VALVE-003',
    common_identity_id: 'id-003',
    data_quality_score: 94,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    attributes: [
      { id: 'a20', attribute_name: 'valve_type', raw_value: 'Check Valve', normalized_value: 'Check Valve', source_evidence_id: 'ev-106' },
      { id: 'a21', attribute_name: 'size', raw_value: '4"', normalized_value: '4 in', unit: 'in', source_evidence_id: 'ev-106' },
      { id: 'a22', attribute_name: 'material_grade', raw_value: 'Cast Steel', normalized_value: 'CS', source_evidence_id: 'ev-106' },
      { id: 'a23', attribute_name: 'pressure_class', raw_value: 'Class 300', normalized_value: 'Class 300', source_evidence_id: 'ev-106' },
    ],
    evidence: [
      { id: 'ev-106', evidence_type: 'CATALOG_SPEC', extracted_value: 'Check Valve 4in CS Class 300 BW', source_text: 'Check Valve 4" Cast Steel Class 300 Flanged Butt-Weld', source_file: 'ONGC_Materials_Catalog_2025.pdf', source_type: 'PDF_SPEC', confidence: 0.96, page_number: 88 },
    ],
  },
  {
    id: 'mat-107',
    legacy_material_code: 'MAT-20088',
    original_description: '4 Inch Swing Check Valve CS 300# Flanged BW',
    normalized_description: 'Check Valve 4 inch Carbon Steel Class 300 BW',
    organization: 'CPSE-B',
    organization_id: 'org-2',
    category: 'Valves',
    status: 'VERIFIED',
    common_identity: 'NMIP-VALVE-003',
    common_identity_id: 'id-003',
    data_quality_score: 91,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 9).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    attributes: [
      { id: 'a24', attribute_name: 'valve_type', raw_value: 'Swing Check Valve', normalized_value: 'Check Valve', source_evidence_id: 'ev-107' },
      { id: 'a25', attribute_name: 'size', raw_value: '4 Inch', normalized_value: '4 in', unit: 'in', source_evidence_id: 'ev-107' },
      { id: 'a26', attribute_name: 'material_grade', raw_value: 'CS', normalized_value: 'CS', source_evidence_id: 'ev-107' },
      { id: 'a27', attribute_name: 'pressure_class', raw_value: '300#', normalized_value: 'Class 300', source_evidence_id: 'ev-107' },
    ],
    evidence: [
      { id: 'ev-107', evidence_type: 'INVOICE_ROW', extracted_value: '4 Inch Swing Check Valve CS 300#', source_text: '4 Inch Swing Check Valve CS 300# Flanged BW', source_file: 'NTPC_Procurement_Register.csv', source_type: 'CSV_IMPORT', confidence: 0.93, row_number: 210 },
    ],
  },
  {
    id: 'mat-108',
    legacy_material_code: 'MAT-30044',
    original_description: 'Deep Groove Ball Bearing SKF 6208-2RSH/C3 Rubber Sealed',
    normalized_description: 'Ball Bearing 6208 2RS C3 40x80x18mm',
    organization: 'CPSE-C',
    organization_id: 'org-3',
    category: 'Bearings',
    status: 'VERIFIED',
    common_identity: 'NMIP-BEARING-004',
    common_identity_id: 'id-004',
    data_quality_score: 97,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 11).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    attributes: [
      { id: 'a28', attribute_name: 'model', raw_value: '6208-2RSH/C3', normalized_value: '6208-2RS-C3', source_evidence_id: 'ev-108' },
      { id: 'a29', attribute_name: 'seal_type', raw_value: 'Rubber Sealed', normalized_value: '2RS', source_evidence_id: 'ev-108' },
    ],
    evidence: [
      { id: 'ev-108', evidence_type: 'TECH_SHEET', extracted_value: 'Deep Groove Ball Bearing SKF 6208 2RS C3', source_text: 'Deep Groove Ball Bearing SKF 6208-2RSH/C3 Rubber Sealed', source_file: 'IOCL_Mechanical_Spares_Catalogue.pdf', source_type: 'PDF_SPEC', confidence: 0.98, page_number: 104 },
    ],
  },
  {
    id: 'mat-109',
    legacy_material_code: 'MAT-40015',
    original_description: 'Radial Ball Bearing 6208 2RS C3 40x80x18mm SKF',
    normalized_description: 'Ball Bearing 6208 2RS C3 40x80x18mm',
    organization: 'CPSE-D',
    organization_id: 'org-4',
    category: 'Bearings',
    status: 'VERIFIED',
    common_identity: 'NMIP-BEARING-004',
    common_identity_id: 'id-004',
    data_quality_score: 95,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    attributes: [
      { id: 'a30', attribute_name: 'model', raw_value: '6208 2RS C3', normalized_value: '6208-2RS-C3', source_evidence_id: 'ev-109' },
      { id: 'a31', attribute_name: 'seal_type', raw_value: '2RS', normalized_value: '2RS', source_evidence_id: 'ev-109' },
    ],
    evidence: [
      { id: 'ev-109', evidence_type: 'INVOICE_ROW', extracted_value: 'Radial Ball Bearing 6208 2RS C3', source_text: 'Radial Ball Bearing 6208 2RS C3 40x80x18mm SKF', source_file: 'BHEL_Component_Indent_2025.csv', source_type: 'CSV_IMPORT', confidence: 0.96, row_number: 77 },
    ],
  },
  {
    id: 'mat-110',
    legacy_material_code: 'MAT-50099',
    original_description: 'Electric Motor 45kW 415V 50Hz 1480RPM IE3 Efficiency',
    normalized_description: 'Electric Motor 45 kW 415 V 1480 RPM IE3',
    organization: 'CPSE-E',
    organization_id: 'org-5',
    category: 'Electrical',
    status: 'NORMALIZED',
    data_quality_score: 89,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    attributes: [
      { id: 'a32', attribute_name: 'power', raw_value: '45kW', normalized_value: '45 kW', unit: 'kW', source_evidence_id: 'ev-110' },
      { id: 'a33', attribute_name: 'voltage', raw_value: '415V', normalized_value: '415 V', unit: 'V', source_evidence_id: 'ev-110' },
    ],
    evidence: [
      { id: 'ev-110', evidence_type: 'TECH_SHEET', extracted_value: 'Electric Motor 45kW 415V 1480RPM', source_text: 'Electric Motor 45kW 415V 50Hz 1480RPM IE3 Efficiency', source_file: 'GAIL_Compressor_Station_Spec.pdf', source_type: 'PDF_SPEC', confidence: 0.95, page_number: 31 },
    ],
  },
  {
    id: 'mat-111',
    legacy_material_code: 'MAT-60012',
    original_description: '3-Phase Induction Motor 60HP 415V 1500RPM TEFC BHEL',
    normalized_description: 'Electric Motor 45 kW (60 HP) 415 V 1500 RPM',
    organization: 'CPSE-F',
    organization_id: 'org-6',
    category: 'Electrical',
    status: 'EXTRACTED',
    data_quality_score: 87,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 16).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    attributes: [
      { id: 'a34', attribute_name: 'power', raw_value: '60HP', normalized_value: '45 kW', unit: 'kW', source_evidence_id: 'ev-111' },
      { id: 'a35', attribute_name: 'voltage', raw_value: '415V', normalized_value: '415 V', unit: 'V', source_evidence_id: 'ev-111' },
    ],
    evidence: [
      { id: 'ev-111', evidence_type: 'CATALOG_SPEC', extracted_value: '3-Phase Induction Motor 60HP 415V', source_text: '3-Phase Induction Motor 60HP 415V 1500RPM TEFC BHEL', source_file: 'SAIL_Plant_Electrical_Spares.pdf', source_type: 'PDF_SPEC', confidence: 0.94, page_number: 62 },
    ],
  },
  {
    id: 'mat-112',
    legacy_material_code: 'MAT-60033',
    original_description: 'Seamless Pipe 6" NB SCH 40 Carbon Steel ASTM A106 Gr B',
    normalized_description: 'Seamless Pipe 6 in SCH 40 Carbon Steel A106 Gr B',
    organization: 'CPSE-F',
    organization_id: 'org-6',
    category: 'Pipes & Fittings',
    status: 'VERIFIED',
    common_identity: 'NMIP-PIPE-005',
    common_identity_id: 'id-005',
    data_quality_score: 96,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    attributes: [
      { id: 'a36', attribute_name: 'size', raw_value: '6" NB', normalized_value: '6 in', unit: 'in', source_evidence_id: 'ev-112' },
      { id: 'a37', attribute_name: 'schedule', raw_value: 'SCH 40', normalized_value: 'SCH 40', source_evidence_id: 'ev-112' },
      { id: 'a38', attribute_name: 'material_grade', raw_value: 'ASTM A106 Gr B', normalized_value: 'A106-B', source_evidence_id: 'ev-112' },
    ],
    evidence: [
      { id: 'ev-112', evidence_type: 'CATALOG_SPEC', extracted_value: 'Seamless Pipe 6in SCH 40 A106 Gr B', source_text: 'Seamless Pipe 6" NB SCH 40 Carbon Steel ASTM A106 Gr B', source_file: 'SAIL_Plant_Piping_Specs.pdf', source_type: 'PDF_SPEC', confidence: 0.97, page_number: 19 },
    ],
  },
  {
    id: 'mat-113',
    legacy_material_code: 'MAT-70014',
    original_description: 'Pipe Seamless 6 Inch SCH40 CS ASTM A106 Grade B',
    normalized_description: 'Seamless Pipe 6 in SCH 40 Carbon Steel A106 Gr B',
    organization: 'CPSE-G',
    organization_id: 'org-7',
    category: 'Pipes & Fittings',
    status: 'VERIFIED',
    common_identity: 'NMIP-PIPE-005',
    common_identity_id: 'id-005',
    data_quality_score: 93,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    attributes: [
      { id: 'a39', attribute_name: 'size', raw_value: '6 Inch', normalized_value: '6 in', unit: 'in', source_evidence_id: 'ev-113' },
      { id: 'a40', attribute_name: 'schedule', raw_value: 'SCH40', normalized_value: 'SCH 40', source_evidence_id: 'ev-113' },
      { id: 'a41', attribute_name: 'material_grade', raw_value: 'ASTM A106 Grade B', normalized_value: 'A106-B', source_evidence_id: 'ev-113' },
    ],
    evidence: [
      { id: 'ev-113', evidence_type: 'INVOICE_ROW', extracted_value: 'Pipe Seamless 6 Inch SCH40 CS A106-B', source_text: 'Pipe Seamless 6 Inch SCH40 CS ASTM A106 Grade B', source_file: 'HPCL_Refinery_Pipe_Register.csv', source_type: 'CSV_IMPORT', confidence: 0.94, row_number: 156 },
    ],
  },
  {
    id: 'mat-114',
    legacy_material_code: 'MAT-70055',
    original_description: 'Globe Valve 3" Forged Steel A105 Class 800 SW Socket Weld',
    normalized_description: 'Globe Valve 3 inch Forged Steel A105 Class 800 SW',
    organization: 'CPSE-G',
    organization_id: 'org-7',
    category: 'Valves',
    status: 'NORMALIZED',
    data_quality_score: 86,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    attributes: [
      { id: 'a42', attribute_name: 'valve_type', raw_value: 'Globe Valve', normalized_value: 'Globe Valve', source_evidence_id: 'ev-114' },
      { id: 'a43', attribute_name: 'size', raw_value: '3"', normalized_value: '3 in', unit: 'in', source_evidence_id: 'ev-114' },
      { id: 'a44', attribute_name: 'material_grade', raw_value: 'A105', normalized_value: 'A105', source_evidence_id: 'ev-114' },
    ],
    evidence: [
      { id: 'ev-114', evidence_type: 'CATALOG_SPEC', extracted_value: 'Globe Valve 3in A105 Class 800 SW', source_text: 'Globe Valve 3" Forged Steel A105 Class 800 SW Socket Weld', source_file: 'HPCL_Refinery_Valves.pdf', source_type: 'PDF_SPEC', confidence: 0.95, page_number: 45 },
    ],
  },
  {
    id: 'mat-115',
    legacy_material_code: 'MAT-80021',
    original_description: 'Spiral Wound Gasket 6" Class 150 SS316L / Graphite Filler',
    normalized_description: 'Spiral Wound Gasket 6 inch Class 150 SS316L Graphite',
    organization: 'CPSE-H',
    organization_id: 'org-8',
    category: 'Fasteners',
    status: 'NORMALIZED',
    data_quality_score: 84,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 22).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    attributes: [
      { id: 'a45', attribute_name: 'size', raw_value: '6"', normalized_value: '6 in', unit: 'in', source_evidence_id: 'ev-115' },
      { id: 'a46', attribute_name: 'material_grade', raw_value: 'SS316L', normalized_value: 'SS316L', source_evidence_id: 'ev-115' },
    ],
    evidence: [
      { id: 'ev-115', evidence_type: 'INVOICE_ROW', extracted_value: 'Spiral Wound Gasket 6in Class 150 SS316L', source_text: 'Spiral Wound Gasket 6" Class 150 SS316L / Graphite Filler', source_file: 'BPCL_Petroleum_Gaskets.csv', source_type: 'CSV_IMPORT', confidence: 0.93, row_number: 89 },
    ],
  },
  {
    id: 'mat-116',
    legacy_material_code: 'MAT-80043',
    original_description: 'Pressure Transmitter 0-10 bar 4-20mA HART 1/2" NPT Rosemount',
    normalized_description: 'Pressure Transmitter 0-10 bar 4-20mA HART 1/2 in NPT',
    organization: 'CPSE-H',
    organization_id: 'org-8',
    category: 'Instrumentation',
    status: 'VERIFIED',
    common_identity: 'NMIP-INSTR-006',
    common_identity_id: 'id-006',
    data_quality_score: 98,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    attributes: [
      { id: 'a47', attribute_name: 'range', raw_value: '0-10 bar', normalized_value: '0-10 bar', unit: 'bar', source_evidence_id: 'ev-116' },
      { id: 'a48', attribute_name: 'signal', raw_value: '4-20mA HART', normalized_value: '4-20mA HART', source_evidence_id: 'ev-116' },
    ],
    evidence: [
      { id: 'ev-116', evidence_type: 'TECH_SHEET', extracted_value: 'Pressure Transmitter 0-10 bar 4-20mA HART', source_text: 'Pressure Transmitter 0-10 bar 4-20mA HART 1/2" NPT Rosemount', source_file: 'BPCL_Instrumentation_Register.pdf', source_type: 'PDF_SPEC', confidence: 0.98, page_number: 12 },
    ],
  },
  {
    id: 'mat-117',
    legacy_material_code: 'MAT-10095',
    original_description: 'Centrifugal Slurry Pump 30HP High Head Iron Alloy ONGC',
    normalized_description: 'Centrifugal Slurry Pump 30 HP High Head High Chrome',
    organization: 'CPSE-A',
    organization_id: 'org-1',
    category: 'Pumps',
    status: 'INGESTED',
    data_quality_score: 75,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    attributes: [
      { id: 'a49', attribute_name: 'power', raw_value: '30HP', normalized_value: '30 HP', unit: 'HP', source_evidence_id: 'ev-117' },
    ],
    evidence: [
      { id: 'ev-117', evidence_type: 'CATALOG_SPEC', extracted_value: 'Centrifugal Slurry Pump 30HP', source_text: 'Centrifugal Slurry Pump 30HP High Head Iron Alloy ONGC', source_file: 'ONGC_Offshore_Pumps.pdf', source_type: 'PDF_SPEC', confidence: 0.91, page_number: 73 },
    ],
  },
  {
    id: 'mat-118',
    legacy_material_code: 'MAT-20110',
    original_description: 'Butterfly Valve 8" Lug Type Ductile Iron EPDM Seat PN16',
    normalized_description: 'Butterfly Valve 8 inch Ductile Iron EPDM PN16',
    organization: 'CPSE-B',
    organization_id: 'org-2',
    category: 'Valves',
    status: 'NORMALIZED',
    data_quality_score: 88,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    attributes: [
      { id: 'a50', attribute_name: 'valve_type', raw_value: 'Butterfly Valve', normalized_value: 'Butterfly Valve', source_evidence_id: 'ev-118' },
      { id: 'a51', attribute_name: 'size', raw_value: '8"', normalized_value: '8 in', unit: 'in', source_evidence_id: 'ev-118' },
    ],
    evidence: [
      { id: 'ev-118', evidence_type: 'INVOICE_ROW', extracted_value: 'Butterfly Valve 8in Ductile Iron EPDM', source_text: 'Butterfly Valve 8" Lug Type Ductile Iron EPDM Seat PN16', source_file: 'NTPC_Water_Treatment_Valves.csv', source_type: 'CSV_IMPORT', confidence: 0.94, row_number: 122 },
    ],
  },
  {
    id: 'mat-119',
    legacy_material_code: 'MAT-30125',
    original_description: 'High Tensile Hex Nut M16 Grade 8.8 Black Phosphate',
    normalized_description: 'Hexagon Nut M16 Grade 8.8 Black Phosphate',
    organization: 'CPSE-C',
    organization_id: 'org-3',
    category: 'Fasteners',
    status: 'EXTRACTED',
    data_quality_score: 82,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    attributes: [
      { id: 'a52', attribute_name: 'size', raw_value: 'M16', normalized_value: 'M16', source_evidence_id: 'ev-119' },
      { id: 'a53', attribute_name: 'material_grade', raw_value: 'Grade 8.8', normalized_value: '8.8', source_evidence_id: 'ev-119' },
    ],
    evidence: [
      { id: 'ev-119', evidence_type: 'INVOICE_ROW', extracted_value: 'High Tensile Hex Nut M16 Grade 8.8', source_text: 'High Tensile Hex Nut M16 Grade 8.8 Black Phosphate', source_file: 'IOCL_Fastener_Stock.csv', source_type: 'CSV_IMPORT', confidence: 0.92, row_number: 204 },
    ],
  },
  {
    id: 'mat-120',
    legacy_material_code: 'MAT-40133',
    original_description: 'Duplex Oil Filter Cartridge 10 Micron Microglass Element',
    normalized_description: 'Oil Filter Cartridge 10 Micron Microglass',
    organization: 'CPSE-D',
    organization_id: 'org-4',
    category: 'Compressors & Filters',
    status: 'INGESTED',
    data_quality_score: 78,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    attributes: [
      { id: 'a54', attribute_name: 'rating', raw_value: '10 Micron', normalized_value: '10 um', unit: 'um', source_evidence_id: 'ev-120' },
    ],
    evidence: [
      { id: 'ev-120', evidence_type: 'TECH_SHEET', extracted_value: 'Duplex Oil Filter Cartridge 10 Micron', source_text: 'Duplex Oil Filter Cartridge 10 Micron Microglass Element', source_file: 'BHEL_Turbine_Filter_Specs.pdf', source_type: 'PDF_SPEC', confidence: 0.93, page_number: 16 },
    ],
  },
  {
    id: 'mat-121',
    legacy_material_code: 'MAT-50148',
    original_description: 'Reciprocating Air Compressor 7.5kW 10bar 500L Tank GAIL',
    normalized_description: 'Reciprocating Air Compressor 7.5 kW 10 bar 500 L',
    organization: 'CPSE-E',
    organization_id: 'org-5',
    category: 'Compressors & Filters',
    status: 'VERIFIED',
    common_identity: 'NMIP-COMP-007',
    common_identity_id: 'id-007',
    data_quality_score: 95,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    attributes: [
      { id: 'a55', attribute_name: 'power', raw_value: '7.5kW', normalized_value: '7.5 kW', unit: 'kW', source_evidence_id: 'ev-121' },
      { id: 'a56', attribute_name: 'pressure', raw_value: '10bar', normalized_value: '10 bar', unit: 'bar', source_evidence_id: 'ev-121' },
    ],
    evidence: [
      { id: 'ev-121', evidence_type: 'CATALOG_SPEC', extracted_value: 'Reciprocating Air Compressor 7.5kW 10bar', source_text: 'Reciprocating Air Compressor 7.5kW 10bar 500L Tank GAIL', source_file: 'GAIL_Pneumatic_Systems.pdf', source_type: 'PDF_SPEC', confidence: 0.97, page_number: 28 },
    ],
  },
  {
    id: 'mat-122',
    legacy_material_code: 'MAT-60199',
    original_description: 'Temperature Element Pt100 RTD 3-Wire Duplex Thermowell',
    normalized_description: 'RTD Sensor Pt100 3-Wire Duplex Thermowell',
    organization: 'CPSE-F',
    organization_id: 'org-6',
    category: 'Instrumentation',
    status: 'VERIFIED',
    common_identity: 'NMIP-INSTR-008',
    common_identity_id: 'id-008',
    data_quality_score: 96,
    revision: 1,
    updated_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    attributes: [
      { id: 'a57', attribute_name: 'sensor_type', raw_value: 'Pt100 RTD', normalized_value: 'Pt100', source_evidence_id: 'ev-122' },
      { id: 'a58', attribute_name: 'wiring', raw_value: '3-Wire Duplex', normalized_value: '3-Wire', source_evidence_id: 'ev-122' },
    ],
    evidence: [
      { id: 'ev-122', evidence_type: 'TECH_SHEET', extracted_value: 'Temperature Element Pt100 RTD 3-Wire', source_text: 'Temperature Element Pt100 RTD 3-Wire Duplex Thermowell', source_file: 'SAIL_Instrumentation_Catalog.pdf', source_type: 'PDF_SPEC', confidence: 0.96, page_number: 50 },
    ],
  },
];

// Initial Candidates Data with realistic candidates in PENDING status for the Review Queue
const initialCandidates: MockCandidate[] = [
  {
    id: 'cand-1',
    status: 'PENDING',
    material_a: initialMaterials[5],
    material_b: initialMaterials[6],
    final_score: 94.8,
    semantic_score: 96.2,
    attribute_score: 93.4,
    critical_conflicts: 0,
    missing_attributes: 0,
    evidence_count: 2,
    decision: {
      id: 'dec-1',
      decision_type: 'IDENTITY_MATCH',
      reason: 'Both ONGC and NTPC records specify a 4-inch Class 300 Cast Steel Check Valve with Butt-Weld connection. High attribute alignment.',
      snapshot: { a_revision: 1, b_revision: 1 },
    },
    comparisons: [
      { id: 'comp-1', attribute_name: 'valve_type', value_a: 'Check Valve', value_b: 'Check Valve', comparison_result: 'MATCH', criticality: 'CRITICAL' },
      { id: 'comp-2', attribute_name: 'size', value_a: '4 in', value_b: '4 in', comparison_result: 'MATCH', criticality: 'CRITICAL' },
      { id: 'comp-3', attribute_name: 'material_grade', value_a: 'CS', value_b: 'CS', comparison_result: 'MATCH', criticality: 'CRITICAL' },
      { id: 'comp-4', attribute_name: 'pressure_class', value_a: 'Class 300', value_b: 'Class 300', comparison_result: 'MATCH', criticality: 'CRITICAL' },
    ],
    reviews: [],
    evidence: [...initialMaterials[5].evidence, ...initialMaterials[6].evidence],
  },
  {
    id: 'cand-2',
    status: 'PENDING',
    material_a: initialMaterials[7],
    material_b: initialMaterials[8],
    final_score: 97.5,
    semantic_score: 99.0,
    attribute_score: 96.0,
    critical_conflicts: 0,
    missing_attributes: 0,
    evidence_count: 2,
    decision: {
      id: 'dec-2',
      decision_type: 'IDENTITY_MATCH',
      reason: 'Standard 6208-2RS-C3 Deep Groove Ball Bearing model match across IOCL and BHEL catalog items.',
      snapshot: { a_revision: 1, b_revision: 1 },
    },
    comparisons: [
      { id: 'comp-5', attribute_name: 'model', value_a: '6208-2RS-C3', value_b: '6208-2RS-C3', comparison_result: 'MATCH', criticality: 'CRITICAL' },
      { id: 'comp-6', attribute_name: 'seal_type', value_a: '2RS', value_b: '2RS', comparison_result: 'MATCH', criticality: 'CRITICAL' },
    ],
    reviews: [],
    evidence: [...initialMaterials[7].evidence, ...initialMaterials[8].evidence],
  },
  {
    id: 'cand-3',
    status: 'PENDING',
    material_a: initialMaterials[11],
    material_b: initialMaterials[12],
    final_score: 95.1,
    semantic_score: 97.0,
    attribute_score: 93.2,
    critical_conflicts: 0,
    missing_attributes: 0,
    evidence_count: 2,
    decision: {
      id: 'dec-3',
      decision_type: 'IDENTITY_MATCH',
      reason: '6-inch SCH 40 Carbon Steel Seamless Pipe ASTM A106 Gr B specification match between SAIL and HPCL.',
      snapshot: { a_revision: 1, b_revision: 1 },
    },
    comparisons: [
      { id: 'comp-7', attribute_name: 'size', value_a: '6 in', value_b: '6 in', comparison_result: 'MATCH', criticality: 'CRITICAL' },
      { id: 'comp-8', attribute_name: 'schedule', value_a: 'SCH 40', value_b: 'SCH 40', comparison_result: 'MATCH', criticality: 'CRITICAL' },
      { id: 'comp-9', attribute_name: 'material_grade', value_a: 'A106-B', value_b: 'A106-B', comparison_result: 'MATCH', criticality: 'CRITICAL' },
    ],
    reviews: [],
    evidence: [...initialMaterials[11].evidence, ...initialMaterials[12].evidence],
  },
  {
    id: 'cand-4',
    status: 'PENDING',
    material_a: initialMaterials[9],
    material_b: initialMaterials[10],
    final_score: 88.3,
    semantic_score: 91.0,
    attribute_score: 85.5,
    critical_conflicts: 0,
    missing_attributes: 1,
    evidence_count: 2,
    decision: {
      id: 'dec-4',
      decision_type: 'POTENTIAL_SUBSTITUTE',
      reason: 'Both motors share 45kW (60HP) 415V rating, but RPM speed ratings (1480 vs 1500 RPM) differ slightly.',
      snapshot: { a_revision: 1, b_revision: 1 },
    },
    comparisons: [
      { id: 'comp-10', attribute_name: 'power', value_a: '45 kW', value_b: '45 kW', comparison_result: 'MATCH', criticality: 'CRITICAL' },
      { id: 'comp-11', attribute_name: 'voltage', value_a: '415 V', value_b: '415 V', comparison_result: 'MATCH', criticality: 'CRITICAL' },
      { id: 'comp-12', attribute_name: 'speed', value_a: '1480 RPM', value_b: '1500 RPM', comparison_result: 'SUBSTITUTE', criticality: 'IMPORTANT' },
    ],
    reviews: [],
    evidence: [...initialMaterials[9].evidence, ...initialMaterials[10].evidence],
  },
  {
    id: 'cand-5',
    status: 'PENDING',
    material_a: initialMaterials[0],
    material_b: initialMaterials[2],
    final_score: 42.1,
    semantic_score: 75.0,
    attribute_score: 30.0,
    critical_conflicts: 2,
    missing_attributes: 0,
    evidence_count: 2,
    decision: {
      id: 'dec-5',
      decision_type: 'DO_NOT_MERGE',
      reason: 'Critical conflict detected: Material grades (CS vs SS316) and Pressure classes (Class 150 vs Class 300) differ.',
      snapshot: { a_revision: 2, b_revision: 1 },
    },
    comparisons: [
      { id: 'comp-13', attribute_name: 'valve_type', value_a: 'Gate Valve', value_b: 'Ball Valve', comparison_result: 'CONFLICT', criticality: 'CRITICAL' },
      { id: 'comp-14', attribute_name: 'material_grade', value_a: 'CS', value_b: 'SS316', comparison_result: 'CONFLICT', criticality: 'CRITICAL' },
      { id: 'comp-15', attribute_name: 'pressure_class', value_a: 'Class 150', value_b: 'Class 300', comparison_result: 'CONFLICT', criticality: 'CRITICAL' },
    ],
    reviews: [],
    evidence: [...initialMaterials[0].evidence, ...initialMaterials[2].evidence],
  },
  {
    id: 'cand-6',
    status: 'INFORMATION_REQUESTED',
    material_a: initialMaterials[16],
    material_b: initialMaterials[3],
    final_score: 62.0,
    semantic_score: 78.5,
    attribute_score: 45.0,
    critical_conflicts: 0,
    missing_attributes: 2,
    evidence_count: 2,
    decision: {
      id: 'dec-6',
      decision_type: 'INSUFFICIENT_INFORMATION',
      reason: 'Material ONGC MAT-10095 lacks explicit impeller material specification and head rating details.',
      snapshot: { a_revision: 1, b_revision: 2 },
    },
    comparisons: [
      { id: 'comp-16', attribute_name: 'power', value_a: '30 HP', value_b: '15 HP', comparison_result: 'CONFLICT', criticality: 'CRITICAL' },
      { id: 'comp-17', attribute_name: 'impeller_material', value_a: 'Missing', value_b: 'SS304', comparison_result: 'MISSING', criticality: 'IMPORTANT' },
    ],
    reviews: [
      { id: 'rev-6', action: 'REQUEST_INFORMATION', comment: 'Requested data steward to verify impeller metallurgy for ONGC slurry pump.', reviewer_id: 'u-engineer', created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
    ],
    evidence: [...initialMaterials[16].evidence, ...initialMaterials[3].evidence],
  },
  {
    id: 'cand-7',
    status: 'APPROVED',
    material_a: initialMaterials[0],
    material_b: initialMaterials[1],
    final_score: 96.4,
    semantic_score: 98.1,
    attribute_score: 94.7,
    critical_conflicts: 0,
    missing_attributes: 0,
    evidence_count: 2,
    decision: {
      id: 'dec-7',
      decision_type: 'IDENTITY_MATCH',
      reason: 'Both items specify a 2-inch Class 150 Carbon Steel Gate Valve with NPT/ANSI threading. Approved identity NMIP-VALVE-001.',
      snapshot: { a_revision: 2, b_revision: 1 },
    },
    comparisons: [
      { id: 'comp-18', attribute_name: 'valve_type', value_a: 'Gate Valve', value_b: 'Gate Valve', comparison_result: 'MATCH', criticality: 'CRITICAL' },
      { id: 'comp-19', attribute_name: 'size', value_a: '2 in', value_b: '2 in', comparison_result: 'MATCH', criticality: 'CRITICAL' },
      { id: 'comp-20', attribute_name: 'material_grade', value_a: 'CS', value_b: 'CS', comparison_result: 'MATCH', criticality: 'CRITICAL' },
    ],
    reviews: [
      { id: 'rev-7', action: 'APPROVE', comment: 'Verified engineering specification match between ONGC (CPSE-A) and NTPC (CPSE-B) catalog records.', reviewer_id: 'u-admin', created_at: new Date(Date.now() - 3600000 * 3).toISOString() },
    ],
    evidence: [...initialMaterials[0].evidence, ...initialMaterials[1].evidence],
  },
];

// Initial Common Identities
const initialCommonIdentities: MockCommonIdentity[] = [
  {
    id: 'id-001',
    nmip_code: 'NMIP-VALVE-001',
    canonical_name: 'Gate Valve 2" Carbon Steel Class 150 NPT Threaded',
    category: 'Valves',
    status: 'PUBLISHED',
    mapping_count: 2,
    canonical_attributes: {
      valve_type: 'Gate Valve',
      size: '2 in',
      material_grade: 'CS (Carbon Steel)',
      pressure_class: 'Class 150 (PN 20)',
      end_connection: 'NPT Threaded / ANSI',
    },
    mappings: [
      { id: 'mat-101', organization: 'CPSE-A · ONGC', legacy_material_code: 'MAT-10060', original_description: 'Gate V/V 2" CS CL150 NPT Threaded Flanged Body' },
      { id: 'mat-102', organization: 'CPSE-B · NTPC', legacy_material_code: 'MAT-20045', original_description: '2 Inch Gate Valve Carbon Steel 150# ANSI Threaded' },
    ],
    reviews: [
      { id: 'r-1', action: 'PUBLISH', comment: 'Approved identity published to National Material Catalog.', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
    ],
    evidence: initialMaterials[0].evidence,
  },
  {
    id: 'id-002',
    nmip_code: 'NMIP-PUMP-002',
    canonical_name: 'Centrifugal Pump 15 HP 415V 3-Phase SS304 Impeller',
    category: 'Pumps',
    status: 'VERIFIED',
    mapping_count: 1,
    canonical_attributes: {
      pump_type: 'Centrifugal Pump',
      power: '15 HP',
      voltage: '415 V',
      phases: '3-Phase',
      impeller_material: 'SS304',
    },
    mappings: [
      { id: 'mat-104', organization: 'CPSE-D · BHEL', legacy_material_code: 'MAT-40089', original_description: 'Centrifugal Water Pump 15HP 415V 3-Phase SS304 Impeller' },
    ],
    reviews: [
      { id: 'r-2', action: 'APPROVE', comment: 'Verified single-source common identity.', created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
    ],
    evidence: initialMaterials[3].evidence,
  },
  {
    id: 'id-003',
    nmip_code: 'NMIP-VALVE-003',
    canonical_name: 'Check Valve 4" Carbon Steel Class 300 Butt-Weld',
    category: 'Valves',
    status: 'VERIFIED',
    mapping_count: 2,
    canonical_attributes: {
      valve_type: 'Check Valve',
      size: '4 in',
      material_grade: 'Cast Steel / CS',
      pressure_class: 'Class 300',
    },
    mappings: [
      { id: 'mat-106', organization: 'CPSE-A · ONGC', legacy_material_code: 'MAT-10072', original_description: 'Check Valve 4" Cast Steel Class 300 Flanged Butt-Weld' },
      { id: 'mat-107', organization: 'CPSE-B · NTPC', legacy_material_code: 'MAT-20088', original_description: '4 Inch Swing Check Valve CS 300# Flanged BW' },
    ],
    reviews: [
      { id: 'r-3', action: 'APPROVE', comment: 'Verified cross-CPSE check valve identity.', created_at: new Date(Date.now() - 3600000 * 7).toISOString() },
    ],
    evidence: [...initialMaterials[5].evidence, ...initialMaterials[6].evidence],
  },
  {
    id: 'id-004',
    nmip_code: 'NMIP-BEARING-004',
    canonical_name: 'Deep Groove Ball Bearing 6208 2RS C3 40x80x18mm',
    category: 'Bearings',
    status: 'VERIFIED',
    mapping_count: 2,
    canonical_attributes: {
      model: '6208-2RS-C3',
      bore_diameter: '40 mm',
      outer_diameter: '80 mm',
      width: '18 mm',
      seal: 'Rubber Sealed (2RS)',
    },
    mappings: [
      { id: 'mat-108', organization: 'CPSE-C · IOCL', legacy_material_code: 'MAT-30044', original_description: 'Deep Groove Ball Bearing SKF 6208-2RSH/C3 Rubber Sealed' },
      { id: 'mat-109', organization: 'CPSE-D · BHEL', legacy_material_code: 'MAT-40015', original_description: 'Radial Ball Bearing 6208 2RS C3 40x80x18mm SKF' },
    ],
    reviews: [
      { id: 'r-4', action: 'APPROVE', comment: 'SKF bearing standard identity verified.', created_at: new Date(Date.now() - 3600000 * 10).toISOString() },
    ],
    evidence: [...initialMaterials[7].evidence, ...initialMaterials[8].evidence],
  },
  {
    id: 'id-005',
    nmip_code: 'NMIP-PIPE-005',
    canonical_name: 'Seamless Steel Pipe 6" SCH 40 ASTM A106 Gr B',
    category: 'Pipes & Fittings',
    status: 'VERIFIED',
    mapping_count: 2,
    canonical_attributes: {
      size: '6 in',
      schedule: 'SCH 40',
      material_grade: 'ASTM A106 Grade B',
      type: 'Seamless Pipe',
    },
    mappings: [
      { id: 'mat-112', organization: 'CPSE-F · SAIL', legacy_material_code: 'MAT-60033', original_description: 'Seamless Pipe 6" NB SCH 40 Carbon Steel ASTM A106 Gr B' },
      { id: 'mat-113', organization: 'CPSE-G · HPCL', legacy_material_code: 'MAT-70014', original_description: 'Pipe Seamless 6 Inch SCH40 CS ASTM A106 Grade B' },
    ],
    reviews: [
      { id: 'r-5', action: 'APPROVE', comment: 'Piping standard identity verified.', created_at: new Date(Date.now() - 3600000 * 6).toISOString() },
    ],
    evidence: [...initialMaterials[11].evidence, ...initialMaterials[12].evidence],
  },
];

// Initial Ingestion Datasets with complete preview values for unit, manufacturer, specification, standard, etc.
const initialDatasets: MockDataset[] = [
  {
    id: 'ds-01',
    filename: 'synthetic_cpse_procurement_batch_2025.csv',
    source_type: 'CSV_IMPORT',
    row_count: 5,
    valid_rows: 5,
    invalid_rows: 0,
    status: 'IMPORTED',
    columns: ['legacy_material_code', 'original_description', 'category', 'unit', 'manufacturer', 'specification', 'standard'],
    column_mapping: {
      legacy_material_code: 'legacy_material_code',
      original_description: 'original_description',
      category: 'category',
      unit: 'unit',
      manufacturer: 'manufacturer',
      specification: 'specification',
      standard: 'standard',
    },
    preview: [
      {
        legacy_material_code: 'MAT-90011',
        original_description: 'Globe Valve 4" Carbon Steel Class 300 Flanged RF',
        category: 'Valves',
        unit: 'in',
        manufacturer: 'L&T Valves India',
        specification: 'Globe Valve 4in CS Class 300 RF',
        standard: 'BS 1873 / API 600',
      },
      {
        legacy_material_code: 'MAT-90022',
        original_description: 'Centrifugal Water Pump 25HP 415V 3-Phase IP55',
        category: 'Pumps',
        unit: 'HP',
        manufacturer: 'Kirloskar Brothers Ltd',
        specification: 'Centrifugal Pump 25HP 415V 3PH',
        standard: 'IS 1520 / ISO 5199',
      },
      {
        legacy_material_code: 'MAT-90033',
        original_description: 'Hex Bolt M16 x 60mm SS316 Plain Washer Included',
        category: 'Fasteners',
        unit: 'mm',
        manufacturer: 'Sundram Fasteners',
        specification: 'Hexagon Bolt M16x60 SS316',
        standard: 'ISO 4014 / DIN 931',
      },
      {
        legacy_material_code: 'MAT-90044',
        original_description: 'Seamless Steel Pipe 8" NB SCH 40 Carbon Steel',
        category: 'Pipes & Fittings',
        unit: 'in',
        manufacturer: 'Jindal Saw Ltd',
        specification: 'Seamless Pipe 8in SCH40 A106 Gr B',
        standard: 'ASTM A106 Grade B',
      },
      {
        legacy_material_code: 'MAT-90055',
        original_description: 'Pressure Transmitter 0-16 bar 4-20mA HART LCD Display',
        category: 'Instrumentation',
        unit: 'bar',
        manufacturer: 'Yokogawa India',
        specification: 'Pressure Transmitter 0-16 bar HART',
        standard: 'IEC 61508 / SIL 2',
      },
    ],
    validation_report: [
      { row: 1, values: { legacy_material_code: 'MAT-90011' }, errors: [] },
      { row: 2, values: { legacy_material_code: 'MAT-90022' }, errors: [] },
      { row: 3, values: { legacy_material_code: 'MAT-90033' }, errors: [] },
      { row: 4, values: { legacy_material_code: 'MAT-90044' }, errors: [] },
      { row: 5, values: { legacy_material_code: 'MAT-90055' }, errors: [] },
    ],
  },
];

// Initial Do Not Merge Rules
const initialDoNotMergeRules = [
  {
    id: 'dnm-1',
    name: 'Material Grade Incompatibility',
    category: '*',
    attribute_a: 'material_grade',
    attribute_b: 'material_grade',
    condition: 'DIFFERENT',
    severity: 'CRITICAL',
    reason: 'Material grades (CS, SS304, SS316, Alloy Steel) have distinct chemical/corrosion profiles and cannot be merged.',
    is_active: true,
  },
  {
    id: 'dnm-2',
    name: 'Pressure Class Rating Mismatch',
    category: 'Valves',
    attribute_a: 'pressure_class',
    attribute_b: 'pressure_class',
    condition: 'DIFFERENT',
    severity: 'CRITICAL',
    reason: 'Different pressure class ratings (e.g., Class 150 vs Class 300) represent non-interchangeable pressure limits.',
    is_active: true,
  },
  {
    id: 'dnm-3',
    name: 'Voltage Rating Mismatch',
    category: 'Electrical',
    attribute_a: 'voltage',
    attribute_b: 'voltage',
    condition: 'DIFFERENT',
    severity: 'CRITICAL',
    reason: 'Voltage ratings (e.g. 230V vs 415V) represent distinct electrical operating specifications.',
    is_active: true,
  },
];

// Initial Category Engineering Rules
const initialCategoryRules = [
  { id: 'rule-1', category: 'Valves', attribute_name: 'pressure_class', rule_type: 'EXACT', severity: 'CRITICAL', rule_definition: { tolerance: 0 }, version: 1, is_active: true },
  { id: 'rule-2', category: 'Valves', attribute_name: 'material_grade', rule_type: 'EXACT', severity: 'CRITICAL', rule_definition: { tolerance: 0 }, version: 1, is_active: true },
  { id: 'rule-3', category: 'Pumps', attribute_name: 'power', rule_type: 'NUMERIC', severity: 'CRITICAL', rule_definition: { tolerance: 0 }, version: 1, is_active: true },
  { id: 'rule-4', category: 'Fasteners', attribute_name: 'material_grade', rule_type: 'EXACT', severity: 'CRITICAL', rule_definition: { tolerance: 0 }, version: 1, is_active: true },
  { id: 'rule-5', category: 'Fasteners', attribute_name: 'coating', rule_type: 'EXACT', severity: 'IMPORTANT', rule_definition: { tolerance: 0 }, version: 1, is_active: true },
];

// Initial Dictionary Mappings
const initialDictionary = [
  { id: 'dict-1', term: 'CS', expansion: 'Carbon Steel', kind: 'ABBREVIATION', category: '*', version: 1 },
  { id: 'dict-2', term: 'SS304', expansion: 'Stainless Steel 304', kind: 'ABBREVIATION', category: '*', version: 1 },
  { id: 'dict-3', term: 'Gate V/V', expansion: 'Gate Valve', kind: 'SYNONYM', category: 'Valves', version: 1 },
  { id: 'dict-4', term: 'S.S.', expansion: 'Stainless Steel', kind: 'ABBREVIATION', category: '*', version: 1 },
  { id: 'dict-5', term: 'CL150', expansion: 'Class 150', kind: 'STANDARD', category: 'Valves', version: 1 },
];

// Initial Audit Trail Entries
const initialAuditEntries: MockAuditEntry[] = [
  {
    id: 'audit-1',
    user_name: 'Admin · Demo',
    action: 'IDENTITY_APPROVED',
    entity_type: 'CommonIdentity',
    entity_id: 'id-001',
    reason: 'Verified engineering specification match between ONGC (CPSE-A) and NTPC (CPSE-B) catalog records.',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    previous_value: { status: 'DRAFT' },
    new_value: { status: 'PUBLISHED', nmip_code: 'NMIP-VALVE-001' },
  },
  {
    id: 'audit-2',
    user_name: 'Data Steward · Demo',
    action: 'DATASET_IMPORTED',
    entity_type: 'Dataset',
    entity_id: 'ds-01',
    reason: 'Uploaded synthetic CPSE material procurement batch and ingested 5 material rows into catalog.',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    previous_value: null,
    new_value: { filename: 'synthetic_cpse_procurement_batch_2025.csv', row_count: 5 },
  },
  {
    id: 'audit-3',
    user_name: 'Data Steward · Demo',
    action: 'MATERIAL_NORMALIZED',
    entity_type: 'Material',
    entity_id: 'mat-101',
    reason: 'Executed standard unit and abbreviation expansion pipeline.',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    previous_value: { status: 'INGESTED' },
    new_value: { status: 'NORMALIZED' },
  },
];

class MockDataStore {
  currentUser: MockUser = initialUsers[0];
  materials: MockMaterial[] = [...initialMaterials];
  candidates: MockCandidate[] = [...initialCandidates];
  identities: MockCommonIdentity[] = [...initialCommonIdentities];
  datasets: MockDataset[] = [...initialDatasets];
  doNotMergeRules = [...initialDoNotMergeRules];
  categoryRules = [...initialCategoryRules];
  dictionary = [...initialDictionary];
  users: MockUser[] = [...initialUsers];
  auditLogs: MockAuditEntry[] = [...initialAuditEntries];
  taxonomyTree = initialTaxonomyTree;

  logAudit(action: string, entity_type: string, entity_id: string, reason: string, prev?: any, next?: any) {
    this.auditLogs.unshift({
      id: 'audit-' + Math.random().toString(36).slice(2, 9),
      user_name: this.currentUser.name,
      action,
      entity_type,
      entity_id,
      reason,
      created_at: new Date().toISOString(),
      previous_value: prev,
      new_value: next,
    });
  }

  getOverview() {
    const total_materials = this.materials.length;
    const common_identities = this.identities.length;
    const potential_duplicates = this.candidates.filter(c => c.status === 'PENDING').length;
    const pending_reviews = this.candidates.filter(c => ['PENDING', 'INFORMATION_REQUESTED'].includes(c.status)).length;

    const decision_distribution = {
      IDENTITY_MATCH: this.candidates.filter(c => c.decision?.decision_type === 'IDENTITY_MATCH').length,
      POTENTIAL_SUBSTITUTE: this.candidates.filter(c => c.decision?.decision_type === 'POTENTIAL_SUBSTITUTE').length,
      DO_NOT_MERGE: this.candidates.filter(c => c.decision?.decision_type === 'DO_NOT_MERGE').length,
      INSUFFICIENT_INFORMATION: this.candidates.filter(c => c.decision?.decision_type === 'INSUFFICIENT_INFORMATION').length,
    };

    const by_org: Record<string, number> = {};
    for (const m of this.materials) {
      by_org[m.organization] = (by_org[m.organization] || 0) + 1;
    }

    const by_cat: Record<string, number> = {};
    for (const m of this.materials) {
      by_cat[m.category] = (by_cat[m.category] || 0) + 1;
    }

    const review_status = {
      APPROVED: this.candidates.filter(c => c.status === 'APPROVED').length,
      PENDING: this.candidates.filter(c => c.status === 'PENDING').length,
      REJECTED: this.candidates.filter(c => c.status === 'REJECTED').length,
    };

    const avgQuality = Math.round(this.materials.reduce((acc, m) => acc + m.data_quality_score, 0) / Math.max(total_materials, 1));

    return {
      total_materials,
      common_identities,
      potential_duplicates,
      pending_reviews,
      decision_distribution,
      by_organization: by_org,
      by_category: by_cat,
      review_status,
      data_quality: { Complete: 16, Partial: 4, Basic: 2 },
      duplicate_trends: { Mon: 4, Tue: 7, Wed: 3, Thu: 6, Fri: 8, Sat: 2, Sun: 3 },
      blocked_merges: this.candidates.filter(c => c.decision?.decision_type === 'DO_NOT_MERGE').length,
      insufficient_information: this.candidates.filter(c => c.decision?.decision_type === 'INSUFFICIENT_INFORMATION').length,
      organizations: Object.keys(by_org).length,
      categories: Object.keys(by_cat).length,
      average_quality: avgQuality,
      review_turnaround_hours: 1.2,
      duplicate_alerts: 4,
      recent_activity: this.auditLogs.slice(0, 5),
    };
  }

  async handleRequest(request: Request, path: string[]): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const endpoint = '/' + path.join('/');

    // Auth endpoints
    if (endpoint === '/auth/login' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const email = body.email?.toLowerCase();
      const user = this.users.find(u => u.email.toLowerCase() === email) || this.users[0];
      this.currentUser = user;
      this.logAudit('USER_LOGIN', 'User', user.id, 'Authenticated with demo credentials');
      return Response.json(user);
    }
    if (endpoint === '/auth/me' && method === 'GET') {
      return Response.json(this.currentUser);
    }
    if (endpoint === '/auth/logout' && method === 'POST') {
      return Response.json({ message: 'Signed out' });
    }

    // Analytics / Overview
    if (endpoint === '/analytics/overview' && method === 'GET') {
      return Response.json(this.getOverview());
    }

    // Organizations
    if (endpoint === '/organizations' && method === 'GET') {
      return Response.json(initialOrgs);
    }

    // Datasets Ingestion Endpoints
    if (endpoint === '/datasets' && method === 'GET') {
      return Response.json(this.datasets);
    }

    if (endpoint === '/datasets/upload' && method === 'POST') {
      const newDataset: MockDataset = {
        id: 'ds-' + Math.random().toString(36).slice(2, 9),
        filename: 'uploaded_cpse_materials_' + new Date().toISOString().slice(0, 10) + '.csv',
        source_type: 'CSV_IMPORT',
        row_count: 5,
        valid_rows: 5,
        invalid_rows: 0,
        status: 'UPLOADED',
        columns: ['legacy_material_code', 'original_description', 'category', 'unit', 'manufacturer', 'specification', 'standard'],
        column_mapping: {
          legacy_material_code: 'legacy_material_code',
          original_description: 'original_description',
          category: 'category',
          unit: 'unit',
          manufacturer: 'manufacturer',
          specification: 'specification',
          standard: 'standard',
        },
        preview: [
          {
            legacy_material_code: 'MAT-99001',
            original_description: 'Ball Valve 2" SS316 Class 600 Flanged ONGC',
            category: 'Valves',
            unit: 'in',
            manufacturer: 'L&T Valves',
            specification: 'Ball Valve 2in SS316 Class 600',
            standard: 'API 6D / BS 5351',
          },
          {
            legacy_material_code: 'MAT-99002',
            original_description: 'Centrifugal Pump 50HP 415V NTPC Boiler Feed',
            category: 'Pumps',
            unit: 'HP',
            manufacturer: 'Kirloskar Brothers',
            specification: 'Centrifugal Pump 50HP 415V 3PH',
            standard: 'ISO 5199 / IS 1520',
          },
          {
            legacy_material_code: 'MAT-99003',
            original_description: 'Stud Bolt 1" x 120mm Alloy Steel B7 Nut 2H IOCL',
            category: 'Fasteners',
            unit: 'in',
            manufacturer: 'Sundram Fasteners',
            specification: 'Stud Bolt 1x120mm ASTM A193 B7',
            standard: 'ASME B16.5 / ASTM A193',
          },
          {
            legacy_material_code: 'MAT-99004',
            original_description: 'High Pressure Pipe 4" SCH 80 CS ASTM A106 Gr B',
            category: 'Pipes & Fittings',
            unit: 'in',
            manufacturer: 'Jindal Saw',
            specification: 'Seamless Pipe 4in SCH 80 CS A106-B',
            standard: 'ASTM A106 Grade B',
          },
          {
            legacy_material_code: 'MAT-99005',
            original_description: 'Temperature Transmitter 0-200C 4-20mA HART BHEL',
            category: 'Instrumentation',
            unit: 'degC',
            manufacturer: 'Yokogawa India',
            specification: 'Temperature Transmitter 0-200C HART',
            standard: 'IEC 60751 / SIL 2',
          },
        ],
        validation_report: [
          { row: 1, values: { legacy_material_code: 'MAT-99001' }, errors: [] },
          { row: 2, values: { legacy_material_code: 'MAT-99002' }, errors: [] },
          { row: 3, values: { legacy_material_code: 'MAT-99003' }, errors: [] },
          { row: 4, values: { legacy_material_code: 'MAT-99004' }, errors: [] },
          { row: 5, values: { legacy_material_code: 'MAT-99005' }, errors: [] },
        ],
      };
      this.datasets.unshift(newDataset);
      this.logAudit('DATASET_UPLOADED', 'Dataset', newDataset.id, `Uploaded ${newDataset.filename} for ingestion processing.`);
      return Response.json(newDataset);
    }

    if (endpoint.startsWith('/datasets/')) {
      const parts = endpoint.split('/').filter(Boolean);
      const dsId = parts[1];
      const ds = this.datasets.find(d => d.id === dsId);

      // PUT /datasets/:id/rows (Editing dataset row in SourcePreview)
      if (parts[2] === 'rows' && method === 'PUT') {
        const body = await request.json().catch(() => ({}));
        if (ds && body.row_index !== undefined && body.values) {
          const idx = body.row_index;
          if (ds.preview[idx]) {
            ds.preview[idx] = { ...ds.preview[idx], ...body.values };
          }
          this.logAudit('DATASET_ROW_UPDATED', 'Dataset', ds.id, body.reason || 'Corrected dataset preview row values');
        }
        return Response.json(ds || {});
      }

      if (parts[2] === 'validate' && method === 'POST') {
        if (ds) ds.status = 'VALIDATED';
        return Response.json({
          rows: ds?.validation_report || [],
          valid_rows: ds?.valid_rows || 5,
          invalid_rows: 0,
        });
      }

      if (parts[2] === 'import' && method === 'POST') {
        if (ds) {
          ds.status = 'IMPORTED';
          // Convert dataset preview rows into materials with complete evidence & attributes
          ds.preview.forEach((row, idx) => {
            const org = initialOrgs[idx % initialOrgs.length];
            const newEvId = 'ev-imp-' + Math.random().toString(36).slice(2, 9);
            const newMat: MockMaterial = {
              id: 'mat-imp-' + Math.random().toString(36).slice(2, 9),
              legacy_material_code: row.legacy_material_code || `MAT-${99000 + idx}`,
              original_description: row.original_description || 'Imported material spec',
              normalized_description: (row.original_description || '').replace(/V\/V/gi, 'Valve').replace(/CS/g, 'Carbon Steel'),
              organization: org.code,
              organization_id: org.id,
              category: row.category || 'Valves',
              status: 'INGESTED',
              data_quality_score: 85,
              revision: 1,
              updated_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              attributes: [
                { id: 'attr-1', attribute_name: 'category', raw_value: row.category || 'Valves', normalized_value: row.category || 'Valves', source_evidence_id: newEvId },
                { id: 'attr-2', attribute_name: 'manufacturer', raw_value: row.manufacturer || 'L&T Valves', normalized_value: row.manufacturer || 'L&T Valves', source_evidence_id: newEvId },
                { id: 'attr-3', attribute_name: 'standard', raw_value: row.standard || 'API 600', normalized_value: row.standard || 'API 600', source_evidence_id: newEvId },
              ],
              evidence: [
                {
                  id: newEvId,
                  evidence_type: 'INSPECTED_IMPORT_ROW',
                  extracted_value: row.specification || row.original_description || 'Imported row specification',
                  source_text: `${row.legacy_material_code || ''} ${row.original_description || ''} ${row.manufacturer || ''} ${row.standard || ''}`.trim(),
                  source_file: ds.filename,
                  source_type: 'CSV_IMPORT',
                  confidence: 0.95,
                  row_number: idx + 1,
                },
              ],
            };
            this.materials.unshift(newMat);
          });

          this.logAudit('DATASET_IMPORTED', 'Dataset', ds.id, `Imported ${ds.valid_rows} validated material rows into catalog.`);
        }
        return Response.json({ status: 'SUCCESS', imported_count: ds?.valid_rows || 5 });
      }

      if (parts.length === 2 && method === 'DELETE') {
        this.datasets = this.datasets.filter(d => d.id !== dsId);
        this.logAudit('DATASET_DELETED', 'Dataset', dsId, 'Deleted dataset from ingestion workspace.');
        return Response.json({ message: 'Deleted' });
      }

      if (parts.length === 2 && method === 'GET') {
        return Response.json(ds || {});
      }
    }

    // Pipeline Stage Bulk Processing Endpoints
    if (endpoint.startsWith('/pipeline/')) {
      const stage = endpoint.split('/')[2];
      let processedCount = 0;

      this.materials.forEach(m => {
        if (m.status !== 'VERIFIED' && m.status !== 'PUBLISHED') {
          if (stage === 'normalize') m.status = 'NORMALIZED';
          if (stage === 'extract') m.status = 'EXTRACTED';
          if (stage === 'enrich') m.status = 'VERIFIED';
          m.data_quality_score = Math.min(100, m.data_quality_score + 8);
          processedCount++;
        }
      });

      this.logAudit('PIPELINE_RUN', 'Pipeline', stage, `Ran ${stage} pipeline on ${processedCount} unverified catalog materials.`);
      return Response.json({ status: 'SUCCESS', processed_count: processedCount });
    }

    // Materials / Catalog
    if ((endpoint === '/materials' || endpoint === '/catalog') && method === 'GET') {
      const q = url.searchParams.get('q')?.toLowerCase() || '';
      const org = url.searchParams.get('organization') || '';
      const cat = url.searchParams.get('category') || '';
      const status = url.searchParams.get('status') || '';

      let list = this.materials.filter(m => {
        if (org && m.organization !== org) return false;
        if (cat && m.category !== cat) return false;
        if (status && m.status !== status) return false;
        if (q) {
          const matchText = `${m.legacy_material_code} ${m.original_description} ${m.normalized_description} ${m.common_identity || ''}`.toLowerCase();
          if (!matchText.includes(q)) return false;
        }
        return true;
      });

      return Response.json(list);
    }

    if (endpoint.startsWith('/materials/') || endpoint.startsWith('/catalog/')) {
      const parts = endpoint.split('/').filter(Boolean);
      const matId = parts[1];

      // POST /materials/:id/normalize
      if (parts[2] === 'normalize' && method === 'POST') {
        const mat = this.materials.find(m => m.id === matId);
        if (mat) {
          mat.status = 'NORMALIZED';
          this.logAudit('MATERIAL_NORMALIZED', 'Material', mat.id, 'Source description normalized.');
        }
        return Response.json(mat || {});
      }

      // POST /materials/:id/extract
      if (parts[2] === 'extract' && method === 'POST') {
        const mat = this.materials.find(m => m.id === matId);
        if (mat) {
          mat.status = 'EXTRACTED';
          mat.data_quality_score = Math.min(100, mat.data_quality_score + 10);
          this.logAudit('ATTRIBUTES_EXTRACTED', 'Material', mat.id, 'Extracted attributes from evidence text.');
        }
        return Response.json(mat || {});
      }

      // POST /materials/:id/attributes
      if (parts[2] === 'attributes' && method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const mat = this.materials.find(m => m.id === matId);
        if (mat) {
          const newEv = {
            id: 'ev-' + Math.random().toString(36).slice(2, 9),
            evidence_type: 'USER_CORRECTION',
            extracted_value: body.value || '',
            source_text: body.source_text || '',
            source_file: body.source_file || 'User_Correction.pdf',
            source_type: 'USER_INPUT',
            confidence: 1.0,
          };
          mat.evidence.push(newEv);
          mat.attributes.push({
            id: 'attr-' + Math.random().toString(36).slice(2, 9),
            attribute_name: body.attribute_name || 'custom_spec',
            raw_value: body.value || '',
            normalized_value: body.value || '',
            source_evidence_id: newEv.id,
          });
          mat.revision += 1;
          this.logAudit('EVIDENCE_ADDED', 'Material', mat.id, body.reason || 'Added attribute evidence');
        }
        return Response.json(mat || {});
      }

      // PUT /materials/:id
      if (parts.length === 2 && method === 'PUT') {
        const body = await request.json().catch(() => ({}));
        const mat = this.materials.find(m => m.id === matId);
        if (mat) {
          const prevDesc = mat.original_description;
          if (body.original_description) {
            mat.original_description = body.original_description;
            mat.normalized_description = body.original_description.replace(/V\/V/gi, 'Valve').replace(/CS/g, 'Carbon Steel');
          }
          mat.revision += 1;
          this.logAudit('MATERIAL_UPDATED', 'Material', mat.id, body.reason || 'Corrected description', { original_description: prevDesc }, { original_description: mat.original_description });
        }
        return Response.json(mat || {});
      }

      // GET /materials/:id
      if (parts.length === 2 && method === 'GET') {
        const mat = this.materials.find(m => m.id === matId);
        if (!mat) return Response.json({ detail: 'Material not found' }, { status: 404 });
        return Response.json(mat);
      }
    }

    // POST /materials (Create Material)
    if ((endpoint === '/materials' || endpoint === '/catalog') && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const org = initialOrgs.find(o => o.id === body.organization_id) || initialOrgs[0];
      const newEvId = 'ev-new-' + Math.random().toString(36).slice(2, 9);
      const newMat: MockMaterial = {
        id: 'mat-' + Math.random().toString(36).slice(2, 9),
        legacy_material_code: body.legacy_material_code || `MAT-${Math.floor(10000 + Math.random() * 90000)}`,
        original_description: body.original_description || 'Unspecified material',
        normalized_description: (body.original_description || '').replace(/V\/V/gi, 'Valve').replace(/CS/g, 'Carbon Steel'),
        organization: org.code,
        organization_id: org.id,
        category: body.category || 'Valves',
        status: 'INGESTED',
        data_quality_score: 80,
        revision: 1,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        attributes: [
          { id: 'a-new', attribute_name: 'category', raw_value: body.category || 'Valves', normalized_value: body.category || 'Valves', source_evidence_id: newEvId }
        ],
        evidence: [
          {
            id: newEvId,
            evidence_type: 'MANUAL_ENTRY',
            extracted_value: body.original_description || 'Manual entry specification',
            source_text: `Created as separate material code ${body.legacy_material_code} for ${org.code}. Reason: ${body.override_reason || 'Initial creation'}`,
            source_file: 'Manual_Material_Creation_Form.pdf',
            source_type: 'USER_INPUT',
            confidence: 1.0,
          },
        ],
      };
      this.materials.unshift(newMat);
      this.logAudit('MATERIAL_CREATED', 'Material', newMat.id, body.override_reason || 'Manual item creation');
      return Response.json(newMat);
    }

    // POST /duplicate-check
    if (endpoint === '/duplicate-check' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const desc = (body.description || '').toLowerCase();
      const cat = body.category || 'Valves';

      const matched = this.materials.filter(m => m.category === cat).map(m => {
        const similarity = desc.includes(m.legacy_material_code.toLowerCase()) || desc.includes('gate') && m.original_description.toLowerCase().includes('gate') ? 94 : 68;
        return {
          material_id: m.id,
          legacy_material_code: m.legacy_material_code,
          description: m.original_description,
          similarity,
          common_identity: m.common_identity,
          common_identity_id: m.common_identity_id,
          decision: {
            decision_type: similarity > 90 ? 'IDENTITY_MATCH' : 'POTENTIAL_SUBSTITUTE',
            reason: similarity > 90 ? 'High attribute alignment and identical material grade' : 'Similar category and size specifications',
          },
          comparisons: [
            { attribute_name: 'size', value_a: '2 in', value_b: '2 in', comparison_result: 'MATCH' },
            { attribute_name: 'material_grade', value_a: 'CS', value_b: 'CS', comparison_result: 'MATCH' },
          ],
        };
      });

      return Response.json(matched.slice(0, 3));
    }

    // Catalog Ingestion: POST /catalog/ingest
    if ((endpoint === '/catalog/ingest' || endpoint === '/ingestion') && method === 'POST') {
      const sampleMaterials: MockMaterial[] = [
        {
          id: 'mat-' + Math.random().toString(36).slice(2, 9),
          legacy_material_code: 'MAT-60011',
          original_description: 'Centrifugal Pump 20HP 415V ONGC Offshore Platform Grade',
          normalized_description: 'Centrifugal Pump 20 HP 415 V ONGC Offshore',
          organization: 'CPSE-A',
          organization_id: 'org-1',
          category: 'Pumps',
          status: 'NORMALIZED',
          data_quality_score: 91,
          revision: 1,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          attributes: [{ id: 'a20', attribute_name: 'power', raw_value: '20HP', normalized_value: '20 HP', unit: 'HP' }],
          evidence: [
            { id: 'ev-b1', evidence_type: 'CATALOG_SPEC', extracted_value: 'Centrifugal Pump 20HP 415V', source_text: 'Centrifugal Pump 20HP 415V ONGC Offshore Platform Grade', source_file: 'ONGC_Offshore_Pumps.pdf', source_type: 'PDF_SPEC', confidence: 0.96, page_number: 14 },
          ],
        },
        {
          id: 'mat-' + Math.random().toString(36).slice(2, 9),
          legacy_material_code: 'MAT-70022',
          original_description: 'Ball Valve 2" SS316 Class 150 Flanged IOCL Pipeline',
          normalized_description: 'Ball Valve 2 inch SS316 Class 150 Flanged',
          organization: 'CPSE-C',
          organization_id: 'org-3',
          category: 'Valves',
          status: 'NORMALIZED',
          data_quality_score: 93,
          revision: 1,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          attributes: [{ id: 'a21', attribute_name: 'valve_type', raw_value: 'Ball Valve', normalized_value: 'Ball Valve' }],
          evidence: [
            { id: 'ev-b2', evidence_type: 'INVOICE_ROW', extracted_value: 'Ball Valve 2in SS316 Class 150', source_text: 'Ball Valve 2" SS316 Class 150 Flanged IOCL Pipeline', source_file: 'IOCL_Pipeline_Procurement.csv', source_type: 'CSV_IMPORT', confidence: 0.95, row_number: 88 },
          ],
        },
      ];
      this.materials.unshift(...sampleMaterials);
      this.logAudit('DATASET_INGESTED', 'Catalog', 'batch-ingest', 'Ingested dataset into NMIP catalog.');
      return Response.json({ ingested_count: sampleMaterials.length, status: 'SUCCESS' });
    }

    // POST /materials/bulk-delete
    if (endpoint === '/materials/bulk-delete' && method === 'POST') {
      this.materials = this.materials.filter(m => m.status === 'VERIFIED' || m.common_identity);
      this.logAudit('BULK_DELETE', 'Catalog', 'bulk', 'Cleared unverified items from workspace.');
      return Response.json({ message: 'Deleted unverified items' });
    }

    // Candidates Endpoints: GET /candidates
    if (endpoint === '/candidates' && method === 'GET') {
      return Response.json(this.candidates);
    }

    // POST /candidates/retrieve (Dynamic Retrieval)
    if (endpoint === '/candidates/retrieve' && method === 'POST') {
      if (this.materials.length >= 2) {
        // Find unmapped or newly ingested materials and create candidate pair recommendations
        const unmapped = this.materials.filter(m => !m.common_identity_id);
        const matA = unmapped[0] || this.materials[0];
        const matB = unmapped[1] || this.materials[1];

        const newCand: MockCandidate = {
          id: 'cand-' + Math.random().toString(36).slice(2, 9),
          status: 'PENDING',
          material_a: matA,
          material_b: matB,
          final_score: 93.6,
          semantic_score: 96.0,
          attribute_score: 91.2,
          critical_conflicts: 0,
          missing_attributes: 0,
          evidence_count: matA.evidence.length + matB.evidence.length,
          decision: {
            id: 'dec-' + Math.random().toString(36).slice(2, 9),
            decision_type: matA.category === matB.category ? 'IDENTITY_MATCH' : 'POTENTIAL_SUBSTITUTE',
            reason: `Cross-dataset match retrieved between ${matA.organization} (${matA.legacy_material_code}) and ${matB.organization} (${matB.legacy_material_code}). Category specs align cleanly.`,
            snapshot: { a_revision: matA.revision, b_revision: matB.revision },
          },
          comparisons: [
            { id: 'c-1', attribute_name: 'category', value_a: matA.category, value_b: matB.category, comparison_result: 'MATCH', criticality: 'CRITICAL' },
            { id: 'c-2', attribute_name: 'description', value_a: matA.normalized_description, value_b: matB.normalized_description, comparison_result: 'MATCH', criticality: 'CRITICAL' },
          ],
          reviews: [],
          evidence: [...matA.evidence, ...matB.evidence],
        };
        this.candidates.unshift(newCand);
      }
      this.logAudit('CANDIDATES_RETRIEVED', 'CandidateCenter', 'retrieval-job', 'Ran hybrid candidate retrieval algorithm.');
      return Response.json(this.candidates);
    }

    if (endpoint.startsWith('/candidates/')) {
      const parts = endpoint.split('/').filter(Boolean);
      const candId = parts[1];
      const cand = this.candidates.find(c => c.id === candId) || this.candidates[0];

      // GET /candidates/:id/comparison or /candidates/:id
      if (parts[2] === 'comparison' || parts.length === 2) {
        return Response.json(cand);
      }

      // POST /candidates/:id/decision (Rerun engine)
      if (parts[2] === 'decision' && method === 'POST') {
        if (cand && cand.decision) {
          cand.final_score = Math.min(99.5, cand.final_score + 1.5);
          cand.decision.reason = 'Updated evaluation with latest rule engine version.';
        }
        this.logAudit('ENGINE_RERUN', 'Candidate', candId, 'Reran rule engine for candidate pair.');
        return Response.json(cand?.decision || {});
      }
    }

    // Human Reviews: POST /reviews
    if (endpoint === '/reviews' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const cand = this.candidates.find(c => c.decision?.id === body.decision_id) || this.candidates[0];
      let newIdentId: string | undefined = undefined;

      if (cand) {
        if (body.action === 'APPROVE') {
          cand.status = 'APPROVED';
          // Create or link common identity
          const newIdent: MockCommonIdentity = {
            id: 'id-' + Math.random().toString(36).slice(2, 9),
            nmip_code: `NMIP-${cand.material_a.category.toUpperCase().slice(0, 5)}-00${this.identities.length + 1}`,
            canonical_name: cand.material_a.original_description,
            category: cand.material_a.category,
            status: 'VERIFIED',
            mapping_count: 2,
            canonical_attributes: {
              category: cand.material_a.category,
              specification: cand.material_a.normalized_description,
            },
            mappings: [
              { id: cand.material_a.id, organization: cand.material_a.organization, legacy_material_code: cand.material_a.legacy_material_code, original_description: cand.material_a.original_description },
              { id: cand.material_b.id, organization: cand.material_b.organization, legacy_material_code: cand.material_b.legacy_material_code, original_description: cand.material_b.original_description },
            ],
            reviews: [{ id: 'r-new', action: 'APPROVE', comment: body.comment || 'Approved by human reviewer', created_at: new Date().toISOString() }],
            evidence: cand.evidence,
          };
          this.identities.unshift(newIdent);
          cand.material_a.common_identity = newIdent.nmip_code;
          cand.material_a.common_identity_id = newIdent.id;
          cand.material_b.common_identity = newIdent.nmip_code;
          cand.material_b.common_identity_id = newIdent.id;
          newIdentId = newIdent.id;
        } else if (body.action === 'REJECT') {
          cand.status = 'REJECTED';
        } else {
          cand.status = 'INFORMATION_REQUESTED';
        }

        cand.reviews.unshift({
          id: 'rev-' + Math.random().toString(36).slice(2, 9),
          action: body.action,
          comment: body.comment || '',
          reviewer_id: this.currentUser.id,
          created_at: new Date().toISOString(),
        });

        this.logAudit('HUMAN_REVIEW', 'Candidate', cand.id, `${body.action}: ${body.comment || 'No comment'}`);
      }

      return Response.json({ status: 'SUCCESS', common_identity_id: newIdentId });
    }

    // Common Identities: GET /common-identities
    if (endpoint === '/common-identities' && method === 'GET') {
      return Response.json(this.identities);
    }
    if (endpoint.startsWith('/common-identities/')) {
      const parts = endpoint.split('/').filter(Boolean);
      const identId = parts[1];

      // POST /common-identities/:id/publish
      if (parts[2] === 'publish' && method === 'POST') {
        const ident = this.identities.find(i => i.id === identId);
        if (ident) {
          ident.status = 'PUBLISHED';
          this.logAudit('IDENTITY_PUBLISHED', 'CommonIdentity', ident.id, 'Published common material identity to catalog.');
        }
        return Response.json(ident || {});
      }

      // GET /common-identities/:id
      if (parts.length === 2 && method === 'GET') {
        const ident = this.identities.find(i => i.id === identId);
        if (!ident) return Response.json({ detail: 'Identity not found' }, { status: 404 });
        return Response.json(ident);
      }
    }

    // AI Harmonization: POST /ai/harmonize
    if (endpoint === '/ai/harmonize' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const text = body.text || 'Gate V/V 2" CS CL150';
      const category = body.category || 'Valves';

      return Response.json({
        harmonized_title: text.replace(/V\/V/gi, 'Valve').replace(/CS/g, 'Carbon Steel').replace(/CL150/g, 'Class 150'),
        harmonized_category: category,
        taxonomy_node_code: 'VALVE-GATE',
        confidence_score: 0.96,
        extracted_attributes: {
          valve_type: { raw: 'Gate V/V', normalized: 'Gate Valve', confidence: 0.98 },
          size: { raw: '2"', normalized: '2 in', unit: 'in', confidence: 0.95 },
          material_grade: { raw: 'CS', normalized: 'Carbon Steel', confidence: 0.97 },
          pressure_class: { raw: 'CL150', normalized: 'Class 150', unit: 'ANSI', confidence: 0.96 },
        },
        improvements: [
          'Expanded abbreviation "V/V" to canonical term "Valve".',
          'Standardized material grade abbreviation "CS" to "Carbon Steel".',
          'Mapped pressure class rating "CL150" to ANSI Class 150 standard.',
        ],
      });
    }

    // POST /ai/harmonize/apply
    if (endpoint === '/ai/harmonize/apply' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const mat = this.materials.find(m => m.id === body.material_id);
      if (mat) {
        mat.normalized_description = body.harmonized_title || mat.normalized_description;
        mat.status = 'VERIFIED';
        mat.revision += 1;
        this.logAudit('AI_HARMONIZE_APPLIED', 'Material', mat.id, 'Applied AI canonical harmonization title to material.');
      }
      return Response.json({ status: 'SUCCESS' });
    }

    // Do Not Merge Rules: GET/POST /do-not-merge/rules
    if (endpoint === '/do-not-merge/rules' && method === 'GET') {
      return Response.json(this.doNotMergeRules);
    }
    if (endpoint === '/do-not-merge/rules' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newRule = {
        id: 'dnm-' + Math.random().toString(36).slice(2, 9),
        name: body.name || 'New Do Not Merge Rule',
        category: body.category || '*',
        attribute_a: body.attribute_a || 'material_grade',
        attribute_b: body.attribute_b || 'material_grade',
        condition: body.condition || 'DIFFERENT',
        severity: body.severity || 'CRITICAL',
        reason: body.reason || 'User defined block rule.',
        is_active: body.is_active ?? true,
      };
      this.doNotMergeRules.unshift(newRule);
      this.logAudit('DNM_RULE_CREATED', 'DoNotMergeRule', newRule.id, body.reason || 'Created policy rule');
      return Response.json(newRule);
    }

    if (endpoint.startsWith('/do-not-merge/rules/')) {
      const ruleId = endpoint.split('/')[3];
      if (method === 'PUT') {
        const body = await request.json().catch(() => ({}));
        const rule = this.doNotMergeRules.find(r => r.id === ruleId);
        if (rule) {
          rule.is_active = body.is_active ?? !rule.is_active;
          this.logAudit('DNM_RULE_TOGGLED', 'DoNotMergeRule', rule.id, 'Toggled enforcement state');
        }
        return Response.json(rule || {});
      }
      if (method === 'DELETE') {
        this.doNotMergeRules = this.doNotMergeRules.filter(r => r.id !== ruleId);
        this.logAudit('DNM_RULE_DELETED', 'DoNotMergeRule', ruleId, 'Deleted rule definition');
        return Response.json({ message: 'Deleted' });
      }
    }

    // POST /do-not-merge/test
    if (endpoint === '/do-not-merge/test' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const valA = body.aa?.material_grade;
      const valB = body.ab?.material_grade;
      const isBlocked = valA && valB && valA.toUpperCase() !== valB.toUpperCase();
      return Response.json({
        blocked: isBlocked,
        violations: isBlocked ? [
          { rule: 'Material Grade Incompatibility', reason: `Material grades '${valA}' and '${valB}' have incompatible metallurgy.` }
        ] : [],
      });
    }

    // Taxonomy Tree: GET /taxonomy/tree
    if (endpoint === '/taxonomy/tree' && method === 'GET') {
      return Response.json({
        tree: this.taxonomyTree,
        total_nodes: 9,
      });
    }
    if ((endpoint === '/taxonomy/nodes' || endpoint === '/taxonomy/tree') && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newNode = {
        id: 'tax-' + Math.random().toString(36).slice(2, 9),
        code: body.code || 'NODE-NEW',
        name: body.name || 'New Taxonomy Node',
        level: 2,
        description: body.description || '',
        total_material_count: 0,
        attribute_schema: [],
        children: [],
      };
      if (this.taxonomyTree[0]?.children) {
        this.taxonomyTree[0].children.push(newNode);
      }
      this.logAudit('TAXONOMY_NODE_CREATED', 'TaxonomyNode', newNode.id, 'Created new category taxonomy node');
      return Response.json(newNode);
    }
    if (endpoint === '/taxonomy/classify' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const text = (body.text || '').toLowerCase();
      let matchedNode = { code: 'VALVE-GATE', name: 'Valves' };
      if (text.includes('pump')) matchedNode = { code: 'PUMP-CENT', name: 'Pumps' };
      if (text.includes('bolt')) matchedNode = { code: 'FAST-BOLT', name: 'Fasteners' };
      return Response.json({
        category: matchedNode.name,
        taxonomy_node: matchedNode,
        confidence: 0.94,
      });
    }

    // Admin Rules: GET/POST /rules
    if (endpoint === '/rules' && method === 'GET') {
      return Response.json(this.categoryRules);
    }
    if (endpoint === '/rules' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newR = {
        id: 'rule-' + Math.random().toString(36).slice(2, 9),
        category: body.category || 'Valves',
        attribute_name: body.attribute_name || 'custom_attribute',
        rule_type: body.rule_type || 'EXACT',
        severity: body.severity || 'CRITICAL',
        rule_definition: body.rule_definition || { tolerance: 0 },
        version: 1,
        is_active: body.is_active ?? true,
      };
      this.categoryRules.unshift(newR);
      this.logAudit('RULE_CREATED', 'EngineeringRule', newR.id, 'Created category engineering rule');
      return Response.json(newR);
    }

    // Users Management: GET/POST /users
    if (endpoint === '/users' && method === 'GET') {
      return Response.json(this.users);
    }
    if (endpoint === '/users' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newU: MockUser = {
        id: 'user-' + Math.random().toString(36).slice(2, 9),
        name: body.name || 'New User',
        email: body.email || `user${Math.floor(Math.random()*1000)}@nmip.local`,
        role: body.role || 'ENGINEER',
        organization_id: 'org-1',
        organization_name: 'CPSE-A · ONGC India',
        is_active: true,
      };
      this.users.push(newU);
      this.logAudit('USER_CREATED', 'User', newU.id, 'Provisioned new user account');
      return Response.json(newU);
    }
    if (endpoint.startsWith('/users/')) {
      const userId = endpoint.split('/')[2];
      if (method === 'PUT') {
        const body = await request.json().catch(() => ({}));
        const u = this.users.find(x => x.id === userId);
        if (u) {
          if (body.role) u.role = body.role;
          if (body.is_active !== undefined) u.is_active = body.is_active;
          this.logAudit('USER_UPDATED', 'User', u.id, 'Updated user access roles or active status');
        }
        return Response.json(u || {});
      }
    }

    // Settings & Dictionary: GET /settings, POST /settings/dictionary
    if (endpoint === '/settings' && method === 'GET') {
      return Response.json({
        embedding_provider: 'Deterministic Hybrid Hashing (Standard)',
        extraction_provider: 'Rule-Engine Regex & LLM Pipeline',
        erp_sync: 'Disabled (Standalone Demo Mode)',
        max_upload_mb: 10,
        dictionary: this.dictionary,
      });
    }
    if (endpoint === '/settings/dictionary' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const newD = {
        id: 'dict-' + Math.random().toString(36).slice(2, 9),
        term: body.term || 'TERM',
        expansion: body.expansion || 'Expansion',
        kind: body.kind || 'ABBREVIATION',
        category: body.category || '*',
        version: 1,
      };
      this.dictionary.unshift(newD);
      this.logAudit('DICTIONARY_ADDED', 'DictionaryEntry', newD.id, 'Added terminology expansion');
      return Response.json(newD);
    }

    // Audit Trail: GET /audit
    if (endpoint === '/audit' && method === 'GET') {
      return Response.json(this.auditLogs);
    }

    // Proof Board: GET /proof-board, POST /proof-board/benchmark
    if (endpoint === '/proof-board' && method === 'GET') {
      return Response.json({
        provider: 'NMIP Rule-Governed Hybrid Matcher',
        runs: [
          {
            id: 'run-1',
            filename: 'CPSE_Material_Benchmark_V1.csv',
            row_count: 50,
            created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            metrics: {
              provider: 'NMIP Hybrid Rule Matcher',
              threshold: 75,
              top_k: 5,
              scope: 'CPSE cross-catalog material dataset benchmarking',
              models: {
                'Fuzzy matching': { precision: 0.72, recall: 0.68, f1: 0.70, top_k_retrieval: 0.80, false_merge_rate: 0.18, do_not_merge_accuracy: 0.60, abstention_rate: 0.05, confusion: { tp: 17, fp: 4, tn: 20, fn: 9 } },
                'Embedding similarity': { precision: 0.81, recall: 0.85, f1: 0.83, top_k_retrieval: 0.92, false_merge_rate: 0.12, do_not_merge_accuracy: 0.75, abstention_rate: 0.02, confusion: { tp: 21, fp: 3, tn: 22, fn: 4 } },
                'NMIP hybrid + rules': { precision: 0.96, recall: 0.92, f1: 0.94, top_k_retrieval: 0.98, false_merge_rate: 0.01, do_not_merge_accuracy: 0.99, abstention_rate: 0.08, confusion: { tp: 23, fp: 1, tn: 25, fn: 1 } },
              },
            },
          },
        ],
      });
    }
    if (endpoint === '/proof-board/benchmark' && method === 'POST') {
      this.logAudit('BENCHMARK_EXECUTED', 'ProofBoard', 'run-new', 'Ran labeled evaluation benchmark dataset.');
      return Response.json({ status: 'SUCCESS' });
    }

    // Default fallback response
    return Response.json({ status: 'ok', detail: 'Mock response from NMIP frontend standalone API' });
  }
}

export const mockDataStore = new MockDataStore();
