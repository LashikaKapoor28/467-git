param([int]$Port = 4670)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$root = $PSScriptRoot
$origin = 'https://team467-git.base44.app'
$handler = New-Object System.Net.Http.HttpClientHandler
$handler.AllowAutoRedirect = $false
$handler.UseCookies = $false
$client = New-Object System.Net.Http.HttpClient($handler)
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Team 467 GitLab: http://localhost:$Port/"
Write-Host 'Using the original Base44 backend. Press Ctrl+C to stop.'

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $upstream = $null
        $message = $null
        try {
            $path = [Uri]::UnescapeDataString($request.Url.AbsolutePath)
            $file = [IO.Path]::GetFullPath((Join-Path $root $path.TrimStart('/')))
            $withinRoot = $file.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)
            $isAsset = $path.StartsWith('/assets/') -or $path -eq '/manifest.json'
            $isRemote = $path.StartsWith('/api/') -or $path.StartsWith('/static/') -or $path -eq '/login' -or $path.StartsWith('/ws-user-apps/')
            if ($isRemote) {
                $message = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::new($request.HttpMethod), ($origin + $request.RawUrl))
                if ($request.HasEntityBody) {
                    $body = New-Object IO.MemoryStream
                    $request.InputStream.CopyTo($body)
                    $message.Content = New-Object System.Net.Http.ByteArrayContent(,$body.ToArray())
                    $body.Dispose()
                }
                foreach ($name in $request.Headers.AllKeys) {
                    if ($name -in @('Host','Connection','Content-Length','Accept-Encoding','Origin','Referer')) { continue }
                    if (-not $message.Headers.TryAddWithoutValidation($name, $request.Headers[$name]) -and $null -ne $message.Content) {
                        [void]$message.Content.Headers.TryAddWithoutValidation($name, $request.Headers[$name])
                    }
                }
                [void]$message.Headers.TryAddWithoutValidation('Origin', $origin)
                [void]$message.Headers.TryAddWithoutValidation('Referer', "$origin/")
                $upstream = $client.SendAsync($message).GetAwaiter().GetResult()
                $response.StatusCode = [int]$upstream.StatusCode
                foreach ($header in $upstream.Headers) {
                    if ($header.Key -in @('Transfer-Encoding','Connection','Keep-Alive','Content-Length')) { continue }
                    foreach ($value in $header.Value) { $response.AppendHeader($header.Key, $value) }
                }
                foreach ($header in $upstream.Content.Headers) {
                    if ($header.Key -eq 'Content-Length') { continue }
                    $response.Headers[$header.Key] = $header.Value -join ', '
                }
                $bytes = $upstream.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
            } elseif ($isAsset) {
                if (-not $withinRoot -or -not [IO.File]::Exists($file)) {
                    $response.StatusCode = 404
                    $bytes = [Text.Encoding]::UTF8.GetBytes('Not found')
                } else {
                    $types = @{ '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json'; '.html'='text/html; charset=utf-8' }
                    $response.ContentType = $types[[IO.Path]::GetExtension($file)]
                    $bytes = [IO.File]::ReadAllBytes($file)
                }
            } else {
                $response.ContentType = 'text/html; charset=utf-8'
                $bytes = [IO.File]::ReadAllBytes((Join-Path $root 'index.html'))
            }
            $response.ContentLength64 = $bytes.Length
            if ($request.HttpMethod -ne 'HEAD') { $response.OutputStream.Write($bytes, 0, $bytes.Length) }
        } catch {
            $response.StatusCode = 502
            $bytes = [Text.Encoding]::UTF8.GetBytes('The local server could not reach Base44. Check your internet connection and try again.')
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Warning $_.Exception.Message
        } finally {
            $response.Close()
            if ($null -ne $upstream) { $upstream.Dispose() }
            if ($null -ne $message) { $message.Dispose() }
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
    $client.Dispose()
}
