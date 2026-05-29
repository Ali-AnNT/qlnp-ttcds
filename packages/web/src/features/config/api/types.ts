export interface ConfigDto {
  id: number;
  leaveTypeId: number;
  approvalLevel: number;
  approverRole: string;
}

export interface LeaveTypeDto {
  id: number;
  name: string;
  code: string;
  defaultDays: number;
  description: string | null;
  isActive: boolean;
}

export interface SystemConfigDto {
  id: number;
  configKey: string;
  configValue: string;
  description: string | null;
  updatedAt: string;
}
