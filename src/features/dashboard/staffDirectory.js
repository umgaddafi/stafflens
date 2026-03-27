import * as XLSX from 'xlsx'

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

function buildPassportCandidates(pfNumber) {
  const normalized = cleanValue(pfNumber)

  if (!normalized) {
    return []
  }

  const variants = Array.from(
    new Set([
      normalized,
      normalized.toUpperCase(),
      normalized.toLowerCase(),
      normalized.replace(/\//g, '-'),
      normalized.replace(/\//g, '-').toUpperCase(),
      normalized.replace(/\//g, '-').toLowerCase(),
    ]),
  )

  return variants.flatMap((variant) =>
    ['jpg', 'jpeg', 'png', 'webp'].map(
      (extension) => `/passports/${variant}.${extension}`,
    ),
  )
}

function mapRecord(record, index) {
  const pfNumber = pickField(record, ['STAFF ID', 'Staff ID']) || `staff-${index + 1}`
  const name = buildName(record) || 'Unnamed staff'

  return {
    id: pfNumber,
    name,
    pfNumber,
    legacyId: pickField(record, ['LEGACY ID']) || 'Not available',
    surname: pickField(record, ['SURNAME']) || 'Not available',
    firstName: pickField(record, ['FIRST NAME']) || 'Not available',
    otherName: pickField(record, ['OTHER NAME']) || 'Not available',
    rank: pickField(record, ['RANK', 'Rank']) || 'Not available',
    salaryStructure:
      pickField(record, ['SALARY STRUCTURE', 'ORIGINAL SALARY STRUCTURE']) ||
      'Not available',
    department:
      pickField(record, ['DEPARTMENT/UNIT', 'Department/Unit']) ||
      pickField(record, ['POSTED UNIT', 'Posted Unit']) ||
      'Not available',
    postedUnit: pickField(record, ['POSTED UNIT', 'Posted Unit']) || 'Not available',
    phone: pickField(record, ['STAFF PHONE NO', 'Staff Phone No']) || 'Not available',
    qualification: pickField(record, ['QUALIFICATION']) || 'Not available',
    sex: pickField(record, ['SEX']) || 'Not available',
    dateOfBirth: pickField(record, ['DATE OF BIRTH']) || 'Not available',
    stateOfOrigin: pickField(record, ['STATE OF ORIGIN']) || 'Not available',
    lga: pickField(record, ['LGA']) || 'Not available',
    dateOfFirstAppointment:
      pickField(record, ['DATE OF FIRST APPT.']) || 'Not available',
    dateOfConfirmation:
      pickField(record, ['DATE OF CONFIRMATION']) || 'Not available',
    dateOfLastPromotion:
      pickField(record, ['DATE OF LAST PROMOTION']) || 'Not available',
    status: pickField(record, ['STATUS']) || 'Not available',
    glStep: `${pickField(record, ['Reg NR', 'GL']) || 'Not available'} / ${pickField(record, ['__EMPTY', 'STEP']) || 'Not available'}`,
    gl: pickField(record, ['Reg NR', 'GL']) || 'Not available',
    step: pickField(record, ['__EMPTY', 'STEP']) || 'Not available',
    bank: pickField(record, ['Bank', 'BANK']) || 'Not available',
    accountNo: pickField(record, ['Account No', 'ACCOUNT NO']) || 'Not available',
    rsaPin: pickField(record, ['RSA PIN']) || 'Not available',
    pfa: pickField(record, ['PFA']) || 'Not available',
    nin: pickField(record, ['NIN']) || 'Not available',
    tin: pickField(record, ['TIN']) || 'Not available',
    nokName: pickField(record, ['NOK NAME']) || 'Not available',
    relationship: pickField(record, ['RELATIONSHIP']) || 'Not available',
    nokPhone: pickField(record, ['NOK PHONE NO']) || 'Not available',
    passportCandidates: buildPassportCandidates(pfNumber),
  }
}

export async function loadStaffDirectory() {
  const response = await fetch(DATA_FILE)

  if (!response.ok) {
    throw new Error('Unable to load staff workbook.')
  }

  const buffer = await response.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    range: 3,
    defval: '',
    raw: false,
  })

  return rows
    .map(mapRecord)
    .filter((record) => record.name !== 'Unnamed staff' || record.pfNumber)
}
