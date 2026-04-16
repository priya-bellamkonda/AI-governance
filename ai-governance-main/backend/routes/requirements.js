import express from 'express';
import SecurityRequirement from '../models/SecurityRequirement.js';
import { validateRequirement } from '../services/requirementValidator.js';

const router = express.Router();

// GET all requirements
router.get('/', async (req, res) => {
  try {
    const { projectId, category, priority, status } = req.query;
    const filter = {};
    if (projectId) filter.projectId = projectId;
    if (category)  filter.category  = category;
    if (priority)  filter.priority  = priority;
    if (status)    filter.status    = status;

    const requirements = await SecurityRequirement.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: requirements, total: requirements.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single requirement by ID
router.get('/:id', async (req, res) => {
  try {
    const requirement = await SecurityRequirement.findOne({ id: req.params.id });
    if (!requirement)
      return res.status(404).json({ success: false, error: 'Requirement not found' });
    res.json({ success: true, data: requirement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST create new requirement
router.post('/', async (req, res) => {
  try {
    const validation = validateRequirement(req.body);
    if (!validation.valid)
      return res.status(400).json({ success: false, errors: validation.errors });

    const requirement = new SecurityRequirement(req.body);
    await requirement.save();
    res.status(201).json({ success: true, data: requirement });
  } catch (error) {
    if (error.code === 11000)
      return res.status(400).json({ success: false, error: 'Requirement ID already exists' });
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT update requirement
router.put('/:id', async (req, res) => {
  try {
    const requirement = await SecurityRequirement.findOneAndUpdate(
      { id: req.params.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!requirement)
      return res.status(404).json({ success: false, error: 'Requirement not found' });
    res.json({ success: true, data: requirement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE requirement
router.delete('/:id', async (req, res) => {
  try {
    const requirement = await SecurityRequirement.findOneAndDelete({ id: req.params.id });
    if (!requirement)
      return res.status(404).json({ success: false, error: 'Requirement not found' });
    res.json({ success: true, message: 'Requirement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;