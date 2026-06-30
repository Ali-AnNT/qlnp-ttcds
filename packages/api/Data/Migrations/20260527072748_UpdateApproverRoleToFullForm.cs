using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLNP.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateApproverRoleToFullForm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "ApproverRole",
                table: "LeaveConfigs",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(10)",
                oldMaxLength: 10);

            // Migrate existing short-form roles to full form
            migrationBuilder.Sql("UPDATE LeaveConfigs SET ApproverRole = 'QLNP.' + ApproverRole WHERE ApproverRole NOT LIKE 'QLNP.%'");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 1L,
                column: "ApproverRole",
                value: "QLNP.LD.PCM");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 2L,
                column: "ApproverRole",
                value: "QLNP.GD.PGD");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 3L,
                column: "ApproverRole",
                value: "QLNP.LD.PCM");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 4L,
                column: "ApproverRole",
                value: "QLNP.GD.PGD");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 5L,
                column: "ApproverRole",
                value: "QLNP.LD.PCM");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 6L,
                column: "ApproverRole",
                value: "QLNP.GD.PGD");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 7L,
                column: "ApproverRole",
                value: "QLNP.LD.PCM");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 8L,
                column: "ApproverRole",
                value: "QLNP.LD.PCM");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 9L,
                column: "ApproverRole",
                value: "QLNP.GD.PGD");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert full-form roles back to short form
            migrationBuilder.Sql("UPDATE LeaveConfigs SET ApproverRole = REPLACE(ApproverRole, 'QLNP.', '') WHERE ApproverRole LIKE 'QLNP.%'");

            migrationBuilder.AlterColumn<string>(
                name: "ApproverRole",
                table: "LeaveConfigs",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 1L,
                column: "ApproverRole",
                value: "LD.PCM");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 2L,
                column: "ApproverRole",
                value: "GD.PGD");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 3L,
                column: "ApproverRole",
                value: "LD.PCM");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 4L,
                column: "ApproverRole",
                value: "GD.PGD");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 5L,
                column: "ApproverRole",
                value: "LD.PCM");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 6L,
                column: "ApproverRole",
                value: "GD.PGD");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 7L,
                column: "ApproverRole",
                value: "LD.PCM");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 8L,
                column: "ApproverRole",
                value: "LD.PCM");

            migrationBuilder.UpdateData(
                table: "LeaveConfigs",
                keyColumn: "Id",
                keyValue: 9L,
                column: "ApproverRole",
                value: "GD.PGD");
        }
    }
}
