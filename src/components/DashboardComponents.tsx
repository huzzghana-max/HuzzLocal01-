import React from 'react'
import {
  Box,
  Paper,
  Card,
  CardContent,
  Typography,
  LinearProgress,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon?: React.ReactNode
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color = 'primary' }) => {
  const theme = useTheme()

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '16px',
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === 'light'
          ? '0 4px 16px rgba(17,24,39,0.08)'
          : '0 4px 16px rgba(0, 0, 0, 0.35)',
        transition: 'box-shadow 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: theme.palette.mode === 'light'
            ? '0 8px 24px rgba(17,24,39,0.12)'
            : '0 8px 24px rgba(0, 0, 0, 0.45)',
        },
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: theme.palette.text.secondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {title}
            </Typography>
            <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, mt: 1, color: `${color}.main` }}>
              {value}
            </Typography>
          </Box>
          {icon && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                background: theme.palette.mode === 'light'
                  ? 'rgba(17,24,39,0.05)'
                  : 'rgba(148,163,184,0.15)',
                color: `${color}.main`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
            {change >= 0 ? (
              <>
                <TrendingUpIcon sx={{ fontSize: '1rem', color: 'success.main' }} />
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'success.main' }}>
                  {Math.abs(change)}% increase
                </Typography>
              </>
            ) : (
              <>
                <TrendingDownIcon sx={{ fontSize: '1rem', color: 'warning.main' }} />
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'warning.main' }}>
                  {Math.abs(change)}% decrease
                </Typography>
              </>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

interface ProgressCardProps {
  title: string
  current: number
  total: number
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ title, current, total, color = 'primary' }) => {
  const theme = useTheme()
  const percentage = Math.round((current / total) * 100)

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: '16px',
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.palette.mode === 'light'
          ? '0 4px 16px rgba(17,24,39,0.08)'
          : '0 4px 20px rgba(0, 0, 0, 0.3)',
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: theme.palette.mode === 'light'
            ? '0 8px 24px rgba(17,24,39,0.12)'
            : '0 8px 28px rgba(0, 0, 0, 0.4)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: theme.palette.text.primary }}>
          {title}
        </Typography>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '1.1rem',
            color: 'text.primary',
          }}
        >
          {percentage}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 10,
          borderRadius: 8,
          background: theme.palette.mode === 'light'
            ? 'rgba(17,24,39,0.1)'
            : 'rgba(148,163,184,0.2)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 8,
            background: `${color}.main`,
          },
        }}
      />
      <Typography sx={{ fontSize: '0.8rem', mt: 1.5, color: theme.palette.text.secondary, fontWeight: 500 }}>
        {current} of {total}
      </Typography>
    </Paper>
  )
}

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  actionButton?: React.ReactNode
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle, actionButton }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', md: 'flex-start' },
        flexDirection: { xs: 'column', md: 'row' },
        mb: { xs: 3, md: 4 },
        flexWrap: 'wrap',
        gap: { xs: 1.5, md: 2 },
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 800,
            mb: 0.5,
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {actionButton && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            width: { xs: '100%', md: 'auto' },
            '& .MuiButton-root': {
              width: { xs: '100%', sm: 'auto' },
            },
          }}
        >
          {actionButton}
        </Box>
      )}
    </Box>
  )
}
