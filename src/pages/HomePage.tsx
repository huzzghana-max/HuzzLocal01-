import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import EventIcon from '@mui/icons-material/Event'
import PeopleIcon from '@mui/icons-material/People'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SecurityIcon from '@mui/icons-material/Security'
import PaymentIcon from '@mui/icons-material/Payment'
import VerifiedIcon from '@mui/icons-material/Verified'
import CateringIcon from '@mui/icons-material/Restaurant'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import MusicNoteIcon from '@mui/icons-material/MusicNote'
import LocalFloristIcon from '@mui/icons-material/LocalFlorist'
import EditCalendarIcon from '@mui/icons-material/EditCalendar'
import TravelExploreIcon from '@mui/icons-material/TravelExplore'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import CelebrationIcon from '@mui/icons-material/Celebration'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const theme = useTheme()

  const features = [
    {
      icon: EventIcon,
      title: 'Planning Workspace',
      description: 'Create events and keep vendors, tasks, and updates in one streamlined timeline.',
      image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    },
    {
      icon: PeopleIcon,
      title: 'Trusted Providers',
      description: 'Browse vetted vendors with transparent reviews and services that fit your event goals.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    },
    {
      icon: CheckCircleIcon,
      title: 'Execution Control',
      description: 'Track bookings, status changes, and communications from planning to event day.',
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
    },
  ]

  const steps = [
    {
      icon: EditCalendarIcon,
      title: 'Create Event',
      description: 'Define your date, budget, and service requirements.',
    },
    {
      icon: TravelExploreIcon,
      title: 'Compare Options',
      description: 'Evaluate providers by portfolio, rates, and ratings.',
    },
    {
      icon: TaskAltIcon,
      title: 'Book Confidently',
      description: 'Confirm availability and secure your preferred team.',
    },
    {
      icon: CelebrationIcon,
      title: 'Deliver Smoothly',
      description: 'Manage updates and execute the event without chaos.',
    },
  ]

  const categories = [
    { icon: CateringIcon, title: 'Catering' },
    { icon: PhotoCameraIcon, title: 'Photography' },
    { icon: MusicNoteIcon, title: 'Entertainment' },
    { icon: LocalFloristIcon, title: 'Decor' },
  ]

  const trust = [
    { icon: SecurityIcon, title: 'Secure Payments', desc: 'Protected transactions and reliable billing flows.' },
    { icon: VerifiedIcon, title: 'Verified Vendors', desc: 'Provider vetting for safer event collaborations.' },
    { icon: PaymentIcon, title: 'Clear Refund Logic', desc: 'Transparent terms for safer booking decisions.' },
  ]

  return (
    <Box sx={{ backgroundColor: 'background.default' }}>
      <Box
        sx={{
          pt: { xs: 12, md: 16 },
          pb: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
          background:
            `radial-gradient(circle at 10% -20%, ${alpha(theme.palette.secondary.main, 0.22)} 0%, transparent 38%),` +
            `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.primary.dark, 0.96)} 55%, ${theme.palette.primary.dark} 100%)`,
          color: theme.palette.common.white,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            right: -120,
            top: -80,
            width: 340,
            height: 340,
            borderRadius: '50%',
            background: alpha(theme.palette.secondary.main, 0.2),
            filter: 'blur(8px)',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Stack spacing={3.2} sx={{ maxWidth: 760 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.84rem', md: '0.92rem' }, letterSpacing: 0.9, opacity: 0.9 }}>
              MODERN EVENT OPERATIONS
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2.3rem', sm: '3rem', md: '4rem' },
                lineHeight: 1.08,
              }}
            >
              Plan, book, and run events with professional precision.
            </Typography>
            <Typography sx={{ fontSize: { xs: '1rem', md: '1.18rem' }, opacity: 0.92, maxWidth: 640, lineHeight: 1.65 }}>
              HUZZ helps organizers and providers collaborate through one modern platform for bookings, messaging, and execution.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.6}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => navigate('/signup')}
                sx={{
                  py: 1.15,
                  px: 3.2,
                  borderRadius: 999,
                  backgroundColor: theme.palette.secondary.main,
                  color: '#142420',
                  fontWeight: 800,
                  border: `1px solid ${alpha('#142420', 0.22)}`,
                  boxShadow: `0 10px 24px ${alpha(theme.palette.common.black, 0.26)}`,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.secondary.main, 0.92),
                    boxShadow: `0 14px 28px ${alpha(theme.palette.common.black, 0.34)}`,
                  },
                }}
              >
                Start Free
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/browse-vendors')}
                sx={{
                  py: 1.15,
                  px: 3.2,
                  borderRadius: 999,
                  color: theme.palette.common.white,
                  borderColor: alpha(theme.palette.common.white, 0.62),
                  backgroundColor: alpha(theme.palette.common.white, 0.04),
                  '&:hover': {
                    borderColor: theme.palette.common.white,
                    backgroundColor: alpha(theme.palette.common.white, 0.12),
                  },
                }}
              >
                Browse Vendors
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Stack spacing={5}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 850, fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 1.2 }}>
              Why Teams Choose HUZZ
            </Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 620, mx: 'auto' }}>
              Built for clarity, speed, and reliability across event planning workflows.
            </Typography>
          </Box>
          <Grid container spacing={2.5}>
            {features.map((feature) => (
              <Grid key={feature.title} size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: '100%', borderRadius: 3, overflow: 'hidden', boxShadow: 'none' }}>
                  <Box sx={{ height: 190, background: `url(${feature.image}) center/cover` }} />
                  <CardContent sx={{ p: 2.5 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 1.8,
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1.4,
                      }}
                    >
                      <feature.icon />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.08rem', mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{feature.description}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Stack spacing={5}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 850, fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 1.2 }}>
              How It Works
            </Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 640, mx: 'auto' }}>
              A practical flow designed for busy event teams.
            </Typography>
          </Box>
          <Grid container spacing={2.5}>
            {steps.map((step, index) => (
              <Grid key={step.title} size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    p: 2.8,
                    borderRadius: 3,
                    backgroundColor: 'background.paper',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                    minHeight: 212,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: `0 16px 34px ${alpha(theme.palette.primary.main, 0.18)}`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      mb: 1.8,
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      backgroundColor: alpha(theme.palette.secondary.main, 0.2),
                      color: 'secondary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {index + 1}
                  </Box>
                  <step.icon sx={{ color: 'primary.main', mb: 1.2 }} />
                  <Typography sx={{ fontWeight: 800, fontSize: '1rem', mb: 0.8 }}>{step.title}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', lineHeight: 1.55 }}>
                    {step.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      <Box sx={{ py: { xs: 8, md: 11 }, backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.04 : 0.12) }}>
        <Container maxWidth="lg">
          <Stack spacing={4.2}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 850, fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 1.2 }}>
                Popular Categories
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>Discover providers across core event service categories.</Typography>
            </Box>
            <Grid container spacing={2.2}>
              {categories.map((cat) => (
                <Grid key={cat.title} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card sx={{ borderRadius: 3, boxShadow: 'none', textAlign: 'center' }}>
                    <CardContent sx={{ py: 3.2 }}>
                      <cat.icon sx={{ fontSize: 40, color: 'secondary.main', mb: 0.8 }} />
                      <Typography sx={{ fontWeight: 800 }}>{cat.title}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={2.5}>
          {trust.map((item) => (
            <Grid key={item.title} size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 3, height: '100%', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.6 }}>
                  <item.icon sx={{ color: 'secondary.main', fontSize: 36, mb: 1 }} />
                  <Typography sx={{ fontWeight: 800, mb: 0.8 }}>{item.title}</Typography>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{item.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box
        sx={{
          py: { xs: 9, md: 12 },
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: theme.palette.common.white,
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={2.2} alignItems="center" textAlign="center">
            <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '2.6rem' } }}>
              Ready to run your next event like a pro?
            </Typography>
            <Typography sx={{ opacity: 0.9, maxWidth: 680 }}>
              Join organizers and providers already using HUZZ to simplify planning and deliver better events.
            </Typography>
            <Button
              variant="contained"
              endIcon={<ArrowForwardRoundedIcon />}
              onClick={() => navigate('/signup')}
              sx={{
                mt: 1,
                px: 3.2,
                py: 1.1,
                borderRadius: 999,
                backgroundColor: theme.palette.secondary.main,
                color: '#142420',
                fontWeight: 800,
                border: `1px solid ${alpha('#142420', 0.22)}`,
                boxShadow: `0 10px 24px ${alpha(theme.palette.common.black, 0.26)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.92),
                  boxShadow: `0 14px 28px ${alpha(theme.palette.common.black, 0.34)}`,
                },
              }}
            >
              Create Account
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}

export default HomePage
