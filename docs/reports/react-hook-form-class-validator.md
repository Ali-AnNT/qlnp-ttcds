# Báo cáo Nghiên cứu: Kết hợp React Hook Form + Class Validator

## Tóm tắt Dự án (Executive Summary)
Báo cáo này nghiên cứu giải pháp tích hợp thư viện **React Hook Form** (thư viện quản lý form hiệu năng cao trong React) với **class-validator** (thư viện kiểm định dữ liệu dựa trên Class và Decorator của TypeScript). Sự kết hợp này thường được thực thi thông qua gói chính thức `@hookform/resolvers`.

Phương án này cực kỳ hữu ích đối với các dự án sử dụng cấu trúc Monorepo hoặc chia sẻ mã nguồn giữa Frontend (React/Vite) và Backend (NestJS/TypeORM), cho phép lập trình viên tái sử dụng các lớp thực thể (DTOs/Entities) để kiểm định dữ liệu ở cả hai đầu mà không cần viết lại quy tắc kiểm định (validation rules). 

Tuy nhiên, việc tích hợp này đòi hỏi một số cấu hình bắt buộc về TypeScript Compiler (cho phép sử dụng Decorators) và cài đặt polyfill `reflect-metadata` ở Frontend. Báo cáo cũng đề xuất so sánh giải pháp này với **Zod** để giúp đội ngũ đưa ra quyết định kiến trúc tối ưu nhất dựa trên các yếu tố: kích thước bundle size, hiệu năng, và trải nghiệm lập trình viên (DX).

---

## Phương pháp Nghiên cứu (Research Methodology)
- **Số lượng nguồn tham khảo đã đối chiếu:** 5 tài liệu (Tài liệu chính thức React Hook Form Resolvers, tài liệu class-validator/class-transformer, các bài viết kỹ thuật trên Dev.to, Medium và StackOverflow).
- **Phạm vi thời gian của tài liệu:** Từ năm 2023 đến 2026.
- **Từ khóa tìm kiếm chính:** `react hook form class validator resolver`, `react hook form class-validator resolver nested objects arrays`, `react-hook-form share validation monorepo class-validator`.

---

## Các Kết quả Nghiên cứu Chính (Key Findings)

### 1. Tổng quan Công nghệ (Technology Overview)
- **React Hook Form (RHF):** Hoạt động dựa trên uncontrolled inputs, giúp hạn chế re-render tối đa và tối ưu hóa hiệu năng form.
- **Class Validator:** Sử dụng các decorator (như `@IsNotEmpty()`, `@IsEmail()`, `@MinLength()`) trực tiếp trên thuộc tính của Class TypeScript để định nghĩa các ràng buộc dữ liệu.
- **Class Transformer:** Thư viện đi kèm bắt buộc dùng để chuyển đổi các object thuần (plain javascript objects) nhận từ form thành các instance của Class nhằm kích hoạt các decorator kiểm định.
- **RHF Resolvers (@hookform/resolvers/class-validator):** Đóng vai trò là cầu nối (adapter) giúp RHF chạy tiến trình kiểm định của `class-validator` và map các lỗi (`ValidationError[]`) thành định dạng lỗi mà RHF hiểu (`FieldErrors`).

### 2. Trạng thái Hiện tại và Xu hướng (Current State & Trends)
- Giải pháp này được hỗ trợ chính thức bởi gói `@hookform/resolvers` và được bảo trì tích cực.
- Trong các dự án NestJS monorepo, đây vẫn là lựa chọn hàng đầu khi muốn đồng bộ hóa DTO từ backend xuống frontend. Tuy nhiên, đối với các ứng dụng React thuần hoặc không dùng NestJS, xu hướng hiện tại chuyển dịch mạnh mẽ sang **Zod** (`zodResolver`) hoặc **Valibot** vì tính gọn nhẹ và không phụ thuộc vào Decorators của TypeScript (vốn vẫn là tính năng thử nghiệm/experimental).

### 3. Thực hành Tốt nhất (Best Practices)
- **Tách biệt DTOs validation:** Không nên nhúng các logic của cơ sở dữ liệu (như TypeORM decorators `@Entity`, `@Column`) vào chung với class DTO dùng ở frontend để tránh lỗi import các thư viện node-only (như pg, mysql) vào trình duyệt.
- **Sử dụng `@ValidateNested` và `@Type` cho dữ liệu lồng nhau:** Khi kiểm định object lồng nhau hoặc mảng các object, bắt buộc sử dụng đồng thời `@ValidateNested()` của `class-validator` và `@Type()` của `class-transformer` để đảm bảo cơ chế đệ quy hoạt động chính xác.
- **Khai báo `reflect-metadata` tại Entry Point:** Luôn import `reflect-metadata` ở dòng đầu tiên của file chạy chính ở Frontend (ví dụ: `main.tsx` hoặc `index.tsx`) trước bất kỳ import logic nào khác.

