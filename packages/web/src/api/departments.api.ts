import { api } from "@/shared/api/client";

export interface DepartmentDto {
  donViId: number;
  maDonVi: string | null;
  tenDonVi: string | null;
  tenVietTat: string | null;
}

export const departmentsApi = {
  list: () => api.get<DepartmentDto[]>("/departments"),
  get: (id: number) => api.get<DepartmentDto>(`/departments/${id}`),
};
