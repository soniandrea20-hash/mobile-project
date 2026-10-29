import { Injectable } from "@nestjs/common";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { uploadsDir } from "src/media/uploads-dir";
import { IVideoProbe } from "../application/ports/content-ports";

const run = promisify(execFile);

@Injectable()
export class FfprobeVideoProbe implements IVideoProbe {

    async durationSeconds(filePath: string): Promise<number> {
        const { stdout } = await run(
            'ffprobe',
            ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', join(uploadsDir(), filePath)],
            { timeout: 15_000 },
        );
        return Math.ceil(Number(stdout.trim()));
    }
}