### 4. Vấn đề Bảo mật (Security Considerations)
- **Không tin tưởng hoàn toàn vào Frontend:** Kiểm định ở client-side bằng RHF chỉ nhằm tối ưu hóa trải nghiệm người dùng (UX). Bắt buộc phải thực hiện lại kiểm định tương tự (hoặc nghiêm ngặt hơn) ở API Backend.
- **Tránh rò rỉ cấu trúc hệ thống:** Hãy cẩn thận khi sử dụng các custom validator có chứa logic nghiệp vụ nhạy cảm hoặc truy vấn db trực tiếp trên Frontend.

### 5. Đánh giá Hiệu năng & Kích thước Bundle (Performance & Bundle Size)
- **Bundle Size:** `class-validator` và `class-transformer` có dung lượng tương đối nặng (khoảng ~50KB - 80KB gzipped). So với Zod (~15KB gzipped), việc sử dụng Class Validator sẽ làm tăng kích thước bundle của client.
- **Hiệu năng chạy:** Tương đương các resolver khác. RHF quản lý trạng thái form tối ưu nên tốc độ phản hồi của form không bị ảnh hưởng đáng kể bởi thư viện kiểm định.

---

## Phân tích So sánh (Comparative Analysis)

| Tiêu chí | Class Validator + RHF | Zod + RHF (Khuyên dùng cho React thuần) |
| :--- | :--- | :--- |
| **Kích thước Bundle** | Lớn (Yêu cầu `class-validator`, `class-transformer`, `reflect-metadata`) | Nhỏ đến trung bình (~15KB gzipped) |
| **Cấu hình Compiler** | Phức tạp (Cần bật `experimentalDecorators`, `emitDecoratorMetadata` trong tsconfig) | Không cần cấu hình thêm |
| **Hỗ trợ Monorepo** | Tốt nhất nếu Backend dùng NestJS (chia sẻ trực tiếp Class DTO) | Rất tốt (chia sẻ schema dạng JSON-like và tự động suy luận Type) |
| **Kiểu dữ liệu lồng nhau** | Cần khai báo thêm `@Type` và `@ValidateNested` | Tự nhiên, ngắn gọn với `zod.object().shape()` |
| **Mô hình lập trình** | Object-Oriented Programming (OOP) | Functional Programming / Schema-first |

---

## Hướng dẫn Triển khai (Implementation Recommendations)

### Hướng dẫn Nhanh (Quick Start Guide)

#### Bước 1: Cài đặt các gói thư viện cần thiết
```bash
npm install react-hook-form @hookform/resolvers class-validator class-transformer reflect-metadata
# hoặc dùng pnpm
pnpm add react-hook-form @hookform/resolvers class-validator class-transformer reflect-metadata
```

#### Bước 2: Cấu hình TypeScript (`tsconfig.json`)
Bật hỗ trợ Decorator trong dự án:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false
  }
}
```

#### Bước 3: Import `reflect-metadata` ở đầu file chạy chính (`main.tsx` hoặc `index.tsx`)
```typescript
import 'reflect-metadata';
// Các import khác bên dưới...
```

---

### Ví dụ Mã nguồn (Code Examples)

#### Ví dụ 1: Kiểm định Form cơ bản (Single Level Schema)
```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';
import { IsNotEmpty, IsEmail, MinLength } from 'class-validator';

// 1. Định nghĩa Class chứa luật kiểm định
class SignUpDto {
  @IsNotEmpty({ message: 'Tên không được để trống' })
  username: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;

  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên' })
  password: string;
}

const resolver = classValidatorResolver(SignUpDto);

