import { ContainerClient } from "@azure/storage-blob";
import { Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { uploadBlob } from "src/media/blob-container";
import { IContentStorage } from "../application/ports/content-ports";

const MIMES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', mp4: 'video/mp4' };

export class BlobContentStorage implements IContentStorage {
    private readonly logger = new Logger(BlobContentStorage.name);

    constructor(private readonly container: ContainerClient) {}

    async save(tenantId: string, buffer: Buffer, ext: string): Promise<string> {
        const filePath = `${tenantId}/content/${randomUUID()}.${ext}`;
        await uploadBlob(this.container, filePath, buffer, MIMES[ext] ?? 'application/octet-stream');
        return filePath;
    }

    // Callers run this after the DB change; an orphan blob is preferable to failing the request.
    async remove(filePath: string): Promise<void> {
        try {
            await this.container.getBlockBlobClient(filePath).deleteIfExists();
        } catch (error) {
            this.logger.warn(`Could not remove content ${filePath}: ${(error as Error).message}`);
        }
    }
}
