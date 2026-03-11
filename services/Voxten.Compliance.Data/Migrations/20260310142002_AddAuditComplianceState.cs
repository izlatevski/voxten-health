using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Voxten.Compliance.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditComplianceState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ComplianceState",
                table: "AuditRecords",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_AuditRecords_ComplianceState",
                table: "AuditRecords",
                column: "ComplianceState");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AuditRecords_ComplianceState",
                table: "AuditRecords");

            migrationBuilder.DropColumn(
                name: "ComplianceState",
                table: "AuditRecords");
        }
    }
}
