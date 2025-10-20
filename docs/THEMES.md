# Adding New Themes

The Initiative Tracker supports custom themes. Here's how to add a new one:

## Quick Start

1. **Create a new CSS file** named `theme-yourtheme.css`

2. **Add a theme comment** at the top:
   ```css
   /* THEME: Your Theme Name */
   ```

3. **Override CSS variables** to customize the look:
   ```css
   :root {
       --bg-primary: #your-color;
       --bg-secondary: #your-color;
       /* ... etc */
   }
   ```

4. **Register your theme** in `script.js`:
   - Find the `setupThemes()` method (around line 363)
   - Add your theme to the `availableThemes` array:
   ```javascript
   const availableThemes = [
       { file: 'theme-mork-borg.css', name: 'Mörk Borg' },
       { file: 'theme-yourtheme.css', name: 'Your Theme Name' }
   ];
   ```

## Available CSS Variables

You can override any of these in your theme file:

### Colors
- `--bg-primary` - Main background color
- `--bg-secondary` - Secondary background color
- `--card-bg` - Card background
- `--card-border` - Card border color
- `--text-primary` - Primary text color
- `--text-secondary` - Secondary text color
- `--accent-primary` - Primary accent color
- `--accent-secondary` - Secondary accent color

### Shadows & Effects
- `--card-shadow` - Card shadow
- `--input-shadow` - Input shadow
- `--glow-effect` - Glow effect

### Spacing
- `--spacing-xs` through `--spacing-xxxl`
- `--radius-sm` through `--radius-xl`

### Typography
- `--font-family-primary`
- `--font-family-secondary`
- `--font-size-*` variables

## Example Themes

The app includes five complete theme examples:

### Mörk Borg (`theme-mork-borg.css`)
- Dark apocalyptic colors (black, yellow, red)
- Bold, high-contrast typography
- Gritty, distressed effects
- Medieval doom aesthetic

### Pirate Borg (`theme-pirate-borg.css`)
- **Parchment/cream backgrounds** (#e8dcc8) - NOT black!
- **Muted CMYK tones** - dark browns, sepia, aged paper
- Old 17th/18th century etching aesthetic
- Serif fonts (Georgia) for authenticity
- Weathered, aged nautical feel

### Corp Borg (`theme-corp-borg.css`)
- **Yellow (#ffeb00) BACKGROUND - inverted MÖRK BORG**
- Black (#000000) text and buttons
- Bright red (#fe002b) for headings, danger, and blood
- Light gray (#e4e4e4) for completed items
- Office grid patterns in black with blood splatter
- Bold monospace typography

### CY_BORG (`theme-cy-borg.css`)
- **Hot pink/magenta (#ff00ff) as PRIMARY neon accent**
- Dark chrome backgrounds with cyan secondary
- Digital scanline and grid effects
- Terminal monospace fonts with neon glow
- Intense pink/cyan contrast

### Eat the Reich (`theme-eat-the-reich.css`)
- **Hot pink (#ef4796) and cyan (#19afd0) on deep blue**
- Vibrant comic book aesthetic
- Dark navy blue backgrounds (#11254a, #0e486e)
- Impact/Arial Black bold fonts
- Comic book energy effects and halftone dots
- Stark, high-impact design

Each theme demonstrates:
- Complete color palette overrides
- Typography customization
- Shadow and glow effects
- Border and background styles
- Button and input styling

## Tips

1. **Start with the base**: Copy `theme-mork-borg.css` as a template
2. **Test locally**: Open `index.html` directly in your browser (no server needed!)
3. **Use the selector**: Your theme will appear in the theme dropdown
4. **Persistence**: Theme choice is saved to localStorage

## Static File Usage

This app is designed to work as a **static HTML file** - no server required! Just:
1. Download all files
2. Open `index.html` in your browser
3. Select your theme from the dropdown

The theme CSS files will be loaded dynamically when selected.
