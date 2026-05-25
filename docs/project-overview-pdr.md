# Product Development Requirements (PDR) - QLNP-TTCDS

## 1. Project Identity

| Item | Detail |
|------|--------|
| **Project Name** | QLNP-TTCDS - He Thong Quan Ly Nghi Phep |
| **Organization** | Trung Tam Chuyen Doi So (TTCDS) |
| **Domain** | Quan ly nghi phep noi bo |
| **Platform** | Web application (SPA) |
| **Current Version** | 0.3.2 (backend/API readiness in progress) |

## 2. Purpose

Xay dung he thong noi bo thay the quy trinh xin nghi phep thu cong (giay to, email). Muc tieu:

- So hoa toan bo quy trinh: tao don -> phe duyet -> theo doi -> bao cao
- Giam thoi gian xu ly don nghi phep tu vai ngay xuong vai phut
- Tu dong tinh toan ngay phep con lai, phat hien trung lich, vuot muc quy dinh
- Cung cap dashboard thong ke cho lanh dao ra quyet dinh

## 3. Target Users

| Role | Label | Description |
|------|-------|-------------|
| **CB.PCM** | Can bo phong chuyen mon | Nhan vien thong thuong. Nhu cau: tao don nghi phep, xem tinh trang don, theo doi lich nghi |
| **LD.PCM** | Lanh dao phong chuyen mon | Truong/ pho phong. Nhu cau: phe duyet don cua nhan vien trong phong, quan ly lich nghi ca phong |
| **GD.PGD** | Giam doc / Pho giam doc | Lanh dao cao nhat. Nhu cau: phe duyet cuoi cung, xem bao cao tong hop, phat hien vi pham |
| **QTHT** | Quan tri he thong | IT admin. Nhu cau: cau hinh tham so he thong, loai nghi phep, quy trinh phe duyet |

## 4. Core Features

### 4.1 Tao & Quan Ly Don Nghi Phep (CB.PCM, LD.PCM)
- Tao don nghi phep moi: chon loai phep, ngay bat dau/ket thuc, ly do
- Tu dong tinh so ngay nghi (chi tinh ngay lam viec - business days)
- Phat hien trung lich: canh bao neu ngay nghi trung voi don da duoc duyet
- Xem danh sach don cua minh, loc theo trang thai
- Chinh sua don khi chua duoc phe duyet
- Huy don

### 4.2 Phe Duyet Don Nghi Phep (LD.PCM, GD.PGD)
- Phe duyet 2 cap (configurable): Lanh dao phong -> Giam doc
- Xem chi tiet don: nhan vien, loai phep, thoi gian, ly do
- Phe duyet / tu choi kem ly do
- Bang dieu khien danh cho nguoi phe duyet hien thi cac don cho xu ly

### 4.3 Theo Doi Lich Nghi Phep (All Roles)
- Lich dang thang (calendar grid): hien thi ngay nghi cua tung nhan vien
- Lich dang danh sach: xem chi tiet theo ngay
- Loc theo phong ban
- Mau sac phan biet loai nghi phep va trang thai

### 4.4 Tong Hop Lich Nghi (GD.PGD)
- Bang tong hop theo phong ban: so luong don, tong ngay nghi
- Click vao phong ban de xem chi tiet tung nhan vien
- Loc theo nam, loai phep
- Bieu do tron phan bo theo loai nghi phep

### 4.5 Thong Ke Bao Cao (GD.PGD)
- KPI cards: tong don, tong ngay nghi, so nhan vien nghi
- Bieu do cot theo phong ban
- Bieu do tron theo loai nghi phep
- Backend ho tro xuat Excel `.xlsx`; frontend hien tai van xuat CSV cuc bo tren trang bao cao

### 4.6 Giam Sat Vuot Muc Quy Dinh (GD.PGD)
- Theo doi nhan vien vuot qua han muc 12 ngay/nam
- Bang chi tiet theo nhan vien + bang tong hop theo phong ban
- Bieu do tron + bieu do cot
- Loc theo ky: nam / quy / thang

### 4.7 Cau Hinh He Thong (QTHT)
- Tab Cau hinh chung: chu ky nam, so ngay mac dinh theo vai tro
- Tab Loai nghi phep (CRUD): ten, ma, so ngay mac dinh, mo ta
- Tab Cau hinh phe duyet (CRUD): loai phep + cap phe duyet + vai tro nguoi duyet

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| **Performance** | Page load < 3s, form submit < 1s |
| **Availability** | 99% trong gio hanh chinh (8h-17h, T2-T6) |
| **Security** | JWT Bearer auth (SSO Portal delegates), ICurrentUserProvider (claims-based), role-based endpoint authorization |
| **Usability** | Giao dien tieng Viet, responsive mobile + desktop |
| **Browser Support** | Chrome, Firefox, Edge (latest 2 versions) |
| **Data Integrity** | Unique constraints tranh trung lap du lieu balance; lazy seed tao balance cho user/nam/loai phep |

## 6. Success Criteria

| Metric | Target |
|--------|--------|
| Thoi gian xu ly don nghi phep | < 1 ngay (hien tai 3-5 ngay) |
| Don nghi phep bi trung lich | 0 (phat hien tu dong) |
| Giam thoi gian bao cao thu cong | 100% (tu dong tao bao cao) |
| Ty le loi khi tinh ngay phep | 0% |
| Nguoi dung thanh thao sau | < 15 phut su dung |

## 7. Technical Constraints

- Infrastructure: .NET 10 API server + SQL Server (on-premise)
- Backend: FastEndpoints v8.1.0 + Vertical Slice Architecture + EF Core 9 + SQL Server
- Frontend: SPA React, khong SSR
- Database: SQL Server (existing VI_NGHIPHEP database)
- Auth: JWT Bearer (SSO Portal issues token, iframe embeds via postMessage). API resolves via ICurrentUserProvider reading claims. Dev mode uses `/api/auth/dev/login` to issue local test JWTs
- Hosting: Vercel / Netlify / Nginx (frontend), IIS (API reverse proxy)
- Embed: iframe host gui JWT qua `postMessage`; API tra CSP `frame-ancestors` theo cau hinh

## 8. Dependencies

### Frontend
| Dependency | Version | Purpose |
|------------|---------|---------|
| React | ^18.3.1 | UI framework |
| Vite | ^5.4.19 | Build tool |
| Zustand | ^5.0.12 | Client state management |
| TanStack React Query | ^5.83.0 | Server state caching |
| React Router DOM | ^6.30.1 | SPA routing |
| Recharts | ^3.8.1 | Charts |
| React Hook Form | ^7.72.1 | Form handling |
| Zod | ^4.3.6 | Schema validation |
| date-fns | ^4.1.0 | Date utilities |

### Backend
| Dependency | Version | Purpose |
|------------|---------|---------|
| .NET SDK | 10.0 | Runtime |
| FastEndpoints | 8.1.0 | REPR pattern API framework |
| EF Core (SqlServer) | 9.0.0 | ORM + migrations + SQL Server provider |
| EF Core Design | 9.0.0 | Design-time tools (scaffold, migrations) |
| EF Core Tools | 9.0.0 | CLI tools for migrations |
| Microsoft.AspNetCore.OpenApi | 9.0.16 | OpenAPI/Swagger support |
