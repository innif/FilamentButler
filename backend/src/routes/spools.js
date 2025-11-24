const express = require('express');
const router = express.Router();
const { Spool, FilamentType, sequelize } = require('../models');
const { Op } = require('sequelize');

router.get('/', async (req, res) => {
  try {
    const { filamentTypeId, isEmpty } = req.query;
    const where = {};

    if (filamentTypeId) {
      where.filamentTypeId = filamentTypeId;
    }

    if (isEmpty !== undefined) {
      where.isEmpty = isEmpty === 'true';
    }

    const spools = await Spool.findAll({
      where,
      include: [{
        model: FilamentType,
        as: 'filamentType',
      }],
      order: [['createdAt', 'DESC']],
    });
    res.json(spools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = await Spool.findAll({
      attributes: [
        'material',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('remainingWeight')), 'totalWeight'],
      ],
      group: ['material'],
    });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const spool = await Spool.findByPk(req.params.id, {
      include: [{
        model: FilamentType,
        as: 'filamentType',
      }],
    });
    if (!spool) {
      return res.status(404).json({ error: 'Spool not found' });
    }
    res.json(spool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const spool = await Spool.create(req.body);
    res.status(201).json(spool);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const spool = await Spool.findByPk(req.params.id);
    if (!spool) {
      return res.status(404).json({ error: 'Spool not found' });
    }
    await spool.update(req.body);
    res.json(spool);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const spool = await Spool.findByPk(req.params.id);
    if (!spool) {
      return res.status(404).json({ error: 'Spool not found' });
    }
    await spool.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
