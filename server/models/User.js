const { DataTypes } = require("sequelize");

module.exports = (sequelize) => sequelize.define("User", {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING(254), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: "password_hash" },
  displayName: { type: DataTypes.STRING(80), allowNull: true, field: "display_name" },
  role: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "customer" },
  createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at" },
  updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at" }
}, {
  tableName: "users",
  indexes: [{ unique: true, fields: ["email"] }]
});
