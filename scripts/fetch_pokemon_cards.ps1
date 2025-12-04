# Pokemon TCG API Card Data Fetcher (Simple Version)
# Fetches a limited number of cards for testing

$baseUrl = "https://api.pokemontcg.io/v2"
$outputJsonPath = "C:\repo\pokelog\data\pokemon_cards.json"
$outputCsvPath = "C:\repo\pokelog\data\pokemon_cards.csv"

Write-Host "Pokemon TCG Card Data Fetcher"
Write-Host "=============================="
Write-Host ""

# Fetch first page only (for testing)
$page = 1
$pageSize = 250

Write-Host "Fetching cards from Pokemon TCG API..."

try {
    $url = "$baseUrl/cards?page=$page&pageSize=$pageSize"
    Write-Host "Request URL: $url"
    
    $response = Invoke-RestMethod -Uri $url -Method Get
    
    $cards = $response.data
    $totalCount = $response.totalCount
    
    Write-Host "Fetched: $($cards.Count) cards"
    Write-Host "Total available: $totalCount cards"
    Write-Host ""
    
    # Extract card information
    $cardInfoList = @()
    
    foreach ($card in $cards) {
        $cardInfo = [PSCustomObject]@{
            id = if ($card.id) { $card.id } else { "" }
            name = if ($card.name) { $card.name } else { "" }
            set_name = if ($card.set.name) { $card.set.name } else { "" }
            set_id = if ($card.set.id) { $card.set.id } else { "" }
            number = if ($card.number) { $card.number } else { "" }
            image_small = if ($card.images.small) { $card.images.small } else { "" }
            image_large = if ($card.images.large) { $card.images.large } else { "" }
            supertype = if ($card.supertype) { $card.supertype } else { "" }
            subtypes = if ($card.subtypes) { ($card.subtypes -join ", ") } else { "" }
            hp = if ($card.hp) { $card.hp } else { "" }
            types = if ($card.types) { ($card.types -join ", ") } else { "" }
        }
        $cardInfoList += $cardInfo
    }
    
    # Save to JSON file
    Write-Host "Saving to JSON..."
    $jsonContent = $cardInfoList | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText($outputJsonPath, $jsonContent, [System.Text.Encoding]::UTF8)
    Write-Host "Saved to: $outputJsonPath"
    
    # Save to CSV file
    Write-Host "Saving to CSV..."
    $cardInfoList | Export-Csv -Path $outputCsvPath -NoTypeInformation -Encoding UTF8
    Write-Host "Saved to: $outputCsvPath"
    
    # Display sample
    Write-Host ""
    Write-Host "Sample Cards (First 5):"
    Write-Host "-----------------------"
    
    for ($i = 0; $i -lt [Math]::Min(5, $cardInfoList.Count); $i++) {
        $card = $cardInfoList[$i]
        Write-Host ""
        Write-Host "$($i+1). $($card.name)"
        Write-Host "   Set: $($card.set_name) #$($card.number)"
        Write-Host "   ID: $($card.id)"
        Write-Host "   Small Image: $($card.image_small)"
        Write-Host "   Large Image: $($card.image_large)"
    }
    
    Write-Host ""
    Write-Host "Success! Total cards in file: $($cardInfoList.Count)"
    
} catch {
    Write-Host "Error: $_"
    Write-Host "Exception: $($_.Exception.Message)"
}
