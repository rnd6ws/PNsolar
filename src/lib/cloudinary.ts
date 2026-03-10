import { v2 as cloudinary } from 'cloudinary';

export default cloudinary;

interface UploadOptions {
    folder?: string;
    public_id?: string;
    resourceType?: 'image' | 'raw' | 'auto';
    transformation?: object[];
    originalName?: string;
}

/**
 * Cấu hình lại Cloudinary mỗi lần upload để đảm bảo đọc đúng env vars
 */
function configureCloudinary() {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
}

/**
 * Upload Buffer lên Cloudinary (server-side)
 */
export async function uploadToCloudinary(
    file: string | Buffer,
    options: UploadOptions = {}
) {
    // Cấu hình tại thời điểm gọi - đảm bảo env vars đã load
    configureCloudinary();

    const {
        folder = 'pnsolar/uploads',
        public_id,
        resourceType = 'auto',
        transformation,
        originalName,
    } = options;

    const cfg = cloudinary.config();
    console.log('[Cloudinary] Uploading with cloud_name:', cfg.cloud_name, '| api_key:', cfg.api_key);

    const uploadOptions: any = {
        folder,
        overwrite: true,
        resource_type: resourceType,
        ...(public_id && { public_id }),
        ...(originalName && { original_filename: originalName, use_filename: false }),
        ...(transformation && { transformation }),
    };

    if (typeof file === 'string') {
        return cloudinary.uploader.upload(file, uploadOptions);
    }

    return new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) {
                console.error('[Cloudinary] Upload error:', error);
                reject(error);
            } else {
                resolve(result);
            }
        });
        stream.end(file);
    });
}

/**
 * Xóa file khỏi Cloudinary theo public_id
 */
export async function deleteFromCloudinary(
    publicId: string,
    resourceType: 'image' | 'raw' | 'video' = 'image'
) {
    configureCloudinary();
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
