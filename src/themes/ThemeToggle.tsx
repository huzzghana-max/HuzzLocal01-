import React from 'react'
import { Box, Tooltip } from '@mui/material'
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material'
import { alpha, useTheme as useMuiTheme } from '@mui/material/styles'
import { useTheme } from './ThemeContext'

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large'
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ size = 'medium' }) => {
  const { mode, toggleTheme } = useTheme()
  const muiTheme = useMuiTheme()
  const dims = size === 'small' ? { w: 48, h: 26, knob: 20 } : size === 'large' ? { w: 62, h: 32, knob: 24 } : { w: 56, h: 30, knob: 22 }

  return (
    <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
      <Box
        onClick={toggleTheme}
        sx={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: dims.w,
          height: dims.h,
          borderRadius: 999,
          backgroundColor: mode === 'light'
            ? alpha(muiTheme.palette.primary.main, 0.12)
            : alpha(muiTheme.palette.primary.main, 0.2),
          border: `1px solid ${alpha(muiTheme.palette.primary.main, 0.35)}`,
          padding: '2px',
          position: 'relative',
          transition: 'all 0.25s ease',
          '&:hover': {
            boxShadow: `0 4px 12px ${alpha(muiTheme.palette.primary.main, 0.2)}`,
          },
        }}
      >
        <LightModeIcon
          sx={{
            fontSize: size === 'large' ? 16 : 14,
            color: mode === 'light' ? muiTheme.palette.secondary.main : muiTheme.palette.text.disabled,
            zIndex: 1,
            marginLeft: '4px',
            transition: 'color 0.3s ease',
          }}
        />
        
        <Box
          sx={{
            position: 'absolute',
            left: mode === 'light' ? '2px' : `calc(100% - ${dims.knob + 2}px)`,
            width: dims.knob,
            height: dims.knob,
            borderRadius: '18px',
            backgroundColor: muiTheme.palette.background.paper,
            boxShadow: `0 2px 8px ${alpha(muiTheme.palette.common.black, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'left 0.25s ease',
            zIndex: 2,
          }}
        >
          {mode === 'light' ? (
            <LightModeIcon sx={{ fontSize: size === 'large' ? 14 : 12, color: muiTheme.palette.secondary.main }} />
          ) : (
            <DarkModeIcon sx={{ fontSize: size === 'large' ? 14 : 12, color: muiTheme.palette.primary.main }} />
          )}
        </Box>

        <DarkModeIcon
          sx={{
            fontSize: size === 'large' ? 16 : 14,
            color: mode === 'dark' ? muiTheme.palette.primary.main : muiTheme.palette.text.disabled,
            zIndex: 1,
            marginRight: '4px',
            transition: 'color 0.3s ease',
          }}
        />
      </Box>
    </Tooltip>
  )
}

export default ThemeToggle
