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
import { alpha, useTheme } from '@mui/material/styles'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import EventIcon from '@mui/icons-material/Event'
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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'

interface SidebarItem {
  label: string
  icon: React.ReactNode
  path?: string
  onClick?: () => void
  badge?: number
  submenu?: SidebarItem[]
}

type DashboardUserRole = 'admin' | 'organizer' | 'provider'

interface DashboardSidebarProps {
  userRole: string
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
  const normalizedUserRole: DashboardUserRole | null =
    userRole === 'admin' || userRole === 'organizer' || userRole === 'provider'
      ? userRole
      : null

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

  const handleItemClick = (item: SidebarItem) => {
    if (item.submenu) {
      toggleSubmenu(item.label)
      return
    }
    handleNavigation(item.path, item.onClick)
  }

  const getMenuItems = (): SidebarItem[] => {
    switch (normalizedUserRole) {
      case 'admin':
        return [
          {
            label: 'Dashboard',
            icon: <DashboardIcon />,
            path: '/admin-dashboard',
          },
         /* {
            label: 'Analytics',
            icon: <AnalyticsIcon />,
            path: '#analytics',
          },*/
          {
            label: 'Payments',
            icon: <PaymentIcon />,
            path: '/admin/payout-requests',
          },
          {
            label: 'Messages',
            icon: <MessageIcon />,
            badge: messages,
            path: '/messaging',
          },
          {
            label: 'Reports',
            icon: <ReviewsIcon />,
            path: '/admin/reports',
          },
          {
            label: 'Organizer Reports',
            icon: <ReviewsIcon />,
            path: '/organizer/reports',
          },
          {
            label: 'Support Tickets',
            icon: <HelpIcon />,
            path: '/admin/support-tickets',
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
            label: 'Registrants & Tickets',
            icon: <ReceiptIcon />,
            path: '/organizer/registrants-tickets',
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
            path: '/browse-vendors',
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
          {
            label: 'Messages',
            icon: <MessageIcon />,
            badge: messages,
            path: '/messaging',
          },
          {
            label: 'Reports',
            icon: <ReviewsIcon />,
            path: '/provider/reports',
          },
          {
            label: 'Portfolio',
            icon: <EventIcon />,
            path: '/vendor-services',
          },
          {
            label: 'Availability Calendar',
            icon: <CalendarMonthIcon />,
            path: '/vendor-availability',
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
        bgcolor: 'background.paper',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.06),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Avatar
            src={avatarSrc}
            sx={{
              width: 40,
              height: 40,
              bgcolor: theme.palette.primary.main,
              fontWeight: 700,
              fontSize: '1rem',
              color: theme.palette.primary.contrastText,
              border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {userName}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: 'text.secondary',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                px: 0.75,
                py: 0.2,
                borderRadius: 999,
                display: 'inline-block',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {userEmail}
        </Typography>
      </Box>

      <Box
        sx={{
          p: 1.5,
          display: 'grid',
          gridTemplateColumns: notifications || messages ? '1fr 1fr' : '1fr',
          gap: 0.75,
        }}
      >
        {notifications > 0 && (
          <Box
            sx={{
              p: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              borderRadius: 2,
              textAlign: 'center',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.13),
              },
            }}
          >
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>Notifications</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mt: 0.25 }}>{notifications}</Typography>
          </Box>
        )}
        {messages > 0 && (
          <Box
            sx={{
              p: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
              borderRadius: 2,
              textAlign: 'center',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.13),
              },
            }}
          >
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', fontWeight: 600 }}>Messages</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mt: 0.25 }}>{messages}</Typography>
          </Box>
        )}
      </Box>

      <Divider />

      <List sx={{ flex: 1, overflow: 'auto', py: 1, px: 1 }}>
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleItemClick(item)}
                sx={{
                  py: 0.8,
                  px: 1.5,
                  borderRadius: 2,
                  bgcolor: isActive(item.path) ? alpha(theme.palette.primary.main, 0.14) : 'transparent',
                  color: isActive(item.path) ? 'primary.main' : 'text.primary',
                  border: `1px solid ${isActive(item.path) ? alpha(theme.palette.primary.main, 0.3) : 'transparent'}`,
                  fontWeight: isActive(item.path) ? 700 : 500,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                    fontWeight: 600,
                  }}
                >
                  {item.badge ? (
                    <Badge
                      badgeContent={item.badge}
                      color="error"
                      sx={{ '& .MuiBadge-badge': { fontWeight: 700, fontSize: '0.6rem' } }}
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
                  <Box sx={{ ml: 'auto', color: isActive(item.path) ? 'primary.main' : 'text.secondary' }}>
                    {expanded[item.label] ? <ExpandLess /> : <ExpandMore />}
                  </Box>
                )}
              </ListItemButton>
            </ListItem>

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
                          borderRadius: 1.5,
                          bgcolor: isActive(subitem.path) ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                          color: isActive(subitem.path) ? 'primary.main' : 'text.secondary',
                          fontSize: '0.9rem',
                          fontWeight: isActive(subitem.path) ? 600 : 400,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: 'primary.main',
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

      <Divider />

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <ListItemButton
          onClick={() => handleNavigation('/')}
          sx={{
            borderRadius: 2,
            py: 1.1,
            px: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              borderColor: alpha(theme.palette.primary.main, 0.35),
              color: 'primary.main',
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
            borderRadius: 2,
            py: 1.1,
            px: 2,
            color: theme.palette.error.main,
            backgroundColor: alpha(theme.palette.error.main, 0.08),
            border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.15),
              borderColor: alpha(theme.palette.error.main, 0.4),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            sx={{
              '& .MuiTypography-root': {
                fontSize: '0.95rem',
                fontWeight: 700,
              },
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <>
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
              color: theme.palette.primary.contrastText,
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Tooltip>
      </Box>

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
