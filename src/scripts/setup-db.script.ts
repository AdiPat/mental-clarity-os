/**
 *
 * Author: Aditya Patange
 * License: MIT
 *
 * This file contains the `DatabaseSetup` class which handles the MongoDB installation
 * and initial configuration process. It provides functionality to check for existing
 * MongoDB installations, configure users, and generate connection strings.
 */

import chalk from "chalk";
import { DBConfigService, MongoInstaller } from "../services";
import { DBConfig } from "../models";

/**
 * Class responsible for handling the database setup process.
 * Manages MongoDB installation checking and user configuration.
 */
export class DatabaseSetup {
  constructor(
    private readonly installer: MongoInstaller,
    private readonly configService: DBConfigService
  ) {}

  /**
   * Executes the database setup process.
   * Checks MongoDB installation, configures users, and generates connection string.
   *
   * @returns {Promise<string>} A promise that resolves to the MongoDB connection string
   * @throws {Error} If the setup process fails
   */
  async setup(): Promise<string> {
    try {
      console.log(chalk.blue("🔍 Checking MongoDB installation..."));

      const isInstalled = await this.installer.checkInstallation();
      if (!isInstalled) {
        console.log(chalk.yellow("⚠️ MongoDB not found"));
        await this.installer.install();
      } else {
        console.log(chalk.green("✅ MongoDB is already installed"));
      }

      console.log(chalk.blue("🔐 Configuring database user..."));
      const config = await this.configureUser();

      const connectionString = this.configService.getConnectionString(config);
      await this.configService.saveConnectionString(connectionString);

      console.log(chalk.green("✨ Database setup completed successfully!"));
      return connectionString;
    } catch (error: any) {
      console.error(chalk.red("❌ Setup failed:"), error.message);
      throw error;
    }
  }

  /**
   * Handles the user configuration process by either creating a new user
   * or selecting an existing one.
   *
   * @private
   * @returns {Promise<DBConfig>} A promise that resolves to the selected or created user configuration
   */
  private async configureUser(): Promise<DBConfig> {
    const existingUsers = await this.configService.listExistingUsers();

    if (existingUsers.length === 0) {
      console.log(
        chalk.yellow("👤 No existing users found. Creating initial user...")
      );
      return await this.configService.createInitialUser();
    }

    console.log(chalk.blue("👥 Existing users found"));
    return await this.configService.selectUser();
  }
}

/**
 * Creates a new DatabaseSetup instance and executes the setup process.
 *
 * @returns {Promise<string>} A promise that resolves to the MongoDB connection string
 * @throws {Error} If the setup process fails
 */
export async function setupDatabase(): Promise<string> {
  const setup = new DatabaseSetup(new MongoInstaller(), new DBConfigService());
  return await setup.setup();
}

// Run setup if script is executed directly
if (require.main === module) {
  setupDatabase().catch(console.error);
}
