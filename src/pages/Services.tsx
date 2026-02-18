import React from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, useTheme } from '@mui/material'
import {
  Celebration as EventIcon,
  Mic as EntertainmentIcon,
  LocalDining as CateringIcon,
  PhotoLibrary as PhotographyIcon,
} from '@mui/icons-material'

const Services: React.FC = () => {
  const theme = useTheme()

  const services = [
    { title: 'Event Planning', desc: 'Complete event coordination and management', icon: EventIcon },
    { title: 'Entertainment', desc: 'Professional entertainment services', icon: EntertainmentIcon },
    { title: 'Catering', desc: 'Culinary excellence and service', icon: CateringIcon },
    { title: 'Photography', desc: 'Professional photography and videography', icon: PhotographyIcon },
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
          Our Services
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: '1.1rem',
            color: theme.palette.text.secondary,
            mb: 6,
          }}
        >
          Comprehensive event planning and management services to bring your vision to life.
        </Typography>

        <Grid container spacing={3}>
          {services.map((service) => {
            const ServiceIcon = service.icon
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={service.title}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.palette.mode === 'light'
                        ? '0 12px 32px rgba(31, 77, 92, 0.15)'
                        : '0 12px 32px rgba(0, 0, 0, 0.4)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ServiceIcon sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {service.title}
                    </Typography>
                    <Typography color="textSecondary">{service.desc}</Typography>
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

export default Services
