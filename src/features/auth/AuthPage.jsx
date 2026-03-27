import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import LockOutlineRoundedIcon from '@mui/icons-material/LockOutlineRounded'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  initializeAuthStore,
  loginAdmin,
  requestPasswordReset,
  resetPassword,
} from './authStorage.js'

const authContent = {
  login: {
    primaryButton: 'Sign In',
    helperLinkLabel: 'Forgot password?',
    helperLinkTo: '/admin/forgot-password',
    fields: [
      { label: 'Admin Email', type: 'email', placeholder: 'admin@stafflens.edu.ng' },
      { label: 'Password', type: 'password', placeholder: 'Enter your password' },
    ],
    footerPrompt: 'Need to reset your credentials?',
    footerLinkLabel: 'Reset account password',
    footerLinkTo: '/admin/reset-password',
  },
  forgot: {
    primaryButton: 'Send Reset Link',
    helperLinkLabel: 'Back to login',
    helperLinkTo: '/admin/login',
    fields: [
      { label: 'Recovery Email', type: 'email', placeholder: 'admin@stafflens.edu.ng' },
    ],
    footerPrompt: 'Remember your password already?',
    footerLinkLabel: 'Return to sign in',
    footerLinkTo: '/admin/login',
  },
  reset: {
    primaryButton: 'Update Password',
    helperLinkLabel: 'Back to login',
    helperLinkTo: '/admin/login',
    fields: [
      { label: 'Reset Token', type: 'text', placeholder: 'Enter reset token' },
      { label: 'New Password', type: 'password', placeholder: 'Create a strong password' },
      { label: 'Confirm Password', type: 'password', placeholder: 'Repeat the new password' },
    ],
    footerPrompt: 'Need another recovery email?',
    footerLinkLabel: 'Go to forgot password',
    footerLinkTo: '/admin/forgot-password',
  },
}

