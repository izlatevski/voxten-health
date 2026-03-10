using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Voxten.Compliance.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialComplianceSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Messages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceChannel = table.Column<int>(type: "int", nullable: false),
                    Direction = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SenderId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    SenderRawAddress = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    SenderRole = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    RecipientsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ContentBlobRef = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    AttachmentsMetaJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IngestHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    ThreadId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    MessageTimestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IngestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RetainUntil = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Messages", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PatternLibraries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PatternsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatternLibraries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RulePacks",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Sector = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    RetentionDays = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RulePacks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MessageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OverallVerdict = table.Column<int>(type: "int", nullable: false),
                    MaxViolationSeverity = table.Column<int>(type: "int", nullable: true),
                    TotalRulesEvaluated = table.Column<int>(type: "int", nullable: false),
                    ViolationCount = table.Column<int>(type: "int", nullable: false),
                    UncertainCount = table.Column<int>(type: "int", nullable: false),
                    CompliantCount = table.Column<int>(type: "int", nullable: false),
                    IngestHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    EvaluationHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    EvaluationSignature = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SigningKeyId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    EngineVersion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    RuleVersionsSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDisclosure = table.Column<bool>(type: "bit", nullable: false),
                    RetainUntil = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditRecords_Messages_MessageId",
                        column: x => x.MessageId,
                        principalTable: "Messages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EvaluationResults",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MessageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RuleLogicalId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RuleVersion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EvalLane = table.Column<int>(type: "int", nullable: false),
                    Verdict = table.Column<int>(type: "int", nullable: false),
                    ViolationSeverity = table.Column<int>(type: "int", nullable: true),
                    Confidence = table.Column<double>(type: "float", nullable: true),
                    IsDegradedMode = table.Column<bool>(type: "bit", nullable: false),
                    DegradedReason = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    EvidenceJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AiPromptBlobRef = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AiResponseBlobRef = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EngineVersion = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ModelVersion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EvaluationLatencyMs = table.Column<int>(type: "int", nullable: false),
                    EvaluatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EvaluationResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EvaluationResults_Messages_MessageId",
                        column: x => x.MessageId,
                        principalTable: "Messages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MessageActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MessageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TriggeredByEvaluationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ActionType = table.Column<int>(type: "int", nullable: false),
                    Channel = table.Column<int>(type: "int", nullable: false),
                    ActionDetailJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Succeeded = table.Column<bool>(type: "bit", nullable: false),
                    FailureReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ExecutedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MessageActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MessageActions_Messages_MessageId",
                        column: x => x.MessageId,
                        principalTable: "Messages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Rules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LogicalId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Version = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Category = table.Column<int>(type: "int", nullable: false),
                    EvalType = table.Column<int>(type: "int", nullable: false),
                    DefaultSeverity = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    PackId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EffectiveDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeprecatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ScopeJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LogicJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DefaultActionsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExemptionsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChangelogJson = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Rules_RulePacks_PackId",
                        column: x => x.PackId,
                        principalTable: "RulePacks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditRecords_CreatedAt",
                table: "AuditRecords",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_AuditRecords_IngestHash",
                table: "AuditRecords",
                column: "IngestHash");

            migrationBuilder.CreateIndex(
                name: "IX_AuditRecords_IsDisclosure",
                table: "AuditRecords",
                column: "IsDisclosure");

            migrationBuilder.CreateIndex(
                name: "IX_AuditRecords_MessageId",
                table: "AuditRecords",
                column: "MessageId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AuditRecords_OverallVerdict",
                table: "AuditRecords",
                column: "OverallVerdict");

            migrationBuilder.CreateIndex(
                name: "IX_AuditRecords_RetainUntil",
                table: "AuditRecords",
                column: "RetainUntil");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationResults_EvaluatedAt",
                table: "EvaluationResults",
                column: "EvaluatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationResults_MessageId",
                table: "EvaluationResults",
                column: "MessageId");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationResults_RuleLogicalId",
                table: "EvaluationResults",
                column: "RuleLogicalId");

            migrationBuilder.CreateIndex(
                name: "IX_EvaluationResults_Verdict",
                table: "EvaluationResults",
                column: "Verdict");

            migrationBuilder.CreateIndex(
                name: "IX_MessageActions_ActionType",
                table: "MessageActions",
                column: "ActionType");

            migrationBuilder.CreateIndex(
                name: "IX_MessageActions_MessageId",
                table: "MessageActions",
                column: "MessageId");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_IngestedAt",
                table: "Messages",
                column: "IngestedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_IngestHash",
                table: "Messages",
                column: "IngestHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Messages_RetainUntil",
                table: "Messages",
                column: "RetainUntil");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_SourceChannel",
                table: "Messages",
                column: "SourceChannel");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_Status",
                table: "Messages",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Rules_Category",
                table: "Rules",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Rules_PackId",
                table: "Rules",
                column: "PackId");

            migrationBuilder.CreateIndex(
                name: "IX_Rules_Status",
                table: "Rules",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "UX_Rules_LogicalId_Active",
                table: "Rules",
                column: "LogicalId",
                unique: true,
                filter: "[IsActive] = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditRecords");

            migrationBuilder.DropTable(
                name: "EvaluationResults");

            migrationBuilder.DropTable(
                name: "MessageActions");

            migrationBuilder.DropTable(
                name: "PatternLibraries");

            migrationBuilder.DropTable(
                name: "Rules");

            migrationBuilder.DropTable(
                name: "Messages");

            migrationBuilder.DropTable(
                name: "RulePacks");
        }
    }
}
