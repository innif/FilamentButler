const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Spool = sequelize.define('Spool', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    filamentTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Reference to FilamentType',
      references: {
        model: 'filament_types',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    spoolNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Optional: Spulennummer zur Identifikation',
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Initial weight in grams',
    },
    remainingWeight: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: 'Remaining weight in grams',
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Price in local currency',
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date of purchase',
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Storage location',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes specific to this spool',
    },
    isEmpty: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Mark if spool is empty',
    },
  }, {
    timestamps: true,
    tableName: 'spools',
  });

  return Spool;
};