export default function AuthPage({ mode, title, subtitle }) {
  const config = authContent[mode]
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState({})

  useEffect(() => {
    initializeAuthStore().catch((error) => {
      setFeedback({
        severity: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to initialize secure client storage.',
      })
    })
  }, [])

  function setFieldValue(label, value) {
    setFormValues((current) => ({
      ...current,
      [label]: value,
    }))
  }

  function togglePasswordVisibility(label) {
    setVisiblePasswords((current) => ({
      ...current,
      [label]: !current[label],
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFeedback(null)
    setSubmitting(true)

    try {
      if (mode === 'login') {
        await loginAdmin(
          formValues['Admin Email'] ?? '',
          formValues.Password ?? '',
        )
        navigate('/admin/overview')
      } else if (mode === 'forgot') {
        const result = await requestPasswordReset(formValues['Recovery Email'] ?? '')
        setFeedback({
          severity: 'success',
          message: `Reset token generated for demo use: ${result.token}. It expires at ${new Date(result.expiresAt).toLocaleString()}.`,
        })
      } else {
        await resetPassword(
          formValues['Reset Token'] ?? '',
          formValues['New Password'] ?? '',
          formValues['Confirm Password'] ?? '',
        )
        setFeedback({
          severity: 'success',
          message: 'Password updated successfully. You can now sign in with the new password.',
        })
        navigate('/admin/login')
      }
    } catch (error) {
      setFeedback({
        severity: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'The requested authentication action failed.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top left, rgba(17, 79, 149, 0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(63, 139, 105, 0.12), transparent 26%), linear-gradient(180deg, #f5f8fc 0%, #edf3f9 100%)',
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 6 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 520 }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 7,
            border: '1px solid',
            borderColor: 'rgba(20, 58, 92, 0.08)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,252,255,0.98) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 28px 70px rgba(22, 48, 71, 0.12)',
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack component="form" spacing={2.4} onSubmit={handleSubmit}>
              <Stack spacing={1.75}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={0.9}
                >
                  <Chip
                    label="StaffLens Admin Portal"
                    sx={{
                      width: 'fit-content',
                      color: '#114f95',
                      bgcolor: 'rgba(17, 79, 149, 0.08)',
                      fontWeight: 700,
                      height: 34,
                      borderRadius: 999,
                      border: '1px solid rgba(17, 79, 149, 0.08)',
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#7a8ca1',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      fontSize: '0.76rem',
                    }}
                  >
                    Secure access
                  </Typography>
                </Stack>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1.5, sm: 2 }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  sx={{
                    p: { xs: 1.5, sm: 1.75 },
                    borderRadius: 4,
                    background:
                      'radial-gradient(circle at top left, rgba(34, 104, 186, 0.12), transparent 38%), linear-gradient(180deg, rgba(247, 250, 255, 0.98) 0%, rgba(255,255,255,0.92) 100%)',
                    border: '1px solid rgba(17, 79, 149, 0.08)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 54, sm: 62 },
                      height: { xs: 54, sm: 62 },
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 4,
                      background:
                        'linear-gradient(160deg, rgba(17, 79, 149, 0.14) 0%, rgba(17, 79, 149, 0.06) 100%)',
                      color: '#114f95',
                      boxShadow:
                        'inset 0 0 0 1px rgba(17, 79, 149, 0.08), 0 14px 24px rgba(17, 79, 149, 0.08)',
                      flexShrink: 0,
                      '& svg': {
                        fontSize: { xs: '1.3rem', sm: '1.45rem' },
                      },
                    }}
                  >
                    {mode === 'login' ? (
                      <LockOutlineRoundedIcon />
                    ) : mode === 'forgot' ? (
                      <MailOutlineRoundedIcon />
                    ) : (
                      <VisibilityOffRoundedIcon />
                    )}
                  </Box>
                  <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: '#3d6790',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        lineHeight: 1,
                        fontSize: '0.68rem',
                      }}
                    >
                      Administrator Access
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        color: '#163047',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.05,
                        fontSize: { xs: '2rem', sm: '2.35rem' },
                      }}
                    >
                      {title}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#62748a',
                        lineHeight: 1.6,
                        maxWidth: 380,
                        fontSize: { xs: '0.94rem', sm: '0.96rem' },
                      }}
                    >
                      {subtitle}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>

              {feedback && (
                <Alert
                  severity={feedback.severity}
                  sx={{
                    borderRadius: 3,
                    '& .MuiAlert-message': { lineHeight: 1.6 },
                  }}
                >
                  {feedback.message}
                </Alert>
              )}

              <Divider sx={{ borderColor: 'rgba(20, 58, 92, 0.08)' }} />

              <Stack spacing={1.8}>
                {config.fields.map((field) => (
                  <TextField
                    key={field.label}
                    fullWidth
                    type={
                      field.type === 'password' && visiblePasswords[field.label]
                        ? 'text'
                        : field.type
                    }
                    label={field.label}
                    placeholder={field.placeholder}
                    value={formValues[field.label] ?? ''}
                    onChange={(event) => setFieldValue(field.label, event.target.value)}
                    variant="outlined"
                    InputProps={
                      field.type === 'password'
                        ? {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  edge="end"
                                  onClick={() => togglePasswordVisibility(field.label)}
                                  aria-label={`Toggle ${field.label} visibility`}
                                >
                                  {visiblePasswords[field.label] ? (
                                    <VisibilityOffRoundedIcon />
                                  ) : (
                                    <VisibilityRoundedIcon />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }
                        : undefined
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        backgroundColor: '#f9fbfe',
                        minHeight: 54,
                      },
                    }}
                  />
                ))}
              </Stack>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <Link
                  component={RouterLink}
                  to={config.helperLinkTo}
                  underline="hover"
                  sx={{ fontWeight: 600, color: '#1c63b8' }}
                >
                  {config.helperLinkLabel}
                </Link>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{
                    minWidth: { xs: '100%', sm: 176 },
                    minHeight: 52,
                    borderRadius: 3.5,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.98rem',
                    background: 'linear-gradient(135deg, #1d73d6 0%, #114f95 100%)',
                    boxShadow: '0 18px 34px rgba(17, 79, 149, 0.24)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1767c3 0%, #0e467f 100%)',
                    },
                  }}
                >
                  {submitting ? 'Please wait...' : config.primaryButton}
                </Button>
              </Stack>

              <Typography sx={{ color: '#6b7f94', lineHeight: 1.55, fontSize: '0.95rem' }}>
                {config.footerPrompt}{' '}
                <Link
                  component={RouterLink}
                  to={config.footerLinkTo}
                  underline="hover"
                  sx={{ fontWeight: 600 }}
                >
                  {config.footerLinkLabel}
                </Link>
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
