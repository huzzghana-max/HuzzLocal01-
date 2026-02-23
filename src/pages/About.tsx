import React from 'react'
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Event as EventIcon, People as PeopleIcon, Handshake as HandshakeIcon, Insights as InsightsIcon } from '@mui/icons-material'
import MarketingHero from '../components/MarketingHero'

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
        <MarketingHero
          badge="ABOUT HUZZ"
          title="Professional event operations, built for modern teams."
          subtitle="HUZZ helps organizers and providers plan, coordinate, and execute events with fewer handoffs and higher delivery confidence."
          imageUrl="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=80"
        />

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
