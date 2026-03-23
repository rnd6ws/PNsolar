import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import JSZip from 'jszip';

// MIME types cho các loại file phổ biến
const MIME_MAP: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
};

/**
 * Proxy file từ Cloudinary để xem inline (PDF, Word, Excel...)
 * 
 * Cloudinary account có Strict Transformations → delivery URLs bị 401.
 * Giải pháp: dùng generate_archive API (download_zip_url) → download ZIP → unzip → serve file gốc
 * 
 * Usage: /api/file-view?url=<cloudinary_url>
 */
export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Chỉ cho phép URL từ Cloudinary
    if (!url.includes('res.cloudinary.com')) {
        return NextResponse.json({ error: 'Only Cloudinary URLs are allowed' }, { status: 403 });
    }

    try {
        // ═══ Parse Cloudinary URL để lấy public_id và resource_type ═══
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        
        const uploadIdx = pathParts.indexOf('upload');
        if (uploadIdx === -1) {
            return NextResponse.json({ error: 'Invalid Cloudinary URL' }, { status: 400 });
        }

        const resourceType = pathParts[uploadIdx - 1] || 'raw';
        
        // Skip version (v123...) nếu có
        const afterUpload = pathParts.slice(uploadIdx + 1);
        let publicIdParts = afterUpload;
        if (afterUpload[0] && /^v\d+$/.test(afterUpload[0])) {
            publicIdParts = afterUpload.slice(1);
        }
        
        const fullPublicId = decodeURIComponent(publicIdParts.join('/'));

        // ═══ Configure Cloudinary ═══
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        });

        // ═══ Tạo download URL qua generate_archive API ═══
        // Đây là cách duy nhất hoạt động khi Strict Transformations bật
        const downloadUrl = cloudinary.utils.download_zip_url({
            public_ids: [fullPublicId],
            resource_type: resourceType as any,
            flatten_folders: true,
        });

        // Fetch ZIP
        const zipResponse = await fetch(downloadUrl);
        if (!zipResponse.ok) {
            console.error('[file-view] ZIP download failed:', zipResponse.status);
            return NextResponse.json(
                { error: `Download failed: ${zipResponse.status}` },
                { status: zipResponse.status }
            );
        }

        // Unzip và lấy file đầu tiên
        const zipBuffer = await zipResponse.arrayBuffer();
        const zip = await JSZip.loadAsync(zipBuffer);
        
        const fileNames = Object.keys(zip.files);
        if (fileNames.length === 0) {
            return NextResponse.json({ error: 'Empty archive' }, { status: 500 });
        }

        // Lấy file đầu tiên (thường chỉ có 1 file)
        const firstFile = zip.files[fileNames[0]];
        const fileBuffer = await firstFile.async('arraybuffer');
        
        // Detect MIME type from filename
        const fileName = fileNames[0];
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        const contentType = MIME_MAP[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
                'Cache-Control': 'public, max-age=86400',
            },
        });
    } catch (error: any) {
        console.error('[file-view] Error:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch file: ' + error.message },
            { status: 500 }
        );
    }
}
