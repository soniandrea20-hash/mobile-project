import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { uploadsDir } from "src/media/uploads-dir";
import { IImageStorage } from "../application/ports/image-storage";
import { ImageType } from "../domain/product-image";
import { mediaUnreadable } from "../domain/product.errors";

const MAX_WIDTH = 1280;

@Injectable()
export class LocalImageStorage implements IImageStorage {
    private readonly logger = new Logger(LocalImageStorage.name);

    async save(tenantId: string, buffer: Buffer, type: ImageType): Promise<string> {
        let output: Buffer;
        try {
            // A small, highly compressed file can decode to a huge bitmap; cap it (~40 MP).
            output = await sharp(buffer, { limitInputPixels: 40_000_000 })
                .rotate()
                .resize({ width: MAX_WIDTH, withoutEnlargement: true })
                .toFormat(type === 'jpg' ? 'jpeg' : type)
                .toBuffer();
        } catch {
            throw mediaUnreadable();
        }

        const imagePath = `${tenantId}/products/${randomUUID()}.${type}`;
        const file = join(uploadsDir(), imagePath);
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, output);
        return imagePath;
    }

    // Callers run this after the DB change; an orphan file is preferable to failing the request.
    async remove(imagePath: string): Promise<void> {
        try {
            await rm(join(uploadsDir(), imagePath), { force: true });
        } catch (error) {
            this.logger.warn(`Could not remove image ${imagePath}: ${(error as Error).message}`);
        }
    }
}
