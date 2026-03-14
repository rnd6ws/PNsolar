# 📖 Hướng dẫn Git cho dự án PNSolar

## 1. Lấy code mới từ nhánh khác về nhánh mình
## thêm test

```bash
# Bước 1: Đảm bảo đang ở nhánh của mình
git branch                    # Xem đang ở nhánh nào (* là nhánh hiện tại)

# Bước 2: Fetch code mới từ remote
git fetch origin <tên-nhánh>  # VD: git fetch origin main

# Bước 3: Merge vào nhánh mình
git merge origin/<tên-nhánh> --no-edit   # VD: git merge origin/main --no-edit
```

> [!WARNING]
> Nếu báo lỗi **"local changes would be overwritten"** → chạy `git stash` trước, merge xong chạy `git stash pop`

---

## 2. Push code lên nhánh của mình

```bash
git add .
git commit -m "mô tả thay đổi"
git push origin rnd6
```

---

## 3. Push code lên nhánh khác (VD: từ rnd6 → rnd8)

### Cách 1: Cherry-pick (chỉ lấy 1 commit cụ thể)

```bash
git checkout rnd8              # Chuyển sang rnd8
git pull origin rnd8           # Pull code mới nhất
git cherry-pick <mã-commit>   # VD: git cherry-pick abc1234
git push origin rnd8           # Push lên
git checkout rnd6              # Quay lại rnd6
```

### Cách 2: Merge toàn bộ nhánh

```bash
git checkout rnd8
git pull origin rnd8
git merge rnd6 --no-edit
git push origin rnd8
git checkout rnd6
```

> [!TIP]
> Dùng `git log --oneline -5` để xem mã commit gần nhất nếu cần cherry-pick.

---

## 4. Hoàn tác (quay lại trước khi merge/pull)

```bash
# Xem lịch sử để tìm commit muốn quay về
git log --oneline -10

# Reset về commit cụ thể (XÓA hết thay đổi sau đó)
git reset --hard <mã-commit>

# Nếu cần giữ lại 1 commit cụ thể sau khi reset
git cherry-pick <mã-commit>
```

> [!CAUTION]
> `git reset --hard` sẽ **xóa vĩnh viễn** các thay đổi chưa commit. Hãy chắc chắn trước khi dùng!

---

## 5. Xử lý khi có thay đổi chưa commit

```bash
git stash              # Cất tạm thay đổi
# ... làm gì đó (merge, checkout, pull) ...
git stash pop          # Lấy lại thay đổi đã cất
```

---

## 6. Các lệnh hay dùng

| Lệnh | Mô tả |
|---|---|
| `git branch` | Xem đang ở nhánh nào |
| `git branch --show-current` | Chỉ hiện tên nhánh hiện tại |
| `git status` | Xem file nào thay đổi |
| `git log --oneline -5` | Xem 5 commit gần nhất |
| `git diff` | Xem chi tiết thay đổi |
| `git stash` | Cất tạm thay đổi chưa commit |
| `git stash pop` | Lấy lại thay đổi đã cất |
| `git fetch origin <nhánh>` | Tải code mới từ remote (chưa merge) |
| `git pull origin <nhánh>` | Tải + merge luôn (= fetch + merge) |
| `git checkout <nhánh>` | Chuyển nhánh |
| `git cherry-pick <commit>` | Lấy 1 commit cụ thể từ nhánh khác |
| `git reset --hard <commit>` | Quay về commit cụ thể (xóa hết sau đó) |

---

## 🔄 Quy trình làm việc hàng ngày

```
1. git pull origin main          ← Lấy code mới nhất từ main
2. ... code, code, code ...      ← Làm việc bình thường
3. git add .                     ← Thêm file thay đổi
4. git commit -m "mô tả"        ← Commit
5. git push origin rnd6          ← Push lên nhánh mình
6. Tạo Pull Request trên GitHub  ← Merge vào main
```

---

## 🔥 Xử lý Conflict (xung đột code)

Khi merge mà bị conflict:

```bash
# 1. Git sẽ báo file nào bị conflict
git status

# 2. Mở file đó, tìm đoạn:
<<<<<<< HEAD
code của mình
=======
code từ nhánh khác
>>>>>>> origin/main

# 3. Giữ lại code đúng, xóa các dấu <<<, ===, >>>

# 4. Sau khi sửa xong tất cả conflict:
git add .
git commit -m "resolve conflict"
```

---

## 📝 Lưu ý quan trọng

> [!IMPORTANT]
> - Luôn **pull code mới nhất** trước khi bắt đầu làm việc
> - Luôn **commit thường xuyên** với mô tả rõ ràng
> - Khi thêm model Prisma mới → chạy `npx prisma generate`
> - Khi deploy Vercel lỗi → kiểm tra Build Logs trên Vercel dashboard
