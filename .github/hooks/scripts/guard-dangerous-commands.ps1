$inputJson = $input | ConvertFrom-Json -ErrorAction SilentlyContinue
$tool = $inputJson.tool_name
$cmd = if ($inputJson.tool_input.command) { $inputJson.tool_input.command } else { "" }

$dangerous = @(
    "prisma migrate reset",
    "db push --force-reset",
    "DROP TABLE",
    "DELETE FROM",
    "git push --force",
    "git reset --hard",
    "git clean -fd",
    "rm -rf"
)

foreach ($d in $dangerous) {
    if ($cmd -like "*$d*") {
        $out = @{
            hookSpecificOutput = @{
                hookEventName = "PreToolUse"
                permissionDecision = "ask"
                permissionDecisionReason = "TWENTY2CRM Guardian: הפקודה '$cmd' זוהתה כמסוכנת ועלולה לגרום נזק בלתי הפיך. אשר במפורש כדי להמשיך."
            }
        } | ConvertTo-Json -Depth 5
        Write-Output $out
        exit 0
    }
}

Write-Output '{"continue": true}'
exit 0
