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
        background: theme.palette.mode === 'light'
          ? 'linear-gradient(135deg, #FFFFFF 0%, #F4F7F6 100%)'
          : 'linear-gradient(135deg, #122A1F 0%, #0E2620 100%)',
        border: theme.palette.mode === 'light'
          ? '1px solid rgba(184, 227, 197, 0.2)'
          : '1px solid rgba(184, 227, 197, 0.15)',
        boxShadow: theme.palette.mode === 'light'
          ? '0 4px 20px rgba(14, 59, 38, 0.08)'
          : '0 4px 20px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: theme.palette.mode === 'light'
            ? 'radial-gradient(circle, rgba(184, 227, 197, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(184, 227, 197, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        },
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: theme.palette.mode === 'light'
            ? '0 12px 32px rgba(14, 59, 38, 0.15)'
            : '0 12px 32px rgba(0, 0, 0, 0.5)',
          border: theme.palette.mode === 'light'
            ? '1px solid rgba(14, 59, 38, 0.3)'
            : '1px solid rgba(184, 227, 197, 0.25)',
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
            <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, mt: 1, color: theme.palette.primary.main }}>
              {value}
            </Typography>
          </Box>
          {icon && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                background: theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, rgba(14, 59, 38, 0.1) 0%, rgba(184, 227, 197, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(184, 227, 197, 0.1) 0%, rgba(14, 59, 38, 0.1) 100%)',
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: theme.palette.mode === 'light'
                  ? 'inset 0 2px 8px rgba(14, 59, 38, 0.1)'
                  : 'inset 0 2px 8px rgba(0, 0, 0, 0.2)',
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
                <TrendingUpIcon sx={{ fontSize: '1rem', color: '#1B5E3C' }} />
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#1B5E3C' }}>
                  {Math.abs(change)}% increase
                </Typography>
              </>
            ) : (
              <>
                <TrendingDownIcon sx={{ fontSize: '1rem', color: '#F5A623' }} />
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#F5A623' }}>
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
        background: theme.palette.mode === 'light'
          ? 'linear-gradient(135deg, #FFFFFF 0%, #F4F7F6 100%)'
          : 'linear-gradient(135deg, #122A1F 0%, #0E2620 100%)',
        border: theme.palette.mode === 'light'
          ? '1px solid rgba(184, 227, 197, 0.2)'
          : '1px solid rgba(184, 227, 197, 0.15)',
        boxShadow: theme.palette.mode === 'light'
          ? '0 4px 20px rgba(14, 59, 38, 0.08)'
          : '0 4px 20px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: theme.palette.mode === 'light'
            ? '0 8px 28px rgba(14, 59, 38, 0.12)'
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
            background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
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
            ? 'rgba(14, 59, 38, 0.1)'
            : 'rgba(184, 227, 197, 0.1)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 8,
            background: 'linear-gradient(90deg, #0E3B26 0%, #B8E3C5 100%)',
            boxShadow: '0 2px 8px rgba(14, 59, 38, 0.3)',
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
        alignItems: 'flex-start',
        mb: 4,
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 800,
            mb: 0.5,
            background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
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
      {actionButton && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actionButton}</Box>}
    </Box>
  )
}
