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
            // 1. Drop FK and indexes that reference LeaveTypeId
            migrationBuilder.DropForeignKey(
                name: "FK_LeaveBalances_LeaveTypes_LeaveTypeId",
                table: "LeaveBalances");

            migrationBuilder.DropIndex(
                name: "IX_LeaveBalances_LeaveTypeId",
                table: "LeaveBalances");

            migrationBuilder.DropIndex(
                name: "IX_LeaveBalances_UserId_LeaveTypeId_Year",
                table: "LeaveBalances");

            // 2. Make LeaveTypeId nullable so consolidation INSERT doesn't violate NOT NULL
            migrationBuilder.Sql("ALTER TABLE LeaveBalances ALTER COLUMN LeaveTypeId bigint NULL;");

            // 3. Add Role column
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "LeaveBalances",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            // 4. Create UserRoles table
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

            // 5. Insert dev user roles
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

            // 6. Consolidate LeaveBalances: one row per (UserId, Year)
            migrationBuilder.Sql(@"
-- Pre-compute max_annual_leave once
DECLARE @MaxAnnual DECIMAL(5,1) = ISNULL(
    (SELECT TOP 1 CAST(ConfigValue AS DECIMAL(5,1)) FROM SystemConfigs WHERE ConfigKey = 'max_annual_leave'),
    12
);

-- Create temp table with consolidated data
SELECT lb.UserId, lb.Year,
    SUM(lb.UsedDays) AS UsedDays,
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

-- Re-insert consolidated rows (LeaveTypeId is now nullable, so omitted column = NULL is fine)
INSERT INTO LeaveBalances (UserId, Year, TotalDays, UsedDays, Role)
SELECT UserId, Year, TotalDays, UsedDays, Role
FROM #ConsolidatedBalances;

DROP TABLE #ConsolidatedBalances;
");

            // 7. Drop LeaveTypeId column
            migrationBuilder.DropColumn(
                name: "LeaveTypeId",
                table: "LeaveBalances");

            // 8. Create new unique index on (UserId, Year)
            migrationBuilder.CreateIndex(
                name: "IX_LeaveBalances_UserId_Year",
                table: "LeaveBalances",
                columns: new[] { "UserId", "Year" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropIndex(
                name: "IX_LeaveBalances_UserId_Year",
                table: "LeaveBalances");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "LeaveBalances");

            migrationBuilder.AddColumn<long>(
                name: "LeaveTypeId",
                table: "LeaveBalances",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateIndex(
                name: "IX_LeaveBalances_LeaveTypeId",
                table: "LeaveBalances",
                column: "LeaveTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveBalances_UserId_LeaveTypeId_Year",
                table: "LeaveBalances",
                columns: new[] { "UserId", "LeaveTypeId", "Year" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveBalances_LeaveTypes_LeaveTypeId",
                table: "LeaveBalances",
                column: "LeaveTypeId",
                principalTable: "LeaveTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}