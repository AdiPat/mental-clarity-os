/**
 *
 * Author: Aditya Patange
 * License: MIT
 *
 * "The only way to do great work is to love what you do." - Steve Jobs
 *
 * This file contains the `DBConfigService` class, which provides methods to manage
 * database configuration, including creating users, listing users, selecting users,
 * and generating connection strings.
 */

import { promises as fs } from "fs";
import inquirer from "inquirer";
import { DBConfig } from "../models";

/**
 * Service class for managing database configuration.
 * Provides methods to create, list, and select users, as well as generate
 * and save MongoDB connection strings.
 */
export class DBConfigService {
  private readonly configPath: string = "./db-config.json";

  /**
   * Prompts the user to create an initial admin user and saves the configuration.
   *
   * @returns {Promise<DBConfig>} A promise that resolves to the created `DBConfig` object.
   */
  async createInitialUser(): Promise<DBConfig> {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "username",
        message: "Enter admin username:",
        validate: (input: string) => input.length >= 3,
      },
      {
        type: "password",
        name: "password",
        message: "Enter admin password:",
        validate: (input: string) => input.length >= 8,
      },
    ]);

    const config: DBConfig = {
      username: answers.username,
      password: answers.password,
      host: "localhost",
      port: 27017,
    };

    await this.saveConfig(config);
    return config;
  }

  /**
   * Reads and returns the list of existing database users from the configuration file.
   *
   * @returns {Promise<DBConfig[]>} A promise that resolves to an array of `DBConfig` objects.
   */
  async listExistingUsers(): Promise<DBConfig[]> {
    try {
      const data: string = await fs.readFile(this.configPath, "utf-8");
      return JSON.parse(data) as DBConfig[];
    } catch {
      return [];
    }
  }

  /**
   * Prompts the user to select an existing database user from the list.
   *
   * @returns {Promise<DBConfig>} A promise that resolves to the selected `DBConfig` object.
   */
  async selectUser(): Promise<DBConfig> {
    const users: DBConfig[] = await this.listExistingUsers();
    const { selected }: { selected: string } = await inquirer.prompt([
      {
        type: "list",
        name: "selected",
        message: "Select a user:",
        choices: users.map((u: DBConfig) => u.username),
      },
    ]);

    return users.find((u: DBConfig) => u.username === selected)!;
  }

  /**
   * Generates a MongoDB connection string for the given database configuration.
   *
   * @param {DBConfig} config - The database configuration object.
   * @returns {string} The MongoDB connection string.
   */
  getConnectionString(config: DBConfig): string {
    return `mongodb://${config.username}:${config.password}@${config.host}:${config.port}`;
  }

  /**
   * Saves the given MongoDB connection string to a `.env` file.
   *
   * @param {string} connectionString - The MongoDB connection string to save.
   * @returns {Promise<void>} A promise that resolves when the connection string is saved.
   */
  async saveConnectionString(connectionString: string): Promise<void> {
    await fs.writeFile(".env", `MONGODB_URI=${connectionString}\n`, "utf-8");
  }

  /**
   * Saves the given database configuration to the configuration file.
   *
   * @private
   * @param {DBConfig} config - The database configuration object to save.
   * @returns {Promise<void>} A promise that resolves when the configuration is saved.
   */
  private async saveConfig(config: DBConfig): Promise<void> {
    const users: DBConfig[] = await this.listExistingUsers();
    users.push(config);
    await fs.writeFile(this.configPath, JSON.stringify(users, null, 2));
  }
}
