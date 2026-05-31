function Add-Timestamp ($filePath) {
    $content = Get-Content $filePath -Raw
    $content = $content -replace 'fetch\("(/api/[^"?]+)"\)', 'fetch("$1?t=${Date.now()}")'
    $content = $content -replace 'fetch\("(/api/[^"?]+)\?([^"]+)"\)', 'fetch("$1?$2&t=${Date.now()}")'
    Set-Content -Path $filePath -Value $content -Encoding UTF8
}

Add-Timestamp "app/menu/page.tsx"
Add-Timestamp "app/travel/page.tsx"
Add-Timestamp "app/books/page.tsx"
Add-Timestamp "app/page.tsx"
