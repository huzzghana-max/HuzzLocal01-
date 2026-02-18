import React from 'react'
import { Box, Tooltip } from '@mui/material'
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon } from '@mui/icons-material'
import { useTheme } from './ThemeContext'

export const ThemeToggle: React.FC = () => {
  const { mode, toggleTheme } = useTheme()

  return (
    <Tooltip title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}>
      <Box
        onClick={toggleTheme}
        sx={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '56px',
          height: '28px',
          borderRadius: '20px',
          backgroundColor: mode === 'light' ? '#E8F4F0' : '#0F2B1F',
          border: `2px solid ${mode === 'light' ? '#B8E3C5' : '#1B5E3C'}`,
          padding: '2px',
          position: 'relative',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: `0 4px 12px ${mode === 'light' ? 'rgba(14, 59, 38, 0.15)' : 'rgba(184, 227, 197, 0.15)'}`,
            transform: 'translateY(-1px)',
          },
        }}
      >
        <LightModeIcon
          sx={{
            fontSize: '14px',
            color: mode === 'light' ? '#F5A623' : '#6B7280',
            zIndex: 1,
            marginLeft: '4px',
            transition: 'color 0.3s ease',
          }}
        />
        
        <Box
          sx={{
            position: 'absolute',
            left: mode === 'light' ? '2px' : 'calc(100% - 26px)',
            width: '24px',
            height: '24px',
            borderRadius: '18px',
            backgroundColor: mode === 'light' ? '#B8E3C5' : '#B8E3C5',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 2,
          }}
        >
          {mode === 'light' ? (
            <LightModeIcon sx={{ fontSize: '12px', color: '#0E3B26' }} />
          ) : (
            <DarkModeIcon sx={{ fontSize: '12px', color: '#0E3B26' }} />
          )}
        </Box>

        <DarkModeIcon
          sx={{
            fontSize: '14px',
            color: mode === 'dark' ? '#94A3B8' : '#6B7280',
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
