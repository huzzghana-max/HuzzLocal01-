import React from 'react'
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import MarketingHero from '../components/MarketingHero'

const Portfolio: React.FC = () => {
  const theme = useTheme()

  const projects = [
    {
      title: 'Executive Summit',
      summary: 'High-attendance corporate summit with streamlined registration and speaker coordination.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
      label: 'Corporate',
    },
    {
      title: 'Luxury Wedding',
      summary: 'End-to-end vendor orchestration with schedule control and premium guest experience.',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      label: 'Private',
    },
    {
      title: 'Music Night',
      summary: 'Ticketed entertainment event managed with provider collaboration and check-in flow.',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      label: 'Ticketed',
    },
    {
      title: 'Brand Product Launch',
      summary: 'Media-heavy launch event executed with tight logistics and vendor synchronization.',
      image: 'https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=1200&q=80',
      label: 'Brand',
    },
    {
      title: 'Community Festival',
      summary: 'Large-scale public event with multi-service provider management.',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
      label: 'Public',
    },
    {
      title: 'Innovation Forum',
      summary: 'Speaker sessions, booths, and attendee tracking delivered in one workflow.',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
      label: 'Conference',
    },
  ]

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 6, md: 10 }, display: 'grid', gap: 4 }}>
        <MarketingHero
          badge="PORTFOLIO HIGHLIGHTS"
          title="A track record of events delivered with precision."
          subtitle="Explore event outcomes executed through HUZZ workflows across corporate, private, and public formats."
          imageUrl="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=80"
        />

        <Grid container spacing={2.4}>
          {projects.map((project) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.title}>
              <Card
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  height: '100%',
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 16px 30px ${alpha(theme.palette.primary.main, 0.16)}`,
                  },
                }}
              >
                <Box sx={{ height: 190, background: `url(${project.image}) center/cover` }} />
                <CardContent sx={{ p: 2.3 }}>
                  <Typography sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.8rem', letterSpacing: 0.4, mb: 0.6 }}>
                    {project.label}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, mb: 0.8, fontSize: '1.06rem' }}>{project.title}</Typography>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.6, fontSize: '0.93rem' }}>{project.summary}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  )
}

export default Portfolio
