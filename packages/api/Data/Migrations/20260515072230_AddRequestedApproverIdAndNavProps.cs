using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace QLNP.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestedApproverIdAndNavProps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "UserRoles",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(10)",
                oldMaxLength: 10);

            migrationBuilder.AddColumn<long>(
                name: "RequestedApproverId",
                table: "LeaveRequests",
                type: "bigint",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "UserId",
                keyValue: 1L,
                column: "Role",
                value: "QLNP.QTHT");

            migrationBuilder.InsertData(
                table: "UserRoles",
                columns: new[] { "UserId", "Role" },
                values: new object[,]
                {
                    { 2L, "QLNP.CB.PCM" },
                    { 3L, "QLNP.LD.PCM" },
                    { 4L, "QLNP.GD.PGD" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequests_RequestedApproverId",
                table: "LeaveRequests",
                column: "RequestedApproverId");

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveRequests_USER_MASTER_RequestedApproverId",
                table: "LeaveRequests",
                column: "RequestedApproverId",
                principalTable: "USER_MASTER",
                principalColumn: "User_MasterID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LeaveRequests_USER_MASTER_RequestedApproverId",
                table: "LeaveRequests");

            migrationBuilder.DropIndex(
                name: "IX_LeaveRequests_RequestedApproverId",
                table: "LeaveRequests");

            migrationBuilder.DeleteData(
                table: "UserRoles",
                keyColumn: "UserId",
                keyValue: 2L);

            migrationBuilder.DeleteData(
                table: "UserRoles",
                keyColumn: "UserId",
                keyValue: 3L);

            migrationBuilder.DeleteData(
                table: "UserRoles",
                keyColumn: "UserId",
                keyValue: 4L);

            migrationBuilder.DropColumn(
                name: "RequestedApproverId",
                table: "LeaveRequests");

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "UserRoles",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "UserId",
                keyValue: 1L,
                column: "Role",
                value: "quantri");
        }
    }
}
