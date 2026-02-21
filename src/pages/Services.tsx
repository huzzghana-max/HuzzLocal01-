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
        <Box
          sx={{
            p: { xs: 2.4, md: 3.2 },
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            background:
              `radial-gradient(circle at -10% 10%, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 38%),` +
              alpha(theme.palette.secondary.main, theme.palette.mode === 'light' ? 0.08 : 0.2),
          }}
        >
          <Typography variant="h2" sx={{ fontWeight: 850, mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>
            Services
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', color: 'text.secondary', maxWidth: 760, lineHeight: 1.65 }}>
            A curated service ecosystem that helps event teams move from planning to execution with confidence.
          </Typography>
        </Box>

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
