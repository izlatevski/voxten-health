using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Voxten.Compliance.Data;

#nullable disable

namespace Voxten.Compliance.Data.Migrations
{
    [DbContext(typeof(ComplianceDbContext))]
    [Migration("20260314112000_AddSenderDisplayNameToCanonicalMessage")]
    public partial class AddSenderDisplayNameToCanonicalMessage : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SenderDisplayName",
                table: "Messages",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SenderDisplayName",
                table: "Messages");
        }
    }
}
