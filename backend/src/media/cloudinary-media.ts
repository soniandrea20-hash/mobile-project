import { v2 as cloudinary } from 'cloudinary';

// The single switch: uploads and /media both read it, so they cannot disagree. The SDK reads CLOUDINARY_URL itself.
export const cloudinaryEnabled = () => !!process.env.CLOUDINARY_URL;

// Stored path "<tenant>/products/<uuid>.webp" maps to public_id without extension; mp4 lives under resource_type video.
const parse = (path: string) => {
  const clean = path.replace(/^\/+/, '');
  const dot = clean.lastIndexOf('.');
  const ext = clean.slice(dot + 1);
  return { publicId: clean.slice(0, dot), ext, resource_type: ext === 'mp4' ? ('video' as const) : ('image' as const) };
};

export const cloudinaryUrl = (path: string) => {
  const { publicId, ext, resource_type } = parse(path);
  return cloudinary.url(publicId, { resource_type, format: ext, secure: true });
};

export const uploadMedia = (path: string, data: Buffer) => {
  const { publicId, resource_type } = parse(path);
  return new Promise<void>((resolve, reject) =>
    cloudinary.uploader
      .upload_stream({ public_id: publicId, resource_type, overwrite: false }, (err) => (err ? reject(err) : resolve()))
      .end(data),
  );
};

// destroy resolves { result: 'not found' } instead of throwing; resource_type is required or videos are never deleted.
export const removeMedia = async (path: string) => {
  const { publicId, resource_type } = parse(path);
  await cloudinary.uploader.destroy(publicId, { resource_type, invalidate: true });
};