export default function RegisterForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<SignUpDto>({
    resolver
  });

  const onSubmit = (data: SignUpDto) => {
    console.log('Dữ liệu gửi lên:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Tên người dùng</label>
        <input {...register('username')} className="mt-1 block w-full border rounded p-2" />
        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" {...register('email')} className="mt-1 block w-full border rounded p-2" />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
        <input type="password" {...register('password')} className="mt-1 block w-full border rounded p-2" />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Đăng ký</button>
    </form>
  );
}
```

#### Ví dụ 2: Kiểm định Dữ liệu lồng nhau (Nested Objects & Arrays)
Sử dụng khi form có các trường chứa object con hoặc mảng (ví dụ: mảng địa chỉ, mảng danh sách sản phẩm).
```typescript
import { IsString, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { useForm, useFieldArray } from 'react-hook-form';
import { classValidatorResolver } from '@hookform/resolvers/class-validator';

// Class con
class AddressDto {
  @IsString({ message: 'Thành phố phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Thành phố không được trống' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ chi tiết không được trống' })
  street: string;
}

// Class cha
class UserProfileDto {
  @IsNotEmpty({ message: 'Tên không được trống' })
  fullName: string;

  // Đối tượng lồng nhau (Nested Object)
  @ValidateNested()
  @Type(() => AddressDto)
  primaryAddress: AddressDto;

  // Mảng đối tượng lồng nhau (Nested Array of Objects)
  @IsArray()
  @ArrayMinSize(1, { message: 'Cần cung cấp ít nhất một địa chỉ phụ' })
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  secondaryAddresses: AddressDto[];
}

const resolver = classValidatorResolver(UserProfileDto);

export default function UserProfileForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm<UserProfileDto>({
    resolver,
    defaultValues: {
      fullName: '',
      primaryAddress: { city: '', street: '' },
      secondaryAddresses: [{ city: '', street: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'secondaryAddresses'
  });

  const onSubmit = (data: UserProfileDto) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg mx-auto p-4">
      <div>
        <label className="block font-semibold">Họ tên</label>
        <input {...register('fullName')} className="border w-full p-2" />
        {errors.fullName && <span className="text-red-500">{errors.fullName.message}</span>}
      </div>

      {/* Địa chỉ chính */}
      <fieldset className="border p-4 rounded">
        <legend className="font-semibold px-2">Địa chỉ chính</legend>
        <div>
          <label>Thành phố</label>
          <input {...register('primaryAddress.city')} className="border w-full p-2 mb-2" />
          {errors.primaryAddress?.city && <span className="text-red-500">{errors.primaryAddress.city.message}</span>}
        </div>
        <div>
          <label>Đường</label>
          <input {...register('primaryAddress.street')} className="border w-full p-2" />
          {errors.primaryAddress?.street && <span className="text-red-500">{errors.primaryAddress.street.message}</span>}
        </div>
      </fieldset>

      {/* Danh sách địa chỉ phụ */}
      <fieldset className="border p-4 rounded">
        <legend className="font-semibold px-2">Danh sách địa chỉ phụ</legend>
        {errors.secondaryAddresses && !Array.isArray(errors.secondaryAddresses) && (
          <p className="text-red-500">{(errors.secondaryAddresses as any).message}</p>
        )}
        
        {fields.map((field, index) => (
          <div key={field.id} className="border-b py-2 mb-2 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Địa chỉ #{index + 1}</span>
              <button type="button" onClick={() => remove(index)} className="text-red-500">Xóa</button>
            </div>
            <div>
              <label>Thành phố</label>
              <input {...register(`secondaryAddresses.${index}.city`)} className="border w-full p-2" />
              {errors.secondaryAddresses?.[index]?.city && (
                <span className="text-red-500">{errors.secondaryAddresses[index].city?.message}</span>
              )}
            </div>
            <div>
              <label>Đường</label>
              <input {...register(`secondaryAddresses.${index}.street`)} className="border w-full p-2" />
              {errors.secondaryAddresses?.[index]?.street && (
                <span className="text-red-500">{errors.secondaryAddresses[index].street?.message}</span>
              )}
            </div>
          </div>
        ))}

        <button type="button" onClick={() => append({ city: '', street: '' })} className="bg-green-500 text-white px-3 py-1 rounded mt-2">
          Thêm địa chỉ phụ
        </button>
      </fieldset>

      <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Lưu hồ sơ</button>
    </form>
  );
}
```

---

### Các Bẫy Thường Gặp & Cách Khắc Phục (Common Pitfalls)

1. **Lỗi: `Reflect.getMetadata is not a function`**
   - *Nguyên nhân:* Chưa import thư viện `reflect-metadata` ở entry point của ứng dụng Frontend.
   - *Cách khắc phục:* Đảm bảo dòng `import 'reflect-metadata';` nằm ở vị trí đầu tiên của file `main.tsx` hoặc `index.tsx`.

2. **Lỗi: Decorator không chạy hoặc báo lỗi cú pháp ở Frontend (Vite/CRA)**
   - *Nguyên nhân:* Công cụ build chưa được cấu hình để biên dịch cú pháp Decorators cũ (Legacy Decorators Stage 2) của TypeScript.
   - *Cách khắc phục:*
     - Kiểm tra `tsconfig.json` đã có `"experimentalDecorators": true` và `"emitDecoratorMetadata": true`.
     - Nếu sử dụng Vite với React plugin mặc định, hãy đảm bảo plugin hỗ trợ SWC (`@vitejs/plugin-react-swc`) hoặc cài thêm plugin hỗ trợ metadata của Babel nếu dùng Babel.

3. **Lỗi: Không kiểm định các trường lồng nhau (Nested object properties luôn vượt qua validation)**
   - *Nguyên nhân:* Thiếu decorator `@ValidateNested()` hoặc `@Type(() => TargetClass)`.
   - *Cách khắc phục:* Luôn luôn dùng cả 2 decorator này cùng nhau trên các trường có kiểu dữ liệu là một Class khác.

---

## Tài nguyên Tham khảo (Resources & References)

### Tài liệu Chính thức (Official Documentation)
- [React Hook Form Resolvers Github Repository](https://github.com/react-hook-form/resolvers)
- [Class Validator GitHub Page & API Documentation](https://github.com/typestack/class-validator)
- [Class Transformer GitHub Page](https://github.com/typestack/class-transformer)

### Tài liệu đọc thêm (Further Reading)
- [Sharing validation schemas in a NestJS and React Monorepo (Dev.to)](https://dev.to/)
- [TypeScript Decorators Specification and standard usage guide](https://www.typescriptlang.org/docs/handbook/decorators.html)
