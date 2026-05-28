using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLNP.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUserRolesAndSimplifyLeaveBalance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create UserRoles table
            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_UserRoles_USER_MASTER_UserId",
                        column: x => x.UserId,
                        principalTable: "USER_MASTER",
                        principalColumn: "User_MasterID",
                        onDelete: ReferentialAction.Restrict);
                });

            // 2. Insert dev user roles (matching DevLogin mapping)
            migrationBuilder.Sql(@"
INSERT INTO UserRoles (UserId, Role, UpdatedAt)
SELECT u.User_MasterID, r.Role, SYSUTCDATETIME()
FROM USER_MASTER u
JOIN (VALUES
    ('quantri', 'QLNP.QTHT'),
    ('trinh.vo', 'QLNP.GD.PGD'),
    ('nvhau.ttcds', 'QLNP.LD.PCM'),
    ('htquy.ttcds', 'QLNP.CB.PCM')
) AS r(UserName, Role) ON u.UserName = r.UserName
WHERE u.Used = 1;
");

            // 3. Drop FK and indexes that reference LeaveTypeId
            migrationBuilder.DropForeignKey(
                name: "FK_LeaveBalances_LeaveTypes_LeaveTypeId",
                table: "LeaveBalances");

            migrationBuilder.DropIndex(
                name: "IX_LeaveBalances_LeaveTypeId",
                table: "LeaveBalances");

            migrationBuilder.DropIndex(
                name: "IX_LeaveBalances_UserId_LeaveTypeId_Year",
                table: "LeaveBalances");

            // 4. Add Role column (nullable for migration safety)
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "LeaveBalances",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            // 5. Consolidate LeaveBalances: one row per (UserId, Year)
            //    TotalDays = min(max_annual_leave, default_days_{role}), fallback = max_annual_leave
            //    UsedDays = SUM of existing UsedDays per (UserId, Year)
            migrationBuilder.Sql(@"
-- Pre-compute max_annual_leave once
DECLARE @MaxAnnual DECIMAL(5,1) = ISNULL(
    (SELECT TOP 1 CAST(ConfigValue AS DECIMAL(5,1)) FROM SystemConfigs WHERE ConfigKey = 'max_annual_leave'),
    12
);

-- Create temp table with consolidated data
SELECT lb.UserId, lb.Year,
    SUM(lb.UsedDays) AS UsedDays,
    -- TotalDays = min(max_annual_leave, default_days_{role}), fallback = max_annual_leave
    ISNULL(
        (SELECT TOP 1
            CASE WHEN CAST(sc.ConfigValue AS DECIMAL(5,1)) < @MaxAnnual
                THEN CAST(sc.ConfigValue AS DECIMAL(5,1))
                ELSE @MaxAnnual
            END
         FROM SystemConfigs sc
         JOIN UserRoles ur ON ur.UserId = lb.UserId
         WHERE sc.ConfigKey = 'default_days_' + REPLACE(ur.Role, 'QLNP.', '')
        ),
        @MaxAnnual
    ) AS TotalDays,
    (SELECT TOP 1 ur.Role FROM UserRoles ur WHERE ur.UserId = lb.UserId) AS Role
INTO #ConsolidatedBalances
FROM LeaveBalances lb
GROUP BY lb.UserId, lb.Year;

-- Delete all existing rows
DELETE FROM LeaveBalances;

-- Re-insert consolidated rows
INSERT INTO LeaveBalances (UserId, Year, TotalDays, UsedDays, Role)
SELECT UserId, Year, TotalDays, UsedDays, Role
FROM #ConsolidatedBalances;

DROP TABLE #ConsolidatedBalances;
");

            // 6. Drop LeaveTypeId column
            migrationBuilder.DropColumn(
                name: "LeaveTypeId",
                table: "LeaveBalances");

            // 7. Create new unique index on (UserId, Year)
            migrationBuilder.CreateIndex(
                name: "IX_LeaveBalances_UserId_Year",
                table: "LeaveBalances",
                columns: new[] { "UserId", "Year" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop new index
            migrationBuilder.DropIndex(
                name: "IX_LeaveBalances_UserId_Year",
                table: "LeaveBalances");

            // Drop Role column
            migrationBuilder.DropColumn(
                name: "Role",
                table: "LeaveBalances");

            // Restore LeaveTypeId column
            migrationBuilder.AddColumn<long>(
                name: "LeaveTypeId",
                table: "LeaveBalances",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            // Restore indexes
            migrationBuilder.CreateIndex(
                name: "IX_LeaveBalances_LeaveTypeId",
                table: "LeaveBalances",
                column: "LeaveTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveBalances_UserId_LeaveTypeId_Year",
                table: "LeaveBalances",
                columns: new[] { "UserId", "LeaveTypeId", "Year" },
                unique: true);

            // Restore FK to LeaveTypes
            migrationBuilder.AddForeignKey(
                name: "FK_LeaveBalances_LeaveTypes_LeaveTypeId",
                table: "LeaveBalances",
                column: "LeaveTypeId",
                principalTable: "LeaveTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // Drop UserRoles table
            migrationBuilder.DropTable(
                name: "UserRoles");

            // Note: Down migration cannot restore per-LeaveType breakdown from consolidated data.
            // A database backup should be taken before this migration.
            // Each existing balance row will have LeaveTypeId = 0 (invalid) and must be re-seeded.
        }
    }
}