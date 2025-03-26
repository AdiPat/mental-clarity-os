import { describe, it, expect, vi, beforeEach } from "vitest";
import { MongoInstaller } from "../mongo-installer.service";
import { exec } from "child_process";
import { platform } from "os";
import chalk from "chalk";

// Mock dependencies
vi.mock("child_process", () => ({
  exec: vi.fn(),
}));

vi.mock("os", () => ({
  platform: vi.fn(),
}));

vi.mock("chalk", () => ({
  default: {
    blue: vi.fn((str) => str),
    green: vi.fn((str) => str),
  },
}));

describe("MongoInstaller", () => {
  let installer: MongoInstaller;

  beforeEach(() => {
    installer = new MongoInstaller();
    vi.clearAllMocks();
  });

  describe("checkInstallation", () => {
    it("should return true when MongoDB is installed", async () => {
      vi.mocked(exec).mockImplementation((cmd, callback: any) => {
        callback(null, { stdout: "MongoDB version 6.0.0" });
        return {} as any;
      });

      const result = await installer.checkInstallation();
      expect(result).toBe(true);
    });

    it("should return false when MongoDB is not installed", async () => {
      vi.mocked(exec).mockImplementation((cmd, callback: any) => {
        callback(new Error("command not found: mongod"));
        return {} as any;
      });

      const result = await installer.checkInstallation();
      expect(result).toBe(false);
    });
  });

  describe("install", () => {
    it("should install MongoDB on macOS successfully", async () => {
      vi.mocked(platform).mockReturnValue("darwin");
      vi.mocked(exec).mockImplementation((cmd, callback: any) => {
        callback(null, { stdout: "Success" });
        return {} as any;
      });

      await expect(installer.install()).resolves.not.toThrow();
      expect(exec).toHaveBeenCalledWith(
        "brew install mongodb-community@6.0",
        expect.any(Function)
      );
    });

    it("should install MongoDB on Linux successfully", async () => {
      vi.mocked(platform).mockReturnValue("linux");
      vi.mocked(exec).mockImplementation((cmd, callback: any) => {
        callback(null, { stdout: "Success" });
        return {} as any;
      });

      await expect(installer.install()).resolves.not.toThrow();
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining("apt-get"),
        expect.any(Function)
      );
    });

    it("should install MongoDB on Windows successfully", async () => {
      vi.mocked(platform).mockReturnValue("win32");
      vi.mocked(exec).mockImplementation((cmd, callback: any) => {
        callback(null, { stdout: "Success" });
        return {} as any;
      });

      await expect(installer.install()).resolves.not.toThrow();
      expect(exec).toHaveBeenCalledWith(
        "choco install mongodb",
        expect.any(Function)
      );
    });

    it("should throw error for unsupported operating system", async () => {
      vi.mocked(platform).mockReturnValue("sunos");

      await expect(installer.install()).rejects.toThrow(
        "Unsupported operating system"
      );
    });

    it("should handle installation failure gracefully", async () => {
      vi.mocked(platform).mockReturnValue("darwin");
      vi.mocked(exec).mockImplementation((cmd, callback: any) => {
        callback(new Error("Installation failed"));
        return {} as any;
      });

      await expect(installer.install()).rejects.toThrow(
        "MongoDB installation failed"
      );
    });
  });

  describe("executeCommand", () => {
    it("should execute command successfully", async () => {
      vi.mocked(exec).mockImplementation((cmd, callback: any) => {
        callback(null, { stdout: "Command output" });
        return {} as any;
      });

      const result = await (installer as any).executeCommand("test command");
      expect(result).toBe("Command output");
    });

    it("should throw error when command fails", async () => {
      vi.mocked(exec).mockImplementation((cmd, callback: any) => {
        callback(new Error("Command failed"));
        return {} as any;
      });

      await expect(
        (installer as any).executeCommand("test command")
      ).rejects.toThrow("Command execution failed");
    });
  });
});
