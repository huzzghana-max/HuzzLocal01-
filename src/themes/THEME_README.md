# Theme Documentation

## Overview
The application uses a centralized theme system built with Material-UI's theming capabilities. All colors, typography, and component styles are defined in a single location for easy customization and consistency.

## File Structure
```
src/
└── themes/
    └── theme.ts          # Main theme configuration file
```

## Color Palette

### Primary Colors (Orange)
- **Main**: `#ff8c00` - Primary orange
- **Light**: `#ffb347` - Lighter orange
- **Dark**: `#e67e0a` - Darker orange for hover states
- **Lighter**: `rgba(255, 140, 0, 0.05)` - Very light orange background
- **LightBg**: `rgba(255, 140, 0, 0.1)` - Light orange background

### Secondary Colors
- **Main**: `#ff6b35` - Dark orange
- **Light**: `#ff8c4f` - Light dark orange
- **Dark**: `#e65a27` - Darker variant

### Text Colors
- **Primary**: `#333333` - Main text
- **Secondary**: `#666666` - Subtitle text
- **Tertiary**: `#999999` - Light text
- **Light**: `#bbbbbb` - Very light text

### Background Colors
- **Default**: `#ffffff` - White
- **Paper**: `rgba(255, 255, 255, 0.9)` - Semi-transparent white

### Gradients
- **Primary Gradient**: `linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)`
- **Hover Gradient**: `linear-gradient(135deg, #e67e0a 0%, #ff5722 100%)`

## Usage Examples

### Basic Import
```typescript
import { themeColors, getGradientBackground } from '../themes/theme'

// Use in component
const bgColor = themeColors.primary.main  // #ff8c00
```

### Using Utility Functions
```typescript
import { getOrangeButtonSx, getGradientTextSx, getInputFieldSx } from '../themes/theme'

// In your component JSX:
<Button sx={getOrangeButtonSx()}>Click Me</Button>

<Typography sx={getGradientTextSx()}>Gradient Text</Typography>

<TextField sx={getInputFieldSx()} />
```

### Material-UI Components
Since the theme is applied via `ThemeProvider` in `main.tsx`, all Material-UI components automatically use the theme colors:

```typescript
import { Button, TextField, Typography } from '@mui/material'

// Uses primary color from theme
<Button variant="contained">Primary Button</Button>

// Uses secondary color from theme
<Button variant="contained" color="secondary">Secondary Button</Button>

// Typography uses theme typography settings
<Typography variant="h3">Heading</Typography>
```

### Custom Styling with Theme Colors
```typescript
import { themeColors } from '../themes/theme'

<Box sx={{ 
  backgroundColor: themeColors.primary.lightBg,
  color: themeColors.text.primary,
  padding: themeColors.primary.main
}}>
  Content
</Box>
```

## Component-Specific Styling

### Buttons
```typescript
import { getOrangeButtonSx } from '../themes/theme'

<Button sx={getOrangeButtonSx()}>Styled Button</Button>
```

### Text Fields
```typescript
import { getInputFieldSx } from '../themes/theme'

<TextField sx={getInputFieldSx()} label="Email" />
```

### Stat Cards
```typescript
import { getStatCardSx } from '../themes/theme'

<Paper sx={getStatCardSx()}>
  <Typography>Stat Value</Typography>
</Paper>
```

### Gradient Text
```typescript
import { getGradientTextSx } from '../themes/theme'

<Typography variant="h3" sx={getGradientTextSx()}>
  Orange Gradient Text
</Typography>
```

### Navbar
```typescript
import { getNavbarSx } from '../themes/theme'

<AppBar sx={getNavbarSx()}>
  {/* Navbar content */}
</AppBar>
```

## Changing the Theme

To change the theme colors globally:

1. Edit `src/themes/theme.ts`
2. Update the `themeColors` object with new colors
3. All components using the theme will automatically update

Example - Changing primary color from orange to blue:
```typescript
export const themeColors = {
  primary: {
    main: '#0066cc',        // Changed from #ff8c00
    light: '#3385ff',       // Update related colors
    dark: '#004da6',
    // ... rest of colors
  },
  // ... rest of theme
}
```

## Material-UI Integration

The theme is integrated with Material-UI through:
1. **ThemeProvider** in `main.tsx` - Applies theme globally
2. **CssBaseline** - Normalizes CSS across browsers
3. **Component Overrides** - Customized styling for MuiButton, MuiTextField, MuiCard, etc.

## Best Practices

1. **Always use theme colors** - Don't hardcode colors in components
2. **Use utility functions** - They ensure consistency across the app
3. **Keep colors in one place** - Makes updates and maintenance easier
4. **Use semantic naming** - `primary`, `secondary`, `text`, `background` are clear
5. **Extend as needed** - Add new utility functions for new patterns

## Future Extensions

The theme system can be easily extended with:
- Dark mode support
- Multiple theme variants
- Custom typography scales
- Animation/transition definitions
- Spacing/sizing standards
- Shadow definitions

## References
- [Material-UI Theming](https://mui.com/material-ui/customization/theming/)
- [Material-UI Theme Provider](https://mui.com/material-ui/customization/theme-provider/)
