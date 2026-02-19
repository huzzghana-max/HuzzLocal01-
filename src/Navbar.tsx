// Example usage:
// <Navbar navState="active" activeIndex={1} onNavigate={(i)=>console.log(i)} />
import React, { useEffect, useState } from 'react'
import { AppBar, Toolbar, Box, Button, Typography, Menu, MenuItem, useTheme } from '@mui/material'
import { NavLink, useNavigate } from 'react-router-dom'
import ThemeToggle from './themes/ThemeToggle'

type NavState = 'default' | 'active' | 'alternate'

interface NavbarProps {
  navState?: NavState
  activeIndex?: number
  onNavigate?: (index: number) => void
}

const navItems = ['About us', 'Portfolio', 'Services', 'Events']

const Navbar: React.FC<NavbarProps> = ({ navState = 'default', activeIndex: _activeIndex = 0, onNavigate: _onNavigate, }) => {
  const isAlternate = navState === 'alternate'
  const navigate = useNavigate()
  const theme = useTheme()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        setIsLoggedIn(true)
        setUserName(user.name)
      } catch (e) {
        setIsLoggedIn(false)
      }
    }
  }, [])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleSettings = () => {
    navigate('/settings')
    handleMenuClose()
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUserName('')
    handleMenuClose()
    navigate('/')
  }

  const handleDashboard = () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
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

  return (
    <Box component="nav" sx={{ width: '100%', display: 'block' }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            left: 0,
            right: 0,
            width: '100%',
            background: theme.palette.mode === 'light' 
              ? 'rgba(255, 255, 255, 0.75)' 
              : 'rgba(15, 31, 38, 0.75)',
            backdropFilter: 'blur(12px)',
            boxShadow: theme.palette.mode === 'light'
              ? '0 2px 8px rgba(0, 0, 0, 0.05)'
              : '0 2px 8px rgba(0, 0, 0, 0.3)',
            height: 72,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            px: { xs: 1.5, sm: 3 },
            zIndex: 1300,
          }}
        >
          <Toolbar
            disableGutters
            sx={{
              width: '100%',
              maxWidth: 1200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '72px !important',
              px: { xs: 1, sm: 2 },
            }}
          >
            <Box
              onClick={() => navigate('/')}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  opacity: 0.8,
                  transform: 'scale(1.05)',
                },
              }}
            >
              <Typography
                variant="h6"
                component="div"
                sx={{
                  fontWeight: 700,
                  color: theme.palette.primary.main,
                  letterSpacing: 0.5,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
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
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.5, sm: 1.5 },
                ml: 2,
                flex: 1,
                justifyContent: 'center',
              }}
              role="menubar"
              aria-label="Main navigation"
            >
              {navItems.map((label, i) => {
                const routes = ['/about', '/portfolio', '/services', '/events-nearby']
                const to = routes[i] || '/'
                return (
                  <NavLink key={label} to={to} style={{ textDecoration: 'none' }}>
                    {({ isActive }) => (
                      <Button
                        role="menuitem"
                        sx={{
                          minWidth: 120,
                          color: isActive ? theme.palette.secondary.main : theme.palette.text.secondary,
                          opacity: 1,
                          textTransform: 'none',
                          fontWeight: isActive ? 600 : 500,
                          fontSize: { xs: '0.75rem', sm: '0.9rem' },
                          transition: 'all 200ms ease',
                          '&:hover': {
                            color: theme.palette.secondary.main,
                          },
                          '&:focus': {
                            outline: `2px solid ${theme.palette.secondary.main}`,
                            outlineOffset: 4,
                          },
                        }}
                      >
                        {label}
                      </Button>
                    )}
                  </NavLink>
                )
              })}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, gap: 1 }}>
              <ThemeToggle color="secondary" size="large" />
              {isLoggedIn ? (
                <>
                  <Button
                    onClick={handleMenuOpen}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      color: theme.palette.secondary.main,
                      fontSize: { xs: '0.75rem', sm: '0.9rem' },
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'light' 
                          ? 'rgba(244, 166, 74, 0.1)' 
                          : 'rgba(242, 178, 97, 0.1)',
                      },
                    }}
                  >
                    {userName}
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={handleDashboard}>Go to Dashboard</MenuItem>
                    <MenuItem onClick={handleSettings}>Settings</MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    component={NavLink}
                    to="/signin"
                    sx={{
                      borderRadius: '8px',
                      px: { xs: 1.5, sm: 2.5 },
                      py: 0.8,
                      fontWeight: 700,
                      fontSize: { xs: '0.75rem', sm: '0.9rem' },
                      color: '#0E3B26',
                      textTransform: 'none',
                      border: '2px solid #0E3B26',
                      backgroundColor: 'transparent',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        transition: 'left 0.6s ease',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(14, 59, 38, 0.08)',
                        borderColor: '#1B5E3C',
                        color: '#1B5E3C',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(14, 59, 38, 0.25)',
                        '&::before': {
                          left: '100%',
                        },
                      },
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    component={NavLink}
                    to="/signup"
                    sx={{
                      borderRadius: '8px',
                      px: { xs: 1.5, sm: 2.5 },
                      py: 0.8,
                      fontWeight: 700,
                      fontSize: { xs: '0.75rem', sm: '0.9rem' },
                      background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                      color: '#FFFFFF',
                      textTransform: 'none',
                      boxShadow: '0 4px 15px rgba(14, 59, 38, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        transition: 'left 0.6s ease',
                      },
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1B5E3C 0%, #0E3B26 100%)',
                        boxShadow: '0 8px 25px rgba(14, 59, 38, 0.4)',
                        transform: 'translateY(-3px)',
                        '&::before': {
                          left: '100%',
                        },
                      },
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
              <Button
                component={NavLink}
                to="/contact"
                aria-label="Contact us"
                sx={{
                  borderRadius: '8px',
                  px: { xs: 1.5, sm: 2.5 },
                  py: 0.8,
                  fontWeight: 700,
                  fontSize: { xs: '0.75rem', sm: '0.9rem' },
                  background: isAlternate 
                    ? 'transparent'
                    : 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                  color: isAlternate ? '#0E3B26' : '#FFFFFF',
                  border: isAlternate ? '2px solid #0E3B26' : '2px solid transparent',
                  boxShadow: isAlternate 
                    ? 'none'
                    : '0 4px 15px rgba(14, 59, 38, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    transition: 'left 0.6s ease',
                  },
                  '&:hover': {
                    backgroundColor: isAlternate 
                      ? 'rgba(14, 59, 38, 0.08)'
                      : undefined,
                    background: isAlternate
                      ? undefined
                      : 'linear-gradient(135deg, #1B5E3C 0%, #0E3B26 100%)',
                    borderColor: isAlternate ? '#1B5E3C' : 'transparent',
                    color: isAlternate ? '#1B5E3C' : '#FFFFFF',
                    boxShadow: isAlternate
                      ? 'none'
                      : '0 8px 25px rgba(14, 59, 38, 0.4)',
                    transform: 'translateY(-3px)',
                    '&::before': {
                      left: '100%',
                    },
                  },
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                  },
                }}
              >
                Contact us
              </Button>
            </Box>
          </Toolbar>
        </AppBar>
    </Box>
  )
}

export default Navbar
