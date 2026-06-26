import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
  Avatar,
  IconButton,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { keyframes } from '@mui/system'
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded'
import ForumRoundedIcon from '@mui/icons-material/ForumRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import XIcon from '@mui/icons-material/X'
import InstagramIcon from '@mui/icons-material/Instagram'
import GitHubIcon from '@mui/icons-material/GitHub'

const floatX = keyframes`
  0% { transform: translate3d(0,0,0); }
  50% { transform: translate3d(12px,-10px,0); }
  100% { transform: translate3d(0,0,0); }
`

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const currentYear = new Date().getFullYear()
  const builtYear = 2026
  const sectionSpacing = { xs: 7, md: 10 }

  const pillars = [
    {
      icon: EventAvailableRoundedIcon,
      title: 'Operational Planning',
      text: 'Build events with timelines, resources, and ownership in one workflow.',
    },
    {
      icon: VerifiedRoundedIcon,
      title: 'Verified Providers',
      text: 'Book trusted vendors with clear profiles, status, and approvals.',
    },
    {
      icon: PaymentsRoundedIcon,
      title: 'Ticketing + Registration',
      text: 'Handle paid tickets and public attendance from one integrated flow.',
    },
    {
      icon: ForumRoundedIcon,
      title: 'Live Coordination',
      text: 'Keep organizers and providers aligned with direct in-app messaging.',
    },
  ]

  const spotlight = [
    {
      title: 'Conference Launch',
      text: 'Multi-track event with ticket validation and provider coordination.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Private Gala',
      text: 'Curated vendor stack, controlled guest lists, and premium setup.',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Festival Weekend',
      text: 'High-volume attendance managed with unified registration and check-in.',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    },
  ]

  const [spotlightIndex, setSpotlightIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isCarouselPaused, setCarouselPaused] = useState(false)

  const handleSwipe = () => {
    if (touchStart === null || touchEnd === null) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      handleSpotlightNext()
    } else if (isRightSwipe) {
      handleSpotlightPrev()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  useEffect(() => {
    if (touchEnd !== null) {
      handleSwipe()
    }
  }, [touchEnd])

  useEffect(() => {
    if (isCarouselPaused) {
      return
    }

    const interval = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % spotlight.length)
    }, 5200)

    return () => clearInterval(interval)
  }, [spotlight.length, isCarouselPaused])

  const handleSpotlightPrev = () => setSpotlightIndex((prev) => (prev - 1 + spotlight.length) % spotlight.length)
  const handleSpotlightNext = () => setSpotlightIndex((prev) => (prev + 1) % spotlight.length)

  return (
    <Box sx={{ backgroundColor: 'background.default', pb: { xs: 10, md: 14 } }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 5, md: 7 } }}>
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: { xs: 4, md: 5 },
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              pointerEvents: 'none',
            }}
          />

          <Grid container sx={{ position: 'relative' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Stack spacing={2.2} sx={{ p: { xs: 3, sm: 4, md: 6 }, pt: { xs: 4, md: 6 } }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    letterSpacing: 0.8,
                    color: 'primary.main',
                  }}
                >
                  EVENT OPERATIONS PLATFORM
                </Typography>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.15rem', sm: '2.6rem', md: '3.25rem' },
                    lineHeight: 1.06,
                    fontWeight: 900,
                    color: 'text.primary',
                    maxWidth: 560,
                  }}
                >
                  Plan, book, and run events with professional precision.
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: { xs: '0.98rem', md: '1.05rem' }, maxWidth: 520, lineHeight: 1.65 }}>
                  A modern control center for organizers and providers: create events, manage tickets, coordinate services, and deliver reliable execution.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ pt: 0.6 }}>
                  <Button
                    variant="contained"
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={() => navigate('/signup')}
                    sx={{
                      py: 1.05,
                      px: 3,
                      borderRadius: 999,
                      fontWeight: 800,
                      textTransform: 'none',
                      color: 'secondary.contrastText',
                      backgroundColor: theme.palette.secondary.main,
                    }}
                  >
                    Start now
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/browse-vendors')}
                    sx={{
                      py: 1.05,
                      px: 3,
                      borderRadius: 999,
                      fontWeight: 700,
                      textTransform: 'none',
                      borderColor: alpha(theme.palette.primary.main, 0.5),
                      color: 'primary.main',
                      '&:hover': { borderColor: theme.palette.primary.main },
                    }}
                  >
                    Explore providers
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ p: { xs: 3, md: 4 }, pt: { xs: 0, md: 4 }, height: '100%' }}>
                <Box
                  sx={{
                    height: { xs: 260, sm: 320, md: '100%' },
                    minHeight: { md: 420 },
                    borderRadius: { xs: 3, md: 4 },
                    backgroundImage:
                      'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    boxShadow: `0 24px 50px ${alpha(theme.palette.common.black, 0.22)}`,
                    animation: `${floatX} 10s ease-in-out infinite`,
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ mt: sectionSpacing }}>
        <Grid container spacing={2.4}>
          {pillars.map((item) => (
            <Grid key={item.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                }}
              >
                <CardContent sx={{ p: 2.4 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1.3,
                    }}
                  >
                    <item.icon />
                  </Box>
                  <Typography sx={{ fontWeight: 800, mb: 0.7 }}>{item.title}</Typography>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.6, fontSize: '0.93rem' }}>{item.text}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ mt: sectionSpacing }}>
        <Stack spacing={1} sx={{ textAlign: 'center', mb: 3 }}>
          <Typography sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 0.6, fontSize: '0.82rem' }}>
            RECENT EXECUTION SPOTLIGHT
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.8rem', md: '2.2rem' }, fontWeight: 900 }}>
            Outcomes Teams Can Trust
          </Typography>
        </Stack>

        <Box
          sx={{
            position: 'relative',
            borderRadius: 4,
            overflow: 'hidden',
            minHeight: { xs: 320, md: 360 },
            boxShadow: `0 18px 40px ${alpha(theme.palette.common.black, 0.12)}`,
            cursor: 'grab',
            userSelect: 'none',
          }}
          onMouseEnter={() => setCarouselPaused(true)}
          onMouseLeave={() => setCarouselPaused(false)}
          onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
          onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
          onTouchEnd={(e) => setTouchEnd(e.changedTouches[0].clientX)}
        >
          {spotlight.map((item, idx) => (
            <Box
              key={item.title}
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${item.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.75) contrast(1.05)',
                opacity: idx === spotlightIndex ? 1 : 0,
                transition: 'opacity 600ms ease-in-out',
              }}
            />
          ))}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(15,23,42,0.15) 0%, rgba(15,23,42,0.72) 100%)',
            }}
          />
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ p: { xs: 3, md: 4 }, maxWidth: { xs: '100%', md: '55%' } }}>
              <Typography sx={{ color: theme.palette.secondary.main, fontWeight: 700, letterSpacing: 0.8, mb: 1 }}>
                Featured execution
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: '1.9rem', md: '2.6rem' },
                  fontWeight: 900,
                  color: 'common.white',
                  lineHeight: 1.05,
                  opacity: 1,
                  transition: 'opacity 600ms ease-in-out',
                }}
              >
                {spotlight[spotlightIndex].title}
              </Typography>
              <Typography
                sx={{
                  mt: 1.5,
                  color: alpha(theme.palette.common.white, 0.92),
                  fontSize: '1rem',
                  lineHeight: 1.7,
                  maxWidth: 540,
                  opacity: 1,
                  transition: 'opacity 600ms ease-in-out',
                }}
              >
                {spotlight[spotlightIndex].text}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: { xs: 2.5, md: 3 } }}>
              <Stack direction="column" spacing={1} sx={{ width: '100%', maxWidth: 260 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  {spotlight.map((item, idx) => (
                    <ButtonBase
                      key={item.title}
                      onClick={() => setSpotlightIndex(idx)}
                      aria-label={`Show ${item.title}`}
                      sx={{
                        width: 16,
                        height: 16,
                        minWidth: 16,
                        minHeight: 16,
                        borderRadius: '50%',
                        backgroundColor: idx === spotlightIndex ? theme.palette.secondary.main : alpha(theme.palette.common.white, 0.45),
                        transition: 'transform 180ms ease, background-color 180ms ease',
                        transform: idx === spotlightIndex ? 'scale(1.1)' : 'scale(1)',
                        '&:hover': {
                          transform: 'scale(1.35)',
                          backgroundColor: theme.palette.secondary.main,
                        },
                      }}
                    />
                  ))}
                </Stack>
                <Box
                  sx={{
                    width: '100%',
                    height: 5,
                    borderRadius: 999,
                    backgroundColor: alpha(theme.palette.common.white, 0.18),
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${((spotlightIndex + 1) / spotlight.length) * 100}%`,
                      height: '100%',
                      backgroundColor: theme.palette.secondary.main,
                      transition: 'width 450ms ease',
                    }}
                  />
                </Box>
              </Stack>

              <Stack direction="row" spacing={1}>
                <IconButton
                  aria-label="Previous spotlight"
                  onClick={handleSpotlightPrev}
                  sx={{
                    color: 'common.white',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.32)}`,
                    backgroundColor: alpha(theme.palette.common.black, 0.24),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.common.black, 0.34),
                    },
                  }}
                >
                  <ArrowForwardRoundedIcon sx={{ transform: 'rotate(180deg)' }} />
                </IconButton>
                <IconButton
                  aria-label="Next spotlight"
                  onClick={handleSpotlightNext}
                  sx={{
                    color: 'common.white',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.32)}`,
                    backgroundColor: alpha(theme.palette.common.black, 0.24),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.common.black, 0.34),
                    },
                  }}
                >
                  <ArrowForwardRoundedIcon />
                </IconButton>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Container>

      <Container maxWidth="lg" sx={{ mt: sectionSpacing }}>
        <Grid
          container
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.045 : 0.12),
          }}
        >
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2} sx={{ p: { xs: 3, md: 5 } }}>
              <Typography sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 0.6, fontSize: '0.82rem' }}>
                OPERATIONAL CONFIDENCE
              </Typography>
              <Typography sx={{ fontSize: { xs: '1.75rem', md: '2.2rem' }, fontWeight: 900, lineHeight: 1.15 }}>
                Built for professional teams, not spreadsheet chaos.
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.65 }}>
                HUZZ consolidates planning, provider booking, registrations, and ticket sales into one execution layer.
                Your team works faster, your stakeholders stay informed, and event delivery becomes repeatable.
              </Typography>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800 }}>H</Avatar>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Trusted by organizers, providers, and event operators.</Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                minHeight: { xs: 260, md: '100%' },
                backgroundImage:
                  'url(https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1400&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </Grid>
        </Grid>
      </Container>

        <Box
        sx={{
          mt: sectionSpacing,
          height: { xs: 18, md: 22 },
          backgroundColor: theme.palette.primary.main,
          boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.2)}`,
        }}
      />

      <Box
        sx={{
          py: { xs: 4, md: 5 },
          backgroundColor: alpha(theme.palette.primary.dark, 0.95),
          color: 'white',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={2.4} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <Typography sx={{ fontWeight: 800, mb: 0.6 }}>HUZZ</Typography>
              <Typography sx={{ opacity: 0.9, fontSize: '0.92rem' }}>
                Built by GROUP 34. Professional event operations platform for organizers and providers.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack direction="row" spacing={1}>
                <Button size="small" startIcon={<LinkedInIcon />} sx={{ color: 'white', textTransform: 'none' }}>
                  LinkedIn
                </Button>
                <Button size="small" startIcon={<XIcon />} sx={{ color: 'white', textTransform: 'none' }}>
                  X
                </Button>
                <Button size="small" startIcon={<InstagramIcon />} sx={{ color: 'white', textTransform: 'none' }}>
                  Instagram
                </Button>
                <Button size="small" startIcon={<GitHubIcon />} sx={{ color: 'white', textTransform: 'none' }}>
                  GitHub
                </Button>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Stack spacing={0.4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                <Typography sx={{ fontSize: '0.9rem', opacity: 0.92 }}>
                  Copyright (c) {currentYear} HUZZ
                </Typography>
                <Typography sx={{ fontSize: '0.84rem', opacity: 0.8 }}>
                  App built in {builtYear}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}

export default HomePage
