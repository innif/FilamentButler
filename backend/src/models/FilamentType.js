const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FilamentType = sequelize.define('FilamentType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Name/Bezeichnung des Filament-Typs',
    },
    manufacturer: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Hersteller des Filaments',
    },
    material: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'PLA',
      comment: 'Material-Typ (PLA, PETG, ABS, etc.)',
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Farbe des Filaments',
    },
    colorHex: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '#000000',
      comment: 'Farbcode in Hex-Format',
    },
    color2: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Zweite Farbe des Filaments (für zweifarbige Filamente)',
    },
    colorHex2: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Farbcode der zweiten Farbe in Hex-Format',
    },
    diameter: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.75,
      comment: 'Filament-Durchmesser in mm',
    },
    standardWeight: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Standard-Gewicht einer Spule in Gramm',
    },
    standardPrice: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Standard-Preis einer Spule',
    },
    printTemperature: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Empfohlene Druck-Temperatur in °C',
    },
    bedTemperature: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Empfohlene Bett-Temperatur in °C',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Zusätzliche Notizen zum Filament-Typ',
    },
  }, {
    timestamps: true,
    tableName: 'filament_types',
  });

  return FilamentType;
};
