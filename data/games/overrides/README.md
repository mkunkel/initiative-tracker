# Game Configuration Overrides

This directory is for user-created game configuration overrides. Override files allow you to customize existing game configurations without modifying the base game files.

## How It Works

When a game config is loaded (e.g., `eat-the-reich.json`), the system will automatically check for an override file with the same name in this directory (e.g., `overrides/eat-the-reich.json`).

If an override file exists, it will be **deep merged** with the base configuration:
- Objects are merged recursively
- Arrays are replaced entirely (not merged)
- Primitive values override the base value

## Creating an Override

1. Create a JSON file with the same name as the game you want to override
   - Example: `eat-the-reich.json` to override Eat the Reich

2. Include only the fields you want to change
   - You don't need to copy the entire config
   - The override will merge with the base config

3. The override must be valid JSON

## Example 1: Change Theme

To override just the theme for Eat the Reich:

```json
{
  "themeFile": "themes/theme-my-custom.css"
}
```

## Example 2: Modify Resource Values

To change the default Blood value and maximum:

```json
{
  "resources": {
    "primary": {
      "default": 5,
      "max": 15
    }
  }
}
```

Note: This will merge with the existing `resources.primary` object, so other fields like `name`, `displayName`, `min`, etc. remain unchanged.

## Example 3: Add Custom Tracker

To add a new injury tracker:

```json
{
  "customTrackers": [
    {
      "id": "new-injury",
      "label": "New Injury",
      "type": "checkbox",
      "count": 3,
      "appliesToPC": true,
      "appliesToNPC": true,
      "appliesToEnemy": false
    }
  ]
}
```

**Warning:** Arrays are **replaced**, not merged. If you override `customTrackers`, you must include all trackers you want to keep from the base config.

## Example 4: Modify Enemy Subtype Attributes

To change the default Attack value for Threats:

```json
{
  "enemySubtypes": {
    "threat": {
      "attributes": [
        {
          "id": "attack",
          "default": 3
        }
      ]
    }
  }
}
```

This will deep merge, so only the `default` value for the `attack` attribute is changed.

## Example 5: Complete Override Example

A more complex override for Eat the Reich:

```json
{
  "name": "Eat the Reich (Custom)",
  "themeFile": "themes/theme-my-custom.css",
  "resources": {
    "primary": {
      "default": 3,
      "max": 12
    }
  },
  "enemySubtypes": {
    "threat": {
      "attributes": [
        {
          "id": "rating",
          "label": "Rating",
          "type": "counter",
          "default": 5,
          "min": 0,
          "max": null
        },
        {
          "id": "attack",
          "label": "Attack",
          "type": "counter",
          "default": 3,
          "min": 0,
          "max": null
        },
        {
          "id": "challenge",
          "label": "Challenge",
          "type": "counter",
          "default": 1,
          "min": 0,
          "max": null
        }
      ]
    }
  }
}
```

## Testing Your Override

1. Create your override file in this directory
2. Reload the page (hard refresh: Ctrl+Shift+R / Cmd+Shift+R)
3. Select the game from the Game dropdown
4. Check the browser console for: `Applied override config for [game-id]`
5. If there's an error, check the console for validation messages

## Troubleshooting

### Override not loading
- Make sure the filename matches exactly (e.g., `eat-the-reich.json`)
- Check that the JSON is valid (use a JSON validator)
- Hard refresh the browser to clear cache

### Configuration invalid after override
- The merged config must still pass validation
- Required fields cannot be removed
- Check browser console for validation errors

### Arrays not merging as expected
- Arrays are replaced, not merged
- If you override an array, include all items you want

## Git and Version Control

Override files in this directory are **gitignored** by default. This means:
- Your custom configs won't be committed to the repository
- Updates to the base game files won't affect your overrides
- You can maintain personal customizations without conflicts

If you want to share an override configuration:
- Copy it outside the `overrides/` directory
- Share it manually or add it to a different repository

## Advanced: Array Merging Workaround

Since arrays are replaced rather than merged, if you want to add to an array (like `customTrackers`), you must:

1. Copy the entire array from the base config
2. Add your new items to the array
3. Include the complete array in your override

Example:
```json
{
  "customTrackers": [
    // Copy all existing trackers from base config
    {
      "id": "injuries-1-2",
      "label": "1-2",
      "type": "checkbox",
      "count": 2,
      "appliesToPC": true,
      "appliesToNPC": true,
      "appliesToEnemy": false
    },
    // ... more existing trackers ...

    // Add your new tracker
    {
      "id": "my-new-tracker",
      "label": "My Tracker",
      "type": "checkbox",
      "count": 3,
      "appliesToPC": true,
      "appliesToNPC": false,
      "appliesToEnemy": false
    }
  ]
}
```

## Need Help?

Check the base game configuration files in `/data/games/` to see the full structure and available options.

