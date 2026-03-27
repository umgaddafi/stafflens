import { useEffect, useMemo, useState } from 'react'
import {
  BrowserRouter as Router,
  Link as RouterLink,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import './App.css'
import AuthPage from './features/auth/AuthPage.jsx'
import { isAuthenticated } from './features/auth/authStorage.js'
import DashboardPage from './features/dashboard/DashboardPage.jsx'
import { loadStaffDirectory } from './features/dashboard/staffDirectory.js'

const PASSPORT_STORAGE_KEY = 'stafflens_passport_overrides_v1'

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/admin/login" replace />
}

function readPassportOverrides() {
  const raw = localStorage.getItem(PASSPORT_STORAGE_KEY)

  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function buildDisplayName(record) {
  const parts = [record.surname, record.firstName, record.otherName].filter(
    (part) => part && part !== 'Not available',
  )

  return parts.join(' ') || record.name || 'Unnamed Staff'
}

function buildInitials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'NA'
}

function PassportPreview({ record }) {
  const localPassport = record?.localPassport
  const candidates = localPassport?.dataUrl
    ? [localPassport.dataUrl]
    : record?.passportCandidates ?? []
  const [candidateIndex, setCandidateIndex] = useState(0)

  useEffect(() => {
    setCandidateIndex(0)
  }, [record?.id, localPassport?.dataUrl])

  const activeSource = candidates[candidateIndex] || ''

  if (activeSource) {
    return (
      <img
        className="passport-photo"
        src={activeSource}
        alt={`${record.name} passport`}
        onError={() => {
          setCandidateIndex((current) => current + 1)
        }}
      />
    )
  }

  return <div className="passport-avatar">{buildInitials(record.name)}</div>
}

function PublicHomePage() {
  const [records, setRecords] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadRecords() {
      try {
        setLoading(true)
        setError('')
        const directory = await loadStaffDirectory()
        const passportOverrides = readPassportOverrides()
        const preparedRecords = directory.map((record) => ({
          ...record,
          name: buildDisplayName(record),
          glStep: `${record.gl || 'Not available'} / ${record.step || 'Not available'}`,
          localPassport: passportOverrides[record.id] ?? null,
        }))

        if (active) {
          setRecords(preparedRecords)
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load staff records.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadRecords()

    return () => {
      active = false
    }
  }, [])

  const filteredRecords = useMemo(() => {
    const normalized = submittedQuery.trim().toLowerCase()

    if (!normalized) {
      return records
    }

    return records.filter((record) =>
      [record.pfNumber, record.name, record.phone, record.department]
        .join(' ')
        .toLowerCase()
        .includes(normalized),
    )
  }, [records, submittedQuery])

  useEffect(() => {
    setCurrentIndex(0)
  }, [submittedQuery])

  const activeRecord = filteredRecords[currentIndex] ?? null

  function handleSearchSubmit(event) {
    event.preventDefault()
    setSubmittedQuery(searchInput)
  }

  return (
    <main className="page-shell">
      <section className="app-card">
        <div className="hero-copy">
          <p className="eyebrow">Staff Records</p>
          <h1>ACADEMIC STAFF DIRECTORY</h1>
          
        
        </div>

        <form className="search-panel" onSubmit={handleSearchSubmit}>
          <label className="search-label" htmlFor="staff-search">
            Search Staff
          </label>
          <div className="search-row">
            <div className="search-input-wrap">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </span>
              <input
                id="staff-search"
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Enter PF Number, Name, Phone or Department"
              />
            </div>
            <button className="search-button" type="submit">
              Search
            </button>
          </div>
        </form>

        <div className="results-header">
          <div>
            <p className="section-label">Result Display</p>
            <h2>
              {loading
                ? 'Loading staff records...'
                : error
                  ? 'Unable to load staff records'
                  : filteredRecords.length
                    ? `Showing ${currentIndex + 1} of ${filteredRecords.length.toLocaleString()} matching staff records`
                    : 'No matching staff records found'}
            </h2>
          </div>
          {!loading && !error && (
            <span className="data-pill">
              {records.length.toLocaleString()} records loaded
            </span>
          )}
        </div>

        {error ? (
          <div className="result-card empty-state">
            <div className="details-panel">
              <h3>Something went wrong</h3>
              <p>{error}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="result-card empty-state">
            <div className="details-panel">
              <h3>Loading</h3>
              <p>Please wait while staff records are loaded from the workbook.</p>
            </div>
          </div>
        ) : activeRecord ? (
          <>
            <article className="result-card">
              <div className="passport-panel">
                <PassportPreview record={activeRecord} />
                <p className="passport-caption">Passport Photo</p>
              </div>

              <div className="details-panel">
                <div className="details-topline">
                  <div>
                    <p className="section-label">Staff Details</p>
                    <h3>{activeRecord.name}</h3>
                  </div>
                  <span className="status-pill">Match Ready</span>
                </div>

                <div className="details-grid">
                  {[
                    ['Name', activeRecord.name],
                    ['PF Number', activeRecord.pfNumber],
                    ['Rank', activeRecord.rank],
                    ['Department', activeRecord.department],
                    ['Phone', activeRecord.phone],
                    ['GL / Step', activeRecord.glStep],
                  ].map(([label, value]) => (
                    <div className="detail-item" key={label}>
                      <span>{label}</span>
                      <strong>{value || 'Not available'}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <div className="navigation-bar">
              <p>
                Browse the current search results using the previous and next buttons.
              </p>
              <div className="nav-actions">
                <button
                  className="nav-button secondary"
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((current) => Math.max(current - 1, 0))}
                >
                  Prev
                </button>
                <button
                  className="nav-button primary"
                  type="button"
                  disabled={currentIndex >= filteredRecords.length - 1}
                  onClick={() =>
                    setCurrentIndex((current) =>
                      Math.min(current + 1, filteredRecords.length - 1),
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="result-card empty-state">
            <div className="details-panel">
              <h3>No staff found</h3>
              <p>
                Try a PF number, a name, a phone number, or a department to narrow down
                the directory.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route
          path="/admin/login"
          element={
            <AuthPage
              mode="login"
              title="Admin Sign In"
              subtitle="Access the StaffLens admin workspace to manage records, monitor staff updates, and review operational insights."
            />
          }
        />
        <Route
          path="/admin/forgot-password"
          element={
            <AuthPage
              mode="forgot"
              title="Forgot Password"
              subtitle="Enter your administrator email address and we will prepare a reset link for secure account recovery."
            />
          }
        />
        <Route
          path="/admin/reset-password"
          element={
            <AuthPage
              mode="reset"
              title="Reset Password"
              subtitle="Set a fresh password for your admin account and return to the dashboard with updated credentials."
            />
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
