require("dotenv").config();
const { Sequelize, DataTypes } = require("sequelize");

(async () => {
  const targetEmail = String(process.argv[2] || "").trim().toLowerCase();
  const confirmation = String(process.env.CONFIRM_ADMIN_PROMOTION || "").trim().toLowerCase();
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required. Run this command from a trusted environment with database access.");
    process.exit(1);
  }
  if (!targetEmail || !targetEmail.includes("@") || confirmation !== targetEmail) {
    console.error("Usage: CONFIRM_ADMIN_PROMOTION=you@example.com npm run admin:promote -- you@example.com");
    console.error("The target email must match the confirmation variable exactly.");
    process.exit(1);
  }
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    dialectOptions: process.env.NODE_ENV === "production" && process.env.DATABASE_SSL === "true"
      ? { ssl: { require: true, rejectUnauthorized: true } }
      : {}
  });
  const User = sequelize.define("User", {
    id: { type: DataTypes.UUID, primaryKey: true },
    email: { type: DataTypes.STRING(254), allowNull: false },
    role: { type: DataTypes.STRING(20), allowNull: false },
    emailVerifiedAt: { type: DataTypes.DATE, field: "email_verified_at" }
  }, { tableName: "users", underscored: true, timestamps: true });
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email: targetEmail } });
    if (!user) throw new Error("No account exists for that email. Register and verify it first.");
    if (!user.emailVerifiedAt) throw new Error("That account's email is not verified. Verify it before promotion.");
    if (user.role === "admin") {
      console.log(`Account ${targetEmail} is already an administrator.`);
      return;
    }
    user.role = "admin";
    await user.save({ fields: ["role"] });
    console.log(`Administrator role granted to verified account ${targetEmail}.`);
    console.log("Sign out and sign back in, then verify that the admin dashboard works.");
  } catch (error) {
    console.error(`Administrator promotion failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
