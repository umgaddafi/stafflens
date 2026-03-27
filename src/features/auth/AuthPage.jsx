import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
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
    helperLinkTo: '/forgot-password',
    fields: [
      { label: 'Admin Email', type: 'email', placeholder: 'admin@stafflens.edu.ng' },
      { label: 'Password', type: 'password', placeholder: 'Enter your password' },
    ],
    footerPrompt: 'Need to reset your credentials?',
    footerLinkLabel: 'Reset account password',
    footerLinkTo: '/reset-password',
  },
  forgot: {
    primaryButton: 'Send Reset Link',
    helperLinkLabel: 'Back to login',
    helperLinkTo: '/login',
    fields: [
      { label: 'Recovery Email', type: 'email', placeholder: 'admin@stafflens.edu.ng' },
    ],
    footerPrompt: 'Remember your password already?',
    footerLinkLabel: 'Return to sign in',
    footerLinkTo: '/login',
  },
  reset: {
    primaryButton: 'Update Password',
    helperLinkLabel: 'Back to login',
    helperLinkTo: '/login',
    fields: [
      { label: 'Reset Token', type: 'text', placeholder: 'Enter reset token' },
      { label: 'New Password', type: 'password', placeholder: 'Create a strong password' },
      { label: 'Confirm Password', type: 'password', placeholder: 'Repeat the new password' },
    ],
    footerPrompt: 'Need another recovery email?',
    footerLinkLabel: 'Go to forgot password',
    footerLinkTo: '/forgot-password',
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
        navigate('/overview')
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
        navigate('/login')
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
          'radial-gradient(circle at 12% 10%, rgba(17, 79, 149, 0.18), transparent 24%), radial-gradient(circle at 88% 88%, rgba(63, 139, 105, 0.1), transparent 22%), linear-gradient(180deg, #f6f9fc 0%, #edf3f8 100%)',
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 6 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 430 }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 8,
            border: '1px solid',
            borderColor: 'rgba(20, 58, 92, 0.08)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,252,255,0.98) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 24px 64px rgba(22, 48, 71, 0.12)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: 6,
              background: 'linear-gradient(90deg, #1d73d6 0%, #114f95 65%, #3f8b69 100%)',
            }}
          />
          <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
            <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
              <Stack spacing={1.1} sx={{ alignItems: 'center', textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: '#163047',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.05,
                    fontSize: { xs: '2rem', sm: '2.2rem' },
                  }}
                >
                  {title}
                </Typography>
                {mode !== 'login' && (
                  <Typography
                    sx={{
                      color: '#6b7f94',
                      lineHeight: 1.6,
                      fontSize: '0.95rem',
                      maxWidth: 300,
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
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

              <Stack spacing={1.6}>
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
                      '& .MuiInputLabel-root': {
                        color: '#647a92',
                        fontWeight: 500,
                      },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3.5,
                        backgroundColor: '#fbfdff',
                        minHeight: 56,
                        transition: 'border-color 140ms ease, box-shadow 140ms ease',
                        '& fieldset': {
                          borderColor: 'rgba(46, 79, 112, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(17, 79, 149, 0.35)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 4px rgba(17, 79, 149, 0.08)',
                        },
                      },
                    }}
                  />
                ))}
              </Stack>

              <Stack spacing={1.2}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Link
                    component={RouterLink}
                    to={config.helperLinkTo}
                    underline="hover"
                    sx={{ fontWeight: 700, color: '#1c63b8', fontSize: '0.96rem' }}
                  >
                    {config.helperLinkLabel}
                  </Link>
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{
                    width: '100%',
                    minHeight: 54,
                    borderRadius: 4,
                    textTransform: 'none',
                    fontWeight: 800,
                    letterSpacing: '0.01em',
                    fontSize: '1rem',
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

              {mode !== 'login' && (
                <Typography
                  sx={{
                    color: '#6b7f94',
                    lineHeight: 1.55,
                    fontSize: '0.95rem',
                    textAlign: 'center',
                  }}
                >
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
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
