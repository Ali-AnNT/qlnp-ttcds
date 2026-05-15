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
                value: "QTHT");

            migrationBuilder.InsertData(
                table: "UserRoles",
                columns: new[] { "UserId", "Role" },
                values: new object[,]
                {
                    { 2L, "CB.PCM" },
                    { 3L, "LD.PCM" },
                    { 4L, "GD.PGD" }
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
                onDelete: ReferentialAction.SetNull);
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

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "UserId",
                keyValue: 1L,
                column: "Role",
                value: "quantri");
        }
    }
}
