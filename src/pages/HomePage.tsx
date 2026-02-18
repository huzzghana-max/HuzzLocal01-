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
import { useTheme } from '@mui/material/styles'
import { keyframes } from '@mui/system'
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

// Animation keyframes
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const fadeInDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
`

const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const muiTheme = useTheme()

  return (
    <Box sx={{ background: muiTheme.palette.background.default }}>
      {/* Hero Section */}
      <Box
        sx={{
          backgroundImage: `linear-gradient(135deg, rgba(31, 77, 92, 0.85) 0%, rgba(1, 22, 29, 0.69) 100%), url('https://i.pinimg.com/1200x/43/ee/75/43ee757d7a791045e4168cb1bcc7b7d3.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: muiTheme.palette.primary.main,
          py: { xs: 20, md: 24 },
          color: 'white',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={4} alignItems="center" justifyContent="center">
            <Typography
              variant="h1"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2.5rem', sm: '3.2rem', md: '4rem' },
                lineHeight: 1.15,
                color: '#ffffff',
                letterSpacing: '-0.5px',
                animation: `${fadeInDown} 0.8s ease-out`,
              }}
            >
              Plan Your Perfect Event
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                lineHeight: 1.7,
                opacity: 0.95,
                maxWidth: '600px',
                fontWeight: 400,
                animation: `${fadeInUp} 0.8s ease-out 0.2s both`,
              }}
            >
              Connect with trusted vendors and manage every aspect of your event seamlessly
            </Typography>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={3}
              sx={{ animation: `${fadeInUp} 0.8s ease-out 0.4s both` }}
            >
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/signup')}
                sx={{
                  backgroundColor: muiTheme.palette.secondary.main,
                  color: muiTheme.palette.primary.main,
                  fontWeight: 800,
                  padding: '14px 40px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 0,
                    height: 0,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    transform: 'translate(-50%, -50%)',
                    transition: 'width 0.6s, height 0.6s',
                  },
                  '&:hover': {
                    backgroundColor: muiTheme.palette.secondary.light,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.35)',
                    '&::before': {
                      width: 300,
                      height: 300,
                    }
                  },
                }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/browse-vendors')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  fontWeight: 800,
                  padding: '14px 40px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  borderWidth: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: muiTheme.palette.secondary.main,
                    color: muiTheme.palette.secondary.main,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Browse Vendors
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 12, md: 18 } }}>
        <Stack spacing={12}>
          <Stack 
            spacing={2} 
            sx={{ 
              textAlign: 'center',
              animation: `${fadeInUp} 0.8s ease-out`,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2rem', md: '2.8rem' },
                color: muiTheme.palette.primary.main,
              }}
            >
              Why Choose Us
            </Typography>
            <Box sx={{textAlign : 'center'}}>
              <Typography
                sx={{
                  fontSize: '1.1rem',
                  color: muiTheme.palette.text.secondary,
                  maxWidth: '500px',
                  mx: 'auto',
                  textAlign:'center' 
              }}
              >
              Everything you need for seamless event planning
              </Typography>
            </Box>
          </Stack>
          <Grid container spacing={4}>
            {[
              {
                icon: EventIcon,
                title: 'Easy Event Planning',
                description: 'Create and manage events with an intuitive interface designed for everyone.',
                image: 'https://i.pinimg.com/1200x/05/b9/0a/05b90ac7017405a5ce3dd968b5d1da19.jpg',
              },
              {
                icon: PeopleIcon,
                title: 'Connect with Vendors',
                description: 'Find and book trusted service providers tailored to your needs.',
                image: 'https://i.pinimg.com/736x/dc/6f/62/dc6f626eed0546beb9c3a99efc48e635.jpg',
              },
              {
                icon: CheckCircleIcon,
                title: 'Seamless Management',
                description: 'Coordinate all details in one place with real-time updates.',
                image: 'https://i.pinimg.com/1200x/65/8e/8f/658e8fe6f6fde5656c959b6e1db2bc47.jpg',
              },
            ].map((feature, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: '12px',
                    border: `2px solid ${muiTheme.palette.divider}`,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: `${fadeInUp} 0.8s ease-out ${0.1 * (index + 1)}s both`,
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      borderColor: muiTheme.palette.secondary.main,
                      boxShadow: `0 20px 50px ${muiTheme.palette.secondary.main}20`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 200,
                      background: `url(${feature.image}) center/cover`,
                      position: 'relative',
                      overflow: 'hidden',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(135deg, ${muiTheme.palette.primary.main}80 0%, ${muiTheme.palette.secondary.main}60 100%)`,
                        opacity: 0.3,
                      }
                    }}
                  />
                  <CardContent sx={{ p: 4, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%' }}>
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        mx: 'auto',
                        mb: 2,
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${muiTheme.palette.secondary.main}20 0%, ${muiTheme.palette.secondary.main}05 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                      }}
                    >
                      <feature.icon
                        sx={{
                          fontSize: 40,
                          color: muiTheme.palette.secondary.main,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        mb: 1.5,
                        fontSize: '1.2rem',
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: muiTheme.palette.text.secondary,
                        lineHeight: 1.6,
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      {/* Statistics Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${muiTheme.palette.primary.main} 0%, ${muiTheme.palette.primary.dark} 100%)`,
          color: 'white',
          py: { xs: 12, md: 16 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${muiTheme.palette.secondary.main}15 0%, transparent 70%)`,
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6}>
            {[
              { number: '500+', label: 'Events Planned' },
              { number: '1000+', label: 'Trusted Vendors' },
              { number: '10K+', label: 'Happy Clients' },
            ].map((stat, index) => (
              <Grid 
                size={{ xs: 12, sm: 4 }} 
                key={index} 
                sx={{ 
                  textAlign: 'center',
                  animation: `${fadeInUp} 0.8s ease-out ${0.1 * (index + 1)}s both`,
                }}
              >
                <Box sx={{ animation: `${pulse} 3s ease-in-out infinite` }}>
                  <Typography
                    sx={{
                      fontSize: { xs: '2.5rem', md: '3.2rem' },
                      fontWeight: 900,
                      mb: 1,
                      background: `linear-gradient(135deg, ${muiTheme.palette.secondary.main} 0%, #fff 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {stat.number}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.1rem',
                      fontWeight: 500,
                      opacity: 0.9,
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works - Simple & Clean */}
      <Container maxWidth="lg" sx={{ py: { xs: 10, md: 16 } }}>
        <Stack spacing={10}>
          {/* Header */}
          <Stack spacing={2} sx={{ textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2rem', md: '2.8rem' },
                color: muiTheme.palette.text.primary,
              }}
            >
              How It Works
            </Typography>
            <Box sx={{textAlign:'center'}}>
              <Typography
                sx={{
                  fontSize: '1.1rem',
                  color: muiTheme.palette.text.secondary,
                  maxWidth: '500px',
                  mx: 'auto',
                }}
              >
                Four simple steps to plan your perfect event
              </Typography>
            </Box>
          </Stack>

          {/* Steps */}
          <Grid container spacing={3}>
            {[
              { icon: '📅', title: 'Create Event', description: 'Set up your event details and requirements' },
              { icon: '🔍', title: 'Browse Vendors', description: 'Explore trusted vendors in your area' },
              { icon: '✅', title: 'Book Services', description: 'Reserve your selected vendors easily' },
              { icon: '🎉', title: 'Manage & Enjoy', description: 'Coordinate seamlessly on the day' },
            ].map((item, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    background: muiTheme.palette.background.paper,
                    border: `1.5px solid ${muiTheme.palette.divider}`,
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      borderColor: muiTheme.palette.primary.main,
                      boxShadow: `0 12px 30px ${muiTheme.palette.primary.main}15`,
                    },
                  }}
                >
                  {/* Step Number Badge */}
                  <Box
                    sx={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${muiTheme.palette.primary.main} 0%, ${muiTheme.palette.secondary.main} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '1.25rem',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {index + 1}
                  </Box>

                  {/* Icon */}
                  <Typography sx={{ fontSize: '2.5rem', mb: 1.5 }}>
                    {item.icon}
                  </Typography>

                  {/* Title */}
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      mb: 1,
                      color: muiTheme.palette.text.primary,
                    }}
                  >
                    {item.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    sx={{
                      fontSize: '0.95rem',
                      color: muiTheme.palette.text.secondary,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* CTA */}
          <Stack sx={{ alignItems: 'center' }}>
            <Button
              onClick={() => navigate('/browse-vendors')}
              sx={{
                px: 5,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${muiTheme.palette.primary.main} 0%, ${muiTheme.palette.secondary.main} 100%)`,
                color: 'white',
                borderRadius: '50px',
                textTransform: 'none',
                boxShadow: `0 10px 25px ${muiTheme.palette.primary.main}30`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 15px 35px ${muiTheme.palette.primary.main}40`,
                },
              }}
            >
              Start Planning Now →
            </Button>
          </Stack>
        </Stack>
      </Container>

      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 12, md: 18 } }}>
        <Stack spacing={12}>
          <Stack 
            spacing={2} 
            sx={{ 
              textAlign: 'center',
              animation: `${fadeInUp} 0.8s ease-out`,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2rem', md: '2.8rem' },
                color: muiTheme.palette.primary.main,
              }}
            >
              Popular Categories
            </Typography>
            <Box sx={{textAlign : 'center'}}>
              <Typography
                sx={{
                  fontSize: '1.1rem',
                  color: muiTheme.palette.text.secondary,
                  maxWidth: '500px',
                  mx: 'auto',
                }}
              >
                Find vendors for every aspect of your event
              </Typography>
            </Box>
          </Stack>
          <Grid container spacing={4}>
            {[
              { 
                icon: CateringIcon, 
                title: 'Catering',
                image: 'https://i.pinimg.com/1200x/6d/32/30/6d32307ec0ca4f85bd33e191f0a51b00.jpg'
              },
              { 
                icon: PhotoCameraIcon, 
                title: 'Photography',
                image: 'https://i.pinimg.com/1200x/80/59/a3/8059a3d683e09c0a7b7d760767c3af4d.jpg'
              },
              { 
                icon: MusicNoteIcon, 
                title: 'Entertainment',
                image: 'https://i.pinimg.com/1200x/0c/5c/9d/0c5c9d91ab33adf9b3e6f6662b413096.jpg'
              },
              { 
                icon: LocalFloristIcon, 
                title: 'Decorations',
                image: 'https://i.pinimg.com/736x/bf/bc/31/bfbc310dc4b6b0982d28be0c9b4ee59b.jpg'
              },
            ].map((cat, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: '12px',
                    border: `2px solid ${muiTheme.palette.divider}`,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    animation: `${fadeInUp} 0.8s ease-out ${0.1 * (index + 1)}s both`,
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      borderColor: muiTheme.palette.secondary.main,
                      boxShadow: `0 20px 50px ${muiTheme.palette.secondary.main}20`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 180,
                      background: `url(${cat.image}) center/cover`,
                      position: 'relative',
                      transition: 'transform 0.4s ease',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(135deg, ${muiTheme.palette.primary.main}70 0%, ${muiTheme.palette.secondary.main}50 100%)`,
                        opacity: 0.4,
                        transition: 'opacity 0.3s ease',
                      }
                    }}
                  />
                  <CardContent sx={{ p: 3, textAlign: 'center', background: muiTheme.palette.background.default, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <cat.icon
                      sx={{
                        fontSize: 40,
                        color: muiTheme.palette.secondary.main,
                        mb: 1,
                      }}
                    />
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                      }}
                    >
                      {cat.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      {/* Testimonials Section */}
      {/*<Container maxWidth="lg" sx={{ py: { xs: 12, md: 18 } }}>
        <Stack spacing={12}>
          <Stack 
            spacing={2} 
            sx={{ 
              textAlign: 'center',
              animation: `${fadeInUp} 0.8s ease-out`,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2rem', md: '2.8rem' },
                color: muiTheme.palette.primary.main,
              }}
            >
              What Our Clients Say
            </Typography>
            <Typography
              sx={{
                fontSize: '1.1rem',
                color: muiTheme.palette.text.secondary,
                maxWidth: '500px',
                mx: 'auto',
              }}
            >
              Real feedback from real customers
            </Typography>
          </Stack>
          <Grid container spacing={4}>
            {[
              {
                name: 'Sarah Johnson',
                role: 'Event Organizer',
                rating: 5,
                text: 'HUZZ made planning my wedding so easy. The vendor selection was amazing!',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
              },
              {
                name: 'Michael Chen',
                role: 'Corporate Event Manager',
                rating: 5,
                text: 'Best event planning platform. Everything was organized and professional.',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
              },
              {
                name: 'Emma Davis',
                role: 'Party Planner',
                rating: 5,
                text: 'Highly recommend! Found all vendors in one place and saved so much time.',
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
              },
            ].map((testimonial, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: '16px',
                    border: `2px solid ${muiTheme.palette.divider}`,
                    p: 4,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: `${fadeInUp} 0.8s ease-out ${0.1 * (index + 1)}s both`,
                    position: 'relative',
                    '&::before': {
                      content: '"💬"',
                      position: 'absolute',
                      top: '-15px',
                      left: '20px',
                      fontSize: '2.5rem',
                      opacity: 0.2,
                    },
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      borderColor: muiTheme.palette.secondary.main,
                      boxShadow: `0 20px 50px ${muiTheme.palette.secondary.main}20`,
                    },
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Stack spacing={3} alignItems="flex-start" justifyContent="flex-start">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Avatar
                          src={testimonial.image}
                          sx={{
                            width: 60,
                            height: 60,
                            border: `3px solid ${muiTheme.palette.secondary.main}`,
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '1rem', textAlign: 'left' }}>
                            {testimonial.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: muiTheme.palette.text.secondary, textAlign: 'left' }}>
                            {testimonial.role}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex' }}>
                        <Rating value={testimonial.rating} readOnly size="small" />
                      </Box>
                      <Typography
                        sx={{
                          fontStyle: 'italic',
                          color: muiTheme.palette.text.secondary,
                          lineHeight: 1.7,
                          fontSize: '0.95rem',
                          textAlign: 'left',
                        }}
                      >
                        "{testimonial.text}"
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>*/}

      {/* Trust Section */}
      <Box
        sx={{
          bg: muiTheme.palette.mode === 'dark' ? muiTheme.palette.background.paper : '#f8f9fa',
          py: { xs: 12, md: 18 },
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={12}>
            <Stack 
              spacing={2} 
              sx={{ 
                textAlign: 'center',
                animation: `${fadeInUp} 0.8s ease-out`,
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2rem', md: '2.8rem' },
                  color: muiTheme.palette.primary.main,
                }}
              >
                Trusted & Secure
              </Typography>
              <Box sx={{textAlign : 'center'}}>
                <Typography
                  sx={{
                    textAlign:'center',
                    fontSize: '1.1rem',
                    color: muiTheme.palette.text.secondary,
                    maxWidth: '500px',
                    mx: 'auto',
                  }}
                >
                  Your data and transactions are protected
                </Typography>
              </Box>
            </Stack>
            <Grid container spacing={4}>
              {[
                { icon: SecurityIcon, title: 'Secure Payments', desc: 'SSL encrypted transactions' },
                { icon: VerifiedIcon, title: 'Verified Vendors', desc: 'All vendors thoroughly vetted' },
                { icon: PaymentIcon, title: 'Money Back', desc: '100% satisfaction guaranteed' },
              ].map((trust, index) => (
                <Grid size={{ xs: 12, md: 4 }} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '12px',
                      border: `2px solid ${muiTheme.palette.divider}`,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: `${fadeInUp} 0.8s ease-out ${0.1 * (index + 1)}s both`,
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        borderColor: muiTheme.palette.secondary.main,
                        boxShadow: `0 20px 50px ${muiTheme.palette.secondary.main}20`,
                      },
                    }}
                  >
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <trust.icon
                        sx={{
                          fontSize: 56,
                          color: muiTheme.palette.secondary.main,
                          mb: 2,
                        }}
                      />
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '1.2rem',
                          mb: 1,
                        }}
                      >
                        {trust.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: muiTheme.palette.text.secondary,
                        }}
                      >
                        {trust.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${muiTheme.palette.primary.main} 0%, ${muiTheme.palette.primary.dark} 100%)`,
          color: 'white',
          py: { xs: 12, md: 16 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${muiTheme.palette.secondary.main}15 0%, transparent 70%)`,
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={4} sx={{ animation: `${fadeInUp} 0.8s ease-out` }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2rem', md: '2.8rem' },
              }}
            >
              Ready to Plan Your Event?
            </Typography>
            <Typography
              sx={{
                fontSize: '1.1rem',
                opacity: 0.95,
              }}
            >
              Join thousands of happy customers who have successfully planned their events with HUZZ
            </Typography>
            <Box sx ={{alignItems:'center'}}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/signup')}
                sx={{
                  backgroundColor: muiTheme.palette.secondary.main,
                  color: muiTheme.palette.primary.main,
                  fontWeight: 800,
                  padding: '14px 40px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  width: 'fit-content',
                  mx: 'auto',
                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.25)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 0,
                    height: 0,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    transform: 'translate(-50%, -50%)',
                    transition: 'width 0.6s, height 0.6s',
                  },
                  '&:hover': {
                    backgroundColor: muiTheme.palette.secondary.light,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.35)',
                    '&::before': {
                      width: 300,
                      height: 300,
                    }
                  },
                }}
              >
                Get Started Today
              </Button>
            </Box>
            
          </Stack>
          <br />
          <Box sx={{alignItems: 'center'}}>
            <Typography
              sx={{
                  fontSize: '1.1rem',
                  opacity: 0.30,
              }}
            >
              All Copyright reserved | Built in 2026 
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default HomePage
