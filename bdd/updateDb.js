const { DATABASE } = require('../framework/database');
const { DataTypes } = require('sequelize');
const { zokou } = require('../framework/zokou');

const UpdateDB = DATABASE.define(
  'UpdateInfo',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
      defaultValue: 1,
    },
    commitHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'update_info',
    timestamps: false,
    hooks: {
      beforeCreate: (record) => {
        record.id = 1;
      },
      beforeBulkCreate: (records) => {
        records.forEach((record) => {
          record.id = 1;
        });
      },
    },
  }
);

// Ensure the database table is initialized
async function initializeUpdateDB() {
  await UpdateDB.sync();
  const [record, created] = await UpdateDB.findOrCreate({
    where: { id: 1 },
    defaults: { commitHash: 'unknown' },
  });
  return record;
}

// Set the latest commit hash
async function setCommitHash(hash) {
  await initializeUpdateDB();
  const record = await UpdateDB.findByPk(1);
  if (record) {
    record.commitHash = hash;
    await record.save();
  }
}

// Get the stored commit hash
async function getCommitHash() {
  await initializeUpdateDB();
  const record = await UpdateDB.findByPk(1);
  return record ? record.commitHash : 'unknown';
}

// Export in Zokou-friendly style
module.exports = {
  UpdateDB,
  setCommitHash,
  getCommitHash,
};
