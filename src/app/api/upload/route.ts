import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getCurrentUser } from '@/lib/auth';

// Cấu hình file được phép theo loại
const ALLOWED_TYPES: Record<string, string[]> = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain',
    ],
    any: [], // empty = chấp nhận tất cả
};

// Cloudinary resource_type tương ứng
const RESOURCE_TYPES: Record<string, 'image' | 'raw' | 'auto'> = {
    image: 'image',
    document: 'raw',
    any: 'auto',
};

const MAX_SIZE_MB = 20; // Max 20MB

export async function POST(request: NextRequest) {
    try {
        // DEBUG: Kiểm tra env vars tại runtime
        console.log('[Cloudinary ENV]', {
            CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
            API_KEY: process.env.CLOUDINARY_API_KEY,
            API_SECRET: process.env.CLOUDINARY_API_SECRET
                ? process.env.CLOUDINARY_API_SECRET.slice(0, 6) + '...' + process.env.CLOUDINARY_API_SECRET.slice(-4)
                : '✗ MISSING',
            URL: process.env.CLOUDINARY_URL
                ? process.env.CLOUDINARY_URL.slice(0, 20) + '...'
                : '✗ MISSING',
        });

        // Auth check
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || 'pnsolar/uploads';
        const type = (formData.get('type') as string) || 'any'; // 'image' | 'document' | 'any'
        const publicId = formData.get('public_id') as string | null;

        if (!file) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy file' }, { status: 400 });
        }

        // Validate file type
        const allowedList = ALLOWED_TYPES[type] ?? [];
        if (allowedList.length > 0 && !allowedList.includes(file.type)) {
            return NextResponse.json({
                success: false,
                message: `Loại file không được hỗ trợ. Chấp nhận: ${allowedList.join(', ')}`,
            }, { status: 400 });
        }

        // Validate file size
        const maxBytes = MAX_SIZE_MB * 1024 * 1024;
        if (file.size > maxBytes) {
            return NextResponse.json({
                success: false,
                message: `File vượt quá ${MAX_SIZE_MB}MB`,
            }, { status: 400 });
        }

        // Chuyển sang Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // ═══ Resource type: đơn giản ═══
        // - Ảnh thật (image/*): resource_type='image' + optimization
        // - Tất cả file khác (PDF, Word, Excel...): resource_type='raw'
        // Xem file non-image qua Google Docs Viewer (Cloudinary raw không hỗ trợ xem inline)
        const isImage = file.type.startsWith('image/');
        const resourceType: 'image' | 'raw' = isImage ? 'image' : 'raw';

        // Transformation chỉ cho ảnh
        const transformation = isImage
            ? [{ quality: 'auto', fetch_format: 'auto' }]
            : undefined;

        // Public_id có tên file gốc để dễ nhận biết
        // Raw: CẦN extension (Cloudinary raw giữ nguyên public_id làm URL)
        // Image: BỎ extension (Cloudinary tự append)
        let resolvedPublicId = publicId ?? undefined;
        if (!resolvedPublicId) {
            const nameParts = file.name.split('.');
            const ext = nameParts.length > 1 ? nameParts.pop()!.toLowerCase() : '';
            const baseName = nameParts.join('_')
                .replace(/[^a-zA-Z0-9_\u00C0-\u024F-]/g, '_')
                .substring(0, 60);
            resolvedPublicId = resourceType === 'raw' && ext
                ? `${baseName}.${ext}`
                : baseName;
        }

        const result = await uploadToCloudinary(buffer, {
            folder,
            public_id: resolvedPublicId,
            resourceType,
            transformation,
            originalName: file.name,
        });

        // Derive file type label from extension
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const FILE_TYPE_MAP: Record<string, string> = {
            pdf: 'PDF', doc: 'WORD', docx: 'WORD',
            xls: 'EXCEL', xlsx: 'EXCEL', ppt: 'PPT', pptx: 'PPT',
            csv: 'CSV', txt: 'TXT', jpg: 'IMAGE', jpeg: 'IMAGE',
            png: 'IMAGE', webp: 'IMAGE', gif: 'IMAGE',
        };

        return NextResponse.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            bytes: result.bytes,
            resource_type: result.resource_type,
            original_filename: result.original_filename,
            filename: file.name,                          // Tên gốc CÓ extension: "bao_cao.docx"
            file_type: FILE_TYPE_MAP[fileExt] || fileExt.toUpperCase() || 'FILE',
        });

    } catch (error: any) {
        console.error('[Upload Error]', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi upload: ' + (error.message || 'Không xác định') },
            { status: 500 }
        );
    }
}
