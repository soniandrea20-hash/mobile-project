import { randomBytes } from "crypto";
import { ScreenRow } from "./screen.repository";

// 32 random bytes as base64url: 43 chars, 256 bits.
export const generateScreenToken = () => randomBytes(32).toString('base64url');

export const withPlayerUrl = (slug: string, screen: ScreenRow) => {
    const template = process.env.WEB_ORIGIN_TEMPLATE ?? 'http://{slug}.localhost:8081';
    return { ...screen, player_url: `${template.replace('{slug}', slug)}/screen/${screen.token}` };
};
