---
description: Commit và push code lên Git (tránh treo trên Windows/PowerShell)
---

# /git-push - Commit và Push code

## Lưu ý quan trọng (Windows PowerShell)

- **KHÔNG dùng `&&`** để nối lệnh → PowerShell cũ không hỗ trợ, sẽ lỗi parser
- **KHÔNG dùng tiếng Việt** trong commit message → gây treo do encoding UTF-8
- **KHÔNG viết commit message quá dài** → giữ dưới 72 ký tự
- **Chạy từng lệnh riêng biệt**, mỗi lệnh 1 bước

## Quy trình chuẩn

// turbo-all

### 1. Kiểm tra trạng thái
```
git status --short
```

### 2. Stage tất cả file thay đổi
```
git add -A
```

### 3. Commit với message tiếng Anh ngắn gọn
```
git commit -m "type: short english description"
```

**Quy tắc commit message:**
- Viết bằng **tiếng Anh** hoặc **tiếng Việt không dấu**
- **TUYỆT ĐỐI KHÔNG** dùng tiếng Việt có dấu (é, ạ, ổ, ứ...)
- Format: `type: mo ta ngan gon`
- Types: `feat`, `fix`, `refactor`, `style`, `docs`, `chore`
- Tối đa 72 ký tự
- Ví dụ: `feat: them bo loc san pham` hoặc `fix: sua loi hien thi modal`

### 4. Push lên nhánh hiện tại
```
git push origin rnd6
```

**Lưu ý:** Nếu nhánh khác `rnd6`, kiểm tra trước bằng `git branch --show-current`
