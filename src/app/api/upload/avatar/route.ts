import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Kiểm tra auth
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Chưa đăng nhập' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy file' }, { status: 400 });
        }

        // Kiểm tra loại file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ success: false, message: 'Chỉ chấp nhận file ảnh (JPG, PNG, WebP, GIF)' }, { status: 400 });
        }

        // Kiểm tra kích thước (max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ success: false, message: 'File không được vượt quá 5MB' }, { status: 400 });
        }

        // Chuyển file thành Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload lên Cloudinary
        const result = await uploadToCloudinary(buffer, {
            folder: 'pnsolar/nhan-vien',
        });

        return NextResponse.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
        });

    } catch (error: any) {
        console.error('[Upload Error]', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi upload: ' + (error.message || 'Không xác định') },
            { status: 500 }
        );
    }
}
