# Theme Visual Guide

## Available Themes

### 🌑 Default
**Style**: Clean, modern, minimalistic
- **Background**: Soft gradients (purple to pink)
- **Cards**: Glass-morphism with backdrop blur
- **Text**: Dark gray on light backgrounds
- **Buttons**: Blue gradient
- **Best for**: General use, clean aesthetic

---

### 💀 Mörk Borg
**Style**: Apocalyptic, high-contrast doom
- **Background**: Pure black
- **Cards**: Dark with yellow/red borders
- **Text**: Bright yellow (#FFD700)
- **Buttons**: Yellow with black shadow
- **Fonts**: Bold, aggressive
- **Best for**: Dark fantasy, grimdark settings

**Key Features**:
- High contrast for readability
- Aggressive yellow/black color scheme
- Bold typography
- Distressed aesthetic

---

### 🏴‍☠️ Pirate Borg
**Style**: Aged parchment, muted nautical tones
- **Background**: Parchment/cream (#e8dcc8 to #c8b89c)
- **Cards**: Aged paper with dark brown borders
- **Text**: Dark brown/sepia (#3a2816, #52381c)
- **Buttons**: Muted browns and nautical tones
- **Accents**: Muted reds for blood, aged paper textures
- **Fonts**: Serif (Georgia) for old-world authenticity
- **Best for**: Historical pirate campaigns, 17th/18th century adventures

**Key Features**:
- Parchment backgrounds (NOT black!)
- CMYK muted color palette
- Old etching/engraving aesthetic
- Weathered, aged paper feel

---

### 🏢 Corp Borg
**Style**: Inverted MÖRK BORG - yellow background, black/red
- **Background**: **Bright yellow (#ffeb00)**
- **Cards**: Yellow cards with black borders
- **Text**: **Black (#000000) primary**, red (#fe002b) for headings
- **Buttons**: Black with yellow text (red for danger)
- **Accents**: Bright red blood splatters on yellow
- **Fonts**: Bold monospace (Courier New)
- **Best for**: Occult corporate horror, demonic offices

**Key Features**:
- Yellow background (inverted from MÖRK BORG)
- Black text and UI elements
- Blood red for emphasis and danger
- Office cubicle grid in black
- High-contrast, eye-catching design

---

### 🌃 CY_BORG
**Style**: Hot pink neon cyberpunk dystopia
- **Background**: Dark chrome (#0a0a0f to #1a1a2e)
- **Cards**: Digital terminals with hot pink borders
- **Text**: Hot pink/magenta (#ff00ff) primary
- **Buttons**: Hot pink with intense neon glow
- **Accents**: Cyan (#00ffff) secondary, hot pink primary
- **Fonts**: Monospace (Courier New)
- **Best for**: Cyberpunk, neon-soaked dystopias

**Key Features**:
- Hot pink as signature color
- Scanline and grid effects
- Neon glow animations
- Digital terminal aesthetic
- Intense magenta/cyan contrast

---

### 🔴 Eat the Reich
**Style**: Vibrant comic book with hot pink and cyan
- **Background**: Deep navy blue (#11254a to #0e486e)
- **Cards**: Dark blue with hot pink borders
- **Text**: Hot pink (#ef4796) and cyan (#19afd0)
- **Buttons**: Hot pink/magenta gradient with glow
- **Accents**: Comic book energy effects, halftone dots
- **Fonts**: Impact/Arial Black for comic boldness
- **Best for**: Vampire commandos, hyper-colorful action

**Key Features**:
- Hot pink (#ef4796) + Cyan (#19afd0) + Deep blue
- Comic book halftone dot patterns
- Energy lines and star bursts
- Vibrant, high-contrast design
- Glossy comic book aesthetic

---

## Theme Color Palettes

### Mörk Borg
```
Primary: #000000 (Black)
Accent: #FFD700 (Gold)
Text: #FFED4E (Bright Yellow)
Enemy: #FF0000 (Blood Red)
```

### Pirate Borg
```
Primary: #e8dcc8 (Aged Parchment)
Accent: #8b6f47 (Weathered Brown)
Text: #3a2816 (Dark Brown/Sepia)
Enemy: #7a4f4f (Muted Blood)
Secondary: #d4c4a8 (Old Paper)
Paper: #f4ede0 (Cream)
```

### Corp Borg
```
Background: #ffeb00 (Yellow - MAIN COLOR)
Text: #000000 (Black)
Heading: #fe002b (Bright Red)
Buttons: #000000 (Black)
Enemy: #fe002b (Bright Red)
Completed: #e4e4e4 (Gray)
```

### CY_BORG
```
Primary: #0a0a0f (Dark Chrome)
Accent: #ff00ff (Hot Pink Neon)
Secondary: #00ffff (Cyan Neon)
Text: #ff00ff (Magenta PRIMARY)
Enemy: #ff0055 (Hot Pink Threat)
Success: #00ffff (Cyan Success)
```

### Eat the Reich
```
Primary: #11254a (Deep Navy)
Secondary: #0e486e (Dark Blue)
Text: #ef4796 (Hot Pink)
Accent: #19afd0 (Cyan)
Button: #dd1769 (Magenta)
Steel: #4e718f (Steel Blue)
```

---

## Choosing a Theme

### For Your Game Type

**Medieval/Fantasy Dark**
→ Mörk Borg

**Pirates/Maritime Adventures**
→ Pirate Borg

**Corporate Horror/Office Dystopia**
→ Corp Borg

**Cyberpunk/Neon Sci-Fi**
→ CY_BORG

**WWII/Resistance/Revolutionary**
→ Eat the Reich

**Everything Else**
→ Default

### For Your Lighting Conditions

**Dim/Dark Room**
- Default (easier on eyes)
- Pirate Borg (medium contrast)

**Normal Lighting**
- Any theme works

**Bright Room**
- Mörk Borg (high contrast)
- Eat the Reich (high contrast)

### For Visual Impact

**Subtle/Professional**
→ Default

**Moderate Theming**
→ Pirate Borg

**Strong Theming**
→ CY_BORG, Eat the Reich

**Maximum Impact**
→ Mörk Borg

---

## Technical Details

All themes use:
- CSS Custom Properties for easy customization
- Dynamic loading (no page reload required)
- LocalStorage persistence
- Full responsive design
- Consistent UI patterns

Each theme file is approximately 8-10KB and loads instantly when selected.

---

## Creating Your Own Theme

Want to create a theme for your favorite game? See [THEMES.md](THEMES.md) for a complete guide!

Popular game suggestions:
- Delta Green
- Call of Cthulhu
- Blades in the Dark
- Stars Without Number
- Mothership
- Trophy Dark/Gold
