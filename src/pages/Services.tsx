import React from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, Chip } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import {
  Celebration as EventIcon,
  Mic as EntertainmentIcon,
  LocalDining as CateringIcon,
  PhotoLibrary as PhotographyIcon,
  DesignServices as DesignIcon,
  SupportAgent as SupportIcon,
} from '@mui/icons-material'
import MarketingHero from '../components/MarketingHero'

const Services: React.FC = () => {
  const theme = useTheme()

  const services = [
    { title: 'Event Planning', desc: 'Planning strategy, timeline setup, and execution support.', icon: EventIcon, tag: 'Core' },
    { title: 'Entertainment', desc: 'DJs, hosts, live performers, and immersive audience experiences.', icon: EntertainmentIcon, tag: 'Experience' },
    { title: 'Catering', desc: 'Menu design, food service, and hospitality coordination.', icon: CateringIcon, tag: 'Operations' },
    { title: 'Photography', desc: 'Professional photo and video capture for every key moment.', icon: PhotographyIcon, tag: 'Media' },
    { title: 'Event Design', desc: 'Visual styling, decor, and thematic production concepts.', icon: DesignIcon, tag: 'Creative' },
    { title: 'Support', desc: 'Reliable platform support and collaboration assistance.', icon: SupportIcon, tag: 'Support' },
  ]

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 6, md: 10 }, display: 'grid', gap: 4 }}>
        <MarketingHero
          badge="SERVICE CATALOG"
          title="Everything your event needs, in one coordinated ecosystem."
          subtitle="From planning and catering to media and support, HUZZ connects teams with dependable providers and consistent service delivery."
          imageUrl="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1400&q=80"
        />

        <Grid container spacing={2.2}>
          {services.map((service) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 14px 32px ${alpha(theme.palette.primary.main, 0.16)}`,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 2.4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.4 }}>
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
                      }}
                    >
                      <service.icon />
                    </Box>
                    <Chip size="small" label={service.tag} variant="outlined" />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.8 }}>
                    {service.title}
                  </Typography>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{service.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  )
}

export default Services
