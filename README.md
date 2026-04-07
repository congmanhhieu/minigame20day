# Hướng dẫn triển khai Minigame 20 Ngày lên Server (Deployment Guide)

Tài liệu này hướng dẫn cách triển khai hệ thống Minigame (Frontend Next.js & Backend Golang) lên một máy chủ thực tế (như Ubuntu/Debian VPS) chạy môi trường Production.

---

## 1. Yêu cầu hệ thống (Prerequisites)

Trên VPS (Ubuntu 20.04 hoặc 22.04), bạn cần cài đặt các thành phần nền tảng sau:

1. **Golang** (Phiên bản >= 1.21)
2. **Node.js** (Phiên bản >= 18.x) và **npm** / **yarn**
3. **PostgreSQL** (Phiên bản >= 14)
4. **Redis** (Phiên bản >= 6)
5. **Nginx** (Làm Web Server / Reverse Proxy)
6. **PM2** (Quản lý tiến trình cho Frontend & Backend)

### Lệnh cài đặt nhanh các package cơ bản (Ubuntu/Debian):
```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Nginx, PostgreSQL, Redis
sudo apt install nginx postgresql postgresql-contrib redis-server -y

# Cài đặt Node.js & PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Khởi động và thiết lập chạy mặc định cho DB/Cache
sudo systemctl enable postgresql
sudo systemctl enable redis-server
```

---

## 2. Cài đặt Cơ sở dữ liệu (Database Setup)

Bạn cần tạo một Database PostgreSQL và import Schema cho Minigame.

```bash
# 1. Chuyển sang user postgres để tạo DB
sudo -i -u postgres

# 2. Tạo DB và User (thay YOUR_PASSWORD bằng mật khẩu thực tế)
psql -c "CREATE USER minigame_user WITH PASSWORD 'YOUR_PASSWORD';"
psql -c "CREATE DATABASE minigame20day OWNER minigame_user;"
exit

```bash
# Hoặc tạo database với encoding UTF8 và gán cho user postgres
sudo -u postgres psql -c "CREATE DATABASE minigame20day WITH ENCODING 'UTF8' OWNER postgres;"
```

CREATE DATABASE minigame20day WITH ENCODING = 'UTF8' LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8';



# 3. Import Schema (đảm bảo file schema.sql từ thư mục backend đang nằm ở server)
psql -U postgres -d minigame20day -h 127.0.0.1 -W < backend/schema.sql
```

---

## 3. Triển khai Backend (Golang)

### Bước 1: Chuẩn bị biến môi trường
Di chuyển vào thư mục `backend` và tạo file `.env`:
```bash
cd minigame20day/backend
cp .env.example .env
```
Mở tệp `.env` (`nano .env`) và điền các cấu hình thực tế:
```env
PORT=8080
DB_URL=postgres://minigame_user:YOUR_PASSWORD@localhost:5432/minigame20day?sslmode=disable
REDIS_URL=localhost:6379
JWT_SECRET=super-secret-production-key-change-it
# ... Các cấu hình Google/Facebook OAuth2 nếu có
```

### Bước 2: Build file thực thi (Binary)
```bash
go build -o minigame-backend ./cmd/api/main.go
```

### Bước 3: Chạy Backend bằng PM2 hoặc Systemd
Sử dụng PM2 để chạy tiến trình chạy ngầm và tự khởi động lại khi sập/bảo trì:
```bash
pm2 start ./minigame-backend --name "minigame-api"
```

---

## 4. Triển khai Frontend (Next.js)

### Bước 1: Chuẩn bị biến môi trường
Đứng tại thư mục `frontend`, cấu hình kết nối tới Backend Production.
Tạo file `.env.production` (hoặc `.env.local`):
```bash
cd ../frontend
nano .env.production
```
Nội dung file:
```env
# Địa chỉ API khi Golang backend của bạn đang chạy. Nên domain/trực tiếp
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
# Ngày bắt đầu chiến dịch
NEXT_PUBLIC_START_DATE=2026-04-01
# Tổng số ngày chiến dịch theo thiết lập
NEXT_PUBLIC_TOTAL_DAYS=20
```

### Bước 2: Cài đặt và Build ứng dụng
```bash
npm install
npm run build
```

### Bước 3: Khởi động Next.js bằng PM2
```bash
pm2 start npm --name "minigame-web" -- start
```

### Bước 4: Lưu cấu hình PM2 khởi động cùng server
```bash
pm2 save
pm2 startup
```

---

## 5. Cấu hình Nginx & Tên miền (Reverse Proxy & SSL)

Bạn cần liên kết Frontend tới tên miền chính (VD: `minigame.com`) và Backend API (VD: `api.minigame.com`).

**Tạo cấu hình Nginx:**
```bash
sudo nano /etc/nginx/sites-available/minigame
```

```nginx
# --- FRONTEND ---
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# --- BACKEND API ---
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Kiểm tra và khởi động lại Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/minigame /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Cài đặt SSL (HTTPS) qua Certbot (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

---

## 6. Luồng Cron Tự Động (Lưu ý Vận Hành)
- Backend Golang đã được thiết lập tính toán và chốt bảng xếp hạng tự động vào lúc **00:00 (nửa đêm) theo giờ của máy chủ server**.
- Bạn không cần cấu hình Crontab ngoài cho máy tính, vì Cron đã được **tích hợp cứng** bên trong mã nguồn Go (`v3/cron`). Hãy đảm bảo OS Timezone (giờ máy chủ) trên VPS được thiết lập chuẩn theo nước bạn muốn (Ví dụ Asia/Ho_Chi_Minh).

```bash
# Kiểm tra múi giờ của Server Linux
timedatectl

# Set múi giờ sang Việt Nam (nếu cần thiết)
sudo timedatectl set-timezone Asia/Ho_Chi_Minh
```

🎉 **Xong! Truy cập tên miền của bạn để kiểm tra Hệ thống Minigame đang hoạt động trên Production.**
