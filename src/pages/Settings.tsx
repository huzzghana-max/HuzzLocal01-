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
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { useTheme } from '../themes/ThemeContext'
import SaveIcon from '@mui/icons-material/Save'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const Settings: React.FC = () => {
  const navigate = useNavigate()
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
  const { mode, toggleTheme } = useTheme()
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
    fetchSettings()
  }, [navigate])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      if (!userStr) {
        setLoading(false)
        return
      }

      const user = JSON.parse(userStr)
      setProfileData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      })
      setProfileImagePreview(user.profile_image || '')

      // Mock fetch settings from API
      const response = await api.get('/settings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications(response.data.notifications || notifications)
      setPrivacy(response.data.privacy || privacy)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      // Use defaults if API fails
    } finally {
      setLoading(false)
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

  const handlePrivacyChange = (key: keyof typeof privacy, value?: any) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: value !== undefined ? value : !prev[key as keyof typeof prev],
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
      const apiHost = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
      const updatedUserRaw = { ...currentUser, ...response.data.user }
      const updatedUser = { ...updatedUserRaw,
        profile_image: updatedUserRaw.profile_image && updatedUserRaw.profile_image.startsWith('/uploads/')
          ? `${apiHost}${updatedUserRaw.profile_image}`
          : updatedUserRaw.profile_image || ''
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
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
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Sidebar */}
      {currentUser && (
        <DashboardSidebar
          userRole={currentUser.role as 'admin' | 'organizer' | 'provider'}
          userName={currentUser.name}
          userEmail={currentUser.email}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 2, md: 4 }, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
            Settings
          </Typography>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Paper sx={{ borderRadius: 2 }}>
            {/* Tabs */}
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                borderBottom: '2px solid #f0f0f0',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                },
                '& .MuiTab-root.Mui-selected': {
                  color: '#ff8c00',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#ff8c00',
                },
              }}
            >
              <Tab label="Account" />
              <Tab label="Notifications" />
              <Tab label="Privacy" />
            </Tabs>

            {/* Account Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ maxWidth: 600 }}>
                {/* Profile Picture */}
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Avatar
                    src={profileImagePreview}
                    alt={profileData.name}
                    sx={{ width: 100, height: 100, bgcolor: '#ff8c00', fontSize: '2rem', fontWeight: 700 }}
                  >
                    {profileData.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
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
                        sx={{
                          borderColor: '#ff8c00',
                          color: '#ff8c00',
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: '#ff6b35',
                            backgroundColor: 'rgba(255, 140, 0, 0.05)',
                          },
                        }}
                      >
                        Change Picture
                      </Button>
                    </label>
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 1 }}>
                      JPG, PNG, GIF (Max 5MB)
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Profile Information */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Profile Information
                  </Typography>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Appearance (theme) */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Appearance
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{mode === 'light' ? 'Light' : 'Dark'}</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={mode === 'dark'}
                          onChange={handleToggleTheme}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff8c00' } }}
                        />
                      }
                      label={mode === 'dark' ? 'Dark mode' : 'Light mode'}
                    />
                  </Box>
                  <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                    Toggle between light and dark themes. Preference is saved to your browser.
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Change Password */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Change Password
                  </Typography>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                </Box>

                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  disabled={saving}
                  sx={{
                    background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </TabPanel>

            {/* Notifications Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ maxWidth: 600 }}>
                <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      Notification Channels
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.emailNotifications}
                            onChange={() => handleNotificationChange('emailNotifications')}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff8c00' } }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>Email Notifications</Typography>
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
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff8c00' } }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>Push Notifications</Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                              Receive browser push notifications
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      Notification Types
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={notifications.messageNotifications}
                            onChange={() => handleNotificationChange('messageNotifications')}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff8c00' } }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>Messages</Typography>
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
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff8c00' } }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>Bookings</Typography>
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
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff8c00' } }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>Payments</Typography>
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
                    background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    mt: 3,
                  }}
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </Box>
            </TabPanel>

            {/* Privacy Tab */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ maxWidth: 600 }}>
                <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      Profile Visibility
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 2 }}>
                      Control who can see your profile
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={privacy.profileVisibility === 'public'}
                            onChange={() => handlePrivacyChange('profileVisibility', 'public')}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff8c00' } }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>Public Profile</Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                              Everyone can see your profile
                            </Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={privacy.profileVisibility === 'private'}
                            onChange={() => handlePrivacyChange('profileVisibility', 'private')}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff8c00' } }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>Private Profile</Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                              Only you can see your profile
                            </Typography>
                          </Box>
                        }
                      />
                    </FormGroup>
                  </CardContent>
                </Card>

                <Card sx={{ mt: 3, borderRadius: 2, boxShadow: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      Messaging
                    </Typography>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={privacy.allowMessagesFromAnyone}
                            onChange={() => handlePrivacyChange('allowMessagesFromAnyone')}
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ff8c00' } }}
                          />
                        }
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>Allow Messages from Anyone</Typography>
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
                    background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    mt: 3,
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
