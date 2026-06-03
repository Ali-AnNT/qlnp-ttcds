using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLNP.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class DropUserMasterForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop foreign keys referencing USER_MASTER
            // (navigation properties removed from domain entities; UserMaster is read-only system table)
            migrationBuilder.DropForeignKey(
                name: "FK_LeaveBalances_USER_MASTER_UserId",
                table: "LeaveBalances");

            migrationBuilder.DropForeignKey(
                name: "FK_LeaveRequestAudits_USER_MASTER_ChangedBy",
                table: "LeaveRequestAudits");

            migrationBuilder.DropForeignKey(
                name: "FK_LeaveRequests_USER_MASTER_ApprovedBy",
                table: "LeaveRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_LeaveRequests_USER_MASTER_RequestedApproverId",
                table: "LeaveRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_LeaveRequests_USER_MASTER_UserId",
                table: "LeaveRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_UserRoles_USER_MASTER_UserId",
                table: "UserRoles");

            // Drop indexes that existed only to support the removed FK columns
            migrationBuilder.DropIndex(
                name: "IX_LeaveRequests_ApprovedBy",
                table: "LeaveRequests");

            migrationBuilder.DropIndex(
                name: "IX_LeaveRequests_RequestedApproverId",
                table: "LeaveRequests");

            migrationBuilder.DropIndex(
                name: "IX_LeaveRequestAudits_ChangedBy",
                table: "LeaveRequestAudits");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequests_ApprovedBy",
                table: "LeaveRequests",
                column: "ApprovedBy");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequests_RequestedApproverId",
                table: "LeaveRequests",
                column: "RequestedApproverId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveRequestAudits_ChangedBy",
                table: "LeaveRequestAudits",
                column: "ChangedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveBalances_USER_MASTER_UserId",
                table: "LeaveBalances",
                column: "UserId",
                principalTable: "USER_MASTER",
                principalColumn: "User_MasterID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveRequestAudits_USER_MASTER_ChangedBy",
                table: "LeaveRequestAudits",
                column: "ChangedBy",
                principalTable: "USER_MASTER",
                principalColumn: "User_MasterID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveRequests_USER_MASTER_ApprovedBy",
                table: "LeaveRequests",
                column: "ApprovedBy",
                principalTable: "USER_MASTER",
                principalColumn: "User_MasterID");

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveRequests_USER_MASTER_RequestedApproverId",
                table: "LeaveRequests",
                column: "RequestedApproverId",
                principalTable: "USER_MASTER",
                principalColumn: "User_MasterID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveRequests_USER_MASTER_UserId",
                table: "LeaveRequests",
                column: "UserId",
                principalTable: "USER_MASTER",
                principalColumn: "User_MasterID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserRoles_USER_MASTER_UserId",
                table: "UserRoles",
                column: "UserId",
                principalTable: "USER_MASTER",
                principalColumn: "User_MasterID",
                onDelete: ReferentialAction.Restrict);
        }
    }
}