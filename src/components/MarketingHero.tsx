import React from 'react'
import { Box, Button, Grid, Stack, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { keyframes } from '@mui/system'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'

const driftBg = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`

type MarketingHeroProps = {
  badge: string
  title: string
  subtitle: string
  imageUrl: string
  primaryCtaText?: string
  onPrimaryCta?: () => void
}

const MarketingHero: React.FC<MarketingHeroProps> = ({
  badge,
  title,
  subtitle,
  imageUrl,
  primaryCtaText,
  onPrimaryCta,
}) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: { xs: 4, md: 5 },
        background: `linear-gradient(130deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.92)} 45%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 10% 25%, ${alpha(theme.palette.secondary.main, 0.15)}, transparent 45%), radial-gradient(circle at 80% 70%, ${alpha(theme.palette.primary.main, 0.14)}, transparent 48%)`,
          backgroundSize: '140% 140%',
          animation: `${driftBg} 22s ease-in-out infinite`,
          pointerEvents: 'none',
        }}
      />
      <Grid container sx={{ position: 'relative' }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={2.1} sx={{ p: { xs: 3, md: 4.5 } }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', letterSpacing: 0.8, color: 'primary.main' }}>
              {badge}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '2rem', sm: '2.3rem', md: '2.8rem' },
                lineHeight: 1.08,
                fontWeight: 900,
              }}
            >
              {title}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: { xs: '0.98rem', md: '1.04rem' }, lineHeight: 1.65 }}>
              {subtitle}
            </Typography>
            {primaryCtaText && onPrimaryCta && (
              <Button
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={onPrimaryCta}
                sx={{
                  alignSelf: 'flex-start',
                  py: 1.05,
                  px: 3,
                  borderRadius: 999,
                  fontWeight: 800,
                  textTransform: 'none',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                }}
              >
                {primaryCtaText}
              </Button>
            )}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ p: { xs: 2.2, md: 3 }, pt: { xs: 0, md: 3 }, height: '100%' }}>
            <Box
              sx={{
                height: { xs: 230, sm: 280, md: '100%' },
                minHeight: { md: 300 },
                borderRadius: { xs: 3, md: 4 },
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: `0 18px 36px ${alpha(theme.palette.common.black, 0.2)}`,
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default MarketingHero
