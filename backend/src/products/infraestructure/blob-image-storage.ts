import { ContainerClient } from "@azure/storage-blob";
import { Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { uploadBlob } from "src/media/blob-container";
import { IImageStorage } from "../application/ports/image-storage";
import { ImageType } from "../domain/product-image";
import { processImage } from "./process-image";

const MIMES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export class BlobImageStorage implements IImageStorage {
    private readonly logger = new Logger(BlobImageStorage.name);

    constructor(private readonly container: ContainerClient) {}

    async save(tenantId: string, buffer: Buffer, type: ImageType): Promise<string> {
        const output = await processImage(buffer, type);
        const imagePath = `${tenantId}/products/${randomUUID()}.${type}`;
        await uploadBlob(this.container, imagePath, output, MIMES[type]);
        return imagePath;
    }

    // Callers run this after the DB change; an orphan blob is preferable to failing the request.
    async remove(imagePath: string): Promise<void> {
        try {
            await this.container.getBlockBlobClient(imagePath).deleteIfExists();
        } catch (error) {
            this.logger.warn(`Could not remove image ${imagePath}: ${(error as Error).message}`);
        }
    }
}
