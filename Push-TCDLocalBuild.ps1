# Push the local TCD working tree to the staging branch, then smoke-test Railway.
# Run from PowerShell on the Windows machine that contains C:\DevTools\tcd_ecom_work.
# This intentionally does NOT force-push or update main/production.

[CmdletBinding()]
param(
    [string]$RepoPath = 'C:\DevTools\tcd_ecom_work',
    [string]$TargetBranch = 'staging/auth-google-2fa',
    [string]$StagingUrl = 'https://tcd-staging-production.up.railway.app'
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $RepoPath

function Invoke-Git {
    param([Parameter(Mandatory)][string[]]$GitArgs)
    & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') failed with exit code $LASTEXITCODE. No further push steps were run."
    }
}

function Get-GitText {
    param([Parameter(Mandatory)][string[]]$GitArgs)
    $value = & git @GitArgs
    if ($LASTEXITCODE -ne 0) {
        throw "git $($GitArgs -join ' ') failed with exit code $LASTEXITCODE."
    }
    return (($value | Out-String).Trim())
}

if (-not (Test-Path -LiteralPath (Join-Path $RepoPath '.git'))) {
    throw "Not a Git repository: $RepoPath"
}
if ((Get-GitText @('remote','get-url','origin')) -notmatch '^https://github\.com/tcdoverlord/talented-creative-design(?:\.git)?$') {
    throw 'The origin remote is not the expected tcdoverlord/talented-creative-design GitHub repository. Stopped for safety.'
}
$currentBranch = Get-GitText @('branch','--show-current')
if ($currentBranch -ne $TargetBranch) {
    throw "You are on branch '$currentBranch', not '$TargetBranch'. Switch to the intended staging branch and rerun. No files were committed or pushed."
}

Write-Host "Checking local TCD repo: $RepoPath" -ForegroundColor Cyan
Write-Host 'Fetching latest branch state from GitHub...'
Invoke-Git @('fetch','origin','--prune')

# Create verified online save points for BOTH main (production source) and staging
# before touching the local index or publishing any local changes.
$savepointStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$savepoints = @(
    @{ Source = 'main'; Backup = "backup/main-before-local-sync-$savepointStamp" },
    @{ Source = $TargetBranch; Backup = "backup/staging-before-local-sync-$savepointStamp" }
)
foreach ($savepoint in $savepoints) {
    $sourceRef = "refs/remotes/origin/$($savepoint.Source)"
    $sourceCommit = Get-GitText @('rev-parse',$sourceRef)
    Invoke-Git @('push','origin',"${sourceRef}:refs/heads/$($savepoint.Backup)")
    Invoke-Git @('fetch','origin',"refs/heads/$($savepoint.Backup):refs/remotes/origin/$($savepoint.Backup)")
    $backupCommit = Get-GitText @('rev-parse',"refs/remotes/origin/$($savepoint.Backup)")
    if ($backupCommit -ne $sourceCommit) {
        throw "Save-point verification failed for $($savepoint.Backup). Expected $sourceCommit but got $backupCommit. Stopped before local changes were pushed."
    }
    Write-Host "Verified online save point: $($savepoint.Backup) -> $backupCommit" -ForegroundColor Green
}

$localHead = Get-GitText @('rev-parse','HEAD')
$remoteHead = Get-GitText @('rev-parse',"origin/$TargetBranch")
if ($localHead -ne $remoteHead) {
    throw ("The local branch HEAD and GitHub staging HEAD differ, so I stopped instead of overwriting or rebasing anything.`r`n" +
        "Local:  $localHead`r`n" +
        "Remote: $remoteHead`r`n" +
        "Review with: git log --oneline --graph --decorate --all -20")
}

# Keep editor/recovery backups out of Git and out of the Docker build context.
$ignorePath = Join-Path $RepoPath '.gitignore'
$ignoreText = if (Test-Path -LiteralPath $ignorePath) { [System.IO.File]::ReadAllText($ignorePath) } else { '' }
if ($ignoreText -notmatch '(?m)^\*\.bak-\*$') {
    [System.IO.File]::AppendAllText($ignorePath, "`r`n# Local recovery copies; do not publish these`r`n*.bak`r`n*.bak-*`r`n", [System.Text.UTF8Encoding]::new($false))
}
$dockerIgnorePath = Join-Path $RepoPath '.dockerignore'
$dockerIgnoreText = if (Test-Path -LiteralPath $dockerIgnorePath) { [System.IO.File]::ReadAllText($dockerIgnorePath) } else { '' }
if ($dockerIgnoreText -notmatch '(?m)^\*\.bak-\*$') {
    [System.IO.File]::AppendAllText($dockerIgnorePath, "`r`n# Local recovery copies; do not bake these into images`r`n*.bak`r`n*.bak-*`r`n", [System.Text.UTF8Encoding]::new($false))
}

# Never allow a real .env file to be tracked by this sync.
# Use commands that return exit code 0 for an untracked path; avoid native stderr
# being promoted to a terminating PowerShell error under $ErrorActionPreference='Stop'.
$trackedEnv = Get-GitText @('ls-files','--','.env')
if ($trackedEnv -eq '.env') {
    throw '.env is already tracked by Git. Remove it from tracking and verify no secrets are exposed before syncing.'
}
$ignoredEnv = Get-GitText @('check-ignore','.env')
if ([string]::IsNullOrWhiteSpace($ignoredEnv)) {
    throw '.env is not ignored by .gitignore. Stopped to avoid publishing environment secrets.'
}

Write-Host 'Running the project syntax checks...'
Invoke-Git @('status','--short')
& npm run check
if ($LASTEXITCODE -ne 0) {
    throw 'npm run check failed. Fix the reported errors before pushing.'
}

