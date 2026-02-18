import React from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, useTheme } from '@mui/material'
import { Event as EventIcon, People as PeopleIcon, Handshake as HandshakeIcon } from '@mui/icons-material'

const About: React.FC = () => {
  const theme = useTheme()

  const features = [
    {
      icon: EventIcon,
      title: 'Easy Event Planning',
      description: 'Plan your events with our intuitive and comprehensive platform.',
    },
    {
      icon: PeopleIcon,
      title: 'Connect with Providers',
      description: 'Find and book talented service providers for your events.',
    },
    {
      icon: HandshakeIcon,
      title: 'Seamless Collaboration',
      description: 'Manage bookings and communicate with providers in one place.',
    },
  ]

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            mb: 2,
            color: theme.palette.primary.main,
            fontSize: { xs: '2rem', md: '3rem' },
          }}
        >
          About Us
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: '1.1rem',
            color: theme.palette.text.secondary,
            mb: 6,
            maxWidth: 600,
          }}
        >
          Welcome to our integrated event planning and booking platform. We connect event organizers with talented service providers to create unforgettable experiences.
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, idx) => {
            const IconComponent = feature.icon
            return (
              <Grid size={{ xs: 12, md: 4 }} key={idx}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.palette.mode === 'light' 
                        ? '0 12px 32px rgba(31, 77, 92, 0.15)' 
                        : '0 12px 32px rgba(0, 0, 0, 0.4)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      <IconComponent sx={{ fontSize: 40, color: theme.palette.secondary.main }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography color="textSecondary">{feature.description}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Box>
    </Container>
  )
}

export default About
