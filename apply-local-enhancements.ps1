# Bounded integration points for the recovered, minified frontend.
$ErrorActionPreference = 'Stop'
$path = Join-Path $PSScriptRoot 'assets/index-Ds5au_fa.js'
$script:bundle = [IO.File]::ReadAllText($path)
function Replace-Once([string]$Before, [string]$After) {
    $first = $script:bundle.IndexOf($Before)
    if ($first -lt 0 -or $script:bundle.IndexOf($Before, $first + $Before.Length) -ge 0) { throw "Expected one integration point: $Before" }
    $script:bundle = $script:bundle.Replace($Before, $After)
}
if (-not $script:bundle.StartsWith('import { createEnhancements }')) {
    Replace-Once 'var JO=[{key:`files`' 'const team467=createEnhancements({React:_,useWorkspace:Sw,useSession:jg,git:qO,changes:Lw,head:Nw,api:Q,notify:Sg});var JO=[{key:`pulls`,icon:wn,label:`Pull requests`},{key:`files`'
    Replace-Once 'let o=await qO(e,i,a);' 'let o=await team467.runCommand(e,i,a);'
    Replace-Once 'children:[l===`files`' 'children:[l===`pulls`&&(0,L.jsx)(team467.PullRequestSidebar,{busy:b,onCommand:P,onGuide:()=>{f(`terminal`);n([`Recommended: create your pull request in the terminal. Follow the blue command guide below.`,`Edit a file first if your branch has no changes. Click a suggested command, edit it, and press Enter.`],e)}}),l===`files`'
    Replace-Once 'f=`${(r||`student`).split(` `)[0].toLowerCase()}@team467:~/RobotCode$`;return' 'f=`${(r||`student`).split(` `)[0].toLowerCase()}@team467:~/RobotCode$`;(0,_.useEffect)(()=>{const fill=e=>{a(e.detail);requestAnimationFrame(()=>document.querySelector(`[data-team467-terminal]`)?.focus())};window.addEventListener(`team467:terminal-input`,fill);return()=>window.removeEventListener(`team467:terminal-input`,fill)},[]);return'
    Replace-Once 'd.length===0&&(0,L.jsx)(`p`,{className:`text-ink-faint`' '(0,L.jsx)(team467.TerminalGuide,{workspace:e}),d.length===0&&(0,L.jsx)(`p`,{className:`text-ink-faint`'
    Replace-Once 'value:i,onChange:e=>a(e.target.value),onKeyDown:e=>{if(e.key===`ArrowUp`)' '"data-team467-terminal":true,"aria-label":`Simulator terminal command`,value:i,onChange:e=>a(e.target.value),onKeyDown:e=>{if(e.key===`ArrowUp`)'
    Replace-Once 'Open the GitHub tab to compare and create a pull request.' 'Next: gh pr create --base main --title "Your title" --body "What changed and how you tested it". Or use Pull requests in the VS Code sidebar.'
    $script:bundle = "import { createEnhancements } from './team467-enhancements.js';`n" + $script:bundle
    [IO.File]::WriteAllText($path, $script:bundle, [Text.UTF8Encoding]::new($false))
}

$cssPath = Join-Path $PSScriptRoot 'assets/index-BObOBgAM.css'
$css = [IO.File]::ReadAllText($cssPath)
# Replace branding only; error, warning, and success colors retain their meanings.
$palette = @{
    '354 49% 57%'='217 91% 53%'; '353 56% 94%'='214 95% 93%'; '354 40% 32%'='221 70% 32%';
    '0 25% 98%'='214 60% 98%'; '0 25% 97%'='214 60% 96%';
    '199 91 102'='37 99 235'; '231 167 173'='147 197 253'; '248 230 232'='219 234 254';
    '168 69 79'='30 64 175'; '252 250 250'='248 250 255'; '251 249 249'='241 247 255';
    '#c75b66'='#2563eb'; '#e7a7ad'='#93c5fd'; '#f8e6e8'='#dbeafe'; '#a8454f'='#1e40af'; '#fcfafa'='#f8faff'; '#fbf9f9'='#f1f7ff'
}
foreach ($entry in $palette.GetEnumerator()) { $css = $css.Replace($entry.Key, $entry.Value) }
$css = $css.Replace('#FBF9F9', '#F1F7FF')
[IO.File]::WriteAllText($cssPath, $css, [Text.UTF8Encoding]::new($false))