Write-Host 'Staging local source changes (recovery backups and .env remain excluded)...'
Invoke-Git @('add','-A')
$stagedNames = Get-GitText @('diff','--cached','--name-only')
$stagedPaths = @($stagedNames -split "`r?`n" | Where-Object { $_ })
if ($stagedPaths.Count -eq 0) {
    Write-Host 'Nothing to commit; the staging branch already matches this working tree.' -ForegroundColor Yellow
    exit 0
}
$unsafePaths = @($stagedPaths | Where-Object { $_ -match '(^|/)\.env$|\.bak(?:-|$)|(^|/)node_modules/' })
if ($unsafePaths.Count -gt 0) {
    throw "Unsafe files were staged; nothing was committed or pushed: $($unsafePaths -join ', ')"
}

# Scan staged additions/changes for common live credential signatures.
$stagedDiff = (& git diff --cached --unified=0 | Out-String)
if ($LASTEXITCODE -ne 0) { throw 'Could not review the staged diff.' }
$credentialPattern = '(?i)(sk_live_[A-Za-z0-9]{12,}|whsec_[A-Za-z0-9]{12,}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)'
if ($stagedDiff -match $credentialPattern) {
    throw 'A possible live credential signature was found in the staged diff. Review staged files before pushing.'
}

Write-Host "Files staged: $($stagedPaths.Count)" -ForegroundColor Cyan
Invoke-Git @('diff','--cached','--stat')
$answer = Read-Host 'Commit these local repo changes and push to the staging branch? Type PUSH to continue'
if ($answer -cne 'PUSH') {
    Write-Host 'Cancelled. The files are staged locally but nothing has been committed or pushed.' -ForegroundColor Yellow
    exit 0
}

# Online save points for main and staging were created and verified above.

$commitMessage = 'Sync local TCD website build and Cam Model Profile Builder member perk'
Invoke-Git @('commit','-m',$commitMessage)
$commit = Get-GitText @('rev-parse','HEAD')
Invoke-Git @('push','origin',"HEAD:refs/heads/${TargetBranch}")
Invoke-Git @('fetch','origin')
$remoteAfterPush = Get-GitText @('rev-parse',"origin/$TargetBranch")
if ($remoteAfterPush -ne $commit) {
    throw "GitHub branch verification failed. Local commit $commit but remote branch is $remoteAfterPush."
}
Write-Host "Push verified: $commit" -ForegroundColor Green
Write-Host "Commit URL: https://github.com/tcdoverlord/talented-creative-design/commit/$commit"
Write-Host "Staging branch: https://github.com/tcdoverlord/talented-creative-design/tree/$TargetBranch"

# Check Railway only after the branch push. Match the new perk marker as well as health
# so an older still-running deployment cannot be mistaken for the new build.
Write-Host 'Waiting for the staging deploy to expose the new member perk and healthy database...'
$deployReady = $false
$lastProblem = 'The new Cam Model Profile Builder marker has not appeared yet.'
for ($attempt = 1; $attempt -le 18; $attempt++) {
    try {
        $health = Invoke-RestMethod -Uri "$($StagingUrl.TrimEnd('/'))/api/health" -TimeoutSec 10
        $page = Invoke-WebRequest -Uri "$($StagingUrl.TrimEnd('/'))/cam-guides.html" -TimeoutSec 10 -UseBasicParsing
        $healthOK = ($health.status -eq 'ok' -and $health.database -eq 'connected')
        $perkOK = ($page.StatusCode -eq 200 -and $page.Content.Contains('TCD ACCOUNT PERK'))
        if ($healthOK -and $perkOK) {
            $deployReady = $true
            break
        }
        $lastProblem = "Health status=$($health.status), database=$($health.database), perk marker=$perkOK."
    } catch {
        $lastProblem = $_.Exception.Message
    }
    Start-Sleep -Seconds 5
}
if (-not $deployReady) {
    throw "The GitHub push succeeded, but staging did not pass deployment smoke checks yet. $lastProblem Check Railway deploy logs; do not promote to production until staging is healthy."
}

# Verify anonymous users cannot fetch the protected builder HTML.
$handler = [System.Net.Http.HttpClientHandler]::new()
$handler.AllowAutoRedirect = $false
$client = [System.Net.Http.HttpClient]::new($handler)
try {
    $builderResponse = $client.GetAsync("$($StagingUrl.TrimEnd('/'))/cam-model-profile-builder.html").GetAwaiter().GetResult()
    $location = [string]$builderResponse.Headers.Location
    if ([int]$builderResponse.StatusCode -ne 302 -or $location -notmatch '^/login\.html\?next=') {
        throw "Access-control smoke test failed: anonymous builder request returned HTTP $([int]$builderResponse.StatusCode), Location='$location'."
    }
    $privateProbe = $client.GetAsync("$($StagingUrl.TrimEnd('/'))/private/cam-model-profile-builder.html").GetAwaiter().GetResult()
    if ([int]$privateProbe.StatusCode -ne 404) {
        throw "Private-file exposure probe expected 404 but got HTTP $([int]$privateProbe.StatusCode)."
    }
} finally {
    $client.Dispose()
    $handler.Dispose()
}

Write-Host ''
Write-Host 'PASS: GitHub push verified; staging /api/health reports database connected; Cam Creator page contains the member perk; logged-out access to the builder redirects to login; /private/ is not publicly served.' -ForegroundColor Green
Write-Host 'Manual final check: sign in on staging, open Account -> Cam Model Profile Builder, then test Copy HTML and Download HTML.' -ForegroundColor Yellow
Write-Host 'Production main was not changed.' -ForegroundColor Cyan
