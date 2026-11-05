# Starts a program, lets it settle, then sums memory over it and every process
# it started (Electron's helpers, WebView2's browser/GPU/renderer processes).
# Used by CI to compare the Electron app with the Tauri test on the same machine.
param(
  [Parameter(Mandatory)] [string] $Label,
  [Parameter(Mandatory)] [string] $Exe,
  [string[]] $Arguments = @(),
  [string] $WorkDir = (Get-Location).Path,
  [int] $SettleSeconds = 30
)

$start = Get-Date
$p = if ($Arguments.Count) {
  Start-Process -FilePath $Exe -ArgumentList $Arguments -WorkingDirectory $WorkDir -PassThru
} else {
  Start-Process -FilePath $Exe -WorkingDirectory $WorkDir -PassThru
}
Start-Sleep -Seconds $SettleSeconds

$all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, WorkingSetSize, PrivatePageCount
$tree = [System.Collections.Generic.List[int]]::new()
$tree.Add($p.Id)
for ($i = 0; $i -lt $tree.Count; $i++) {
  foreach ($c in $all | Where-Object { $_.ParentProcessId -eq $tree[$i] }) {
    if (-not $tree.Contains([int]$c.ProcessId)) { $tree.Add([int]$c.ProcessId) }
  }
}
$procs = $all | Where-Object { $tree.Contains([int]$_.ProcessId) }
$ws = [math]::Round((($procs | Measure-Object WorkingSetSize -Sum).Sum) / 1MB)
$priv = [math]::Round((($procs | Measure-Object PrivatePageCount -Sum).Sum) / 1MB)
$names = ($procs | Group-Object Name | ForEach-Object { "$($_.Count)x $($_.Name)" }) -join ', '

$line = "| $Label | $($procs.Count) | $ws MB | $priv MB | $names |"
Write-Host $line
if ($env:GITHUB_STEP_SUMMARY) { Add-Content -Path $env:GITHUB_STEP_SUMMARY -Value $line }

foreach ($id in $tree) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
