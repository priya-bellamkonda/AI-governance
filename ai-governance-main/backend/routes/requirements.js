import express from 'express';
import axios from 'axios';
import SecurityRequirement from '../models/SecurityRequirement.js';
import { validateRequirement } from '../services/requirementValidator.js';

const router = express.Router();
const AGENT_URL = process.env.AGENT_URL || 'http://localhost:8000';

// ============================================
// AI AGENT COLLECTION - Proxy to Python Agent
// ============================================
// POST /requirements/collect - Send chat messages to AI collection agent
router.post('/collect', async (req, res) => {
  try {
    const { session_id, messages } = req.body;
    
    // Validate required fields
    if (!session_id || !messages) {
      return res.status(400).json({ 
        success: false, 
        error: 'session_id and messages are required' 
      });
    }
    
    // Call Python Collection Agent
    const response = await axios.post(`${AGENT_URL}/agent/collection/collect`, {
      session_id,
      messages
    });
    
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error calling collection agent:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to communicate with AI agent',
      details: error.message 
    });
  }
});

// ============================================
// STANDARD CRUD OPERATIONS
// ============================================

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