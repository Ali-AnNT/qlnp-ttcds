using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace QLNP.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemConfigsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SystemConfigs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConfigKey = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ConfigValue = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemConfigs", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "SystemConfigs",
                columns: new[] { "Id", "ConfigKey", "ConfigValue", "Description" },
                values: new object[,]
                {
                    { 1L, "max_annual_leave", "12", "So ngay phep nam toi da" },
                    { 2L, "min_request_days", "1", "So ngay toi thieu khi tao don" },
                    { 3L, "max_carry_over", "5", "So ngay phep chuyen sang nam sau" },
                    { 4L, "leave_cycle", "yearly", "Chu ky tinh phep" },
                    { 5L, "default_days_CB.PCM", "14", "Mac dinh CB.PCM" },
                    { 6L, "default_days_LD.PCM", "14", "Mac dinh LD.PCM" },
                    { 7L, "default_days_GD.PGD", "16", "Mac dinh GD.PGD" },
                    { 8L, "default_days_QTHT", "12", "Mac dinh QTHT" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_SystemConfigs_ConfigKey",
                table: "SystemConfigs",
                column: "ConfigKey",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemConfigs");
        }
    }
}
