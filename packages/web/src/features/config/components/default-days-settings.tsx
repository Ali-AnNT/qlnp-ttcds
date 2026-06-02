import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Save } from "lucide-react";
import { roleLabels, type UserRole, AppRoles } from "@/features/shared-reference-data";
import { SystemConfigDto } from "../api/types";

interface DefaultDaysSettingsProps {
  configs: SystemConfigDto[];
  onChange: (role: string, value: string) => void;
  onSave: () => void;
  isAdmin: boolean;
  isSaving: boolean;
}

export const DefaultDaysSettings = ({ 
  configs, 
  onChange, 
  onSave, 
  isAdmin, 
  isSaving 
}: DefaultDaysSettingsProps) => {
  const getSystemConfig = (key: string) => 
    configs.find((c) => c.configKey === key)?.configValue ?? "";

  const getRoleDefaultDays = (role: string) => {
    const suffix = role.replace("QLNP.", "");
    return getSystemConfig(`default_days_${suffix}`);
  };

  const roles = [AppRoles.Staff, AppRoles.Leader, AppRoles.Director, AppRoles.Admin] as UserRole[];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Số ngày phép năm mặc định theo loại nhân viên</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map((role) => {
              const maxAnnualStr = getSystemConfig("max_annual_leave");
              const maxAnnual = Number.isNaN(parseFloat(maxAnnualStr)) ? 12 : parseFloat(maxAnnualStr);
              const rawDefault = parseFloat(getRoleDefaultDays(role));
              const roleDefault = Number.isNaN(rawDefault) ? maxAnnual : rawDefault;
              const effectiveDays = Math.min(maxAnnual, roleDefault);
              
              return (
                <div key={role} className="flex items-center gap-2">
                  <Label className="text-xs w-40 truncate">{roleLabels[role]}</Label>
                  <Input
                    type="number"
                    min={0}
                    className="w-20 h-8 text-sm"
                    value={getRoleDefaultDays(role)}
                    onChange={(e) => onChange(role, e.target.value)}
                    disabled={!isAdmin}
                  />
                  <span className="text-xs text-muted-foreground">ngày</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    &#8594; hiệu lực: <strong>{effectiveDays}</strong>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {isAdmin && (
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            Lưu cấu hình
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
