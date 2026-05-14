# BRD Comparison Report: 3 Phiên Bản QLNP-TTCDS Migration

**Date:** 2026-05-12 | **Context:** So sánh 3 cách tiếp cận viết BRD cho dự án migration

---

## 1. Tổng quan 3 phiên bản

| Tiêu chí | v1: Comprehensive | v2: Lean Executive | v3: Technical |
|----------|------------------|-------------------|---------------|
| **File** | brd-standalone-dotnet-migration.md | brd-v2-lean-executive.md | brd-v3-technical.md |
| **Độ dài** | ~260 dòng | ~140 dòng | ~310 dòng |
| **Đối tượng chính** | Tất cả stakeholders | Executives, managers | Developers, architects |
| **Phong cách** | Cân bằng business + tech | Thiên business, ngắn gọn | Thiên kỹ thuật, chi tiết |
| **Ngôn ngữ** | Tiếng Việt + thuật ngữ EN | Tiếng Việt hoàn toàn | Tiếng Việt + code snippets |
| **Diagram** | 2 Mermaid sequence diagrams | ASCII flow diagram | C# pseudocode + DDL |

---

## 2. So sánh từng Section

### 2.1 Section 1: Tổng quan

| Khía cạnh | v1 | v2 | v3 |
|-----------|----|----|-----|
| Cấu trúc | 4 mục tiêu cụ thể dạng bullet | Mục tiêu SMART format (S-M-A-R-T) | Bảng AS-IS vs TO-BE stack |
| Scope | Text bullet In/Out | Table In/Out | Không có scope riêng (ẩn trong stack table) |
| Độ chi tiết | Trung bình | Thấp - dễ scan nhanh | Cao - đầy đủ version numbers |

**Khác biệt chính:** v2 dùng SMART goals chuẩn quản trị, v3 dùng technical comparison tables, v1 ở giữa.

### 2.2 Section 2: Stakeholder

| Khía cạnh | v1 | v2 | v3 |
|-----------|----|----|-----|
| Số cột | 4 (Role, Name, Responsibility, Interest) | 3 (Role, Representative, Main Concern) | Không có section riêng |
| Chi tiết | Đầy đủ trách nhiệm | Chỉ quan tâm chính | Stakeholder rải rác trong các section khác |

**Khác biệt chính:** v3 bỏ hẳn stakeholder section (không phù hợp audience technical). v2 tối giản còn 3 cột.

### 2.3 Section 3: Business Requirements / Value

| Khía cạnh | v1 | v2 | v3 |
|-----------|----|----|-----|
| BR table | 6 dòng với ID BR-xxx | Không có table, gộp vào problem/value | Chuyển thành technical requirements |
| Problem | 4 vấn đề trong bullet | 4 vấn đề trong table (Problem/Impact) | Rải trong risk matrix |
| Value | 4 giá trị bullet | 4 giá trị trong table (Value/Measurement) | Không có section riêng |

**Khác biệt chính:** v2 dùng table Problem/Impact và Value/Measurement rõ ràng hơn để đo lường. v1 ID-based giúp traceability. v3 không quan tâm business value riêng.

### 2.4 Section 4: Business Process (AS-IS / TO-BE)

| Khía cạnh | v1 | v2 | v3 |
|-----------|----|----|-----|
| Diagram AS-IS | Mermaid sequence diagram | ASCII text flow | Bảng so sánh stack |
| Diagram TO-BE | Mermaid sequence diagram | ASCII text flow + annotation | Không có process diagram |
| Chi tiết AS-IS | Đầy đủ pain points | Gộp trong problem table | Stack table + code references |
| Chi tiết TO-BE | Full flow với alt/else branch | Đơn giản | Implementation-focused |

**Khác biệt chính:** v1 có Mermaid diagrams đầy đủ nhất. v2 ASCII đơn giản dễ đọc. v3 tập trung vào code structure thay vì process flow.

### 2.5 Section 5: Functional Requirements

| Khía cạnh | v1 | v2 | v3 |
|-----------|----|----|-----|
| Số lượng FR | 9 nhóm, ~30 FRs với ID | 3 nhóm priority (P0/P1/P2), gộp FR | Endpoint contracts chi tiết + C# pseudocode |
| User Stories | 8 US với acceptance note | Không có | Không có |
| Format | Table FR-xxx + Description + Priority + Dependency | Grouped by priority, bullets | API route table + request/response spec |

**Khác biệt chính:** v1 đầy đủ nhất với FR ID + User Stories. v2 gộp theo priority phù hợp executive. v3 thay FR bằng API contracts vì audience là developer.

### 2.6 Section 6: Non-functional Requirements

| Khía cạnh | v1 | v2 | v3 |
|-----------|----|----|-----|
| Số NFR | 9 NFRs, có ID | 5 NFRs, không ID | 8 NFRs, có Implementation column |
| Metrics | Mỗi NFR có metric cụ thể | Metric đơn giản | Có implementation guide cụ thể |
| Độ đo lường | Cao | Trung bình | Cao + hướng dẫn implement |

**Khác biệt chính:** v3 thêm cột "Implementation" cho dev biết cách triển khai. v1 tập trung vào đo lường. v2 giữ tối thiểu.

### 2.7 Section 7: Business Rules

