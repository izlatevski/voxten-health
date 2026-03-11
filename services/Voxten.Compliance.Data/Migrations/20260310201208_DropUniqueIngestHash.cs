using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Voxten.Compliance.Data.Migrations
{
    /// <inheritdoc />
    public partial class DropUniqueIngestHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // IngestHash is a SHA-256 of message content only, so identical messages
            // sent at different times produce the same hash. The unique constraint is wrong.
            migrationBuilder.DropIndex(
                name: "IX_Messages_IngestHash",
                table: "Messages");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_IngestHash",
                table: "Messages",
                column: "IngestHash",
                unique: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Messages_IngestHash",
                table: "Messages");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_IngestHash",
                table: "Messages",
                column: "IngestHash",
                unique: true);
        }
    }
}
