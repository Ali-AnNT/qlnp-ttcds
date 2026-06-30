using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLNP.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceIncludeSaturdayWithWorkDays : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1L,
                column: "Description",
                value: "Số ngày phép năm tối đa");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2L,
                column: "Description",
                value: "Số ngày tối thiểu khi tạo đơn");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 3L,
                column: "Description",
                value: "Số ngày phép chuyển sang năm sau");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 4L,
                column: "Description",
                value: "Chu kỳ tính phép");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 5L,
                column: "Description",
                value: "Mặc định Cán bộ PCM");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 6L,
                column: "Description",
                value: "Mặc định Lãnh đạo PCM");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 7L,
                column: "Description",
                value: "Mặc định Giám đốc PGD");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 8L,
                column: "Description",
                value: "Mặc định Quản trị hệ thống");

            migrationBuilder.InsertData(
                table: "SystemConfigs",
                columns: new[] { "Id", "ConfigKey", "ConfigValue", "Description" },
                values: new object[] { 9L, "work_days", "1,2,3,4,5", "Các ngày làm việc trong tuần (0=CN, 1=T2...)" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 9L);

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 1L,
                column: "Description",
                value: "So ngay phep nam toi da");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 2L,
                column: "Description",
                value: "So ngay toi thieu khi tao don");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 3L,
                column: "Description",
                value: "So ngay phep chuyen sang nam sau");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 4L,
                column: "Description",
                value: "Chu ky tinh phep");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 5L,
                column: "Description",
                value: "Mac dinh CB.PCM");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 6L,
                column: "Description",
                value: "Mac dinh LD.PCM");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 7L,
                column: "Description",
                value: "Mac dinh GD.PGD");

            migrationBuilder.UpdateData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 8L,
                column: "Description",
                value: "Mac dinh QTHT");
        }
    }
}