| Khía cạnh | v1 | v2 | v3 |
|-----------|----|----|-----|
| Số rules | 9 rules (BRULE-xxx) | 6 rules (BR-xx) | Code hóa thành enum + dictionary |
| Format | Table ID + Rule + Description + Exception | Table ID + Rule ngắn gọn | C# enum + state machine code |
| Exception handling | Mỗi rule có exception riêng | Không có exceptions | Implicit trong code logic |

**Khác biệt chính:** v3 chuyển business rules thành code artifacts (enum, dictionary, state machine). v1 có exception handling rõ ràng nhất.

### 2.8 Section 8: Assumptions & Constraints

| Khía cạnh | v1 | v2 | v3 |
|-----------|----|----|-----|
| Assumptions | 6 giả định với Risk column | 4 giả định với Risk column | 0 (thay bằng Risk Matrix ở section 9) |
| Constraints | 5 ràng buộc với Source + Impact | 4 bullet constraints | Rải trong tech stack requirements |
| Cấu trúc | Table riêng assumptions & constraints | Table assumptions + bullet constraints | Risk matrix (P×I + Mitigation) |

**Khác biệt chính:** v3 dùng Risk Matrix (Probability × Impact) chuyên nghiệp hơn cho risk assessment. v1/v2 tách assumptions/constraints rõ ràng hơn.

### 2.9 Section 9: Acceptance Criteria

| Khía cạnh | v1 | v2 | v3 |
|-----------|----|----|-----|
| Tổng thể | 10 checkbox criteria | 10 checkbox criteria | Không có acceptance criteria riêng |
| Theo chức năng | 16 ACs với ID + test method | Không có | Implicit trong API contracts |
| Test method | Manual test, API test, E2E test | Không ghi rõ | xUnit + TestContainers reference |

**Khác biệt chính:** v1 formal nhất với 16 ACs có phương pháp test. v2 tối giản checkbox. v3 coi code/api contracts là acceptance criteria.

---

## 3. Phụ lục (Appendices)

| Nội dung | v1 | v2 | v3 |
|----------|----|----|-----|
| DB type mapping | Có (bảng) | Không | Có (DDL code) |
| API endpoints summary | Có (bảng 19 endpoints) | Không | Có (đầy đủ request/response) |
| Phase breakdown | Có (bảng 3 phases) | Có (ASCII roadmap) | Không |
| NuGet packages | Không | Không | Có |
| Environment variables | Không | Không | Có (full .env example) |
| C# project structure | Không | Không | Có (folder tree) |
| JWT payload spec | Không | Không | Có (JSON) |
| Overlap detection SQL | Không | Không | Có (SQL + C#) |

---

## 4. Ma trận phù hợp theo Audience

| Audience | v1 Comprehensive | v2 Lean | v3 Technical |
|----------|:---:|:---:|:---:|
| **Ban Giám đốc** | OK | BEST | Too technical |
| **Product Owner** | BEST | OK | OK |
| **Business Users** | OK | BEST | No |
| **Dev Team** | OK | OK | BEST |
| **QA/Testers** | BEST | OK | OK |
| **Architects** | OK | No | BEST |
| **Host Team (đối tác)** | OK | BEST | OK |

---

## 5. Điểm mạnh & Yếu từng phiên bản

### v1: Comprehensive
| Mạnh | Yếu |
|------|-----|
| Cân bằng business + technical | Dài, mất thời gian đọc hết |
| Đầy đủ traceability (BR, FR, NFR, AC IDs) | Không có code examples |
| Mermaid diagrams trực quan | Thiếu implementation specifics |
| Phù hợp nhất cho QA và PO | Có thể "quá nhiều" với executives |

### v2: Lean Executive
| Mạnh | Yếu |
|------|-----|
| Ngắn gọn, dễ scan | Thiếu traceability IDs |
| SMART goals chuẩn quản trị | Không có diagram phức tạp |
| Table Problem/Impact, Value/Measurement đo lường được | Không đủ chi tiết cho dev/QA |
| Phù hợp nhất cho executives và host team | Thiếu acceptance criteria chi tiết |

### v3: Technical
| Mạnh | Yếu |
|------|-----|
| Code examples thực tế (C#, SQL, TypeScript) | Không có business perspective |
| API contracts đầy đủ request/response | Thiếu stakeholder, business value |
| Risk matrix chuyên nghiệp (P×I) | Không có process flow diagrams |
| Appendices phong phú (packages, env vars) | Không phù hợp non-technical readers |
| Sẵn sàng để bắt đầu implementation | Thiếu acceptance criteria formal |

---

## 6. Khuyến nghị

| Tình huống | Dùng phiên bản |
|------------|---------------|
| Dự án cần phê duyệt từ Ban Giám đốc | v2 (Lean Executive) |
| Team bắt đầu implementation | v3 (Technical) |
| QA viết test plan | v1 (Comprehensive) |
| Onboarding thành viên mới | v1 + v3 kết hợp |
| Trao đổi với host team | v2 (Lean Executive) |
| Audit/Compliance review | v1 (Comprehensive) |

**Best practice:** Kết hợp v1 (structure + traceability) + v3 (technical depth) cho internal use, extract v2 cho external communication.

---

## Unresolved

- Có nên merge 3 phiên bản thành 1 BRD duy nhất với section "Executive Summary" không?
- Host team đã xác nhận postMessage protocol chưa để đưa vào BRD final?
- SQL Server edition: Express (free) hay Standard (có license)?
