const express = require('express');
const router = express.Router();
const { FilamentType, Spool, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get all filament types with spool count
router.get('/', async (req, res) => {
  try {
    const filamentTypes = await FilamentType.findAll({
      include: [{
        model: Spool,
        as: 'spools',
        attributes: [],
      }],
      attributes: {
        include: [
          [sequelize.fn('COUNT', sequelize.col('spools.id')), 'spoolCount'],
        ],
      },
      group: ['FilamentType.id'],
      order: [['createdAt', 'DESC']],
    });
    res.json(filamentTypes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get statistics about filament types
router.get('/stats', async (req, res) => {
  try {
    const stats = await FilamentType.findAll({
      include: [{
        model: Spool,
        as: 'spools',
        attributes: [],
      }],
      attributes: [
        'material',
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('FilamentType.id'))), 'typeCount'],
        [sequelize.fn('COUNT', sequelize.col('spools.id')), 'totalSpools'],
      ],
      group: ['material'],
    });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single filament type with all spools
router.get('/:id', async (req, res) => {
  try {
    const filamentType = await FilamentType.findByPk(req.params.id, {
      include: [{
        model: Spool,
        as: 'spools',
        order: [['createdAt', 'DESC']],
      }],
    });

    if (!filamentType) {
      return res.status(404).json({ error: 'Filament type not found' });
    }

    res.json(filamentType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new filament type
router.post('/', async (req, res) => {
  try {
    const filamentType = await FilamentType.create(req.body);
    res.status(201).json(filamentType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update filament type
router.put('/:id', async (req, res) => {
  try {
    const filamentType = await FilamentType.findByPk(req.params.id);
    if (!filamentType) {
      return res.status(404).json({ error: 'Filament type not found' });
    }
    await filamentType.update(req.body);
    res.json(filamentType);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete filament type (will cascade delete all spools)
router.delete('/:id', async (req, res) => {
  try {
    const filamentType = await FilamentType.findByPk(req.params.id, {
      include: [{
        model: Spool,
        as: 'spools',
      }],
    });

    if (!filamentType) {
      return res.status(404).json({ error: 'Filament type not found' });
    }

    const spoolCount = filamentType.spools ? filamentType.spools.length : 0;
    await filamentType.destroy();

    res.json({
      message: 'Filament type deleted successfully',
      deletedSpools: spoolCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
