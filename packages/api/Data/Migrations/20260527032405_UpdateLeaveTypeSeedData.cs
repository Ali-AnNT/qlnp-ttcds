using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace QLNP.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLeaveTypeSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "LeaveTypes",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "Code", "Description" },
                values: new object[] { "NPN", "Nghỉ phép năm theo quy định" });

            migrationBuilder.UpdateData(
                table: "LeaveTypes",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "Code", "DefaultDays", "Description", "Name" },
                values: new object[] { "NO", 30m, "Nghỉ ốm đau có giấy xác nhận", "Nghỉ ốm" });

            migrationBuilder.UpdateData(
                table: "LeaveTypes",
                keyColumn: "Id",
                keyValue: 3L,
                columns: new[] { "Code", "Description", "Name" },
                values: new object[] { "NVR", "Nghỉ việc riêng có lương", "Nghỉ việc riêng" });

            migrationBuilder.InsertData(
                table: "LeaveTypes",
                columns: new[] { "Id", "Code", "DefaultDays", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { 4L, "NKL", 0m, "Nghỉ không hưởng lương", true, "Nghỉ không lương" },
                    { 5L, "NTS", 180m, "Nghỉ thai sản", true, "Nghỉ thai sản" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "LeaveTypes",
                keyColumn: "Id",
                keyValue: 4L);

            migrationBuilder.DeleteData(
                table: "LeaveTypes",
                keyColumn: "Id",
                keyValue: 5L);

            migrationBuilder.UpdateData(
                table: "LeaveTypes",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "Code", "Description" },
                values: new object[] { "annual", null });

            migrationBuilder.UpdateData(
                table: "LeaveTypes",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "Code", "DefaultDays", "Description", "Name" },
                values: new object[] { "sick", 0m, null, "Ốm đau" });

            migrationBuilder.UpdateData(
                table: "LeaveTypes",
                keyColumn: "Id",
                keyValue: 3L,
                columns: new[] { "Code", "Description", "Name" },
                values: new object[] { "personal", null, "Việc riêng" });
        }
    }
}
