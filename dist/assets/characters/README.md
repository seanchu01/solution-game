# Character Art Assets

## File Naming Convention

Character art files should be named using the following convention to allow the game engine to dynamically select the correct image based on player choices:

`{species}_{guild}_{work_experience_related}.png`

### Parameters:

- **`{species}`**: Corresponds to the `id` chosen for "educational background" (species)
  - `business` - Griffin (Business / Law)
  - `engineering` - Dwarf (Engineering / Mechanics)  
  - `it` - Mech (IT / Computer Science)
  - `arts` - Elf (Creative Arts / Design)
  - `music` - Siren (Music / Performance)
  - `health` - Druid (Healthcare / Nursing)
  - `education` - Owlkin (Education / Social Science)
  - `science` - Golem (Science / Research)
  - `other` - Mystic (Other)

- **`{guild}`**: Corresponds to the `id` chosen for "work experience field" (guild)
  - `admin_sales` - Admin/Sales Guild
  - `healthcare` - Healthcare Guild
  - `engineering` - Engineering Guild
  - `retail` - Retail Guild
  - `hospitality` - Hospitality Guild
  - `teaching` - Teaching Guild
  - `government` - Government Guild
  - `other` - Other Guild
  - `no_guild` - When work experience is 0 or related to education

- **`{work_experience_related}`**: 
  - `related` - When work experience is related to educational background
  - `unrelated` - When work experience is NOT related to educational background
  - `no_work_exp` - When there is 0 years of work experience

## Examples:

- `business_admin_sales_related.png` (Business background, Admin/Sales work, related)
- `engineering_engineering_related.png` (Engineering background, Engineering work, related)
- `it_healthcare_unrelated.png` (IT background, Healthcare work, unrelated)
- `arts_no_guild_no_work_exp.png` (Arts background, 0 years work experience)
- `science_teaching_unrelated.png` (Science background, Teaching work, unrelated)

## Art Specifications:

- **Format**: PNG with transparent background
- **Size**: 400x400px recommended (will be scaled as needed)
- **Style**: RPG/fantasy character art that matches the species theme
- **Quality**: High resolution for crisp display on mobile devices

## Integration:

Once you add the art files to this directory with the correct naming convention, the game will automatically display the appropriate character art based on the player's choices during character creation.

The placeholder in the character card will be replaced with the actual image when the corresponding file exists.