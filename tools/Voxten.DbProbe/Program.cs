using Microsoft.Data.SqlClient;

const string connectionString = "Server=localhost;Database=tdb;User ID=SA;Password=12345Qwerty!;TrustServerCertificate=True;";

await using var connection = new SqlConnection(connectionString);
await connection.OpenAsync();

if (args.Contains("--repair-ssn", StringComparer.OrdinalIgnoreCase))
{
    const string repairSql = """
    DECLARE @OldSsnPattern NVARCHAR(200) = '\\b\\d{3}[\\-\\s]\\d{2}[\\-\\s]\\d{4}\\b';
    DECLARE @NewSsnPattern NVARCHAR(200) = '(?<!\\d)\\d{3}(?:[\\-\\s]?\\d{2}[\\-\\s]?\\d{4})(?!\\d)';

    DECLARE @OldBulkSsnPattern NVARCHAR(300) = '(?:(?:\\b\\d{3}[\\-\\s]\\d{2}[\\-\\s]\\d{4}\\b).*?){2,}';
    DECLARE @NewBulkSsnPattern NVARCHAR(300) = '(?:(?:(?<!\\d)\\d{3}(?:[\\-\\s]?\\d{2}[\\-\\s]?\\d{4})(?!\\d)).*?){2,}';

    UPDATE PatternLibraries
    SET PatternsJson = REPLACE(PatternsJson, @OldSsnPattern, @NewSsnPattern)
    WHERE Id IN (N'HIPAA-PHI-v1', N'HIPAA-COMMS-PHI-v1');

    UPDATE PatternLibraries
    SET PatternsJson = REPLACE(PatternsJson, @OldBulkSsnPattern, @NewBulkSsnPattern)
    WHERE Id IN (N'HIPAA-PHI-BULK-v1', N'HIPAA-COMMS-PHI-BULK-v1');
    """;

    await using var repairCommand = new SqlCommand(repairSql, connection);
    var affected = await repairCommand.ExecuteNonQueryAsync();
    Console.WriteLine($"Repair applied. Rows affected: {affected}");
}

const string inspectSql = """
SELECT Id, PatternsJson
FROM PatternLibraries
WHERE Id IN (N'HIPAA-PHI-v1', N'HIPAA-COMMS-PHI-v1', N'HIPAA-PHI-BULK-v1', N'HIPAA-COMMS-PHI-BULK-v1');
""";

await using var inspectCommand = new SqlCommand(inspectSql, connection);
await using var reader = await inspectCommand.ExecuteReaderAsync();

while (await reader.ReadAsync())
{
    var id = reader.GetString(0);
    var patternsJson = reader.GetString(1);
    Console.WriteLine($"[{id}]");
    Console.WriteLine(patternsJson);
    Console.WriteLine();
}
