# Ending Art Naming Convention

Ending art files should be named using the following convention to allow the game engine to dynamically select the correct image based on the player's ending type:

`ending_{stat_type}.png`

- **`{stat_type}`**: Corresponds to the ending type based on the player's dominant stat:
  - `strategic` - For Knowledge-dominant players (Strategic Scholar, Knowledge Seeker, etc.)
  - `adventurous` - For Courage-dominant players (Adventurous Pioneer, Bold Leader, etc.)
  - `serendipity` - For Luck-dominant players (Fortunate Wanderer, Lucky Charm, etc.)
  - `harmonious` - For balanced players (Harmonious Explorer)

## Examples:

- `ending_strategic.png` (Knowledge-dominant ending)
- `ending_adventurous.png` (Courage-dominant ending)
- `ending_serendipity.png` (Luck-dominant ending)
- `ending_harmonious.png` (Balanced ending)

## Art Guidelines:

- **Size**: Recommended 400x300px or similar aspect ratio
- **Style**: Should match the overall game aesthetic
- **Content**: Should visually represent the ending type and journey completion
- **Format**: PNG with transparency support preferred

