const { zokou } = require("../framework/zokou");
const Sequelize = require("sequelize");

// 🧩 Database Manager Class
class DatabaseManager {
  static instance = null;

  static getInstance() {
    if (!DatabaseManager.instance) {
      const DATABASE_URL = process.env.DATABASE_URL || "./database.db";

      DatabaseManager.instance =
        DATABASE_URL === "./database.db"
          ? new Sequelize({
              dialect: "sqlite",
              storage: DATABASE_URL,
              logging: false,
            })
          : new Sequelize(DATABASE_URL, {
              dialect: "postgres",
              ssl: true,
              protocol: "postgres",
              dialectOptions: {
                native: true,
                ssl: { require: true, rejectUnauthorized: false },
              },
              logging: false,
            });
    }
    return DatabaseManager.instance;
  }
}

const DATABASE = DatabaseManager.getInstance();

// 🧠 Initialize and Sync Database Automatically
DATABASE.sync()
  .then(() => {
    console.log("✅ DATABASE: Synchronized successfully.");
  })
  .catch((error) => {
    console.error("❌ DATABASE: Error synchronizing database:", error);
  });

// 🔧 Optional Zokou Command for Testing Database
zokou(
  {
    nomCom: "dbcheck",
    categorie: "System",
  },
  async (dest, zk, commandeOptions) => {
    const { repondre, isOwner } = commandeOptions;

    if (!isOwner)
      return repondre("❌ This command is only for the bot owner.");

    try {
      await DATABASE.authenticate();
      repondre("✅ Database connection is working fine!");
    } catch (err) {
      console.error("Database check failed:", err);
      repondre("❌ Failed to connect to the database.");
    }
  }
);

module.exports = { DATABASE };
