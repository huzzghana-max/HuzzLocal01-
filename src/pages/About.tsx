import React from 'react'
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Event as EventIcon, People as PeopleIcon, Handshake as HandshakeIcon, Insights as InsightsIcon } from '@mui/icons-material'

const About: React.FC = () => {
  const theme = useTheme()

  const pillars = [
    {
      icon: EventIcon,
      title: 'Smart Event Planning',
      description: 'Create and organize events with clear workflows from kickoff to event day.',
    },
    {
      icon: PeopleIcon,
      title: 'Provider Network',
      description: 'Connect with trusted professionals across key event service categories.',
    },
    {
      icon: HandshakeIcon,
      title: 'Collaboration',
      description: 'Coordinate messages, bookings, and updates in one shared space.',
    },
    {
      icon: InsightsIcon,
      title: 'Operational Clarity',
      description: 'Use insights and timelines to make faster, better planning decisions.',
    },
  ]

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 6, md: 10 }, display: 'grid', gap: 4 }}>
        <Box
          sx={{
            p: { xs: 2.4, md: 3.2 },
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            background:
              `radial-gradient(circle at 85% -20%, ${alpha(theme.palette.secondary.main, 0.2)} 0%, transparent 38%),` +
              alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.06 : 0.16),
          }}
        >
          <Typography variant="h2" sx={{ fontWeight: 850, mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>
            About HUZZ
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', color: 'text.secondary', maxWidth: 760, lineHeight: 1.65 }}>
            HUZZ is a modern event operations platform built to help organizers and providers plan, coordinate, and execute memorable events with less friction.
          </Typography>
        </Box>

        <Grid container spacing={2.2}>
          {pillars.map((pillar) => (
            <Grid key={pillar.title} size={{ xs: 12, sm: 6 }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 14px 32px ${alpha(theme.palette.primary.main, 0.18)}`,
                  },
                }}
              >
                <CardContent sx={{ p: 2.4 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1.8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.main,
                      mb: 1.5,
                    }}
                  >
                    <pillar.icon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.8 }}>
                    {pillar.title}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{pillar.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  )
}

export default About
