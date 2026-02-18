import React from 'react'
import { Box, Container, Typography, Grid, Card, CardContent, useTheme } from '@mui/material'
import { ImageNotSupported as ImageIcon } from '@mui/icons-material'

const Portfolio: React.FC = () => {
  const theme = useTheme()

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
          Our Portfolio
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: '1.1rem',
            color: theme.palette.text.secondary,
            mb: 6,
          }}
        >
          Explore our curated collection of successful events and collaborations.
        </Typography>

        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.palette.mode === 'light'
                      ? '0 12px 32px rgba(31, 77, 92, 0.15)'
                      : '0 12px 32px rgba(0, 0, 0, 0.4)',
                  },
                }}
              >
                <Box
                  sx={{
                    height: 150,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImageIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.5)' }} />
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    Event {item}
                  </Typography>
                  <Typography color="textSecondary">
                    Professional event planning and execution
                  </Typography>
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
