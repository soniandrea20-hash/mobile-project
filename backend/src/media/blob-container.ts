import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

export const blobEnabled = () => !!process.env.AZURE_STORAGE_CONNECTION_STRING;

// The container is provisioned in infra; it is never created at runtime.
export const blobContainer = () =>
    BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING!)
        .getContainerClient(process.env.AZURE_STORAGE_CONTAINER ?? 'media');

// Public base URL that /media redirects to; undefined means files are served from local disk.
export const mediaBaseUrl = () =>
    blobEnabled() ? (process.env.MEDIA_PUBLIC_BASE_URL ?? blobContainer().url).replace(/\/+$/, '') : undefined;

export const uploadBlob = (container: ContainerClient, name: string, data: Buffer, contentType: string) =>
    container.getBlockBlobClient(name).uploadData(data, {
        blobHTTPHeaders: { blobContentType: contentType, blobCacheControl: 'public, max-age=31536000, immutable' },
    });
