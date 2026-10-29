import { Transform } from "class-transformer";
import { IsBoolean, IsString, IsUUID, Length, ValidateIf } from "class-validator";

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class ListScreensQueryDto {
    @IsUUID()
    store_id: string;
}

export class CreateScreenDto {
    @IsUUID()
    store_id: string;

    @Transform(trim)
    @IsString()
    @Length(1, 80)
    name: string;
}

export class UpdateScreenDto {
    @ValidateIf((_, value) => value !== undefined)
    @Transform(trim)
    @IsString()
    @Length(1, 80)
    name?: string;

    @ValidateIf((_, value) => value !== undefined)
    @IsBoolean()
    is_active?: boolean;
}
