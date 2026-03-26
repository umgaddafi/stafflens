import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

const DATA_FILE = '/Staffs.xls'

function cleanValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).replace(/\s+/g, ' ').trim()
}

function pickField(record, keys) {
  for (const key of keys) {
    const value = cleanValue(record[key])

    if (value) {
      return value
    }
  }

  return ''
}

function buildName(record) {
  return [
    pickField(record, ['SURNAME']),
    pickField(record, ['FIRST NAME']),
    pickField(record, ['OTHER NAME']),
  ]
    .filter(Boolean)
    .join(' ')
}

function getDepartment(record) {
  return (
    pickField(record, ['DEPARTMENT/UNIT', 'Department/Unit']) ||
    pickField(record, ['POSTED UNIT', 'Posted Unit']) ||
    'Not available'
  )
}

function getPhone(record) {
  return pickField(record, ['STAFF PHONE NO', 'Staff Phone No']) || 'Not available'
}

function getInitials(name) {
  const parts = name.split(' ').filter(Boolean)

  if (parts.length === 0) {
    return 'NA'
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function buildPassportCandidates(pfNumber) {
  const cleanPfNumber = cleanValue(pfNumber)

  if (!cleanPfNumber) {
    return []
  }

  const normalized = cleanPfNumber.replace(/\//g, '-')
  const basePaths = Array.from(
    new Set([
      cleanPfNumber,
      cleanPfNumber.toUpperCase(),
      cleanPfNumber.toLowerCase(),
      normalized,
      normalized.toUpperCase(),
      normalized.toLowerCase(),
    ]),
  )

  const extensions = ['jpg', 'jpeg', 'png', 'webp']

  return basePaths.flatMap((basePath) =>
    extensions.map((extension) => `/passports/${basePath}.${extension}`),
  )
}

function mapRecord(record, index) {
  const name = buildName(record)
  const pfNumber = pickField(record, ['STAFF ID', 'Staff ID']) || 'Not available'

  return {
    id: pfNumber !== 'Not available' ? pfNumber : `staff-${index + 1}`,
    name: name || 'Unnamed staff',
    pfNumber,
    rank: pickField(record, ['RANK', 'Rank']) || 'Not available',
    department: getDepartment(record),
    phone: getPhone(record),
    glStep: `${pickField(record, ['Reg NR', 'GL']) || 'Not available'} / ${pickField(record, ['__EMPTY', 'STEP']) || 'Not available'}`,
    passportCandidates: buildPassportCandidates(pfNumber),
  }
}

function PassportCard({ staff }) {
  const [sourceIndex, setSourceIndex] = useState(0)
  const candidates = staff.passportCandidates
  const currentSource = candidates[sourceIndex] ?? null

  useEffect(() => {
    setSourceIndex(0)
  }, [staff.id])

  function handleImageError() {
    setSourceIndex((index) => index + 1)
  }

  const hasUsableImage = Boolean(currentSource)

  return (
    <div className="passport-panel">
      {hasUsableImage ? (
        <img
          className="passport-photo"
          src={currentSource}
          alt={`${staff.name} passport`}
          onError={handleImageError}
        />
      ) : (
        <div className="passport-avatar" aria-hidden="true">
          {getInitials(staff.name)}
        </div>
      )}
      <p className="passport-caption">
        {hasUsableImage ? 'Passport Photo' : 'Passport Preview'}
      </p>
    </div>
  )
}

export default function App() {
  const [records, setRecords] = useState([])
  const [query, setQuery] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadStaffRecords() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(DATA_FILE)

        if (!response.ok) {
          throw new Error('Unable to load the staff workbook.')
        }

        const buffer = await response.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(worksheet, {
          range: 3,
          defval: '',
          raw: false,
        })

        const mappedRows = rows
          .map(mapRecord)
          .filter((record) => record.pfNumber !== 'Not available' || record.name !== 'Unnamed staff')

        if (active) {
          setRecords(mappedRows)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Something went wrong while loading the workbook.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadStaffRecords()

    return () => {
      active = false
    }
  }, [])

  const normalizedQuery = query.trim().toLowerCase()

  const matches = useMemo(() => {
    if (!normalizedQuery) {
      return records
    }

    return records.filter((record) => {
      const haystack = [
        record.pfNumber,
        record.name,
        record.phone,
        record.department,
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [normalizedQuery, records])

  useEffect(() => {
    setCurrentIndex(0)
  }, [normalizedQuery])

  useEffect(() => {
    if (currentIndex > matches.length - 1) {
      setCurrentIndex(0)
    }
  }, [currentIndex, matches.length])

  const currentStaff = matches[currentIndex] ?? null
  const totalMatches = matches.length
  const hasMatches = totalMatches > 0
  const currentPosition = hasMatches ? currentIndex + 1 : 0

  function goToPrevious() {
    if (!hasMatches) {
      return
    }

    setCurrentIndex((index) => (index - 1 + totalMatches) % totalMatches)
  }

  function goToNext() {
    if (!hasMatches) {
      return
    }

    setCurrentIndex((index) => (index + 1) % totalMatches)
  }

  return (
    <main className="page-shell">
      <section className="app-card">
        <div className="hero-copy">
          <p className="eyebrow">Staff Records</p>
          <h1>JOSTUM STAFF DIRECTORY</h1>
          {/* <p className="subtitle">
            Search by PF number, name, phone, or department using the Excel workbook stored in this project.
          </p> */}
        </div>

        <section className="search-panel">
          <label className="search-label" htmlFor="staff-search">
            Search Staff
          </label>
          <div className="search-row">
            <div className="search-input-wrap">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="presentation">
                  <path
                    d="M10.5 4a6.5 6.5 0 1 0 4.03 11.6l4.43 4.44 1.41-1.42-4.43-4.43A6.5 6.5 0 0 0 10.5 4Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <input
                id="staff-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Enter PF Number, Name, Phone or Department"
              />
            </div>
            <button type="button" className="search-button">
              Search
            </button>
          </div>
        </section>

        <section className="results-header">
          <div>
            <p className="section-label">Result Display</p>
            <h2>
              {loading
                ? 'Loading staff records...'
                : hasMatches
                  ? `Showing ${currentPosition} of ${totalMatches} matching staff records`
                  : 'No staff matched your search'}
            </h2>
          </div>
          {!loading && !error && (
            <span className="data-pill">Total Staffs: {records.length}</span>
          )}
        </section>

        {error ? (
          <section className="result-card empty-state">
            <h3>Could not load the workbook</h3>
            <p>{error}</p>
          </section>
        ) : loading ? (
          <section className="result-card empty-state">
            <h3>Preparing staff data</h3>
            <p>The workbook is being read and indexed for search.</p>
          </section>
        ) : currentStaff ? (
          <section className="result-card">
            <PassportCard staff={currentStaff} />

            <div className="details-panel">
              <div className="details-topline">
                <div>
                  <p className="section-label">Staff Details</p>
                  <h3>{currentStaff.name}</h3>
                </div>
                <span className="status-pill">Match Ready</span>
              </div>

              <div className="details-grid">
                <article className="detail-item">
                  <span>Name</span>
                  <strong>{currentStaff.name}</strong>
                </article>
                <article className="detail-item">
                  <span>PF Number</span>
                  <strong>{currentStaff.pfNumber}</strong>
                </article>
                <article className="detail-item">
                  <span>Rank</span>
                  <strong>{currentStaff.rank}</strong>
                </article>
                <article className="detail-item">
                  <span>Department</span>
                  <strong>{currentStaff.department}</strong>
                </article>
                <article className="detail-item">
                  <span>Phone</span>
                  <strong>{currentStaff.phone}</strong>
                </article>
                <article className="detail-item">
                  <span>GL / Step</span>
                  <strong>{currentStaff.glStep}</strong>
                </article>
              </div>
            </div>
          </section>
        ) : (
          <section className="result-card empty-state">
            <h3>No matching staff found</h3>
            <p>Try a different PF number, name, phone number, or department.</p>
          </section>
        )}

        <section className="navigation-bar">
          <p>
            Use <strong>Prev</strong> and <strong>Next</strong> to browse through the staff records that match your current search.
          </p>
          <div className="nav-actions">
            <button type="button" className="nav-button secondary" onClick={goToPrevious} disabled={!hasMatches}>
              Prev
            </button>
            <button type="button" className="nav-button primary" onClick={goToNext} disabled={!hasMatches}>
              Next
            </button>
          </div>
        </section>

        {/* <p className="passport-note">
          Optional passport photos can be added in <strong>/public/passports</strong> using PF number filenames like <strong>PF5403.jpg</strong> or <strong>PF5403.png</strong>.
        </p> */}
      </section>
    </main>
  )
}
