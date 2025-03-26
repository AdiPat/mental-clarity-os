/**
 *
 * Author: Aditya Patange
 * License: MIT
 *
 * "Code is like humor. When you have to explain it, it's bad." - Cory House
 *
 * This file contains the MongoDB installer service that handles the installation
 * and verification of MongoDB across different operating systems (macOS, Linux, Windows).
 * It provides a unified interface for MongoDB installation management.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { platform } from "os";
import chalk from "chalk";

const execAsync = promisify(exec);

/**
 * Interface defining the contract for MongoDB installation operations.
 * Implementers must provide methods to check and perform MongoDB installation.
 */
interface IMongoInstaller {
  checkInstallation(): Promise<boolean>;
  install(): Promise<void>;
}

/**
 * Service class for managing MongoDB installation across different platforms.
 * Provides methods to check installation status and install MongoDB.
 */
export class MongoInstaller implements IMongoInstaller {
  /**
   * Executes a shell command and returns its output.
   *
   * @private
   * @param {string} command - The shell command to execute.
   * @returns {Promise<string>} A promise that resolves with the command output.
   * @throws {Error} If the command execution fails.
   */
  private async executeCommand(command: string): Promise<string> {
    try {
      const { stdout }: { stdout: string } = await execAsync(command);
      return stdout;
    } catch (error: any) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  /**
   * Checks if MongoDB is already installed on the system.
   *
   * @returns {Promise<boolean>} A promise that resolves to true if MongoDB is installed, false otherwise.
   */
  async checkInstallation(): Promise<boolean> {
    try {
      await this.executeCommand("mongod --version");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Installs MongoDB based on the current operating system.
   * Supports macOS, Linux, and Windows installations.
   *
   * @returns {Promise<void>} A promise that resolves when installation is complete.
   * @throws {Error} If installation fails or the OS is not supported.
   */
  async install(): Promise<void> {
    const os: string = platform();
    console.log(chalk.blue("📦 Installing MongoDB..."));

    try {
      switch (os) {
        case "darwin":
          await this.installOnMac();
          break;
        case "linux":
          await this.installOnLinux();
          break;
        case "win32":
          await this.installOnWindows();
          break;
        default:
          throw new Error("Unsupported operating system");
      }
      console.log(chalk.green("✅ MongoDB installed successfully!"));
    } catch (error: any) {
      throw new Error(`MongoDB installation failed: ${error.message}`);
    }
  }

  /**
   * Installs MongoDB on macOS using Homebrew.
   *
   * @private
   * @returns {Promise<void>} A promise that resolves when installation is complete.
   */
  private async installOnMac(): Promise<void> {
    await this.executeCommand("brew install mongodb-community@6.0");
    await this.executeCommand("brew services start mongodb-community@6.0");
  }

  /**
   * Installs MongoDB on Linux using apt package manager.
   *
   * @private
   * @returns {Promise<void>} A promise that resolves when installation is complete.
   */
  private async installOnLinux(): Promise<void> {
    // Add MongoDB GPG key and repository
    await this.executeCommand(
      "curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor"
    );
    await this.executeCommand(
      'echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list'
    );
    await this.executeCommand("sudo apt-get update");
    await this.executeCommand("sudo apt-get install -y mongodb-org");
    await this.executeCommand("sudo systemctl start mongod");
  }

  /**
   * Installs MongoDB on Windows using Chocolatey package manager.
   *
   * @private
   * @returns {Promise<void>} A promise that resolves when installation is complete.
   */
  private async installOnWindows(): Promise<void> {
    await this.executeCommand("choco install mongodb");
    await this.executeCommand("net start MongoDB");
  }
}
