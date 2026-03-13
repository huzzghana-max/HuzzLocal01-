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
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Services', path: '/services' },
  { label: 'Events', path: '/events-nearby' },
]

const Navbar: React.FC<NavbarProps> = ({ navState = 'default' }) => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { isLoggedIn, user, logout } = useAuth()
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAlternate = navState === 'alternate'

  const userInitial = useMemo(() => user?.name?.charAt(0).toUpperCase() || 'U', [user])

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
    <Box sx={{ width: '100%', p: 2.5, pt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Navigation
        </Typography>
        <IconButton onClick={() => setMobileOpen(false)} aria-label="Close menu">
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
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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
              py: 1.1,
              '&.active': {
                backgroundColor: alpha(theme.palette.primary.main, 0.14),
                color: 'primary.main',
              },
            }}
          >
            <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ my: 1.5 }} />
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
          backgroundColor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.75 : 0.78),
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
          backdropFilter: 'blur(14px)',
          height: 76,
          justifyContent: 'center',
          zIndex: 1300,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            width: '100%',
            maxWidth: 1240,
            mx: 'auto',
            px: { xs: 1.5, md: 2.5 },
            minHeight: '76px !important',
            gap: 1.5,
          }}
        >
          <Box
            onClick={() => navigate('/')}
            sx={{
              cursor: 'pointer',
              px: 1,
              py: 0.5,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 900,
                letterSpacing: 0.3,
                fontSize: { xs: '1.05rem', md: '1.2rem' },
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              HUZZ
            </Typography>
          </Box>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.5,
              mx: 1,
              px: 0.8,
              py: 0.6,
              borderRadius: 999,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
              backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.05 : 0.12),
              flex: 1,
              maxWidth: 560,
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
                sx={{
                  flex: 1,
                  minWidth: 0,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: 'text.secondary',
                  borderRadius: 999,
                  py: 0.9,
                  '&.active': {
                    color: 'text.primary',
                    backgroundColor: alpha(theme.palette.background.paper, 0.9),
                    boxShadow: `0 6px 14px ${alpha(theme.palette.primary.main, 0.14)}`,
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            <ThemeToggle size="medium" />
            {isLoggedIn ? (
              <>
                <Button
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                  startIcon={
                    <Avatar sx={{ width: 26, height: 26, fontSize: '0.82rem', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                      {userInitial}
                    </Avatar>
                  }
                  sx={{
                    textTransform: 'none',
                    borderRadius: 999,
                    px: 1.4,
                    color: 'text.primary',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                    display: { xs: 'none', sm: 'inline-flex' },
                  }}
                >
                  {user?.name}
                </Button>
                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                  <MenuItem onClick={handleDashboard}>Dashboard</MenuItem>
                  <MenuItem onClick={() => { navigate('/settings'); handleMenuClose() }}>Settings</MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                <Button component={NavLink} to="/signin" variant="outlined" sx={{ px: 2, py: 0.9, borderRadius: 999 }}>
                  Sign In
                </Button>
                <Button component={NavLink} to="/signup" variant="contained" sx={{ px: 2, py: 0.9, borderRadius: 999 }}>
                  Sign Up
                </Button>
              </Box>
            )}
            <Button
              component={NavLink}
              to="/contact"
              sx={{
                display: { xs: 'none', md: 'inline-flex' },
                px: 2.2,
                py: 0.9,
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 700,
                color: isAlternate ? 'primary.main' : 'primary.contrastText',
                backgroundColor: isAlternate ? alpha(theme.palette.primary.main, 0.08) : 'primary.main',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': {
                  backgroundColor: isAlternate ? alpha(theme.palette.primary.main, 0.14) : 'primary.dark',
                },
              }}
            >
              Contact
            </Button>
            <IconButton
              onClick={() => setMobileOpen(true)}
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: { xs: '85vw', sm: 320 },
            maxWidth: 360,
            backgroundColor: 'background.paper',
            borderLeft: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {MobileDrawer}
      </Drawer>
    </Box>
  )
}

export default Navbar
