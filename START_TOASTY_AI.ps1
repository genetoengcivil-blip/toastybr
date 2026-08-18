$proxyPath = "D:\ollama-proxy"
$projectPath = "D:\ToastyOs"

Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-NoProfile",
    "-Command",
    "cd '$proxyPath'; py -m uvicorn proxy:app --host 127.0.0.1 --port 11435"
)

Start-Sleep -Seconds 2

Set-Location $projectPath

opencode