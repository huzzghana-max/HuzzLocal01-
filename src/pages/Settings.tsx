/*
  File: src/pages/Settings.tsx
  Purpose: Account & appearance settings UI (profile update, password change, notifications, theme).

  Major responsibilities:
  - Profile updates including profile image upload (PUT `/api/settings/profile`)
  - Password-change flow (requires `currentPassword`) and client-side validation
  - Theme toggle wired to `ThemeContext` (persists to localStorage)
  - Notification and privacy settings (mocked / saved via API)

  Where it affects the UI / routes:
  - Route: `/settings`
  - Affects user account behavior and appearance across the app (theme persistence)

  Important notes:
  - Password-change relies on the server to verify the `currentPassword` and return
    clear 4xx responses when validation fails; integration tests assert these cases.
*/
import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  FormGroup,
  Avatar,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Stack,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useTheme as useAppTheme } from '../themes/ThemeContext'
import { API_CONFIG } from '../config/api.config'
import SaveIcon from '@mui/icons-material/Save'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import DashboardSidebar from '../components/DashboardSidebar'

interface User {
  id: number
  name: string
  email: string
  phone?: string
  role: 'admin' | 'organizer' | 'provider'
  profile_image?: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>}
    </div>
  )
}

const Settings: React.FC = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    messageNotifications: true,
    bookingNotifications: true,
    paymentNotifications: true,
  })

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public' as 'public' | 'private' | 'friends',
    allowMessagesFromAnyone: true,
  })

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string>('')

  // Theme (light / dark)
  const { mode, toggleTheme } = useAppTheme()
  const handleToggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light'
    toggleTheme()
    setSuccessMessage(`${newMode.charAt(0).toUpperCase() + newMode.slice(1)} theme enabled`)
    setTimeout(() => setSuccessMessage(''), 2500)
  }

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      setLoading(false)
      navigate('/signin')
      return
    }
    const user = JSON.parse(userStr)
    setCurrentUser(user)
    
    // Initialize profile data immediately from localStorage
    setProfileData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
    })
    setProfileImagePreview(user.profile_image || '')
    
    // Set loading to false immediately - don't wait for API
    setLoading(false)
    
    // Fetch settings in background (non-blocking)
    fetchSettings()
  }, [navigate])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Non-blocking API call
      const response = await api.get('/settings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      // Update state with fetched settings if available
      if (response.data?.notifications) {
        setNotifications(response.data.notifications)
      }
      if (response.data?.privacy) {
        setPrivacy(response.data.privacy)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      // Use defaults if API fails - no error shown since defaults are fine
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleProfileVisibilityChange = (
    _event: React.MouseEvent<HTMLElement>,
    value: 'public' | 'private' | 'friends' | null,
  ) => {
    if (!value) return
    setPrivacy((prev) => ({ ...prev, profileVisibility: value }))
  }

  const handlePrivacyChange = (key: 'allowMessagesFromAnyone') => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setProfileImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    if (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('Passwords do not match!')
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('name', profileData.name)
      formData.append('email', profileData.email)
      formData.append('phone', profileData.phone)
      if (passwordData.newPassword) {
        formData.append('currentPassword', passwordData.currentPassword)
        formData.append('newPassword', passwordData.newPassword)
      }
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile)
      }

      const response = await api.put('/settings/profile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      // Update localStorage (normalize any relative image paths)
      const apiHost = API_CONFIG.getApiHost()
      const normalizeProfileImage = (imagePath?: string) => {
        if (!imagePath) return ''
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath
        if (imagePath.startsWith('/uploads/')) return `${apiHost}${imagePath}`
        if (imagePath.startsWith('uploads/')) return `${apiHost}/${imagePath}`
        return imagePath
      }
      const persistedProfileImage =
        response.data?.user?.profile_image ??
        currentUser?.profile_image ??
        ''
      const updatedUserRaw = { ...currentUser, ...response.data.user, profile_image: persistedProfileImage }
      const updatedUser = {
        ...updatedUserRaw,
        profile_image: normalizeProfileImage(updatedUserRaw.profile_image),
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      if (updatedUser.email && updatedUser.profile_image) {
        localStorage.setItem(`profileImage:${updatedUser.email}`, updatedUser.profile_image || '')
      }
      setCurrentUser(updatedUser)
      setProfileImagePreview(updatedUser.profile_image || '')

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setErrorMessage('')
      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      await api.put('/settings/notifications', notifications, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setErrorMessage('')
      setSuccessMessage('Notification preferences saved!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePrivacy = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      await api.put('/settings/privacy', privacy, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setErrorMessage('')
      setSuccessMessage('Privacy settings saved!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to save privacy settings')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/signin')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
        {currentUser && (
          <DashboardSidebar
            userRole={currentUser.role}
            userName={currentUser.name}
            userEmail={currentUser.email}
            userImage={currentUser.profile_image}
            onLogout={handleLogout}
          />
        )}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', ml: { xs: 0, md: '280px' } }}>
          <CircularProgress />
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {/* Sidebar */}
      {currentUser && (
        <DashboardSidebar
          userRole={currentUser.role as 'admin' | 'organizer' | 'provider'}
          userName={currentUser.name}
          userEmail={currentUser.email}
          userImage={currentUser.profile_image}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 2, md: 4 }, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', gap: 2 }}>
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            p: { xs: 2.4, md: 3.2 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.22),
            backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.08 : 0.18),
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -70,
              right: -60,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: alpha(theme.palette.secondary.main, 0.18),
              filter: 'blur(8px)',
            }}
          />
          <Box sx={{ position: 'relative' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.55rem', md: '2rem' }, color: 'text.primary' }}>
              Account Settings
            </Typography>
            <Typography sx={{ mt: 0.8, color: 'text.secondary', fontSize: { xs: '0.92rem', md: '0.98rem' }, maxWidth: 720 }}>
              Update your identity, security preferences, notifications, and profile visibility in one place.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
              <Chip size="small" label={mode === 'dark' ? 'Dark theme' : 'Light theme'} color="primary" variant="filled" />
              <Chip size="small" label={currentUser?.role ? `${currentUser.role} account` : 'Account'} variant="outlined" />
              <Chip size="small" label="Secure profile controls" variant="outlined" />
            </Stack>
          </Box>
        </Paper>
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2.5 }}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2.5 }}>
              {errorMessage}
            </Alert>
          )}

          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.16),
              boxShadow: theme.palette.mode === 'light'
                ? `0 16px 36px ${alpha(theme.palette.primary.main, 0.12)}`
                : `0 16px 36px ${alpha(theme.palette.common.black, 0.4)}`,
              backgroundColor: alpha(theme.palette.background.paper, 0.92),
              backdropFilter: 'blur(6px)',
              overflow: 'hidden',
            }}
          >
            {/* Tabs */}
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: { xs: 1.2, sm: 2.2 },
                py: 1.1,
                borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.05 : 0.12),
                '& .MuiTab-root': {
                  minHeight: 52,
                  textTransform: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: 'text.secondary',
                  borderRadius: 2,
                  mx: 0.4,
                  px: 2,
                  gap: 0.8,
                  transition: 'all 0.2s ease',
                },
                '& .MuiTab-root.Mui-selected': {
                  color: 'text.primary',
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  boxShadow: `0 6px 18px ${alpha(theme.palette.primary.main, 0.18)}`,
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.secondary.main,
                  height: 2,
                  borderRadius: 3,
                },
              }}
            >
              <Tab icon={<PersonOutlineIcon fontSize="small" />} iconPosition="start" label="Account" />
              <Tab icon={<NotificationsNoneIcon fontSize="small" />} iconPosition="start" label="Notifications" />
              <Tab icon={<LockOutlinedIcon fontSize="small" />} iconPosition="start" label="Privacy" />
            </Tabs>

            {/* Account Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 3 }}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.18),
                    boxShadow: 'none',
                    height: 'fit-content',
                    backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.05 : 0.1),
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography sx={{ fontSize: '0.82rem', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary', mb: 1.8 }}>
                      Profile Photo
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.8 }}>
                      <Avatar
                        src={profileImagePreview}
                        alt={profileData.name}
                        sx={{
                          width: 114,
                          height: 114,
                          backgroundColor: 'primary.main',
                          fontSize: '2.2rem',
                          fontWeight: 700,
                          color: 'primary.contrastText',
                          border: `3px solid ${alpha(theme.palette.background.paper, 0.95)}`,
                          boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.24)}`,
                        }}
                      >
                        {profileData.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="profile-image-input"
                        type="file"
                        onChange={handleProfileImageSelect}
                      />
                      <label htmlFor="profile-image-input">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CameraAltIcon />}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                        >
                          Change Photo
                        </Button>
                      </label>
                      <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', textAlign: 'center' }}>
                        JPG, PNG, GIF up to 5MB
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 2.2 }} />
                    <Typography sx={{ fontSize: '0.82rem', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700, color: 'text.secondary', mb: 1 }}>
                      Appearance
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={mode === 'dark'}
                          onChange={handleToggleTheme}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: alpha(theme.palette.primary.main, 0.5) },
                          }}
                        />
                      }
                      label={mode === 'dark' ? 'Dark mode' : 'Light mode'}
                      sx={{ m: 0, '& .MuiTypography-root': { fontWeight: 600 } }}
                    />
                  </CardContent>
                </Card>

                <Box sx={{ display: 'grid', gap: 2.2 }}>
                  <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.2, fontSize: '1.05rem' }}>
                        Profile Information
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.8 }}>
                        <TextField fullWidth label="Full Name" name="name" value={profileData.name} onChange={handleProfileChange} />
                        <TextField fullWidth label="Phone Number" name="phone" value={profileData.phone} onChange={handleProfileChange} />
                        <Box sx={{ gridColumn: { xs: 'auto', sm: '1 / -1' } }}>
                          <TextField fullWidth label="Email Address" name="email" type="email" value={profileData.email} onChange={handleProfileChange} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                    <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2.2, fontSize: '1.05rem' }}>
                        Security
                      </Typography>
                      <Box sx={{ display: 'grid', gap: 1.8 }}>
                        <TextField fullWidth label="Current Password" name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                        <TextField fullWidth label="New Password" name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} />
                        <TextField fullWidth label="Confirm New Password" name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
                      </Box>
                    </CardContent>
                  </Card>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={saving}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 3,
                        py: 1.1,
                        borderRadius: 2.2,
                        boxShadow: `0 10px 22px ${alpha(theme.palette.primary.main, 0.28)}`,
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </TabPanel>

            {/* Notifications Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ maxWidth: 860 }}>
                <Card sx={{ 
                  mb: 3, 
                  borderRadius: 2.5,
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}>
                  <CardContent>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 800, 
                        mb: 2,
                        fontSize: '1.05rem',
                        color: 'text.primary',
                      }}
                    >
                      Notification Channels
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.emailNotifications}
                            onChange={() => handleNotificationChange('emailNotifications')}
                            sx={{ 
                              '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.5) },
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Email Notifications</Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                              Receive important updates via email
                            </Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.pushNotifications}
                            onChange={() => handleNotificationChange('pushNotifications')}
                            sx={{ 
                              '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.5) },
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Push Notifications</Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                              Receive browser push notifications
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </CardContent>
                </Card>

                <Card sx={{ 
                  borderRadius: 2.5,
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}>
                  <CardContent>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 800, 
                        mb: 2,
                        fontSize: '1.05rem',
                        color: 'text.primary',
                      }}
                    >
                      Notification Types
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.messageNotifications}
                            onChange={() => handleNotificationChange('messageNotifications')}
                            sx={{ 
                              '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.5) },
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Messages</Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                              Get notified when you receive new messages
                            </Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.bookingNotifications}
                            onChange={() => handleNotificationChange('bookingNotifications')}
                            sx={{ 
                              '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.5) },
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Bookings</Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                              Get notified about booking updates
                            </Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.paymentNotifications}
                            onChange={() => handleNotificationChange('paymentNotifications')}
                            sx={{ 
                              '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.5) },
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Payments</Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                              Get notified about payment transactions
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </CardContent>
                </Card>

                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1.1,
                    borderRadius: 2,
                    boxShadow: (theme) =>
                      theme.palette.mode === 'light'
                        ? `0 4px 14px ${alpha(theme.palette.primary.main, 0.22)}`
                        : `0 4px 14px ${alpha(theme.palette.primary.main, 0.32)}`,
                    mt: 3,
                    '&:hover:not(:disabled)': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </Box>
            </TabPanel>

            {/* Privacy Tab */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ maxWidth: 860 }}>
                <Card sx={{ 
                  borderRadius: 3, 
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}>
                  <CardContent>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 800, 
                        mb: 2,
                        fontSize: '1.05rem',
                        color: 'text.primary',
                      }}
                    >
                      Profile Visibility
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 2 }}>
                      Select who can discover and view your profile.
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      value={privacy.profileVisibility}
                      onChange={handleProfileVisibilityChange}
                      size="small"
                      sx={{
                        flexWrap: 'wrap',
                        gap: 1,
                        '& .MuiToggleButton-root': {
                          textTransform: 'none',
                          borderRadius: 2,
                          borderColor: 'divider',
                          color: 'text.secondary',
                          fontWeight: 700,
                          px: 1.8,
                          '&.Mui-selected': {
                            color: 'text.primary',
                            backgroundColor: (theme) => alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.24),
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    >
                      <ToggleButton value="public">Public</ToggleButton>
                      <ToggleButton value="friends">Connections</ToggleButton>
                      <ToggleButton value="private">Private</ToggleButton>
                    </ToggleButtonGroup>
                  </CardContent>
                </Card>

                <Card sx={{ 
                  mt: 3, 
                  borderRadius: 3, 
                  boxShadow: 'none',
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}>
                  <CardContent>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 800, 
                        mb: 2,
                        fontSize: '1.05rem',
                        color: 'text.primary',
                      }}
                    >
                      Messaging
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={privacy.allowMessagesFromAnyone}
                            onChange={() => handlePrivacyChange('allowMessagesFromAnyone')}
                            sx={{ 
                              '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.5) },
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Allow Messages from Anyone</Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                              When disabled, only verified users can message you
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </CardContent>
                </Card>

                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSavePrivacy}
                  disabled={saving}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1.1,
                    borderRadius: 2,
                    boxShadow: (theme) =>
                      theme.palette.mode === 'light'
                        ? `0 4px 14px ${alpha(theme.palette.primary.main, 0.22)}`
                        : `0 4px 14px ${alpha(theme.palette.primary.main, 0.32)}`,
                    mt: 3,
                    '&:hover:not(:disabled)': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            </TabPanel>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}

export default Settings
