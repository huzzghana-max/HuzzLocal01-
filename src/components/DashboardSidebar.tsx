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
  notifications?: number
  messages?: number
  onLogout: () => void
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  userRole,
  userName = 'User',
  userEmail = '',
  notifications = 0,
  messages = 0,
  onLogout,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({})
  const [mobileOpen, setMobileOpen] = useState(false)

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
            path: '#analytics',
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
            path: '#analytics',
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
        bgcolor: theme.palette.background.paper,
      }}
    >
      {/* User Profile Section */}
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: theme.palette.secondary.main,
              fontWeight: 700,
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {userName}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', opacity: 0.9, textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </Typography>
          </Box>
        </Box>
        <Typography sx={{ fontSize: '0.75rem', opacity: 0.8, textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {userEmail}
        </Typography>
      </Box>

      <Divider />

      {/* Quick Stats */}
      <Box
        sx={{
          p: 2,
          display: 'grid',
          gridTemplateColumns: notifications || messages ? '1fr 1fr' : '1fr',
          gap: 1,
        }}
      >
        {notifications > 0 && (
          <Box
            sx={{
              p: 1.5,
              bgcolor: theme.palette.action.hover,
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: theme.palette.secondary.main,
                color: 'white',
              },
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', opacity: 0.7 }}>Notifications</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '1.2rem' }}>{notifications}</Typography>
          </Box>
        )}
        {messages > 0 && (
          <Box
            sx={{
              p: 1.5,
              bgcolor: theme.palette.action.hover,
              borderRadius: 1,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: theme.palette.secondary.main,
                color: 'white',
              },
            }}
          >
            <Typography sx={{ fontSize: '0.75rem', opacity: 0.7 }}>Messages</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '1.2rem' }}>{messages}</Typography>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path, item.onClick)}
                sx={{
                  py: 1.25,
                  px: 2,
                  bgcolor: isActive(item.path) ? theme.palette.action.selected : 'transparent',
                  color: isActive(item.path) ? theme.palette.secondary.main : 'inherit',
                  borderRight: isActive(item.path) ? `4px solid ${theme.palette.secondary.main}` : 'none',
                  transition: 'all 0.3s',
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive(item.path) ? theme.palette.secondary.main : 'inherit',
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
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
                      fontWeight: isActive(item.path) ? 600 : 500,
                    },
                  }}
                />
                {item.submenu && (
                  <Box sx={{ ml: 'auto' }}>
                    {expanded[item.label] ? <ExpandLess /> : <ExpandMore />}
                  </Box>
                )}
              </ListItemButton>
            </ListItem>

            {/* Submenu */}
            {item.submenu && (
              <Collapse in={expanded[item.label]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.submenu.map((subitem, subindex) => (
                    <ListItem key={subindex} disablePadding sx={{ display: 'block' }}>
                      <ListItemButton
                        onClick={() => handleNavigation(subitem.path, subitem.onClick)}
                        sx={{
                          py: 1,
                          pl: 4,
                          pr: 2,
                          bgcolor: isActive(subitem.path) ? theme.palette.action.selected : 'transparent',
                          color: isActive(subitem.path) ? theme.palette.secondary.main : 'inherit',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s',
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>{subitem.icon}</ListItemIcon>
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

            {item.submenu && (
              <ListItemButton
                onClick={() => toggleSubmenu(item.label)}
                sx={{
                  py: 0.75,
                  px: 2,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ fontSize: '0.8rem', opacity: 0.5 }}>
                  {expanded[item.label] ? 'Show less' : 'Show more'}
                </Typography>
              </ListItemButton>
            )}
          </React.Fragment>
        ))}
      </List>

      <Divider />

      {/* Footer Actions */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <ListItemButton
          onClick={() => handleNavigation('/')}
          sx={{
            borderRadius: 1,
            py: 1,
            px: 2,
            transition: 'all 0.3s',
            '&:hover': {
              bgcolor: theme.palette.action.hover,
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Back to Home" sx={{ '& .MuiTypography-root': { fontSize: '0.95rem' } }} />
        </ListItemButton>

        <ListItemButton
          onClick={onLogout}
          sx={{
            borderRadius: 1,
            py: 1,
            px: 2,
            color: 'error.main',
            transition: 'all 0.3s',
            '&:hover': {
              bgcolor: 'error.lighter',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'error.main' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" sx={{ '& .MuiTypography-root': { fontSize: '0.95rem' } }} />
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
