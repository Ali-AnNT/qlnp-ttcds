using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLNP.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDefaultLeaveTypeIdConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "SystemConfigs",
                columns: new[] { "Id", "ConfigKey", "ConfigValue", "Description" },
                values: new object[] { 10L, "default_leave_type_id", "1", "Loại phép mặc định khi tạo đơn xin nghỉ" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "SystemConfigs",
                keyColumn: "Id",
                keyValue: 10L);
        }
    }
}
