using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace QLNP.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedLeaveConfigs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "LeaveConfigs",
                columns: new[] { "Id", "ApprovalLevel", "ApproverRole", "LeaveTypeId" },
                values: new object[,]
                {
                    { 1L, 1, "LD.PCM", 1L },
                    { 2L, 2, "GD.PGD", 1L },
                    { 3L, 1, "LD.PCM", 2L },
                    { 4L, 2, "GD.PGD", 2L },
                    { 5L, 1, "LD.PCM", 3L },
                    { 6L, 2, "GD.PGD", 3L },
                    { 7L, 1, "LD.PCM", 4L },
                    { 8L, 1, "LD.PCM", 5L },
                    { 9L, 2, "GD.PGD", 5L }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 1L);

            migrationBuilder.DeleteData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 2L);

            migrationBuilder.DeleteData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 3L);

            migrationBuilder.DeleteData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 4L);

            migrationBuilder.DeleteData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 5L);

            migrationBuilder.DeleteData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 6L);

            migrationBuilder.DeleteData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 7L);

            migrationBuilder.DeleteData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 8L);

            migrationBuilder.DeleteData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 9L);
        }
    }
}
