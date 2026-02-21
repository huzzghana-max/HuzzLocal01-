import React, { useState } from 'react'
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Typography,
  Badge,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import EventIcon from '@mui/icons-material/Event'
import AssignmentIcon from '@mui/icons-material/Assignment'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import MessageIcon from '@mui/icons-material/Message'
import ReceiptIcon from '@mui/icons-material/Receipt'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import HomeIcon from '@mui/icons-material/Home'
import ReviewsIcon from '@mui/icons-material/Reviews'
import PaymentIcon from '@mui/icons-material/Payment'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import HelpIcon from '@mui/icons-material/Help'

interface SidebarItem {
  label: string
  icon: React.ReactNode
  path?: string
  onClick?: () => void
  badge?: number
  submenu?: SidebarItem[]
}

interface DashboardSidebarProps {
  userRole: 'admin' | 'organizer' | 'provider'
  userName?: string
  userEmail?: string
  userImage?: string
  notifications?: number
  messages?: number
  onLogout: () => void
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  userRole,
  userName = 'User',
  userEmail = '',
  userImage = '',
  notifications = 0,
  messages = 0,
  onLogout,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({})
  const [mobileOpen, setMobileOpen] = useState(false)

  const storedUserImage = (() => {
    try {
      const stored = localStorage.getItem('user')
      if (!stored) return ''
      const parsed = JSON.parse(stored)
      return parsed?.profile_image || ''
    } catch {
      return ''
    }
  })()

  const avatarSrc = userImage || storedUserImage || undefined

  const toggleSubmenu = (label: string) => {
    setExpanded((prev) => ({
      ...prev,
      [label]: !prev[label],
    }))
  }

  const handleNavigation = (path?: string, onClick?: () => void) => {
    if (onClick) {
      onClick()
    } else if (path) {
      navigate(path)
    }
    setMobileOpen(false)
  }

