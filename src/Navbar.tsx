import React, { useMemo, useState } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import { NavLink, useNavigate } from 'react-router-dom'
import ThemeToggle from './themes/ThemeToggle'
import { useAuth } from './contexts/AuthContext'

type NavState = 'default' | 'active' | 'alternate'

interface NavbarProps {
  navState?: NavState
  activeIndex?: number
  onNavigate?: (index: number) => void
}

const navItems = [
  { label: 'About', path: '/about' },
  { label: 'Services', path: '/services' },
  { label: 'Events', path: '/events-nearby' },
  { label: 'Portfolio', path: '/portfolio' },
]

const Navbar: React.FC<NavbarProps> = ({ navState = 'default' }) => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { isLoggedIn, user, logout } = useAuth()
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAlternate = navState === 'alternate'
  const navBlack = '#101010'
  const navPanel = '#171717'
  const navText = '#F7F1EA'
  const navTextMuted = alpha(navText, 0.72)
  const navOrange = theme.palette.secondary.main
  const navOrangeDark = theme.palette.secondary.dark

  const userInitial = useMemo(() => user?.name?.charAt(0).toUpperCase() || 'U', [user])

  const navItemSx = {
    flex: 'initial',
    minWidth: 0,
    textTransform: 'none',
    fontWeight: 700,
    fontSize: '0.86rem',
    color: navTextMuted,
    borderRadius: 8,
    py: 0.45,
    px: 1.25,
    mx: 0.5,
    transition: 'background-color 220ms ease, color 220ms ease, box-shadow 220ms ease, transform 220ms ease',
    '&.active': {
      color: navBlack,
      background: `linear-gradient(135deg, ${navOrange} 0%, ${navOrangeDark} 100%)`,
      boxShadow: `0 10px 20px ${alpha(navOrange, 0.18)}`,
    },
    '&:hover': {
      color: navText,
      backgroundColor: alpha(navOrange, 0.14),
      transform: 'translateY(-1px)',
    },
    '&:focus-visible': {
      outline: `2px solid ${alpha(navOrange, 0.8)}`,
      outlineOffset: '4px',
    },
    '& .MuiButton-startIcon': {
      color: 'inherit',
      transition: 'transform 220ms ease',
    },
    '&:hover .MuiButton-startIcon': {
      transform: 'translateX(-1px)',
    },
  }

  const handleMenuClose = () => setMenuAnchor(null)

  const handleDashboard = () => {
    if (user) {
      const path =
        user.role === 'provider'
          ? '/provider-dashboard'
          : user.role === 'admin'
          ? '/admin-dashboard'
          : '/organizer-dashboard'
      navigate(path)
    }
    handleMenuClose()
  }

  const handleLogout = () => {
    logout()
    handleMenuClose()
    navigate('/')
  }

  const MobileDrawer = (
    <Box
      sx={{
        width: '100%',
        p: 2.5,
        pt: 2,
        minHeight: '100%',
        background: `linear-gradient(180deg, ${navPanel} 0%, ${navBlack} 100%)`,
        color: navText,
        '& .MuiButton-outlined': {
          color: navText,
          borderColor: alpha(navOrange, 0.42),
          '&:hover': {
            borderColor: navOrange,
            backgroundColor: alpha(navOrange, 0.12),
          },
        },
        '& .MuiButton-contained': {
          backgroundColor: navOrange,
          color: theme.palette.secondary.contrastText,
          '&:hover': {
            backgroundColor: navOrangeDark,
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              background: `linear-gradient(135deg, ${navOrange} 0%, ${navOrangeDark} 100%)`,
              color: theme.palette.secondary.contrastText,
              fontWeight: 900,
              boxShadow: `0 10px 22px ${alpha(navOrange, 0.25)}`,
            }}
          >
            a
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: navText, letterSpacing: 0.2 }}>
            HUZZ
          </Typography>
        </Box>
        <IconButton onClick={() => setMobileOpen(false)} aria-label="Close menu" sx={{ color: navText }}>
          <CloseIcon />
        </IconButton>
      </Box>
      {isLoggedIn && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            {userInitial}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{user?.name}</Typography>
            <Typography variant="body2" sx={{ color: navTextMuted }}>
              {user?.email}
            </Typography>
          </Box>
        </Box>
      )}
      <List sx={{ p: 0 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.75,
              py: 1.15,
              color: navTextMuted,
              transition: 'background-color 180ms ease, color 180ms ease, transform 180ms ease',
              '&.active': {
                backgroundColor: alpha(navOrange, 0.18),
                color: navOrange,
              },
              '&:hover': {
                backgroundColor: alpha(navOrange, 0.1),
                color: navText,
                transform: 'translateX(2px)',
              },
              '&:focus-visible': {
                outline: `2px solid ${alpha(navOrange, 0.88)}`,
                outlineOffset: '4px',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
            </Box>
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ my: 1.5, borderColor: alpha(navOrange, 0.16) }} />
      {isLoggedIn ? (
        <Box sx={{ display: 'grid', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setMobileOpen(false)
              handleDashboard()
            }}
          >
            Dashboard
          </Button>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setMobileOpen(false)
              navigate('/settings')
            }}
          >
            Settings
          </Button>
          <Button
            fullWidth
            color="error"
            variant="text"
            onClick={() => {
              setMobileOpen(false)
              handleLogout()
            }}
          >
            Logout
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gap: 1 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              setMobileOpen(false)
              navigate('/signin')
            }}
          >
            Sign In
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              setMobileOpen(false)
              navigate('/signup')
            }}
          >
            Sign Up
          </Button>
        </Box>
      )}
      <Button
        fullWidth
        variant={isAlternate ? 'outlined' : 'contained'}
        sx={{ mt: 1.5 }}
        onClick={() => {
          setMobileOpen(false)
          navigate('/contact')
        }}
      >
        Contact
      </Button>
    </Box>
  )

  return (
    <Box component="nav" sx={{ width: '100%', display: 'block' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          left: 0,
          right: 0,
          width: '100%',
          backgroundColor: navBlack,
          borderBottom: `1px solid ${alpha(navOrange, 0.16)}`,
          boxShadow: `0 10px 24px ${alpha(theme.palette.common.black, 0.22)}`,
          backdropFilter: 'blur(16px)',
          height: 58,
          justifyContent: 'center',
          zIndex: 1300,
          borderRadius: 0,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            width: '100%',
            maxWidth: '100%',
            mx: 0,
            px: { xs: 1, md: 2 },
            minHeight: '56px !important',
            gap: 0.5,
          }}
        >
          <Box
            onClick={() => navigate('/')}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              pr: 1.1,
              py: 0.45,
            }}
          >
            <Box
              sx={{
                width: { xs: 28, md: 32 },
                height: { xs: 28, md: 32 },
                borderRadius: 3,
                display: 'grid',
                placeItems: 'center',
                background: `linear-gradient(135deg, ${navOrange} 0%, ${navOrangeDark} 100%)`,
                color: theme.palette.secondary.contrastText,
                fontWeight: 900,
                fontSize: { xs: '0.85rem', md: '0.95rem' },
                boxShadow: `0 8px 20px ${alpha(navOrange, 0.24)}`,
              }}
            >
              H
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: 0.48,
                fontSize: { xs: '0.96rem', md: '1.05rem' },
                color: navText,
                lineHeight: 1,
              }}
            >
              HUZZ
            </Typography>
          </Box>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1.5,
              mx: 0,
              px: 0,
              py: 0,
              borderRadius: 0,
              border: 'none',
              backgroundColor: 'transparent',
              flex: 1,
              justifyContent: 'center',
            }}
            role="menubar"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={NavLink}
                to={item.path}
                role="menuitem"
                sx={navItemSx}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <ThemeToggle size="small" />
            </Box>
            {isLoggedIn ? (
              <>
                <Button
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                  startIcon={
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.78rem', bgcolor: navOrange, color: theme.palette.secondary.contrastText, fontWeight: 800 }}>
                      {userInitial}
                    </Avatar>
                  }
                  sx={{
                    textTransform: 'none',
                    borderRadius: 999,
                    px: 1.4,
                    color: navText,
                    border: `1px solid ${alpha(navOrange, 0.28)}`,
                    backgroundColor: alpha('#FFFFFF', 0.07),
                    display: { xs: 'none', sm: 'inline-flex' },
                    '&:hover': {
                      backgroundColor: alpha(navOrange, 0.14),
                    },
                  }}
                >
                  {user?.name}
                </Button>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 180,
                      borderRadius: 2,
                      color: navText,
                      backgroundColor: navPanel,
                      border: `1px solid ${alpha(navOrange, 0.18)}`,
                      boxShadow: `0 18px 38px ${alpha(theme.palette.common.black, 0.36)}`,
                      '& .MuiMenuItem-root': {
                        fontWeight: 600,
                        '&:hover': {
                          backgroundColor: alpha(navOrange, 0.12),
                        },
                      },
                    },
                  }}
                >
                  <MenuItem onClick={handleDashboard}>Dashboard</MenuItem>
                  <MenuItem onClick={() => { navigate('/settings'); handleMenuClose() }}>Settings</MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                <Button
                  component={NavLink}
                  to="/signin"
                  variant="outlined"
                  sx={{
                    px: 0.9,
                    py: 0.4,
                    borderRadius: 20,
                    color: navText,
                    borderColor: alpha(navOrange, 0.36),
                    transition: 'background-color 160ms ease, border-color 160ms ease, transform 160ms ease',
                    '&:hover': {
                      borderColor: navOrange,
                      backgroundColor: alpha(navOrange, 0.08),
                      transform: 'translateY(-1px)',
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${alpha(navOrange, 0.8)}`,
                      outlineOffset: '4px',
                    },
                  }}
                >
                  Sign In
                </Button>
                <Button
                  component={NavLink}
                  to="/signup"
                  variant="contained"
                  sx={{
                    px: 0.9,
                    py: 0.4,
                    borderRadius: 20,
                    background: `linear-gradient(135deg, ${navOrange} 0%, ${navOrangeDark} 100%)`,
                    color: theme.palette.secondary.contrastText,
                    boxShadow: `0 6px 14px ${alpha(navOrange, 0.18)}`,
                    transition: 'box-shadow 160ms ease, transform 160ms ease',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${navOrange} 0%, ${navOrangeDark} 100%)`,
                      boxShadow: `0 8px 18px ${alpha(navOrange, 0.22)}`,
                      transform: 'translateY(-1px)',
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${alpha(navOrange, 0.8)}`,
                      outlineOffset: '4px',
                    },
                  }}
                >
                  Sign Up
                </Button>
              </Box>
            )}
            <Button
              component={NavLink}
              to="/contact"
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                px: 0.9,
                    py: 0.4,
                borderRadius: 20,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.86rem',
                color: isAlternate ? navOrange : theme.palette.secondary.contrastText,
                background: isAlternate ? alpha(navOrange, 0.12) : `linear-gradient(135deg, ${navOrange} 0%, ${navOrangeDark} 100%)`,
                border: `1px solid ${alpha(navOrange, 0.32)}`,
                boxShadow: isAlternate ? 'none' : `0 6px 16px ${alpha(navOrange, 0.18)}`,
                '&:hover': {
                  background: isAlternate ? alpha(navOrange, 0.18) : `linear-gradient(135deg, ${navOrange} 0%, ${navOrangeDark} 100%)`,
                  boxShadow: isAlternate ? 'none' : `0 8px 18px ${alpha(navOrange, 0.22)}`,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              Contact
            </Button>
            <IconButton
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Close mobile menu' : 'Open mobile menu'}
              aria-expanded={mobileOpen}
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
                color: navText,
                border: `1px solid ${alpha(navOrange, 0.34)}`,
                backgroundColor: alpha('#FFFFFF', 0.06),
                transition: 'background-color 160ms ease, transform 160ms ease',
                ml: 0,
                mr: 0.5,
                p: 0.35,
                '&:hover': {
                  backgroundColor: alpha(navOrange, 0.16),
                  transform: 'translateY(-1px)',
                },
                '&:focus-visible': {
                  outline: `2px solid ${alpha(navOrange, 0.8)}`,
                  outlineOffset: '4px',
                },
              }}
            >
              {mobileOpen ? (
                <CloseIcon sx={{ transform: mobileOpen ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 240ms ease' }} />
              ) : (
                <MenuIcon sx={{ transform: mobileOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 240ms ease' }} />
              )}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true,
          slotProps: {
            backdrop: {
              sx: {
                backgroundColor: alpha(navBlack, 0.45),
                backdropFilter: 'blur(8px)',
              },
            },
          },
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: { xs: '85vw', sm: 320 },
            maxWidth: 360,
            backgroundColor: alpha(navBlack, 0.95),
            borderLeft: `1px solid ${alpha(navOrange, 0.26)}`,
            backdropFilter: 'blur(18px)',
            boxShadow: `-8px 24px 56px ${alpha(theme.palette.common.black, 0.36)}`,
          },
        }}
      >
        {MobileDrawer}
      </Drawer>
    </Box>
  )
}

export default Navbar






