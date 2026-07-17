import fs from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "./storage-provider.js";

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly uploadsDirectory = path.resolve("uploads")) {}

  async put(objectKey: string, bytes: Buffer) {
    const filePath = this.pathFor(objectKey);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, bytes);
  }

  get(objectKey: string) { return fs.readFile(this.pathFor(objectKey)); }

  async delete(objectKey: string) { await fs.rm(this.pathFor(objectKey), { force: true }); }

  async signedDownloadUrl(objectKey: string) {
    return `/api/files/download/${encodeURIComponent(objectKey)}`;
  }

  private pathFor(objectKey: string) {
    const segments = objectKey
      .split(/[\\/]+/)
      .map(segment => segment.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/^\.+$/, "-"))
      .filter(Boolean);
    return path.join(this.uploadsDirectory, ...segments);
  }
}