  const getMenuItems = (): SidebarItem[] => {
    switch (userRole) {
      case 'admin':
        return [
          {
            label: 'Dashboard',
            icon: <DashboardIcon />,
            path: '/admin-dashboard',
          },
          
          /*{
            label: 'Users',
            icon: <PeopleIcon />,
            submenu: [
              { label: 'All Users', icon: <PeopleIcon />, path: '#users-all' },
              { label: 'Organizers', icon: <EventIcon />, path: '#users-organizers' },
              { label: 'Providers', icon: <VerifiedUserIcon />, path: '#users-providers' },
            ],
          },*/

          {
            label: 'Analytics',
            icon: <AnalyticsIcon />,
            path: '#analytics',
          },
          {
            label: 'Payments',
            icon: <PaymentIcon />,
            path: '#payments',
          },
          /*{
            label: 'Notifications',
            icon: <NotificationsIcon />,
            badge: notifications,
            path: '#notifications',
          },*/
          {
            label: 'Messages',
            icon: <MessageIcon />,
            badge: messages,
            path: '/messaging',
          },
          {
            label: 'Reviews & Reports',
            icon: <ReviewsIcon />,
            path: '#reviews',
          },
          {
            label: 'Support',
            icon: <HelpIcon />,
            path: '/support',
          },
          {
            label: 'Settings',
            icon: <SettingsIcon />,
            path: '/settings',
          },
        ]
      case 'organizer':
        return [
          {
            label: 'Dashboard',
            icon: <DashboardIcon />,
            path: '/organizer-dashboard',
          },
          {
            label: 'My Events',
            icon: <EventIcon />,
            submenu: [
              { label: 'Active Events', icon: <EventIcon />, path: '#events-active' },
              { label: 'Archived Events', icon: <EventIcon />, path: '#events-archived' },
              { label: 'Create Event', icon: <EventIcon />, path: '#events-create' },
            ],
          },
          {
            label: 'Registrants & Tickets',
            icon: <ReceiptIcon />,
            path: '/organizer/registrants-tickets',
          },
          {
            label: 'Bookings',
            icon: <AssignmentIcon />,
            badge: notifications,
            submenu: [
              { label: 'Pending', icon: <AssignmentIcon />, path: '#bookings-pending' },
              { label: 'Confirmed', icon: <AssignmentIcon />, path: '#bookings-confirmed' },
              { label: 'Completed', icon: <AssignmentIcon />, path: '#bookings-completed' },
            ],
          },
          {
            label: 'Messages',
            icon: <MessageIcon />,
            badge: messages,
            path: '/messaging',
          },
          {
            label: 'Analytics',
            icon: <AnalyticsIcon />,
            path: '/organizer/analytics',
          },
          {
            label: 'Providers',
            icon: <PeopleIcon />,
            path: '#providers',
          },
          {
            label: 'Support',
            icon: <HelpIcon />,
            path: '/support',
          },
          {
            label: 'Settings',
            icon: <SettingsIcon />,
            path: '/settings',
          },
        ]
      case 'provider':
        return [
          {
            label: 'Dashboard',
            icon: <DashboardIcon />,
            path: '/provider-dashboard',
          },
          /*{
            label: 'My Bookings',
            icon: <AssignmentIcon />,
            badge: notifications,
            submenu: [
              { label: 'Pending Requests', icon: <AssignmentIcon />, path: '#bookings-pending' },
              { label: 'Confirmed', icon: <AssignmentIcon />, path: '#bookings-confirmed' },
              { label: 'Completed', icon: <AssignmentIcon />, path: '#bookings-completed' },
              { label: 'Cancelled', icon: <AssignmentIcon />, path: '#bookings-cancelled' },
            ],
          },*/
          {
            label: 'Messages',
            icon: <MessageIcon />,
            badge: messages,
            path: '/messaging',
          },
          {
            label: 'Reviews & Ratings',
            icon: <ReviewsIcon />,
            path: '#reviews',
          },
          {
            label: 'Portfolio',
            icon: <EventIcon />,
            path: '/vendor-services',
          },
          {
            label: 'Earnings',
            icon: <PaymentIcon />,
            path: '#earnings',
          },
          {
            label: 'Analytics',
            icon: <AnalyticsIcon />,
            path: '/provider/analytics',
          },
          {
            label: 'Support',
            icon: <HelpIcon />,
            path: '/support',
          },
          {
            label: 'Settings',
            icon: <SettingsIcon />,
            path: '/settings',
          },
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  const isActive = (path?: string) => {
    if (!path) return false
    return location.pathname === path || location.hash === path
  }

  const SidebarContent = () => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.mode === 'light' ? '#F4F7F6' : '#091A12',
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(180deg, #F4F7F6 0%, #FFFFFF 50%, #F4F7F6 100%)'
          : 'linear-gradient(180deg, #091A12 0%, #122A1F 50%, #091A12 100%)',
      }}
    >
      {/* User Profile Section */}
      <Box
        sx={{
          p: 2.5,
          background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
          color: 'white',
          boxShadow: '0 4px 15px rgba(14, 59, 38, 0.2)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            src={avatarSrc}
            sx={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #B8E3C5 0%, #1B5E3C 100%)',
              fontWeight: 700,
              fontSize: '1.3rem',
              color: '#0E3B26',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {userName}
            </Typography>
            <Typography 
              sx={{ 
                fontSize: '0.8rem', 
                opacity: 0.85, 
                textOverflow: 'ellipsis', 
                overflow: 'hidden',
                background: 'rgba(184, 227, 197, 0.2)',
                px: 1,
                py: 0.25,
                borderRadius: '4px',
                display: 'inline-block',
              }}
            >
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ fontSize: '0.75rem', opacity: 0.75, textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {userEmail}
        </Typography>
      </Box>

      <Box sx={{ h: '2px', background: 'linear-gradient(90deg, transparent, rgba(14, 59, 38, 0.3), transparent)' }} />

      {/* Quick Stats */}
      <Box
        sx={{
          p: 2.5,
          display: 'grid',
          gridTemplateColumns: notifications || messages ? '1fr 1fr' : '1fr',
          gap: 1.5,
        }}
      >
        {notifications > 0 && (
          <Box
            sx={{
              p: 1.5,
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, rgba(14, 59, 38, 0.08) 0%, rgba(184, 227, 197, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(27, 94, 60, 0.3) 0%, rgba(184, 227, 197, 0.1) 100%)',
              border: '1px solid rgba(184, 227, 197, 0.3)',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                transition: 'left 0.6s ease',
              },
              '&:hover': {
                background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                color: 'white',
                boxShadow: '0 6px 20px rgba(14, 59, 38, 0.25)',
                transform: 'translateY(-2px)',
                '&:before': {
                  left: '100%',
                },
              },
            }}
          >
            <Typography sx={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notifications</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', mt: 0.5 }}>{notifications}</Typography>
          </Box>
        )}
        {messages > 0 && (
          <Box
            sx={{
              p: 1.5,
              background: theme.palette.mode === 'light'
                ? 'linear-gradient(135deg, rgba(14, 59, 38, 0.08) 0%, rgba(184, 227, 197, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(27, 94, 60, 0.3) 0%, rgba(184, 227, 197, 0.1) 100%)',
              border: '1px solid rgba(184, 227, 197, 0.3)',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                transition: 'left 0.6s ease',
              },
              '&:hover': {
                background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                color: 'white',
                boxShadow: '0 6px 20px rgba(14, 59, 38, 0.25)',
                transform: 'translateY(-2px)',
                '&:before': {
                  left: '100%',
                },
              },
            }}
          >
            <Typography sx={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Messages</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', mt: 0.5 }}>{messages}</Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ h: '2px', background: 'linear-gradient(90deg, transparent, rgba(14, 59, 38, 0.3), transparent)' }} />

      {/* Navigation Menu */}
      <List sx={{ flex: 1, overflow: 'auto', py: 1.5, px: 1.5 }}>
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem disablePadding sx={{ display: 'block', mb: 0.75 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path, item.onClick)}
                sx={{
                  py: 1.25,
                  px: 2,
                  borderRadius: '8px',
                  bgcolor: isActive(item.path) 
                    ? 'rgba(14, 59, 38, 0.15)'
                    : 'transparent',
                  color: isActive(item.path) ? '#0E3B26' : 'inherit',
                  border: isActive(item.path) 
                    ? '2px solid #0E3B26'
                    : '2px solid transparent',
                  fontWeight: isActive(item.path) ? 700 : 500,
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(184, 227, 197, 0.3), transparent)',
                    transition: 'left 0.6s ease',
                  },
                  '&:hover': {
                    bgcolor: isActive(item.path)
                      ? 'rgba(14, 59, 38, 0.25)'
                      : 'rgba(14, 59, 38, 0.1)',
                    color: '#0E3B26',
                    border: '2px solid rgba(14, 59, 38, 0.3)',
                    boxShadow: '0 4px 12px rgba(14, 59, 38, 0.15)',
                    transform: 'translateX(4px)',
                    '&::before': {
                      left: '100%',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive(item.path) ? '#0E3B26' : 'inherit',
                    fontWeight: 600,
                  }}
                >
                  {item.badge ? (
                    <Badge 
                      badgeContent={item.badge} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          background: 'linear-gradient(135deg, #F5A623 0%, #FF8A00 100%)',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                        }
                      }}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    '& .MuiTypography-root': {
                      fontSize: '0.95rem',
                      fontWeight: isActive(item.path) ? 700 : 500,
                    },
                  }}
                />
                {item.submenu && (
                  <Box sx={{ ml: 'auto', color: isActive(item.path) ? '#0E3B26' : 'inherit' }}>
                    {expanded[item.label] ? <ExpandLess /> : <ExpandMore />}
                  </Box>
                )}
              </ListItemButton>
            </ListItem>

            {/* Submenu */}
            {item.submenu && (
              <Collapse in={expanded[item.label]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 1.5 }}>
                  {item.submenu.map((subitem, subindex) => (
                    <ListItem key={subindex} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                      <ListItemButton
                        onClick={() => handleNavigation(subitem.path, subitem.onClick)}
                        sx={{
                          py: 0.8,
                          pl: 3,
                          pr: 2,
                          borderRadius: '6px',
                          bgcolor: isActive(subitem.path) 
                            ? 'rgba(184, 227, 197, 0.2)'
                            : 'transparent',
                          color: isActive(subitem.path) ? '#1B5E3C' : 'inherit',
                          fontSize: '0.9rem',
                          fontWeight: isActive(subitem.path) ? 600 : 400,
                          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          '&:hover': {
                            bgcolor: 'rgba(184, 227, 197, 0.15)',
                            transform: 'translateX(3px)',
                            color: '#1B5E3C',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, opacity: 0.8 }}>{subitem.icon}</ListItemIcon>
                        <ListItemText
                          primary={subitem.label}
                          sx={{
                            '& .MuiTypography-root': {
                              fontSize: '0.9rem',
                              fontWeight: isActive(subitem.path) ? 600 : 400,
                            },
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ h: '2px', background: 'linear-gradient(90deg, transparent, rgba(14, 59, 38, 0.3), transparent)' }} />

      {/* Footer Actions */}
      <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <ListItemButton
          onClick={() => handleNavigation('/')}
          sx={{
            borderRadius: '8px',
            py: 1.25,
            px: 2,
            bgcolor: 'rgba(14, 59, 38, 0.08)',
            border: '1px solid rgba(14, 59, 38, 0.15)',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(184, 227, 197, 0.3), transparent)',
              transition: 'left 0.6s ease',
            },
            '&:hover': {
              bgcolor: 'rgba(14, 59, 38, 0.15)',
              border: '1px solid rgba(14, 59, 38, 0.3)',
              color: '#0E3B26',
              boxShadow: '0 4px 12px rgba(14, 59, 38, 0.15)',
              transform: 'translateY(-2px)',
              '&::before': {
                left: '100%',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Back to Home" sx={{ '& .MuiTypography-root': { fontSize: '0.95rem', fontWeight: 600 } }} />
        </ListItemButton>

        <ListItemButton
          onClick={onLogout}
          sx={{
            borderRadius: '8px',
            py: 1.25,
            px: 2,
            color: '#FFFFFF',
            background: 'linear-gradient(135deg, #D32F2F 0%, #C62828 100%)',
            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              transition: 'left 0.6s ease',
            },
            '&:hover': {
              background: 'linear-gradient(135deg, #C62828 0%, #B71C1C 100%)',
              boxShadow: '0 6px 20px rgba(211, 47, 47, 0.3)',
              transform: 'translateY(-2px)',
              '&::before': {
                left: '100%',
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: '#FFFFFF' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            sx={{ 
              '& .MuiTypography-root': { 
                fontSize: '0.95rem', 
                fontWeight: 700,
              } 
            }} 
          />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1300,
        }}
      >
        <Tooltip title={mobileOpen ? 'Close Sidebar' : 'Open Sidebar'}>
          <IconButton
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: 'white',
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Desktop Sidebar - Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Mobile Sidebar - Temporary Drawer */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
          },
        }}
      >
        <SidebarContent />
      </Drawer>
    </>
  )
}

export default DashboardSidebar
