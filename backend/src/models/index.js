const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, {
  dialect: dbConfig.dialect,
  logging: env === 'development' ? console.log : false,
});

const FilamentType = require('./FilamentType')(sequelize);
const Spool = require('./Spool')(sequelize);

// Define associations
FilamentType.hasMany(Spool, {
  foreignKey: 'filamentTypeId',
  as: 'spools',
  onDelete: 'CASCADE',
});

Spool.belongsTo(FilamentType, {
  foreignKey: 'filamentTypeId',
  as: 'filamentType',
});

module.exports = {
  sequelize,
  FilamentType,
  Spool,
};
