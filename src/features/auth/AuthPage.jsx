import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import LockOutlineRoundedIcon from '@mui/icons-material/LockOutlineRounded'
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded'
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded'
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded'
import { useEffect, useMemo, useState } from 'react'
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

  const defaultCredentials = useMemo(
    () => ({
      email: 'admin@stafflens.edu.ng',
      password: 'Admin@12345',
    }),
    [],
  )

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
          'radial-gradient(circle at top left, rgba(35, 87, 137, 0.22), transparent 32%), radial-gradient(circle at bottom right, rgba(24, 119, 242, 0.14), transparent 24%), linear-gradient(180deg, #f4f7fb 0%, #e8eef6 100%)',
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
      }}
    >
      <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
        <Grid size={{ xs: 12, md: 6, lg: 7 }}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 6,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'rgba(17, 57, 109, 0.08)',
              background:
                'linear-gradient(160deg, #103a6d 0%, #114f95 44%, #4e93dd 100%)',
              color: 'common.white',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 15% 18%, rgba(255,255,255,0.16), transparent 18%), radial-gradient(circle at 82% 28%, rgba(255,255,255,0.14), transparent 20%), linear-gradient(140deg, transparent 0%, rgba(255,255,255,0.06) 100%)',
              }}
            />
            <CardContent sx={{ position: 'relative', p: { xs: 3, md: 5 } }}>
              <Stack spacing={3.5}>
                <Chip
                  icon={<SecurityRoundedIcon />}
                  label="StaffLens Admin Portal"
                  sx={{
                    width: 'fit-content',
                    color: 'common.white',
                    bgcolor: 'rgba(255,255,255,0.14)',
                    '& .MuiChip-icon': { color: 'common.white' },
                  }}
                />
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
                    Secure staff administration with a cleaner daily workflow.
                  </Typography>
                  <Typography sx={{ maxWidth: 560, opacity: 0.84, lineHeight: 1.7 }}>
                    Monitor directory operations, review staff summaries, manage records,
                    and keep institutional administration moving from a single modern
                    workspace.
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  {[
                    {
                      heading: 'Centralized control',
                      text: 'Manage accounts, records, approvals, and updates from one dashboard.',
                    },
                    {
                      heading: 'Protected access',
                      text: 'Dedicated admin flows for sign in, password recovery, and secure resets.',
                    },
                    {
                      heading: 'Faster review',
                      text: 'Quick visibility into staff totals, departments, recent activity, and actions.',
                    },
                  ].map((item) => (
                    <Grid key={item.heading} size={{ xs: 12, sm: 6 }}>
                      <Card
                        elevation={0}
                        sx={{
                          height: '100%',
                          borderRadius: 4,
                          bgcolor: 'rgba(255,255,255,0.1)',
                          color: 'common.white',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }}
                      >
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            {item.heading}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.82, lineHeight: 1.7 }}>
                            {item.text}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 5 }}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 6,
              border: '1px solid',
              borderColor: 'rgba(17, 57, 109, 0.08)',
              backgroundColor: 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 30px 60px rgba(22, 48, 71, 0.08)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack component="form" spacing={3} onSubmit={handleSubmit}>
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 3,
                      bgcolor: '#eaf2ff',
                      color: '#114f95',
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
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#163047' }}>
                    {title}
                  </Typography>
                  <Typography sx={{ color: '#62748a', lineHeight: 1.7 }}>
                    {subtitle}
                  </Typography>
                  {mode === 'login' && (
                    <Alert severity="info" sx={{ mt: 1.5 }}>
                      Demo admin email: <strong>{defaultCredentials.email}</strong>
                      {' '}and password: <strong>{defaultCredentials.password}</strong>
                    </Alert>
                  )}
                </Stack>

                {feedback && (
                  <Alert severity={feedback.severity}>{feedback.message}</Alert>
                )}

                <Stack spacing={2}>
                  {config.fields.map((field) => (
                    <TextField
                      key={field.label}
                      fullWidth
                      type={field.type}
                      label={field.label}
                      placeholder={field.placeholder}
                      value={formValues[field.label] ?? ''}
                      onChange={(event) => setFieldValue(field.label, event.target.value)}
                    />
                  ))}
                </Stack>

                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                >
                  <Link
                    component={RouterLink}
                    to={config.helperLinkTo}
                    underline="hover"
                    sx={{ fontWeight: 600 }}
                  >
                    {config.helperLinkLabel}
                  </Link>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting}
                    sx={{
                      minWidth: 172,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 700,
                      boxShadow: '0 16px 30px rgba(17, 79, 149, 0.22)',
                    }}
                  >
                    {submitting ? 'Please wait...' : config.primaryButton}
                  </Button>
                </Stack>

                <Typography sx={{ color: '#6b7f94' }}>
                  {config.footerPrompt}{' '}
                  <Link component={RouterLink} to={config.footerLinkTo} underline="hover">
                    {config.footerLinkLabel}
                  </Link>
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
