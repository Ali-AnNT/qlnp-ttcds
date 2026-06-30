using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace QLNP.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class DropUserRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserRoles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_UserRoles_USER_MASTER_UserId",
                        column: x => x.UserId,
                        principalTable: "USER_MASTER",
                        principalColumn: "User_MasterID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "UserRoles",
                columns: new[] { "UserId", "Role" },
                values: new object[,]
                {
                    { 1L, "QLNP.QTHT" },
                    { 2L, "QLNP.CB.PCM" },
                    { 3L, "QLNP.LD.PCM" },
                    { 4L, "QLNP.GD.PGD" }
                });
        }
    }
}
