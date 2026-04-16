import mongoose from 'mongoose';

const complianceMappingSchema = new mongoose.Schema({
  framework: {
    type: String,
    enum: ['ISO 27001', 'IEC 62443', 'OWASP ASVS', 'NIST CSF',
           'PCI DSS', 'GDPR', 'NIS2', 'MDR', 'HIPAA'],
    required: true
  },
  version: { type: String },
  control: { type: String, required: true }
}, { _id: false });

const securityRequirementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    match: /^REQ-[0-9]{4}-[0-9]{3}$/
  },
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    minlength: 10
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Authentication', 'Access Control', 'Encryption',
      'Data Protection', 'Logging', 'Network Security',
      'Physical Security', 'Incident Response', 'Compliance',
      'AI Security', 'IoT Security'
    ]
  },
  priority: {
    type: String,
    required: true,
    enum: ['Critical', 'High', 'Medium', 'Low']
  },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Approved', 'In Progress', 'Implemented', 'Rejected'],
    default: 'Draft'
  },
  compliance_mappings: [complianceMappingSchema],
  linked_assets: [{ type: String }],
  source: {
    type: { type: String, enum: ['chat', 'document', 'manual', 'jira', 'confluence'] },
    timestamp: { type: Date },
    reference: { type: String }
  },
  verification_method: { type: String },
  acceptance_criteria: [{ type: String }],
  owner: { type: String },
  review_date: { type: Date },
  projectId: { type: String }
}, {
  timestamps: true
});

export default mongoose.model('SecurityRequirement', securityRequirementSchema);