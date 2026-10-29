import { Type } from "class-transformer";
import { ArrayNotEmpty, ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional, IsUUID, Max, Min, ValidateIf } from "class-validator";
import { IMAGE_MIN_SECONDS, VIDEO_MAX_SECONDS } from "../../domain/content-media";

// Optional field that, when sent, must not be null (NOT NULL columns).
const IsDefinedIfSent = () => ValidateIf((_, value) => value !== undefined);

export class ListContentQueryDto {
    @IsUUID()
    store_id: string;
}

// Multipart fields arrive as strings; the file itself is read by the interceptor.
export class CreateContentDto {
    @IsUUID()
    store_id: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(IMAGE_MIN_SECONDS)
    @Max(VIDEO_MAX_SECONDS)
    duration_seconds?: number;
}

export class UpdateContentDto {
    @IsDefinedIfSent()
    @IsInt()
    @Min(IMAGE_MIN_SECONDS)
    @Max(VIDEO_MAX_SECONDS)
    duration_seconds?: number;

    @IsDefinedIfSent()
    @IsBoolean()
    is_visible?: boolean;
}

export class ReorderContentDto {
    @IsUUID()
    store_id: string;

    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsUUID('all', { each: true })
    content_ids: string[];
}
