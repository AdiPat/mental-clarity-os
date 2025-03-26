import { describe, it, expect, vi, beforeEach } from "vitest";
import { DBConfigService } from "../db-config.service";
import { promises as fs } from "fs";
import inquirer from "inquirer";

vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

describe("DBConfigService", () => {
  let service: DBConfigService;

  beforeEach(() => {
    service = new DBConfigService();
    vi.clearAllMocks();
  });

  describe("createInitialUser", () => {
    it("should create and save new user configuration", async () => {
      vi.mocked(inquirer.prompt).mockResolvedValue({
        username: "testadmin",
        password: "password123",
      });
      vi.mocked(fs.readFile).mockResolvedValue("[]");

      const config = await service.createInitialUser();

      expect(config).toEqual({
        username: "testadmin",
        password: "password123",
        host: "localhost",
        port: 27017,
      });
      expect(fs.writeFile).toHaveBeenCalledOnce();
    });
  });

  describe("listExistingUsers", () => {
    it("should return empty array when no config file exists", async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error("File not found"));

      const users = await service.listExistingUsers();
      expect(users).toEqual([]);
    });

    it("should return parsed users from config file", async () => {
      const mockUsers = [
        {
          username: "user1",
          password: "pass1",
          host: "localhost",
          port: 27017,
        },
      ];
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockUsers));

      const users = await service.listExistingUsers();
      expect(users).toEqual(mockUsers);
    });
  });

  describe("selectUser", () => {
    it("should return selected user configuration", async () => {
      const mockUsers = [
        {
          username: "user1",
          password: "pass1",
          host: "localhost",
          port: 27017,
        },
        {
          username: "user2",
          password: "pass2",
          host: "localhost",
          port: 27017,
        },
      ];
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockUsers));
      vi.mocked(inquirer.prompt).mockResolvedValue({ selected: "user2" });

      const selected = await service.selectUser();
      expect(selected).toEqual(mockUsers[1]);
    });
  });

  describe("getConnectionString", () => {
    it("should return correct mongodb connection string", () => {
      const config = {
        username: "testuser",
        password: "testpass",
        host: "localhost",
        port: 27017,
      };

      const connectionString = service.getConnectionString(config);
      expect(connectionString).toBe(
        "mongodb://testuser:testpass@localhost:27017"
      );
    });
  });

  describe("saveConnectionString", () => {
    it("should save connection string to .env file", async () => {
      const connectionString = "mongodb://user:pass@localhost:27017";
      await service.saveConnectionString(connectionString);

      expect(fs.writeFile).toHaveBeenCalledWith(
        ".env",
        "MONGODB_URI=mongodb://user:pass@localhost:27017\n",
        "utf-8"
      );
    });
  });
});
