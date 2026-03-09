import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  Button,
  Typography,
  Divider,
  Badge,
  CircularProgress,
  InputAdornment,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
} from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { keyframes } from '@mui/system'
import api from '../api'
import SendIcon from '@mui/icons-material/Send'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import DashboardSidebar from '../components/DashboardSidebar'

// Animation keyframes
const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`

const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`

const popIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`

interface Message {
  id: number
  sender_id: number
  receiver_id: number
  message: string
  created_at: string
  is_read: boolean
  sender_name?: string
  receiver_name?: string
}

interface Conversation {
  user_id: number
  name: string
  email: string
  profile_image?: string
  last_message?: string
  last_message_time?: string
  unread_count: number
}

interface User {
  id: number
  name: string
  email: string
  profile_image?: string
  role: string
}

const Messaging: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [conversationSearchQuery, setConversationSearchQuery] = useState('')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const messagePollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const conversationPollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/signin')
      return
    }
    setCurrentUser(JSON.parse(userStr))
    fetchConversations()
    fetchAllUsers()

    // Poll conversations every 5 seconds
    conversationPollingRef.current = setInterval(() => {
      fetchConversations()
    }, 5000)

    return () => {
      if (conversationPollingRef.current) {
        clearInterval(conversationPollingRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate])

  // Auto-select/start conversation with vendor if vendorId is present and users are loaded
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const vendorId = params.get('vendorId')
    if (vendorId && allUsers.length > 0) {
      const user = allUsers.find(u => String(u.id) === String(vendorId))
      if (user) {
        handleStartConversation(user)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUsers, location.search])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Poll for new messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return

    // Poll messages every 4 seconds
    messagePollingRef.current = setInterval(() => {
      fetchMessages(selectedConversation)
    }, 4000)

    return () => {
      if (messagePollingRef.current) {
        clearInterval(messagePollingRef.current)
      }
    }
  }, [selectedConversation])

  const fetchAllUsers = async () => {
    try {
      const response = await api.get('/messaging-users')
      setAllUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await api.get('/conversations')
      
      // Deduplicate conversations by user_id and sort by most recent
      const conversationMap = new Map(response.data.map((conv: Conversation) => [conv.user_id, conv]))
      const uniqueConversations: Conversation[] = Array.from(conversationMap.values()) as Conversation[]
      
      uniqueConversations.sort((a: Conversation, b: Conversation) => {
        const timeA = new Date(a.last_message_time || 0).getTime()
        const timeB = new Date(b.last_message_time || 0).getTime()
        return timeB - timeA // Most recent first
      })
      
      // Only update if:
      // 1. Number of conversations changed
      // 2. Last message content changed
      // 3. Order changed
      setConversations((prevConvs: Conversation[]) => {
        if (prevConvs.length !== uniqueConversations.length) {
          return uniqueConversations
        }
        
        // Check if any conversation's last message or time changed
        const hasChanges = prevConvs.some((prevConv: Conversation, index: number) => {
          const newConv: Conversation = uniqueConversations[index]
          return (
            prevConv.user_id !== newConv.user_id ||
            prevConv.last_message !== newConv.last_message ||
            prevConv.last_message_time !== newConv.last_message_time ||
            prevConv.unread_count !== newConv.unread_count
          )
        })
        
        return hasChanges ? uniqueConversations : prevConvs
      })
      
      // Separately handle loading state to avoid flickering
      if (loading) {
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      if (loading) {
        setLoading(false)
      }
    }
  }

  const fetchMessages = async (conversation: Conversation) => {
    try {
      const response = await api.get(`/messages/${conversation.user_id}`)
      
      // Only update if messages have changed
      setMessages(prevMessages => {
        const newMessages = response.data
        if (JSON.stringify(prevMessages) !== JSON.stringify(newMessages)) {
          return newMessages
        }
        return prevMessages
      })
      
      // Mark as read
      await api.put(`/messages/${conversation.user_id}/read`, {})
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation)
    setShowNewMessageModal(false)
  }

  const handleStartConversation = (user: User) => {
    const newConversation: Conversation = {
      user_id: user.id,
      name: user.name,
      email: user.email,
      profile_image: user.profile_image,
      unread_count: 0,
    }
    handleSelectConversation(newConversation)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      setSendingMessage(true)
      const response = await api.post('/messages', {
        recipientId: selectedConversation.user_id,
        message: newMessage,
      })
      
      console.log('Message sent successfully:', response.data)
      setNewMessage('')
      await fetchMessages(selectedConversation)
      await fetchConversations()
    } catch (error: any) {
      console.error('Failed to send message:', error.response?.data || error.message)
      alert(`Failed to send message: ${error.response?.data?.message || error.message}`)
    } finally {
      setSendingMessage(false)
    }
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(conversationSearchQuery.toLowerCase())
  )

  const filteredUsers = allUsers.filter((user) =>
    user.name.toLowerCase().includes(userSearchQuery.toLowerCase())
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Sidebar */}
      {currentUser && (
        <DashboardSidebar
          userRole={currentUser.role}
          userName={currentUser.name}
          userEmail={currentUser.email}
          userImage={currentUser.profile_image}
          messages={conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)}
          onLogout={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            navigate('/signin')
          }}
        />
      )}
      
      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 2, md: 4 }, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Messages
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowNewMessageModal(true)}
              sx={{
                background: 'linear-gradient(135deg, #F19B7D 0%, #DD8568 100%)',
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              New Message
            </Button>
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px 1fr' }, gap: 2, flex: 1, minHeight: 0 }}>
          {/* Conversations List */}
          <Paper sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: 2, boxShadow: 2, minHeight: 0 }}>
            <Box sx={{ p: 2, borderBottom: '2px solid #E1E7F0', bgcolor: '#F9FBFE' }}>
              <TextField
                fullWidth
                placeholder="Search conversations..."
                size="small"
                value={conversationSearchQuery}
                onChange={(e) => setConversationSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#F19B7D' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    '&:hover fieldset': {
                      borderColor: '#F19B7D',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#F19B7D',
                    },
                  },
                }}
              />
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ overflow: 'auto', flex: 1, '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { background: '#f1f1f1' }, '&::-webkit-scrollbar-thumb': { background: '#F19B7D', borderRadius: '3px' } }}>
                {filteredConversations.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">No conversations yet</Typography>
                  </Box>
                ) : (
                  filteredConversations.map((conversation) => (
                    <ListItem
                      key={conversation.user_id}
                      disablePadding
                      sx={{
                        backgroundColor:
                          selectedConversation?.user_id === conversation.user_id ? '#FCE9E2' : 'transparent',
                        borderLeft: selectedConversation?.user_id === conversation.user_id ? '4px solid #F19B7D' : '4px solid transparent',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#F9FBFE',
                        },
                      }}
                    >
                      <ListItemButton onClick={() => handleSelectConversation(conversation)} sx={{ py: 1.5 }}>
                        <ListItemAvatar>
                          <Badge 
                            badgeContent={conversation.unread_count} 
                            color="error" 
                            overlap="circular" 
                            sx={{ '& .MuiBadge-badge': { backgroundColor: '#F19B7D', color: 'white', fontWeight: 700 } }}
                          >
                            <Avatar
                              src={conversation.profile_image}
                              alt={conversation.name}
                              sx={{ width: 40, height: 40, bgcolor: '#F19B7D', fontWeight: 700 }}
                            >
                              {conversation.name.charAt(0).toUpperCase()}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              {conversation.name}
                            </Typography>
                          }
                          secondary={
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'text.secondary', 
                                fontSize: '0.8rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {conversation.last_message || 'No messages yet'}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))
                )}
              </List>
            )}
          </Paper>

          {/* Messages View */}
          <Paper
            sx={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              backgroundColor: selectedConversation ? 'background.paper' : '#F9FBFE',
              borderRadius: 2,
              boxShadow: 2,
              minHeight: 0,
            }}
          >
            {selectedConversation ? (
              <>
                {/* Header */}
                <Box
                  sx={{
                    p: 2,
                    borderBottom: '2px solid #E1E7F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: '#F9FBFE',
                  }}
                >
                  <Avatar
                    src={selectedConversation.profile_image}
                    alt={selectedConversation.name}
                    sx={{ width: 45, height: 45, bgcolor: '#F19B7D', fontWeight: 700 }}
                  >
                    {selectedConversation.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.dark' }}>
                      {selectedConversation.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {selectedConversation.email}
                    </Typography>
                  </Box>
                </Box>

                {/* Messages */}
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    backgroundColor: '#F9FBFE',
                    minHeight: 0,
                    '&::-webkit-scrollbar': { 
                      width: '10px',
                    },
                    '&::-webkit-scrollbar-track': { 
                      background: '#f1f1f1',
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb': { 
                      background: '#F19B7D',
                      borderRadius: '10px',
                      border: '2px solid #f1f1f1',
                      '&:hover': {
                        background: '#D57B5E',
                      }
                    },
                  }}
                >
                  {messages.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                        No messages yet. Start a conversation!
                      </Typography>
                    </Box>
                  ) : (
                    messages.map((msg) => {
                      const isCurrentUser = msg.sender_id === currentUser?.id
                      return (
                        <Box
                          key={msg.id}
                          sx={{
                            display: 'flex',
                            flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                            gap: 1,
                            alignItems: 'flex-end',
                            animation: `${isCurrentUser ? slideInRight : slideInLeft} 0.4s ease-out, ${popIn} 0.4s ease-out`,
                          }}
                        >
                          {/* Avatar */}
                          <Avatar
                            src={isCurrentUser ? currentUser?.profile_image : selectedConversation?.profile_image}
                            alt={isCurrentUser ? currentUser?.name : selectedConversation?.name}
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: '#F19B7D',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {(isCurrentUser ? currentUser?.name : selectedConversation?.name)?.charAt(0).toUpperCase()}
                          </Avatar>

                          {/* Message Bubble */}
                          <Box
                            sx={{
                              maxWidth: '65%',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                            }}
                          >
                            {/* Sender Name (for all messages) */}
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color: isCurrentUser ? '#F19B7D' : '#F19B7D',
                                pl: 1.5,
                              }}
                            >
                              {isCurrentUser ? 'You' : selectedConversation?.name}
                            </Typography>

                            {/* Message Content */}
                            <Card
                              sx={{
                                background: isCurrentUser
                                  ? 'linear-gradient(135deg, #F19B7D 0%, #DD8568 100%)'
                                  : 'white',
                                color: isCurrentUser ? 'white' : 'black',
                                boxShadow: isCurrentUser
                                  ? '0 4px 12px rgba(241, 155, 125, 0.4)'
                                  : '0 2px 8px rgba(0, 0, 0, 0.15)',
                                borderRadius: isCurrentUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  boxShadow: isCurrentUser
                                    ? '0 6px 16px rgba(241, 155, 125, 0.48)'
                                    : '0 4px 12px rgba(0, 0, 0, 0.2)',
                                  transform: 'translateY(-2px)',
                                },
                              }}
                            >
                              <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                  {msg.message}
                                </Typography>
                              </CardContent>
                            </Card>

                            {/* Timestamp */}
                            <Typography
                              variant="caption"
                              sx={{
                                opacity: 0.6,
                                fontSize: '0.7rem',
                                pl: 1.5,
                              }}
                            >
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Input */}
                <Divider />
                <Box sx={{ p: 2.5, display: 'flex', gap: 1.5, bgcolor: '#F9FBFE', borderTop: '2px solid #E1E7F0' }}>
                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    multiline
                    maxRows={3}
                    disabled={sendingMessage}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        '&:hover fieldset': {
                          borderColor: '#F19B7D',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#F19B7D',
                        },
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    sx={{
                      background: 'linear-gradient(135deg, #F19B7D 0%, #DD8568 100%)',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2,
                      borderRadius: 1.5,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #D57B5E 0%, #C96F54 100%)',
                      },
                    }}
                  >
                    Send
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 1 }}>
                <Typography color="text.secondary">Select a conversation to start messaging</Typography>
              </Box>
            )}
          </Paper>
          </Box>
        </Box>
      </Box>

      {/* New Message Modal */}
      <Dialog 
        open={showNewMessageModal} 
        onClose={() => setShowNewMessageModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.main' }}>
          Start a New Message
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            placeholder="Search users..."
            size="small"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#F19B7D' }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          
          <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
            {filteredUsers.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">No users found</Typography>
              </Box>
            ) : (
              filteredUsers.map((user) => (
                <ListItem
                  key={user.id}
                  disablePadding
                  secondaryAction={
                    user.role === 'admin' && (
                      <Chip label="Admin" size="small" color="error" variant="outlined" />
                    )
                  }
                >
                  <ListItemButton 
                    onClick={() => handleStartConversation(user)}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(241, 155, 125, 0.14)' }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={user.profile_image} 
                        sx={{ bgcolor: '#F19B7D', width: 40, height: 40 }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={user.email}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default Messaging

