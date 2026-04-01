import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  createTheme,
  ThemeProvider,
} from '@mui/material'
import Grid from '@mui/material/Grid'
import AppBar from '@mui/material/AppBar'
import Button from '@mui/material/Button'
import MenuRoundedIcon from '@mui/icons-material/MenuRounded'
import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded'
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded'
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import FileDownloadRoundedIcon from '@mui/icons-material/FileDownloadRounded'
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded'
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import {
  createAdminUser,
  deleteAdminUser,
  getCurrentSession,
  listAdminUsers,
  logoutAdmin,
  updateAdminUser,
} from '../auth/authStorage.js'
import { loadStaffDirectory } from './staffDirectory.js'
import { matchesSearchQuery } from '../../utils/search.js'
import TrainingWorkspace from '../training/TrainingWorkspace.jsx'

const drawerWidth = 288
const collapsedDrawerWidth = 92
const DEPARTMENT_STORAGE_KEY = 'stafflens_department_overrides_v1'
const PERSONNEL_STORAGE_KEY = 'stafflens_personnel_overrides_v1'
const STAFF_STORAGE_KEY = 'stafflens_staff_overrides_v1'
const PASSPORT_STORAGE_KEY = 'stafflens_passport_overrides_v1'
const ADDED_STAFF_STORAGE_KEY = 'stafflens_added_staff_records_v1'

const theme = createTheme({
  palette: {
    primary: {
      main: '#114f95',
    },
    secondary: {
      main: '#3f8b69',
    },
    background: {
      default: '#eef3f8',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: '"Ubuntu", sans-serif',
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
  },
})

function SidebarContent({ currentSection, collapsed, onLogout, onToggleCollapse }) {
  const navItems = [
    { label: 'Dashboard', icon: <DashboardRoundedIcon />, path: '/overview', key: 'overview' },
    { label: 'Staff Directory', icon: <BadgeRoundedIcon />, path: '/staff-directory', key: 'staff-directory' },
    { label: 'Training', icon: <SchoolRoundedIcon />, path: '/training', key: 'training' },
    { label: 'Departments', icon: <ApartmentRoundedIcon />, path: '/departments', key: 'departments' },
    { label: 'Reports', icon: <AssessmentRoundedIcon />, path: '/reports', key: 'reports' },
    { label: 'Admin Users', icon: <ManageAccountsRoundedIcon />, path: '/admin-users', key: 'admin-users' },
    { label: 'Settings', icon: <SettingsRoundedIcon />, path: '/settings', key: 'settings' },
  ]

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        sx={{
          px: collapsed ? 1.5 : 3,
          py: 2,
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexDirection: collapsed ? 'column' : 'row',
          gap: collapsed ? 1 : 0,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar sx={{ bgcolor: '#114f95', width: 44, height: 44 }}>SL</Avatar>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#163047' }}>
                StaffLens
              </Typography>
              <Typography variant="body2" sx={{ color: '#6c7c8f' }}>
                Admin Workspace
              </Typography>
            </Box>
          )}
        </Stack>
        <IconButton
          onClick={onToggleCollapse}
          sx={{
            display: { xs: 'none', lg: 'inline-flex' },
            color: '#5c7188',
            border: '1px solid rgba(92, 113, 136, 0.18)',
            width: 34,
            height: 34,
            flexShrink: 0,
          }}
        >
          {collapsed ? (
            <KeyboardDoubleArrowRightRoundedIcon />
          ) : (
            <KeyboardDoubleArrowLeftRoundedIcon />
          )}
        </IconButton>
      </Toolbar>
      <Divider />
      <List sx={{ px: collapsed ? 1.2 : 2, py: 2, flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.label}
            component={RouterLink}
            to={item.path}
            sx={{
              borderRadius: 3,
              mb: 0.8,
              justifyContent: collapsed ? 'center' : 'flex-start',
              backgroundColor:
                currentSection === item.key ? alpha('#114f95', 0.1) : 'transparent',
              color: currentSection === item.key ? '#114f95' : '#30475e',
              px: collapsed ? 1.2 : 2,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: collapsed ? 0 : 40,
                mr: collapsed ? 0 : 'auto',
                color: currentSection === item.key ? '#114f95' : '#6a7b90',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </ListItemIcon>
            {!collapsed && <ListItemText primary={item.label} />}
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ p: collapsed ? 1.2 : 2 }}>
        <Button
          fullWidth
          startIcon={<LogoutRoundedIcon />}
          variant="outlined"
          onClick={onLogout}
          sx={{
            minHeight: 46,
            justifyContent: collapsed ? 'center' : 'flex-start',
            px: collapsed ? 0 : 2,
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 3,
          }}
        >
          {!collapsed && 'Logout'}
        </Button>
      </Box>
    </Box>
  )
}

function triggerFileDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function exportStaffRecordsToXlsx(records) {
  const worksheet = XLSX.utils.json_to_sheet(
    records.map((record) => ({
      'PF Number': record.pfNumber,
      Name: record.name,
      Rank: record.rank,
      Department: record.department,
      Phone: record.phone,
      'GL / Step': record.glStep,
    })),
  )
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Directory')
  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  triggerFileDownload(
    output,
    'staff-directory.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
}

function downloadStaffRecordsAsCsv(records) {
  const worksheet = XLSX.utils.json_to_sheet(
    records.map((record) => ({
      'PF Number': record.pfNumber,
      Name: record.name,
      Rank: record.rank,
      Department: record.department,
      Phone: record.phone,
      'GL / Step': record.glStep,
    })),
  )
  const csv = XLSX.utils.sheet_to_csv(worksheet)
  triggerFileDownload(csv, 'staff-directory.csv', 'text/csv;charset=utf-8;')
}

function exportUpdatedStaffWorkbook(records) {
  const worksheet = XLSX.utils.json_to_sheet(
    records.map((record, index) => ({
      'S-NO': index + 1,
      'STAFF ID': record.pfNumber,
      'LEGACY ID': record.legacyId,
      SURNAME: record.surname,
      'FIRST NAME': record.firstName,
      'OTHER NAME': record.otherName,
      RANK: record.rank,
      'SALARY STRUCTURE': record.salaryStructure,
      'Reg NR': record.gl,
      STEP: record.step,
      QUALIFICATION: record.qualification,
      SEX: record.sex,
      'DATE OF BIRTH': record.dateOfBirth,
      'STATE OF ORIGIN': record.stateOfOrigin,
      LGA: record.lga,
      'DATE OF FIRST APPT.': record.dateOfFirstAppointment,
      'DATE OF CONFIRMATION': record.dateOfConfirmation,
      'DATE OF LAST PROMOTION': record.dateOfLastPromotion,
      'DEPARTMENT/UNIT': record.department,
      'POSTED UNIT': record.postedUnit,
      'Staff Phone No': record.phone,
      Bank: record.bank,
      'Account No': record.accountNo,
      'RSA PIN': record.rsaPin,
      PFA: record.pfa,
      NIN: record.nin,
      TIN: record.tin,
      'NOK NAME': record.nokName,
      RELATIONSHIP: record.relationship,
      'NOK PHONE NO': record.nokPhone,
      STATUS: record.status,
    })),
  )
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Records')
  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  triggerFileDownload(
    output,
    'Staffs-updated.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
}

function exportDepartmentsToXlsx(rows) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      Department: row.name,
      'Staff Count': row.staffCount,
    })),
  )
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Departments')
  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  triggerFileDownload(
    output,
    'departments.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
}

function exportDepartmentsToPdf(rows) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text('Departments List', 14, 16)
  autoTable(doc, {
    startY: 24,
    head: [['Department', 'Staff Count']],
    body: rows.map((row) => [row.name, String(row.staffCount)]),
    headStyles: {
      fillColor: [17, 79, 149],
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
  })
  doc.save('departments.pdf')
}

function exportPersonnelRecordsToXlsx(rows) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      'PF Number': row.pfNumber,
      Name: row.name,
      Sex: row.sex,
      Status: row.status,
      Department: row.department,
      'Posted Unit': row.postedUnit,
      Rank: row.rank,
      'Salary Structure': row.salaryStructure,
      Qualification: row.qualification,
      'State of Origin': row.stateOfOrigin,
      LGA: row.lga,
      'Date of First Appointment': row.dateOfFirstAppointment,
      'Date of Confirmation': row.dateOfConfirmation,
      'Date of Last Promotion': row.dateOfLastPromotion,
    })),
  )
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Personnel Records')
  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  triggerFileDownload(
    output,
    'personnel-records.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
}

function downloadPersonnelRecordsAsCsv(rows) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      'PF Number': row.pfNumber,
      Name: row.name,
      Sex: row.sex,
      Status: row.status,
      Department: row.department,
      'Posted Unit': row.postedUnit,
      Rank: row.rank,
      'Salary Structure': row.salaryStructure,
      Qualification: row.qualification,
      'State of Origin': row.stateOfOrigin,
      LGA: row.lga,
      'Date of First Appointment': row.dateOfFirstAppointment,
      'Date of Confirmation': row.dateOfConfirmation,
      'Date of Last Promotion': row.dateOfLastPromotion,
    })),
  )
  const csv = XLSX.utils.sheet_to_csv(worksheet)
  triggerFileDownload(csv, 'personnel-records.csv', 'text/csv;charset=utf-8;')
}

function normalizeGender(value) {
  const normalized = String(value || '').trim().toUpperCase()

  if (normalized === 'M' || normalized === 'MALE') {
    return 'Male'
  }

  if (normalized === 'F' || normalized === 'FEMALE') {
    return 'Female'
  }

  return 'Unknown/Invalid Gender'
}

function classifySalaryStructure(value) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')

  if (normalized.includes('CONUASS') || normalized.includes('CONUSSS')) {
    return 'CONUASS'
  }

  if (
    normalized.includes('CONTISS') ||
    normalized.includes('CONTIS') ||
    normalized.includes('COINTISS')
  ) {
    return 'CONTISS'
  }

  if (!normalized) {
    return 'OTHER'
  }

  return 'OTHER'
}

function normalizeCollegeName(value) {
  const normalized = String(value || '').trim()

  if (!normalized) {
    return ''
  }

  return normalized
    .replace(/^Dean['sS.\s]*Office\s*/i, '')
    .replace(/^Deans['sS.\s]*\s*/i, '')
    .replace(/^Dean'S office\s*/i, '')
    .replace(/^Colleger\s+/i, 'College ')
    .replace(/^College of Vet Medicine$/i, 'College of Veterinary Medicine')
    .replace(/^College of Agricultural & Science Education$/i, 'College of Agricultural Science Education')
    .replace(/^College of Agronogy$/i, 'College of Agronomy')
    .replace(/^College of Biological Science$/i, 'College of Biological Sciences')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractCollegeTag(record) {
  const candidates = [record.postedUnit, record.department]

  for (const candidate of candidates) {
    const source = String(candidate || '').trim()

    if (!source || !/college/i.test(source)) {
      continue
    }

    const match = source.match(/college\s+of\s+.+/i)
    if (match) {
      return normalizeCollegeName(match[0])
    }

    return normalizeCollegeName(source)
  }

  return ''
}

function buildCountSummary(records, getKey) {
  const grouped = new Map()

  records.forEach((record) => {
    const key = getKey(record) || 'Not available'
    if (!grouped.has(key)) {
      grouped.set(key, {
        name: key,
        total: 0,
        male: 0,
        female: 0,
        unknown: 0,
      })
    }

    const row = grouped.get(key)
    row.total += 1

    const gender = normalizeGender(record.sex)
    if (gender === 'Male') {
      row.male += 1
    } else if (gender === 'Female') {
      row.female += 1
    } else {
      row.unknown += 1
    }
  })

  return Array.from(grouped.values()).sort(
    (left, right) => right.total - left.total || left.name.localeCompare(right.name),
  )
}

function exportReportsToXlsx({
  overallTotalsRows,
  departmentSummaryRows,
  collegeSummaryRows,
  rankSummaryRows,
  academicConuassRows,
  nonTeachingContissRows,
}) {
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(overallTotalsRows),
    'Overall Totals',
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      departmentSummaryRows.map((row) => ({
        'Department / Directorate': row.name,
        'Total Staff': row.total,
        'Male Staff': row.male,
        'Female Staff': row.female,
        'Unknown Gender': row.unknown,
      })),
    ),
    'Department Summary',
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      collegeSummaryRows.map((row) => ({
        'College (explicitly tagged in source)': row.name,
        'Total Staff': row.total,
        'Male Staff': row.male,
        'Female Staff': row.female,
        'Unknown Gender': row.unknown,
      })),
    ),
    'College Summary',
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      rankSummaryRows.map((row) => ({
        Rank: row.name,
        'Total Staff': row.total,
        'Male Staff': row.male,
        'Female Staff': row.female,
        'Unknown Gender': row.unknown,
      })),
    ),
    'Rank Summary',
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      academicConuassRows.map((row) => ({
        Category: row.name,
        'Total Staff': row.total,
        'Male Staff': row.male,
        'Female Staff': row.female,
        'Unknown Gender': row.unknown,
      })),
    ),
    'Academic CONUASS',
  )
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      nonTeachingContissRows.map((row) => ({
        Category: row.name,
        'Total Staff': row.total,
        'Male Staff': row.male,
        'Female Staff': row.female,
        'Unknown Gender': row.unknown,
      })),
    ),
    'Non-Teaching CONTISS',
  )

  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  triggerFileDownload(
    output,
    'staff-summary-analysis.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
}

function downloadReportsAsCsv({
  overallTotalsRows,
  departmentSummaryRows,
  collegeSummaryRows,
  rankSummaryRows,
  academicConuassRows,
  nonTeachingContissRows,
}) {
  const worksheet = XLSX.utils.json_to_sheet([
    ...overallTotalsRows.map((row) => ({
      Section: 'Overall Totals',
      Metric: row.Metric,
      Count: row.Count,
    })),
    ...departmentSummaryRows.map((row) => ({
      Section: 'Department Summary',
      Name: row.name,
      'Total Staff': row.total,
      'Male Staff': row.male,
      'Female Staff': row.female,
      'Unknown Gender': row.unknown,
    })),
    ...collegeSummaryRows.map((row) => ({
      Section: 'College Summary',
      Name: row.name,
      'Total Staff': row.total,
      'Male Staff': row.male,
      'Female Staff': row.female,
      'Unknown Gender': row.unknown,
    })),
    ...rankSummaryRows.map((row) => ({
      Section: 'Rank Summary',
      Name: row.name,
      'Total Staff': row.total,
      'Male Staff': row.male,
      'Female Staff': row.female,
      'Unknown Gender': row.unknown,
    })),
    ...academicConuassRows.map((row) => ({
      Section: 'Academic CONUASS',
      Name: row.name,
      'Total Staff': row.total,
      'Male Staff': row.male,
      'Female Staff': row.female,
      'Unknown Gender': row.unknown,
    })),
    ...nonTeachingContissRows.map((row) => ({
      Section: 'Non-Teaching CONTISS',
      Name: row.name,
      'Total Staff': row.total,
      'Male Staff': row.male,
      'Female Staff': row.female,
      'Unknown Gender': row.unknown,
    })),
  ])

  const csv = XLSX.utils.sheet_to_csv(worksheet)
  triggerFileDownload(csv, 'staff-summary-analysis.csv', 'text/csv;charset=utf-8;')
}

function exportReportsToPdf({
  overallTotalsRows,
  departmentSummaryRows,
  collegeSummaryRows,
  rankSummaryRows,
  academicConuassRows,
  nonTeachingContissRows,
}) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text('Staff Summary Analysis', 14, 16)

  autoTable(doc, {
    startY: 24,
    head: [['Metric', 'Value']],
    body: overallTotalsRows.map((row) => [row.Metric, String(row.Count)]),
    headStyles: { fillColor: [17, 79, 149] },
    styles: { fontSize: 10, cellPadding: 3 },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Department / Directorate', 'Total', 'Male', 'Female', 'Unknown']],
    body: departmentSummaryRows
      .slice(0, 12)
      .map((row) => [row.name, String(row.total), String(row.male), String(row.female), String(row.unknown)]),
    headStyles: { fillColor: [63, 139, 105] },
    styles: { fontSize: 9, cellPadding: 3 },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['College', 'Total', 'Male', 'Female', 'Unknown']],
    body: collegeSummaryRows
      .slice(0, 12)
      .map((row) => [row.name, String(row.total), String(row.male), String(row.female), String(row.unknown)]),
    headStyles: { fillColor: [178, 106, 25] },
    styles: { fontSize: 9, cellPadding: 3 },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Rank', 'Total', 'Male', 'Female', 'Unknown']],
    body: rankSummaryRows
      .slice(0, 12)
      .map((row) => [row.name, String(row.total), String(row.male), String(row.female), String(row.unknown)]),
    headStyles: { fillColor: [17, 79, 149] },
    styles: { fontSize: 9, cellPadding: 3 },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Category', 'Total', 'Male', 'Female', 'Unknown']],
    body: academicConuassRows.map((row) => [
      row.name,
      String(row.total),
      String(row.male),
      String(row.female),
      String(row.unknown),
    ]),
    headStyles: { fillColor: [122, 63, 176] },
    styles: { fontSize: 9, cellPadding: 3 },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Category', 'Total', 'Male', 'Female', 'Unknown']],
    body: nonTeachingContissRows.map((row) => [
      row.name,
      String(row.total),
      String(row.male),
      String(row.female),
      String(row.unknown),
    ]),
    headStyles: { fillColor: [63, 139, 105] },
    styles: { fontSize: 9, cellPadding: 3 },
  })

  doc.save('staff-summary-analysis.pdf')
}

function sanitizeExportFilename(value) {
  return String(value || 'summary-table')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'summary-table'
}

function exportSummaryTableToXlsx({ title, rows, columns }) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) =>
      columns.reduce((accumulator, column) => {
        accumulator[column.header] = row[column.key]
        return accumulator
      }, {}),
    ),
  )
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31) || 'Summary')
  const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  triggerFileDownload(
    output,
    `${sanitizeExportFilename(title)}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
}

function exportSummaryTableToCsv({ title, rows, columns }) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) =>
      columns.reduce((accumulator, column) => {
        accumulator[column.header] = row[column.key]
        return accumulator
      }, {}),
    ),
  )
  const csv = XLSX.utils.sheet_to_csv(worksheet)
  triggerFileDownload(
    csv,
    `${sanitizeExportFilename(title)}.csv`,
    'text/csv;charset=utf-8;',
  )
}

function exportSummaryTableToPdf({ title, rows, columns }) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(title, 14, 16)
  autoTable(doc, {
    startY: 24,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) => columns.map((column) => String(row[column.key] ?? ''))),
    headStyles: { fillColor: [17, 79, 149] },
    styles: { fontSize: 9, cellPadding: 3 },
  })
  doc.save(`${sanitizeExportFilename(title)}.pdf`)
}

function buildBaseDepartments(records) {
  const grouped = new Map()

  records.forEach((record) => {
    const key = record.department || 'Not available'
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key).push(record)
  })

  return Array.from(grouped.entries())
    .map(([name, members]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      baseName: name,
      name,
      staffCount: members.length,
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

function readDepartmentOverrides() {
  const raw = localStorage.getItem(DEPARTMENT_STORAGE_KEY)
  if (!raw) {
    return { edits: {}, deleted: [] }
  }

  try {
    const parsed = JSON.parse(raw)
    return {
      edits: parsed.edits ?? {},
      deleted: parsed.deleted ?? [],
    }
  } catch {
    return { edits: {}, deleted: [] }
  }
}

function writeDepartmentOverrides(overrides) {
  localStorage.setItem(DEPARTMENT_STORAGE_KEY, JSON.stringify(overrides))
}

function readPersonnelOverrides() {
  const raw = localStorage.getItem(PERSONNEL_STORAGE_KEY)

  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function writePersonnelOverrides(overrides) {
  localStorage.setItem(PERSONNEL_STORAGE_KEY, JSON.stringify(overrides))
}

function readStaffOverrides() {
  const raw = localStorage.getItem(STAFF_STORAGE_KEY)

  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function writeStaffOverrides(overrides) {
  localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(overrides))
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

function writePassportOverrides(overrides) {
  localStorage.setItem(PASSPORT_STORAGE_KEY, JSON.stringify(overrides))
}

function readAddedStaffRecords() {
  const raw = localStorage.getItem(ADDED_STAFF_STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAddedStaffRecords(records) {
  localStorage.setItem(ADDED_STAFF_STORAGE_KEY, JSON.stringify(records))
}

function sanitizePassportBaseName(pfNumber) {
  const normalized = String(pfNumber || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/\//g, '-')

  return normalized || 'staff-passport'
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Unable to read the selected passport file.'))
    reader.readAsDataURL(file)
  })
}

function DepartmentEditDialog({ open, department, onClose, onSave }) {
  const [formValues, setFormValues] = useState({ name: '' })

  useEffect(() => {
    if (department) {
      setFormValues({
        name: department.name,
      })
    }
  }, [department])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Department</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Department Name"
            value={formValues.name}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, name: event.target.value }))
            }
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          onClick={() => onSave(formValues)}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function PersonnelEditDialog({ open, record, onClose, onSave }) {
  const [formValues, setFormValues] = useState({
    postedUnit: '',
    status: 'Not available',
    rank: '',
  })

  useEffect(() => {
    if (record) {
      setFormValues({
        postedUnit: record.postedUnit,
        status: record.status,
        rank: record.rank,
      })
    }
  }, [record])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Personnel Record</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Posted Unit"
            value={formValues.postedUnit}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                postedUnit: event.target.value,
              }))
            }
            fullWidth
          />
          <TextField
            label="Rank"
            value={formValues.rank}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                rank: event.target.value,
              }))
            }
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="personnel-status-label">Status</InputLabel>
            <Select
              labelId="personnel-status-label"
              label="Status"
              value={formValues.status}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
            >
              <MenuItem value="Not available">Not available</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Leave">Leave</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
              <MenuItem value="Retired">Retired</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          onClick={() => onSave(formValues)}
        >
          Save Record
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function StaffEditDialog({ open, record, passportAsset, mode = 'edit', onClose, onSave }) {
  const [formValues, setFormValues] = useState({})
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewSource, setPreviewSource] = useState('')

  useEffect(() => {
    if (record) {
      setFormValues({
        pfNumber: record.pfNumber,
        legacyId: record.legacyId,
        surname: record.surname,
        firstName: record.firstName,
        otherName: record.otherName,
        rank: record.rank,
        salaryStructure: record.salaryStructure,
        gl: record.gl,
        step: record.step,
        qualification: record.qualification,
        sex: record.sex,
        dateOfBirth: record.dateOfBirth,
        stateOfOrigin: record.stateOfOrigin,
        lga: record.lga,
        dateOfFirstAppointment: record.dateOfFirstAppointment,
        dateOfConfirmation: record.dateOfConfirmation,
        dateOfLastPromotion: record.dateOfLastPromotion,
        department: record.department,
        postedUnit: record.postedUnit,
        phone: record.phone,
        bank: record.bank,
        accountNo: record.accountNo,
        rsaPin: record.rsaPin,
        pfa: record.pfa,
        nin: record.nin,
        tin: record.tin,
        nokName: record.nokName,
        relationship: record.relationship,
        nokPhone: record.nokPhone,
        status: record.status,
      })
      setSelectedFile(null)
      setPreviewSource(passportAsset?.dataUrl || '')
    } else {
      setFormValues({
        pfNumber: '',
        legacyId: '',
        surname: '',
        firstName: '',
        otherName: '',
        rank: '',
        salaryStructure: '',
        gl: '',
        step: '',
        qualification: '',
        sex: '',
        dateOfBirth: '',
        stateOfOrigin: '',
        lga: '',
        dateOfFirstAppointment: '',
        dateOfConfirmation: '',
        dateOfLastPromotion: '',
        department: '',
        postedUnit: '',
        phone: '',
        bank: '',
        accountNo: '',
        rsaPin: '',
        pfa: '',
        nin: '',
        tin: '',
        nokName: '',
        relationship: '',
        nokPhone: '',
        status: '',
      })
      setSelectedFile(null)
      setPreviewSource('')
    }
  }, [passportAsset, record])

  const fields = [
    ['pfNumber', 'PF Number'],
    ['legacyId', 'Legacy ID'],
    ['surname', 'Surname'],
    ['firstName', 'First Name'],
    ['otherName', 'Other Name'],
    ['rank', 'Rank'],
    ['salaryStructure', 'Salary Structure'],
    ['gl', 'GL'],
    ['step', 'Step'],
    ['qualification', 'Qualification'],
    ['sex', 'Sex'],
    ['dateOfBirth', 'Date of Birth'],
    ['stateOfOrigin', 'State of Origin'],
    ['lga', 'LGA'],
    ['dateOfFirstAppointment', 'Date of First Appointment'],
    ['dateOfConfirmation', 'Date of Confirmation'],
    ['dateOfLastPromotion', 'Date of Last Promotion'],
    ['department', 'Department'],
    ['postedUnit', 'Posted Unit'],
    ['phone', 'Phone'],
    ['bank', 'Bank'],
    ['accountNo', 'Account No'],
    ['rsaPin', 'RSA PIN'],
    ['pfa', 'PFA'],
    ['nin', 'NIN'],
    ['tin', 'TIN'],
    ['nokName', 'NOK Name'],
    ['relationship', 'Relationship'],
    ['nokPhone', 'NOK Phone'],
    ['status', 'Status'],
  ]

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>{mode === 'add' ? 'Add Staff Record' : 'Edit Staff Record'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              border: '1px solid rgba(17, 57, 109, 0.08)',
              backgroundColor: '#f8fbff',
            }}
          >
            <CardContent>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2.5}
                alignItems={{ xs: 'stretch', md: 'center' }}
              >
                <Box
                  sx={{
                    width: 128,
                    height: 128,
                    borderRadius: 4,
                    overflow: 'hidden',
                    bgcolor: '#e1ebf8',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {previewSource ? (
                    <Box
                      component="img"
                      src={previewSource}
                      alt="Staff passport preview"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Typography sx={{ color: '#5f7892', fontWeight: 700 }}>
                      No Passport
                    </Typography>
                  )}
                </Box>
                <Stack spacing={1.2} sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ color: '#163047', fontWeight: 700 }}>
                    Passport Upload
                  </Typography>
                  <Typography sx={{ color: '#607388', lineHeight: 1.6 }}>
                    Upload a staff passport image and it will be saved using the project naming convention based on the PF number.
                  </Typography>
                  <Button variant="outlined" component="label" sx={{ width: 'fit-content' }}>
                    Upload Passport
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0]

                        if (!file) {
                          return
                        }

                        setSelectedFile(file)
                        setPreviewSource(URL.createObjectURL(file))
                      }}
                    />
                  </Button>
                  <Typography variant="body2" sx={{ color: '#5f7892' }}>
                    {selectedFile
                      ? `Pending file: ${sanitizePassportBaseName(formValues.pfNumber)}.${selectedFile.name.split('.').pop()?.toLowerCase() || 'png'}`
                      : passportAsset?.filename
                        ? `Stored passport: ${passportAsset.filename}`
                        : 'No uploaded passport has been stored yet.'}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
          {fields.map(([key, label]) => (
            <Grid key={key} size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label={label}
                value={formValues[key] ?? ''}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
              />
            </Grid>
          ))}
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          onClick={() => onSave({ ...formValues, selectedPassportFile: selectedFile })}
        >
          {mode === 'add' ? 'Add Staff Record' : 'Save Staff Record'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function AdminUserDialog({ open, user, onClose, onSave }) {
  const [formValues, setFormValues] = useState({
    fullName: '',
    email: '',
    role: 'Admin',
    status: 'Active',
    password: '',
  })

  useEffect(() => {
    setFormValues({
      fullName: user?.fullName || '',
      email: user?.email || '',
      role: user?.role || 'Admin',
      status: user?.status || 'Active',
      password: '',
    })
  }, [user])

  const isEditing = Boolean(user)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? 'Edit Admin User' : 'Create Admin User'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Full Name"
            value={formValues.fullName}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, fullName: event.target.value }))
            }
            fullWidth
          />
          <TextField
            label="Email Address"
            type="email"
            value={formValues.email}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, email: event.target.value }))
            }
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="admin-role-label">Role</InputLabel>
            <Select
              labelId="admin-role-label"
              label="Role"
              value={formValues.role}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, role: event.target.value }))
              }
            >
              <MenuItem value="Super Admin">Super Admin</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Auditor">Auditor</MenuItem>
              <MenuItem value="Viewer">Viewer</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="admin-status-label">Status</InputLabel>
            <Select
              labelId="admin-status-label"
              label="Status"
              value={formValues.status}
              onChange={(event) =>
                setFormValues((current) => ({ ...current, status: event.target.value }))
              }
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
              <MenuItem value="Review">Review</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label={isEditing ? 'New Password (optional)' : 'Password'}
            type="password"
            value={formValues.password}
            onChange={(event) =>
              setFormValues((current) => ({ ...current, password: event.target.value }))
            }
            helperText={
              isEditing
                ? 'Leave blank to keep the current password.'
                : 'Use at least 8 characters.'
            }
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          onClick={() => onSave(formValues)}
        >
          {isEditing ? 'Save User' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function DashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [records, setRecords] = useState([])
  const [query, setQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [rankFilter, setRankFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [staffOverrides, setStaffOverrides] = useState(() => readStaffOverrides())
  const [passportOverrides, setPassportOverrides] = useState(() => readPassportOverrides())
  const [addedStaffRecords, setAddedStaffRecords] = useState(() => readAddedStaffRecords())
  const [departmentQuery, setDepartmentQuery] = useState('')
  const [departmentPage, setDepartmentPage] = useState(0)
  const [departmentRowsPerPage, setDepartmentRowsPerPage] = useState(8)
  const [departmentOverrides, setDepartmentOverrides] = useState(() =>
    readDepartmentOverrides(),
  )
  const [reportQuery, setReportQuery] = useState('')
  const [reportDepartmentFilter, setReportDepartmentFilter] = useState('all')
  const [reportRankFilter, setReportRankFilter] = useState('all')
  const [reportStatusFilter, setReportStatusFilter] = useState('all')
  const [reportSexFilter, setReportSexFilter] = useState('all')
  const [personnelQuery, setPersonnelQuery] = useState('')
  const [personnelSexFilter, setPersonnelSexFilter] = useState('all')
  const [personnelStatusFilter, setPersonnelStatusFilter] = useState('all')
  const [personnelPage, setPersonnelPage] = useState(0)
  const [personnelRowsPerPage, setPersonnelRowsPerPage] = useState(8)
  const [personnelOverrides, setPersonnelOverrides] = useState(() =>
    readPersonnelOverrides(),
  )
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [editingStaff, setEditingStaff] = useState(null)
  const [staffDialogMode, setStaffDialogMode] = useState('edit')
  const [editingPersonnel, setEditingPersonnel] = useState(null)
  const [adminUsers, setAdminUsers] = useState([])
  const [adminQuery, setAdminQuery] = useState('')
  const [adminRoleFilter, setAdminRoleFilter] = useState('all')
  const [adminStatusFilter, setAdminStatusFilter] = useState('all')
  const [adminPage, setAdminPage] = useState(0)
  const [adminRowsPerPage, setAdminRowsPerPage] = useState(8)
  const [editingAdminUser, setEditingAdminUser] = useState(null)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [adminFeedback, setAdminFeedback] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const session = getCurrentSession()
  const currentSection =
    location.pathname === '/'
      ? 'overview'
      : location.pathname.replace('/', '').split('/')[0] || 'overview'
  const pageMeta = {
    overview: {
      title: 'Dashboard',
      subtitle: '',
    },
    'staff-directory': {
      title: 'Staff Directory',
      subtitle: 'Manage the full list of staff records and exports.',
    },
    training: {
      title: 'Training',
      subtitle: 'Upload or capture face images and add new training profiles.',
    },
    departments: {
      title: 'Departments',
      subtitle: 'Review and maintain department-level administration.',
    },
    reports: {
      title: 'Reports',
      subtitle: 'Analyze workbook statistics and export the current reporting view.',
    },
    'personnel-records': {
      title: 'Personnel Records',
      subtitle: 'Work with rich personnel registry details and filters.',
    },
    'admin-users': {
      title: 'Admin Users',
      subtitle: 'Manage frontend admin accounts and access roles.',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Review local admin configuration and storage behavior.',
    },
  }[currentSection] || {
    title: 'Dashboard',
    subtitle: '',
  }

  useEffect(() => {
    let active = true

    async function fetchDirectory() {
      try {
        setLoading(true)
        setError('')
        const nextRecords = await loadStaffDirectory()
        const nextAdminUsers = await listAdminUsers()
        if (active) {
          setRecords(nextRecords)
          setAdminUsers(nextAdminUsers)
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load dashboard data.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchDirectory()

    return () => {
      active = false
    }
  }, [])

  const mergedRecords = useMemo(
    () =>
      [...records, ...addedStaffRecords].map((record) => {
        const overrides = staffOverrides[record.id] ?? {}
        const nextRecord = { ...record, ...overrides }
        nextRecord.localPassport = passportOverrides[record.id] ?? null
        nextRecord.name = [nextRecord.surname, nextRecord.firstName, nextRecord.otherName]
          .filter((part) => part && part !== 'Not available')
          .join(' ') || nextRecord.name
        nextRecord.glStep = `${nextRecord.gl || 'Not available'} / ${nextRecord.step || 'Not available'}`
        return nextRecord
      }),
    [addedStaffRecords, passportOverrides, records, staffOverrides],
  )

  const departmentOptions = useMemo(
    () =>
      Array.from(new Set(mergedRecords.map((record) => record.department)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [mergedRecords],
  )

  const rankOptions = useMemo(
    () =>
      Array.from(new Set(mergedRecords.map((record) => record.rank)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [mergedRecords],
  )

  const filteredRecords = useMemo(() => {
    return mergedRecords.filter((record) => {
      const matchesSearch = matchesSearchQuery(
        query,
        [record.name, record.pfNumber, record.phone, record.department, record.rank],
        record.pfNumber,
      )

      const matchesDepartment =
        departmentFilter === 'all' || record.department === departmentFilter

      const matchesRank = rankFilter === 'all' || record.rank === rankFilter

      return matchesSearch && matchesDepartment && matchesRank
    })
  }, [departmentFilter, mergedRecords, query, rankFilter])

  const departmentsData = useMemo(() => {
    const baseDepartments = buildBaseDepartments(records)
    return baseDepartments
      .filter((item) => !departmentOverrides.deleted.includes(item.id))
      .map((item) => ({
        ...item,
        ...(departmentOverrides.edits[item.id] ?? {}),
      }))
  }, [departmentOverrides, records])

  const filteredDepartments = useMemo(() => {
    const normalized = departmentQuery.trim().toLowerCase()

    return departmentsData.filter((department) => {
      const matchesSearch =
        !normalized ||
        [department.name]
          .join(' ')
          .toLowerCase()
          .includes(normalized)

      return matchesSearch
    })
  }, [departmentQuery, departmentsData])

  const reportStatusOptions = useMemo(
    () =>
      Array.from(new Set(mergedRecords.map((record) => record.status)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [mergedRecords],
  )

  const reportSexOptions = useMemo(
    () =>
      Array.from(new Set(mergedRecords.map((record) => record.sex)))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [mergedRecords],
  )

  const reportRecords = useMemo(() => {
    return mergedRecords.filter((record) => {
      const matchesSearch = matchesSearchQuery(
        reportQuery,
        [
          record.name,
          record.pfNumber,
          record.department,
          record.rank,
          record.status,
          record.salaryStructure,
          record.postedUnit,
        ],
        record.pfNumber,
      )

      const matchesDepartment =
        reportDepartmentFilter === 'all' || record.department === reportDepartmentFilter
      const matchesRank = reportRankFilter === 'all' || record.rank === reportRankFilter
      const matchesStatus =
        reportStatusFilter === 'all' || record.status === reportStatusFilter
      const matchesSex = reportSexFilter === 'all' || record.sex === reportSexFilter

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesRank &&
        matchesStatus &&
        matchesSex
      )
    })
  }, [
    mergedRecords,
    reportDepartmentFilter,
    reportQuery,
    reportRankFilter,
    reportSexFilter,
    reportStatusFilter,
  ])

  const personnelRecords = useMemo(
    () =>
      records.map((record) => ({
        ...record,
        ...(personnelOverrides[record.id] ?? {}),
      })),
    [personnelOverrides, records],
  )

  const filteredPersonnelRecords = useMemo(() => {
    return personnelRecords.filter((record) => {
      const matchesSearch = matchesSearchQuery(
        personnelQuery,
        [
          record.name,
          record.pfNumber,
          record.department,
          record.postedUnit,
          record.rank,
          record.status,
          record.sex,
        ],
        record.pfNumber,
      )

      const matchesSex =
        personnelSexFilter === 'all' || record.sex === personnelSexFilter
      const matchesStatus =
        personnelStatusFilter === 'all' || record.status === personnelStatusFilter

      return matchesSearch && matchesSex && matchesStatus
    })
  }, [personnelQuery, personnelRecords, personnelSexFilter, personnelStatusFilter])

  useEffect(() => {
    setPage(0)
  }, [query, departmentFilter, rankFilter])

  useEffect(() => {
    setDepartmentPage(0)
  }, [departmentQuery])

  const reportDepartmentSummaryRows = useMemo(
    () => buildCountSummary(reportRecords, (record) => record.department),
    [reportRecords],
  )

  const reportCollegeTaggedRecords = useMemo(
    () =>
      reportRecords
        .map((record) => ({
          ...record,
          collegeTag: extractCollegeTag(record),
        }))
        .filter((record) => record.collegeTag),
    [reportRecords],
  )

  const reportCollegeSummaryRows = useMemo(
    () => buildCountSummary(reportCollegeTaggedRecords, (record) => record.collegeTag),
    [reportCollegeTaggedRecords],
  )

  const reportRankSummaryRows = useMemo(
    () => buildCountSummary(reportRecords, (record) => record.rank),
    [reportRecords],
  )

  const academicConuassRecords = useMemo(
    () =>
      reportRecords.filter(
        (record) => classifySalaryStructure(record.salaryStructure) === 'CONUASS',
      ),
    [reportRecords],
  )

  const nonTeachingContissRecords = useMemo(
    () =>
      reportRecords.filter(
        (record) => classifySalaryStructure(record.salaryStructure) === 'CONTISS',
      ),
    [reportRecords],
  )

  const otherSalaryStructureRecords = useMemo(
    () =>
      reportRecords.filter(
        (record) => classifySalaryStructure(record.salaryStructure) === 'OTHER',
      ),
    [reportRecords],
  )

  const genderTotals = useMemo(() => {
    return reportRecords.reduce(
      (accumulator, record) => {
        const gender = normalizeGender(record.sex)
        if (gender === 'Male') {
          accumulator.male += 1
        } else if (gender === 'Female') {
          accumulator.female += 1
        } else {
          accumulator.unknown += 1
        }
        return accumulator
      },
      { male: 0, female: 0, unknown: 0 },
    )
  }, [reportRecords])

  const reportOverallTotalsRows = useMemo(
    () => [
      { Metric: 'Grand Total Staff', Count: reportRecords.length },
      { Metric: 'Male Staff', Count: genderTotals.male },
      { Metric: 'Female Staff', Count: genderTotals.female },
      { Metric: 'Unknown/Invalid Gender', Count: genderTotals.unknown },
      {
        Metric: 'Distinct Department/Directorate Groups',
        Count: reportDepartmentSummaryRows.length,
      },
      {
        Metric: 'Explicitly Tagged CONUASS Staff',
        Count: academicConuassRecords.length,
      },
      {
        Metric: 'Explicitly Tagged CONTISS Staff',
        Count: nonTeachingContissRecords.length,
      },
      {
        Metric: 'Other Salary Structures (CONHESS/CONMESS/PONA)',
        Count: otherSalaryStructureRecords.length,
      },
    ],
    [
      academicConuassRecords.length,
      genderTotals.female,
      genderTotals.male,
      genderTotals.unknown,
      nonTeachingContissRecords.length,
      otherSalaryStructureRecords.length,
      reportDepartmentSummaryRows.length,
      reportRecords.length,
    ],
  )

  const reportAcademicConuassRows = useMemo(
    () => buildCountSummary(academicConuassRecords, () => 'Academic Staff (CONUASS)'),
    [academicConuassRecords],
  )

  const reportNonTeachingContissRows = useMemo(
    () =>
      buildCountSummary(
        nonTeachingContissRecords,
        () => 'Non-Teaching Staff (CONTISS)',
      ),
    [nonTeachingContissRecords],
  )

  const reportExportPayload = useMemo(
    () => ({
      overallTotalsRows: reportOverallTotalsRows,
      departmentSummaryRows: reportDepartmentSummaryRows,
      collegeSummaryRows: reportCollegeSummaryRows,
      rankSummaryRows: reportRankSummaryRows,
      academicConuassRows: reportAcademicConuassRows,
      nonTeachingContissRows: reportNonTeachingContissRows,
    }),
    [
      reportAcademicConuassRows,
      reportCollegeSummaryRows,
      reportDepartmentSummaryRows,
      reportNonTeachingContissRows,
      reportOverallTotalsRows,
      reportRankSummaryRows,
    ],
  )

  useEffect(() => {
    setPersonnelPage(0)
  }, [personnelQuery, personnelSexFilter, personnelStatusFilter])

  useEffect(() => {
    setAdminPage(0)
  }, [adminQuery, adminRoleFilter, adminStatusFilter])

  const paginatedRecords = useMemo(() => {
    const start = page * rowsPerPage
    return filteredRecords.slice(start, start + rowsPerPage)
  }, [filteredRecords, page, rowsPerPage])

  const paginatedDepartments = useMemo(() => {
    const start = departmentPage * departmentRowsPerPage
    return filteredDepartments.slice(start, start + departmentRowsPerPage)
  }, [departmentPage, departmentRowsPerPage, filteredDepartments])

  const paginatedPersonnelRecords = useMemo(() => {
    const start = personnelPage * personnelRowsPerPage
    return filteredPersonnelRecords.slice(start, start + personnelRowsPerPage)
  }, [
    filteredPersonnelRecords,
    personnelPage,
    personnelRowsPerPage,
  ])

  const filteredAdminUsers = useMemo(() => {
    const normalized = adminQuery.trim().toLowerCase()

    return adminUsers.filter((user) => {
      const matchesSearch =
        !normalized ||
        [user.fullName, user.email, user.role, user.status]
          .join(' ')
          .toLowerCase()
          .includes(normalized)

      const matchesRole = adminRoleFilter === 'all' || user.role === adminRoleFilter
      const matchesStatus =
        adminStatusFilter === 'all' || user.status === adminStatusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [adminQuery, adminRoleFilter, adminStatusFilter, adminUsers])

  const paginatedAdminUsers = useMemo(() => {
    const start = adminPage * adminRowsPerPage
    return filteredAdminUsers.slice(start, start + adminRowsPerPage)
  }, [adminPage, adminRowsPerPage, filteredAdminUsers])

  const totalStaff = records.length
  const departments = departmentsData.length

  const summaryCards = [
    {
      label: 'Total Staff',
      value: totalStaff.toLocaleString(),
      icon: <PeopleAltRoundedIcon />,
      tone: '#114f95',
    },
    {
      label: 'Departments',
      value: departments.toLocaleString(),
      icon: <ApartmentRoundedIcon />,
      tone: '#3f8b69',
    },
    {
      label: 'Filtered Results',
      value: filteredRecords.length.toLocaleString(),
      icon: <TrendingUpRoundedIcon />,
      tone: '#b26a19',
    },
    {
      label: 'Verified Profiles',
      value: Math.max(totalStaff - 18, 0).toLocaleString(),
      icon: <VerifiedRoundedIcon />,
      tone: '#7a3fb0',
    },
  ]

  const reportHighlights = [
    {
      label: 'Grand Total Staff',
      value: reportRecords.length.toLocaleString(),
      helper: 'Current filtered total in the summary analysis',
      tone: '#114f95',
    },
    {
      label: 'Male / Female',
      value: `${genderTotals.male.toLocaleString()} / ${genderTotals.female.toLocaleString()}`,
      helper: `${genderTotals.unknown.toLocaleString()} unknown or invalid gender record(s)`,
      tone: '#3f8b69',
    },
    {
      label: 'CONUASS',
      value: academicConuassRecords.length.toLocaleString(),
      helper: 'Explicitly tagged academic salary structure records',
      tone: '#b26a19',
    },
    {
      label: 'Top Rank',
      value: reportRankSummaryRows[0]?.name || 'No data',
      helper: reportRankSummaryRows[0]
        ? `${reportRankSummaryRows[0].total.toLocaleString()} staff in this rank`
        : `${otherSalaryStructureRecords.length.toLocaleString()} record(s) in other salary structures`,
      tone: '#7a3fb0',
    },
  ]

  const overallTotalsTableConfig = {
    title: 'Overall Totals',
    rows: reportOverallTotalsRows,
    columns: [
      { key: 'Metric', header: 'Metric' },
      { key: 'Count', header: 'Count' },
    ],
  }

  const countSummaryColumns = (firstHeader) => [
    { key: 'name', header: firstHeader },
    { key: 'total', header: 'Total Staff' },
    { key: 'male', header: 'Male Staff' },
    { key: 'female', header: 'Female Staff' },
    { key: 'unknown', header: 'Unknown Gender' },
  ]

  function handleLogout() {
    logoutAdmin()
    navigate('/login')
  }

  function persistDepartmentOverrides(nextOverrides) {
    setDepartmentOverrides(nextOverrides)
    writeDepartmentOverrides(nextOverrides)
  }

  function persistPersonnelOverrides(nextOverrides) {
    setPersonnelOverrides(nextOverrides)
    writePersonnelOverrides(nextOverrides)
  }

  function persistStaffOverrides(nextOverrides) {
    setStaffOverrides(nextOverrides)
    writeStaffOverrides(nextOverrides)
  }

  function persistPassportOverrides(nextOverrides) {
    setPassportOverrides(nextOverrides)
    writePassportOverrides(nextOverrides)
  }

  function persistAddedStaffRecords(nextRecords) {
    setAddedStaffRecords(nextRecords)
    writeAddedStaffRecords(nextRecords)
  }

  function handleSaveDepartment(formValues) {
    if (!editingDepartment) {
      return
    }

    const nextOverrides = {
      ...departmentOverrides,
      edits: {
        ...departmentOverrides.edits,
        [editingDepartment.id]: {
          name: formValues.name.trim() || editingDepartment.name,
        },
      },
    }

    persistDepartmentOverrides(nextOverrides)
    setEditingDepartment(null)
  }

  function handleDeleteDepartment(departmentId) {
    if (!window.confirm('Delete this department from the frontend admin list?')) {
      return
    }

    const nextOverrides = {
      ...departmentOverrides,
      deleted: Array.from(new Set([...departmentOverrides.deleted, departmentId])),
    }

    persistDepartmentOverrides(nextOverrides)
  }

  function handleSavePersonnel(formValues) {
    if (!editingPersonnel) {
      return
    }

    const nextOverrides = {
      ...personnelOverrides,
      [editingPersonnel.id]: {
        postedUnit: formValues.postedUnit.trim() || 'Not available',
        rank: formValues.rank.trim() || editingPersonnel.rank,
        status: formValues.status,
      },
    }

    persistPersonnelOverrides(nextOverrides)
    setEditingPersonnel(null)
  }

  async function handleSaveStaff(formValues) {
    const { selectedPassportFile, ...restValues } = formValues
    const normalizedPfNumber = restValues.pfNumber.trim()

    if (!normalizedPfNumber) {
      window.alert('PF Number is required before saving a staff record.')
      return
    }

    const normalizedValues = {
      ...restValues,
      pfNumber: normalizedPfNumber,
      id: normalizedPfNumber,
      legacyId: restValues.legacyId?.trim() || 'Not available',
      surname: restValues.surname?.trim() || 'Not available',
      firstName: restValues.firstName?.trim() || 'Not available',
      otherName: restValues.otherName?.trim() || 'Not available',
      rank: restValues.rank?.trim() || 'Not available',
      salaryStructure: restValues.salaryStructure?.trim() || 'Not available',
      gl: restValues.gl?.trim() || 'Not available',
      step: restValues.step?.trim() || 'Not available',
      qualification: restValues.qualification?.trim() || 'Not available',
      sex: restValues.sex?.trim() || 'Not available',
      dateOfBirth: restValues.dateOfBirth?.trim() || 'Not available',
      stateOfOrigin: restValues.stateOfOrigin?.trim() || 'Not available',
      lga: restValues.lga?.trim() || 'Not available',
      dateOfFirstAppointment:
        restValues.dateOfFirstAppointment?.trim() || 'Not available',
      dateOfConfirmation: restValues.dateOfConfirmation?.trim() || 'Not available',
      dateOfLastPromotion:
        restValues.dateOfLastPromotion?.trim() || 'Not available',
      department: restValues.department?.trim() || 'Not available',
      postedUnit: restValues.postedUnit?.trim() || 'Not available',
      phone: restValues.phone?.trim() || 'Not available',
      bank: restValues.bank?.trim() || 'Not available',
      accountNo: restValues.accountNo?.trim() || 'Not available',
      rsaPin: restValues.rsaPin?.trim() || 'Not available',
      pfa: restValues.pfa?.trim() || 'Not available',
      nin: restValues.nin?.trim() || 'Not available',
      tin: restValues.tin?.trim() || 'Not available',
      nokName: restValues.nokName?.trim() || 'Not available',
      relationship: restValues.relationship?.trim() || 'Not available',
      nokPhone: restValues.nokPhone?.trim() || 'Not available',
      status: restValues.status?.trim() || 'Not available',
      postedUnitRaw: restValues.postedUnit?.trim() || 'Not available',
      name: [restValues.surname, restValues.firstName, restValues.otherName]
        .filter(Boolean)
        .join(' '),
      passportCandidates: [],
    }

    if (staffDialogMode === 'add') {
      const alreadyExists = mergedRecords.some(
        (record) => record.pfNumber.toLowerCase() === normalizedPfNumber.toLowerCase(),
      )

      if (alreadyExists) {
        window.alert('A staff record with this PF Number already exists.')
        return
      }

      persistAddedStaffRecords([...addedStaffRecords, normalizedValues])
    } else {
      if (!editingStaff) {
        return
      }

      const nextOverrides = {
        ...staffOverrides,
        [editingStaff.id]: normalizedValues,
      }

      persistStaffOverrides(nextOverrides)
    }

    if (selectedPassportFile) {
      const extension =
        selectedPassportFile.name.split('.').pop()?.toLowerCase() || 'png'
      const fileName = `${sanitizePassportBaseName(normalizedPfNumber)}.${extension}`
      const dataUrl = await fileToDataUrl(selectedPassportFile)
      const passportRecordId = staffDialogMode === 'add' ? normalizedPfNumber : editingStaff.id

      persistPassportOverrides({
        ...passportOverrides,
        [passportRecordId]: {
          filename: fileName,
          dataUrl,
          mimeType: selectedPassportFile.type || 'image/png',
          updatedAt: new Date().toISOString(),
        },
      })
    }

    setEditingStaff(null)
    setStaffDialogMode('edit')
  }

  async function refreshAdminUsers() {
    const nextUsers = await listAdminUsers()
    setAdminUsers(nextUsers)
  }

  async function handleSaveAdminUser(formValues) {
    try {
      if (editingAdminUser) {
        await updateAdminUser(editingAdminUser.id, formValues)
        setAdminFeedback({ severity: 'success', message: 'Admin user updated successfully.' })
      } else {
        await createAdminUser(formValues)
        setAdminFeedback({ severity: 'success', message: 'Admin user created successfully.' })
      }

      await refreshAdminUsers()
      setAdminDialogOpen(false)
      setEditingAdminUser(null)
    } catch (error) {
      setAdminFeedback({
        severity: 'error',
        message: error instanceof Error ? error.message : 'Unable to save admin user.',
      })
    }
  }

  async function handleDeleteAdminUser(id) {
    if (!window.confirm('Delete this admin user from the frontend auth store?')) {
      return
    }

    try {
      await deleteAdminUser(id)
      await refreshAdminUsers()
      setAdminFeedback({ severity: 'success', message: 'Admin user deleted successfully.' })
    } catch (error) {
      setAdminFeedback({
        severity: 'error',
        message: error instanceof Error ? error.message : 'Unable to delete admin user.',
      })
    }
  }

  const drawer = (
    <SidebarContent
      currentSection={currentSection}
      collapsed={sidebarCollapsed}
      onLogout={handleLogout}
      onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
    />
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{
            width: {
              lg: `calc(100% - ${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px)`,
            },
            ml: { lg: `${sidebarCollapsed ? collapsedDrawerWidth : drawerWidth}px` },
            bgcolor: alpha('#ffffff', 0.9),
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(22, 48, 71, 0.08)',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', gap: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconButton
                color="primary"
                onClick={() => setMobileOpen(true)}
                sx={{ display: { lg: 'none' } }}
              >
                <MenuRoundedIcon />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{ color: '#163047', fontWeight: 800 }}>
                  {pageMeta.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6a7b90' }}>
                  {pageMeta.subtitle}
                </Typography>
              </Box>
            </Stack>
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{
            width: { lg: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth },
            flexShrink: { lg: 0 },
          }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', lg: 'none' },
              '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', lg: 'block' },
              '& .MuiDrawer-paper': {
                width: sidebarCollapsed ? collapsedDrawerWidth : drawerWidth,
                boxSizing: 'border-box',
                borderRight: '1px solid rgba(22, 48, 71, 0.08)',
                backgroundColor: 'rgba(255,255,255,0.84)',
                backdropFilter: 'blur(12px)',
                overflowX: 'hidden',
                transition: 'width 180ms ease',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, mt: 10 }}>
          <Grid container spacing={2.5}>
            {currentSection === 'overview' &&
              summaryCards.map((card) => (
              <Grid key={card.label} size={{ xs: 12, sm: 6, xl: 3 }}>
                <Card elevation={0} sx={{ border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ color: '#708197' }}>
                          {card.label}
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1, color: '#163047' }}>
                          {card.value}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: alpha(card.tone, 0.12), color: card.tone }}>
                        {card.icon}
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {currentSection === 'staff-directory' && (
            <Grid size={{ xs: 12 }}>
              <Card elevation={0} sx={{ border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', lg: 'center' }}
                    spacing={2}
                    sx={{ mb: 3 }}
                  >
                    <Box>
                      <Typography variant="overline" sx={{ color: '#3d6790', fontWeight: 700 }}>
                        Staff Directory
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#163047', mt: 0.5 }}>
                        Complete staff list, filters, and export tools
                      </Typography>
                      <Typography sx={{ color: '#6a7b90', mt: 0.8 }}>
                        Filter the directory by search text, department, or rank, then export the visible list.
                      </Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadRoundedIcon />}
                        onClick={() => downloadStaffRecordsAsCsv(filteredRecords)}
                        disabled={!filteredRecords.length}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Download List
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<FileDownloadRoundedIcon />}
                        onClick={() => exportStaffRecordsToXlsx(filteredRecords)}
                        disabled={!filteredRecords.length}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Export to XLSX
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<SaveRoundedIcon />}
                        onClick={() => exportUpdatedStaffWorkbook(filteredRecords)}
                        disabled={!filteredRecords.length}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Save Updated XLSX
                      </Button>
                    </Stack>
                  </Stack>

                  <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <TextField
                        fullWidth
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by PF number, name, phone, department, or rank"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchRoundedIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
                      <FormControl fullWidth>
                        <InputLabel id="department-filter-label">Department</InputLabel>
                        <Select
                          labelId="department-filter-label"
                          label="Department"
                          value={departmentFilter}
                          onChange={(event) => setDepartmentFilter(event.target.value)}
                          startAdornment={
                            <InputAdornment position="start">
                              <FilterAltRoundedIcon fontSize="small" />
                            </InputAdornment>
                          }
                        >
                          <MenuItem value="all">All Departments</MenuItem>
                          {departmentOptions.map((department) => (
                            <MenuItem key={department} value={department}>
                              {department}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
                      <FormControl fullWidth>
                        <InputLabel id="rank-filter-label">Rank</InputLabel>
                        <Select
                          labelId="rank-filter-label"
                          label="Rank"
                          value={rankFilter}
                          onChange={(event) => setRankFilter(event.target.value)}
                        >
                          <MenuItem value="all">All Ranks</MenuItem>
                          {rankOptions.map((rank) => (
                            <MenuItem key={rank} value={rank}>
                              {rank}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.2}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    sx={{ mb: 1.5 }}
                  >
                    <Typography sx={{ color: '#526579', fontWeight: 600 }}>
                      Showing {filteredRecords.length.toLocaleString()} filtered staff record(s)
                    </Typography>
                    <Chip
                      label={`Total staff loaded: ${records.length.toLocaleString()}`}
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>

                  {error ? (
                    <Typography color="error">{error}</Typography>
                  ) : loading ? (
                    <Typography sx={{ color: '#6a7b90' }}>Loading staff records...</Typography>
                  ) : (
                    <>
                      <TableContainer
                        sx={{
                          border: '1px solid rgba(17, 57, 109, 0.08)',
                          borderRadius: 4,
                          overflowX: 'auto',
                        }}
                      >
                    <Table sx={{ minWidth: 1120 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f6f9fd' }}>
                          {[
                            'PF Number',
                            'Name',
                                'Rank',
                            'Department',
                            'Phone',
                            'GL / Step',
                            'Actions',
                          ].map((header) => (
                            <TableCell
                              key={header}
                                  sx={{ fontWeight: 800, color: '#284866', whiteSpace: 'nowrap' }}
                                >
                                  {header}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paginatedRecords.length > 0 ? (
                              paginatedRecords.map((record) => (
                                <TableRow key={record.id} hover>
                                  <TableCell sx={{ fontWeight: 700 }}>{record.pfNumber}</TableCell>
                                  <TableCell>{record.name}</TableCell>
                                  <TableCell>{record.rank}</TableCell>
                                  <TableCell>{record.department}</TableCell>
                                  <TableCell>{record.phone}</TableCell>
                                  <TableCell>{record.glStep}</TableCell>
                                  <TableCell>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<EditRoundedIcon />}
                                      onClick={() => setEditingStaff(record)}
                                      sx={{ textTransform: 'none' }}
                                    >
                                      Edit
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                  <Typography sx={{ color: '#6a7b90' }}>
                                    No staff records matched the active filters.
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <TablePagination
                        component="div"
                        count={filteredRecords.length}
                        page={page}
                        onPageChange={(_, nextPage) => setPage(nextPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(event) => {
                          setRowsPerPage(Number(event.target.value))
                          setPage(0)
                        }}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            )}

            {currentSection === 'training' && (
            <Grid size={{ xs: 12 }}>
              <TrainingWorkspace />
            </Grid>
            )}

            {currentSection === 'departments' && (
            <Grid size={{ xs: 12 }}>
              <Card elevation={0} sx={{ border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', lg: 'center' }}
                    spacing={2}
                    sx={{ mb: 3 }}
                  >
                    <Box>
                      <Typography variant="overline" sx={{ color: '#3d6790', fontWeight: 700 }}>
                        Departments
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#163047', mt: 0.5 }}>
                        Department list with filters and admin actions
                      </Typography>
                      <Typography sx={{ color: '#6a7b90', mt: 0.8 }}>
                        Filter departments, export the current view, and manage department rows with edit and delete actions.
                      </Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button
                        variant="outlined"
                        startIcon={<PictureAsPdfRoundedIcon />}
                        onClick={() => exportDepartmentsToPdf(filteredDepartments)}
                        disabled={!filteredDepartments.length}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Download PDF
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<FileDownloadRoundedIcon />}
                        onClick={() => exportDepartmentsToXlsx(filteredDepartments)}
                        disabled={!filteredDepartments.length}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Export
                      </Button>
                    </Stack>
                  </Stack>

                  <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        value={departmentQuery}
                        onChange={(event) => setDepartmentQuery(event.target.value)}
                        placeholder="Search by department name"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchRoundedIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TableContainer
                    sx={{
                      border: '1px solid rgba(17, 57, 109, 0.08)',
                      borderRadius: 4,
                      overflowX: 'auto',
                    }}
                  >
                    <Table sx={{ minWidth: 920 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f6f9fd' }}>
                          {['Department', 'Staff Count', 'Actions'].map(
                            (header) => (
                              <TableCell
                                key={header}
                                sx={{ fontWeight: 800, color: '#284866', whiteSpace: 'nowrap' }}
                              >
                                {header}
                              </TableCell>
                            ),
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedDepartments.length > 0 ? (
                          paginatedDepartments.map((department) => (
                            <TableRow key={department.id} hover>
                              <TableCell sx={{ fontWeight: 700 }}>{department.name}</TableCell>
                              <TableCell>{department.staffCount}</TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<EditRoundedIcon />}
                                    onClick={() => setEditingDepartment(department)}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    startIcon={<DeleteRoundedIcon />}
                                    onClick={() => handleDeleteDepartment(department.id)}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    Delete
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                              <Typography sx={{ color: '#6a7b90' }}>
                                No departments matched the active filters.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    component="div"
                    count={filteredDepartments.length}
                    page={departmentPage}
                    onPageChange={(_, nextPage) => setDepartmentPage(nextPage)}
                    rowsPerPage={departmentRowsPerPage}
                    onRowsPerPageChange={(event) => {
                      setDepartmentRowsPerPage(Number(event.target.value))
                      setDepartmentPage(0)
                    }}
                    rowsPerPageOptions={[8, 15, 25, 50]}
                  />
                </CardContent>
              </Card>
            </Grid>
            )}

            {currentSection === 'reports' && (
            <Grid size={{ xs: 12 }}>
              <Stack spacing={2.5}>
                <Card elevation={0} sx={{ border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack
                      direction={{ xs: 'column', lg: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'stretch', lg: 'center' }}
                      spacing={2}
                      sx={{ mb: 3 }}
                    >
                      <Box>
                        <Typography variant="overline" sx={{ color: '#3d6790', fontWeight: 700 }}>
                          Reports
                        </Typography>
                        <Typography variant="h5" sx={{ color: '#163047', mt: 0.5 }}>
                          Staff summary analysis from the workbook
                        </Typography>
                        <Typography sx={{ color: '#6a7b90', mt: 0.8, maxWidth: 860 }}>
                          This page mirrors the structure of the staff summary analysis workbook by showing overall totals, department summaries, college summaries, academic CONUASS totals, and non-teaching CONTISS totals from the current staff data.
                        </Typography>
                      </Box>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <Button
                          variant="outlined"
                          startIcon={<DownloadRoundedIcon />}
                          onClick={() => downloadReportsAsCsv(reportExportPayload)}
                          disabled={!reportRecords.length}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Export CSV
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<PictureAsPdfRoundedIcon />}
                          onClick={() => exportReportsToPdf(reportExportPayload)}
                          disabled={!reportRecords.length}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Export PDF
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<FileDownloadRoundedIcon />}
                          onClick={() => exportReportsToXlsx(reportExportPayload)}
                          disabled={!reportRecords.length}
                          sx={{ textTransform: 'none', fontWeight: 700 }}
                        >
                          Export XLSX
                        </Button>
                      </Stack>
                    </Stack>

                    <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                          fullWidth
                          value={reportQuery}
                          onChange={(event) => setReportQuery(event.target.value)}
                          placeholder="Search by name, PF number, rank, department, status, posted unit, or salary structure"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchRoundedIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel id="report-department-label">Department</InputLabel>
                          <Select
                            labelId="report-department-label"
                            label="Department"
                            value={reportDepartmentFilter}
                            onChange={(event) => setReportDepartmentFilter(event.target.value)}
                          >
                            <MenuItem value="all">All</MenuItem>
                            {departmentOptions.map((department) => (
                              <MenuItem key={department} value={department}>
                                {department}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel id="report-rank-label">Rank</InputLabel>
                          <Select
                            labelId="report-rank-label"
                            label="Rank"
                            value={reportRankFilter}
                            onChange={(event) => setReportRankFilter(event.target.value)}
                          >
                            <MenuItem value="all">All</MenuItem>
                            {rankOptions.map((rank) => (
                              <MenuItem key={rank} value={rank}>
                                {rank}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel id="report-status-label">Status</InputLabel>
                          <Select
                            labelId="report-status-label"
                            label="Status"
                            value={reportStatusFilter}
                            onChange={(event) => setReportStatusFilter(event.target.value)}
                          >
                            <MenuItem value="all">All</MenuItem>
                            {reportStatusOptions.map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel id="report-sex-label">Sex</InputLabel>
                          <Select
                            labelId="report-sex-label"
                            label="Sex"
                            value={reportSexFilter}
                            onChange={(event) => setReportSexFilter(event.target.value)}
                          >
                            <MenuItem value="all">All</MenuItem>
                            {reportSexOptions.map((sex) => (
                              <MenuItem key={sex} value={sex}>
                                {sex}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      {reportHighlights.map((card) => (
                        <Grid key={card.label} size={{ xs: 12, sm: 6, xl: 3 }}>
                          <Card
                            elevation={0}
                            sx={{
                              height: '100%',
                              borderRadius: 4,
                              border: '1px solid rgba(17, 57, 109, 0.08)',
                              background: `linear-gradient(180deg, ${alpha(card.tone, 0.09)} 0%, rgba(255,255,255,0.96) 100%)`,
                            }}
                          >
                            <CardContent>
                              <Typography variant="body2" sx={{ color: '#627589' }}>
                                {card.label}
                              </Typography>
                              <Typography
                                variant="h5"
                                sx={{ color: '#163047', fontWeight: 800, mt: 1 }}
                              >
                                {card.value}
                              </Typography>
                              <Typography sx={{ color: '#627589', mt: 1.2, lineHeight: 1.6 }}>
                                {card.helper}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>

                <Grid container spacing={2.5}>
                  {[
                    ['Department Summary', reportDepartmentSummaryRows, 'Department / Directorate'],
                    ['College Summary', reportCollegeSummaryRows, 'College (explicitly tagged in source)'],
                    ['Rank Summary', reportRankSummaryRows, 'Rank'],
                  ].map(([title, rows, firstColumn]) => (
                    <Grid key={title} size={{ xs: 12, lg: 6 }}>
                      <Card
                        elevation={0}
                        sx={{ height: '100%', border: '1px solid rgba(17, 57, 109, 0.08)' }}
                      >
                        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 2 }}
                          >
                            <Box>
                              <Typography
                                variant="overline"
                                sx={{ color: '#3d6790', fontWeight: 700 }}
                              >
                                Reports
                              </Typography>
                              <Typography variant="h6" sx={{ color: '#163047' }}>
                                {title}
                              </Typography>
                            </Box>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                              <Chip
                                label={`${rows.length.toLocaleString()} group(s)`}
                                color="primary"
                                variant="outlined"
                                size="small"
                              />
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<DownloadRoundedIcon />}
                                  onClick={() =>
                                    exportSummaryTableToCsv({
                                      title,
                                      rows,
                                      columns: countSummaryColumns(firstColumn),
                                    })
                                  }
                                  sx={{ textTransform: 'none' }}
                                  disabled={!rows.length}
                                >
                                  CSV
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PictureAsPdfRoundedIcon />}
                                  onClick={() =>
                                    exportSummaryTableToPdf({
                                      title,
                                      rows,
                                      columns: countSummaryColumns(firstColumn),
                                    })
                                  }
                                  sx={{ textTransform: 'none' }}
                                  disabled={!rows.length}
                                >
                                  PDF
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<FileDownloadRoundedIcon />}
                                  onClick={() =>
                                    exportSummaryTableToXlsx({
                                      title,
                                      rows,
                                      columns: countSummaryColumns(firstColumn),
                                    })
                                  }
                                  sx={{ textTransform: 'none' }}
                                  disabled={!rows.length}
                                >
                                  XLSX
                                </Button>
                              </Stack>
                            </Stack>
                          </Stack>

                          <TableContainer
                            sx={{
                              border: '1px solid rgba(17, 57, 109, 0.08)',
                              borderRadius: 4,
                              overflowX: 'auto',
                            }}
                          >
                            <Table size="small" sx={{ minWidth: 420 }}>
                              <TableHead>
                                <TableRow sx={{ bgcolor: '#f6f9fd' }}>
                                  {[firstColumn, 'Total Staff', 'Male Staff', 'Female Staff', 'Unknown Gender'].map((header) => (
                                    <TableCell
                                      key={header}
                                      sx={{ fontWeight: 800, color: '#284866' }}
                                    >
                                      {header}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {rows.length ? (
                                  rows.slice(0, 12).map((row) => (
                                    <TableRow key={`${title}-${row.name}`} hover>
                                      <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                                      <TableCell>{row.total}</TableCell>
                                      <TableCell>{row.male}</TableCell>
                                      <TableCell>{row.female}</TableCell>
                                      <TableCell>{row.unknown}</TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                      <Typography sx={{ color: '#6a7b90' }}>
                                        No report rows matched the active filters.
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}

                  <Grid size={{ xs: 12, lg: 6 }}>
                    <Card elevation={0} sx={{ height: '100%', border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Typography variant="overline" sx={{ color: '#3d6790', fontWeight: 700 }}>
                          Snapshot
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#163047', mb: 2 }}>
                          Key reporting observations
                        </Typography>
                        <Stack spacing={1.6}>
                          {[
                            `The current report covers ${reportRecords.length.toLocaleString()} staff record(s).`,
                            reportDepartmentSummaryRows[0]
                              ? `${reportDepartmentSummaryRows[0].name} is the largest department/directorate in this filtered view with ${reportDepartmentSummaryRows[0].total} staff.`
                              : 'No department insight is available for the current filters.',
                            reportCollegeSummaryRows[0]
                              ? `${reportCollegeSummaryRows[0].name} is the largest explicitly tagged college group in the current result set.`
                              : 'No explicitly tagged college group was found in the current filters.',
                            reportRankSummaryRows[0]
                              ? `${reportRankSummaryRows[0].name} is the most represented rank in the current filtered analysis.`
                              : 'No rank insight is available for the current filters.',
                          ].map((item) => (
                            <Stack key={item} direction="row" spacing={1.5}>
                              <Avatar
                                sx={{
                                  width: 34,
                                  height: 34,
                                  bgcolor: alpha('#114f95', 0.1),
                                  color: '#114f95',
                                }}
                              >
                                <AssessmentRoundedIcon fontSize="small" />
                              </Avatar>
                              <Typography sx={{ color: '#526579', lineHeight: 1.75 }}>
                                {item}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, lg: 6 }}>
                    <Card elevation={0} sx={{ height: '100%', border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          spacing={1.5}
                          sx={{ mb: 2 }}
                        >
                          <Box>
                            <Typography variant="overline" sx={{ color: '#3d6790', fontWeight: 700 }}>
                              Summary Metrics
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#163047' }}>
                              Overall totals
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DownloadRoundedIcon />}
                              onClick={() => exportSummaryTableToCsv(overallTotalsTableConfig)}
                              sx={{ textTransform: 'none' }}
                              disabled={!reportOverallTotalsRows.length}
                            >
                              CSV
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PictureAsPdfRoundedIcon />}
                              onClick={() => exportSummaryTableToPdf(overallTotalsTableConfig)}
                              sx={{ textTransform: 'none' }}
                              disabled={!reportOverallTotalsRows.length}
                            >
                              PDF
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<FileDownloadRoundedIcon />}
                              onClick={() => exportSummaryTableToXlsx(overallTotalsTableConfig)}
                              sx={{ textTransform: 'none' }}
                              disabled={!reportOverallTotalsRows.length}
                            >
                              XLSX
                            </Button>
                          </Stack>
                        </Stack>
                        <TableContainer
                          sx={{
                            border: '1px solid rgba(17, 57, 109, 0.08)',
                            borderRadius: 4,
                            overflowX: 'auto',
                          }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f6f9fd' }}>
                                <TableCell sx={{ fontWeight: 800, color: '#284866' }}>Metric</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#284866' }}>Value</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {reportOverallTotalsRows.map((row) => (
                                <TableRow key={row.Metric} hover>
                                  <TableCell sx={{ fontWeight: 700 }}>{row.Metric}</TableCell>
                                  <TableCell>{row.Count}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, lg: 6 }}>
                    <Card elevation={0} sx={{ height: '100%', border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          spacing={1.5}
                          sx={{ mb: 2 }}
                        >
                          <Box>
                            <Typography variant="overline" sx={{ color: '#3d6790', fontWeight: 700 }}>
                              Academic CONUASS
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#163047' }}>
                              Academic staff summary
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DownloadRoundedIcon />}
                              onClick={() =>
                                exportSummaryTableToCsv({
                                  title: 'Academic CONUASS',
                                  rows: reportAcademicConuassRows,
                                  columns: countSummaryColumns('Category'),
                                })
                              }
                              sx={{ textTransform: 'none' }}
                              disabled={!reportAcademicConuassRows.length}
                            >
                              CSV
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PictureAsPdfRoundedIcon />}
                              onClick={() =>
                                exportSummaryTableToPdf({
                                  title: 'Academic CONUASS',
                                  rows: reportAcademicConuassRows,
                                  columns: countSummaryColumns('Category'),
                                })
                              }
                              sx={{ textTransform: 'none' }}
                              disabled={!reportAcademicConuassRows.length}
                            >
                              PDF
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<FileDownloadRoundedIcon />}
                              onClick={() =>
                                exportSummaryTableToXlsx({
                                  title: 'Academic CONUASS',
                                  rows: reportAcademicConuassRows,
                                  columns: countSummaryColumns('Category'),
                                })
                              }
                              sx={{ textTransform: 'none' }}
                              disabled={!reportAcademicConuassRows.length}
                            >
                              XLSX
                            </Button>
                          </Stack>
                        </Stack>
                        <TableContainer
                          sx={{
                            border: '1px solid rgba(17, 57, 109, 0.08)',
                            borderRadius: 4,
                            overflowX: 'auto',
                          }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f6f9fd' }}>
                                {['Category', 'Total Staff', 'Male Staff', 'Female Staff', 'Unknown Gender'].map((header) => (
                                  <TableCell key={header} sx={{ fontWeight: 800, color: '#284866' }}>
                                    {header}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {reportAcademicConuassRows.map((row) => (
                                <TableRow key={row.name} hover>
                                  <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                                  <TableCell>{row.total}</TableCell>
                                  <TableCell>{row.male}</TableCell>
                                  <TableCell>{row.female}</TableCell>
                                  <TableCell>{row.unknown}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, lg: 6 }}>
                    <Card elevation={0} sx={{ height: '100%', border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          justifyContent="space-between"
                          alignItems={{ xs: 'stretch', sm: 'center' }}
                          spacing={1.5}
                          sx={{ mb: 2 }}
                        >
                          <Box>
                            <Typography variant="overline" sx={{ color: '#3d6790', fontWeight: 700 }}>
                              Non-Teaching CONTISS
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#163047' }}>
                              Non-teaching staff summary
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DownloadRoundedIcon />}
                              onClick={() =>
                                exportSummaryTableToCsv({
                                  title: 'Non-Teaching CONTISS',
                                  rows: reportNonTeachingContissRows,
                                  columns: countSummaryColumns('Category'),
                                })
                              }
                              sx={{ textTransform: 'none' }}
                              disabled={!reportNonTeachingContissRows.length}
                            >
                              CSV
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PictureAsPdfRoundedIcon />}
                              onClick={() =>
                                exportSummaryTableToPdf({
                                  title: 'Non-Teaching CONTISS',
                                  rows: reportNonTeachingContissRows,
                                  columns: countSummaryColumns('Category'),
                                })
                              }
                              sx={{ textTransform: 'none' }}
                              disabled={!reportNonTeachingContissRows.length}
                            >
                              PDF
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<FileDownloadRoundedIcon />}
                              onClick={() =>
                                exportSummaryTableToXlsx({
                                  title: 'Non-Teaching CONTISS',
                                  rows: reportNonTeachingContissRows,
                                  columns: countSummaryColumns('Category'),
                                })
                              }
                              sx={{ textTransform: 'none' }}
                              disabled={!reportNonTeachingContissRows.length}
                            >
                              XLSX
                            </Button>
                          </Stack>
                        </Stack>
                        <TableContainer
                          sx={{
                            border: '1px solid rgba(17, 57, 109, 0.08)',
                            borderRadius: 4,
                            overflowX: 'auto',
                          }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ bgcolor: '#f6f9fd' }}>
                                {['Category', 'Total Staff', 'Male Staff', 'Female Staff', 'Unknown Gender'].map((header) => (
                                  <TableCell key={header} sx={{ fontWeight: 800, color: '#284866' }}>
                                    {header}
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {reportNonTeachingContissRows.map((row) => (
                                <TableRow key={row.name} hover>
                                  <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                                  <TableCell>{row.total}</TableCell>
                                  <TableCell>{row.male}</TableCell>
                                  <TableCell>{row.female}</TableCell>
                                  <TableCell>{row.unknown}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
            )}

            {currentSection === 'personnel-records' && (
            <Grid size={{ xs: 12 }}>
              <Card elevation={0} sx={{ border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', lg: 'center' }}
                    spacing={2}
                    sx={{ mb: 3 }}
                  >
                    <Box>
                      <Typography variant="overline" sx={{ color: '#3d6790', fontWeight: 700 }}>
                        Personnel Records
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#163047', mt: 0.5 }}>
                        Personnel registry with administrative details
                      </Typography>
                      <Typography sx={{ color: '#6a7b90', mt: 0.8 }}>
                        Review personnel details, filter by status or sex, and export the active personnel register.
                      </Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <Button
                        variant="outlined"
                        startIcon={<DownloadRoundedIcon />}
                        onClick={() => downloadPersonnelRecordsAsCsv(filteredPersonnelRecords)}
                        disabled={!filteredPersonnelRecords.length}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Download List
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<FileDownloadRoundedIcon />}
                        onClick={() => exportPersonnelRecordsToXlsx(filteredPersonnelRecords)}
                        disabled={!filteredPersonnelRecords.length}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Export Records
                      </Button>
                    </Stack>
                  </Stack>

                  <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        value={personnelQuery}
                        onChange={(event) => setPersonnelQuery(event.target.value)}
                        placeholder="Search by PF number, name, department, posted unit, rank, or status"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchRoundedIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel id="personnel-sex-filter-label">Sex</InputLabel>
                        <Select
                          labelId="personnel-sex-filter-label"
                          label="Sex"
                          value={personnelSexFilter}
                          onChange={(event) => setPersonnelSexFilter(event.target.value)}
                        >
                          <MenuItem value="all">All</MenuItem>
                          {['M', 'F', 'Not available'].map((value) => (
                            <MenuItem key={value} value={value}>
                              {value}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel id="personnel-status-filter-label">Status</InputLabel>
                        <Select
                          labelId="personnel-status-filter-label"
                          label="Status"
                          value={personnelStatusFilter}
                          onChange={(event) => setPersonnelStatusFilter(event.target.value)}
                        >
                          <MenuItem value="all">All</MenuItem>
                          {Array.from(
                            new Set(personnelRecords.map((record) => record.status)),
                          )
                            .filter(Boolean)
                            .sort((a, b) => a.localeCompare(b))
                            .map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <TableContainer
                    sx={{
                      border: '1px solid rgba(17, 57, 109, 0.08)',
                      borderRadius: 4,
                      overflowX: 'auto',
                    }}
                  >
                    <Table sx={{ minWidth: 1240 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f6f9fd' }}>
                          {[
                            'PF Number',
                            'Name',
                            'Sex',
                            'Status',
                            'Department',
                            'Posted Unit',
                            'Rank',
                            'Qualification',
                            'State / LGA',
                            'Appointment / Confirmation / Promotion',
                            'Actions',
                          ].map((header) => (
                            <TableCell
                              key={header}
                              sx={{ fontWeight: 800, color: '#284866', whiteSpace: 'nowrap' }}
                            >
                              {header}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedPersonnelRecords.length > 0 ? (
                          paginatedPersonnelRecords.map((record) => (
                            <TableRow key={record.id} hover>
                              <TableCell sx={{ fontWeight: 700 }}>{record.pfNumber}</TableCell>
                              <TableCell>{record.name}</TableCell>
                              <TableCell>{record.sex}</TableCell>
                              <TableCell>
                                <Chip
                                  label={record.status}
                                  size="small"
                                  color={
                                    record.status === 'Active'
                                      ? 'success'
                                      : record.status === 'Leave'
                                        ? 'warning'
                                        : record.status === 'Retired'
                                          ? 'default'
                                          : 'primary'
                                  }
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>{record.department}</TableCell>
                              <TableCell>{record.postedUnit}</TableCell>
                              <TableCell>{record.rank}</TableCell>
                              <TableCell sx={{ minWidth: 180 }}>{record.qualification}</TableCell>
                              <TableCell>{`${record.stateOfOrigin} / ${record.lga}`}</TableCell>
                              <TableCell sx={{ minWidth: 220 }}>
                                {`${record.dateOfFirstAppointment} | ${record.dateOfConfirmation} | ${record.dateOfLastPromotion}`}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<EditRoundedIcon />}
                                  onClick={() => setEditingPersonnel(record)}
                                  sx={{ textTransform: 'none' }}
                                >
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                              <Typography sx={{ color: '#6a7b90' }}>
                                No personnel records matched the active filters.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    component="div"
                    count={filteredPersonnelRecords.length}
                    page={personnelPage}
                    onPageChange={(_, nextPage) => setPersonnelPage(nextPage)}
                    rowsPerPage={personnelRowsPerPage}
                    onRowsPerPageChange={(event) => {
                      setPersonnelRowsPerPage(Number(event.target.value))
                      setPersonnelPage(0)
                    }}
                    rowsPerPageOptions={[8, 15, 25, 50]}
                  />
                </CardContent>
              </Card>
            </Grid>
            )}

            {currentSection === 'admin-users' && (
            <Grid size={{ xs: 12 }}>
              <Card elevation={0} sx={{ border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'stretch', lg: 'center' }}
                    spacing={2}
                    sx={{ mb: 3 }}
                  >
                    <Box>
                      <Typography variant="overline" sx={{ color: '#3d6790', fontWeight: 700 }}>
                        Admin Users
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#163047', mt: 0.5 }}>
                        Manage frontend admin accounts and access roles
                      </Typography>
                      <Typography sx={{ color: '#6a7b90', mt: 0.8 }}>
                        Create, edit, filter, and remove admin accounts stored in the frontend auth store.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<ManageAccountsRoundedIcon />}
                      onClick={() => {
                        setEditingAdminUser(null)
                        setAdminDialogOpen(true)
                      }}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Add Admin User
                    </Button>
                  </Stack>

                  {adminFeedback && (
                    <Alert
                      severity={adminFeedback.severity}
                      sx={{ mb: 2 }}
                      onClose={() => setAdminFeedback(null)}
                    >
                      {adminFeedback.message}
                    </Alert>
                  )}

                  <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        value={adminQuery}
                        onChange={(event) => setAdminQuery(event.target.value)}
                        placeholder="Search by name, email, role, or status"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchRoundedIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel id="admin-role-filter-label">Role</InputLabel>
                        <Select
                          labelId="admin-role-filter-label"
                          label="Role"
                          value={adminRoleFilter}
                          onChange={(event) => setAdminRoleFilter(event.target.value)}
                        >
                          <MenuItem value="all">All Roles</MenuItem>
                          {Array.from(new Set(adminUsers.map((user) => user.role)))
                            .filter(Boolean)
                            .sort((a, b) => a.localeCompare(b))
                            .map((role) => (
                              <MenuItem key={role} value={role}>
                                {role}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel id="admin-status-filter-label">Status</InputLabel>
                        <Select
                          labelId="admin-status-filter-label"
                          label="Status"
                          value={adminStatusFilter}
                          onChange={(event) => setAdminStatusFilter(event.target.value)}
                        >
                          <MenuItem value="all">All Statuses</MenuItem>
                          {Array.from(new Set(adminUsers.map((user) => user.status)))
                            .filter(Boolean)
                            .sort((a, b) => a.localeCompare(b))
                            .map((status) => (
                              <MenuItem key={status} value={status}>
                                {status}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <TableContainer
                    sx={{
                      border: '1px solid rgba(17, 57, 109, 0.08)',
                      borderRadius: 4,
                      overflowX: 'auto',
                    }}
                  >
                    <Table sx={{ minWidth: 920 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f6f9fd' }}>
                          {['Full Name', 'Email', 'Role', 'Status', 'Updated', 'Actions'].map(
                            (header) => (
                              <TableCell
                                key={header}
                                sx={{ fontWeight: 800, color: '#284866', whiteSpace: 'nowrap' }}
                              >
                                {header}
                              </TableCell>
                            ),
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedAdminUsers.length > 0 ? (
                          paginatedAdminUsers.map((user) => (
                            <TableRow key={user.id} hover>
                              <TableCell sx={{ fontWeight: 700 }}>{user.fullName}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.role}</TableCell>
                              <TableCell>
                                <Chip
                                  label={user.status}
                                  size="small"
                                  color={
                                    user.status === 'Active'
                                      ? 'success'
                                      : user.status === 'Suspended'
                                        ? 'error'
                                        : 'warning'
                                  }
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                {new Date(user.updatedAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<EditRoundedIcon />}
                                    onClick={() => {
                                      setEditingAdminUser(user)
                                      setAdminDialogOpen(true)
                                    }}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    startIcon={<DeleteRoundedIcon />}
                                    onClick={() => handleDeleteAdminUser(user.id)}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    Delete
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                              <Typography sx={{ color: '#6a7b90' }}>
                                No admin users matched the active filters.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <TablePagination
                    component="div"
                    count={filteredAdminUsers.length}
                    page={adminPage}
                    onPageChange={(_, nextPage) => setAdminPage(nextPage)}
                    rowsPerPage={adminRowsPerPage}
                    onRowsPerPageChange={(event) => {
                      setAdminRowsPerPage(Number(event.target.value))
                      setAdminPage(0)
                    }}
                    rowsPerPageOptions={[8, 15, 25]}
                  />
                </CardContent>
              </Card>
            </Grid>
            )}

            {currentSection === 'overview' && (
              <>
                <Grid size={{ xs: 12, md: 7, xl: 8 }}>
                  <Card elevation={0} sx={{ border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                    <CardContent>
                      <Typography variant="overline" sx={{ color: '#3d6790', fontWeight: 700 }}>
                        Workspace Summary
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#163047', mt: 0.5, mb: 1.5 }}>
                        Administrative modules ready for daily operations
                      </Typography>
                      <Stack spacing={2}>
                        {[
                          'Staff Directory provides the full searchable and exportable staff list.',
                          'Training mirrors the face-recognition studio for uploading and saving new face profiles.',
                          'Departments offers editable department rows with export and PDF download.',
                          'Reports turns the workbook into exportable admin statistics and breakdowns.',
                          'Admin Users manages frontend admin accounts, roles, and statuses.',
                        ].map((item) => (
                          <Stack key={item} direction="row" spacing={1.5}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                bgcolor: alpha('#114f95', 0.1),
                                color: '#114f95',
                              }}
                            >
                              <NotificationsActiveRoundedIcon fontSize="small" />
                            </Avatar>
                            <Typography sx={{ color: '#526579', lineHeight: 1.7 }}>
                              {item}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 5, xl: 4 }}>
                  <Card elevation={0} sx={{ border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                    <CardContent>
                      <Typography variant="overline" sx={{ color: '#3d6790', fontWeight: 700 }}>
                        Quick Navigation
                      </Typography>
                      <Stack spacing={1.2} sx={{ mt: 1.5 }}>
                        {[
                          ['Open Staff Directory', '/staff-directory'],
                          ['Open Training', '/training'],
                          ['Open Departments', '/departments'],
                          ['Open Reports', '/reports'],
                          ['Open Admin Users', '/admin-users'],
                        ].map(([label, path]) => (
                          <Button
                            key={label}
                            component={RouterLink}
                            to={path}
                            variant="outlined"
                            color="primary"
                            sx={{
                              justifyContent: 'flex-start',
                              textTransform: 'none',
                              fontWeight: 700,
                            }}
                          >
                            {label}
                          </Button>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}

            {currentSection === 'settings' && (
              <Grid size={{ xs: 12 }}>
                <Card elevation={0} sx={{ border: '1px solid rgba(17, 57, 109, 0.08)' }}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Typography variant="overline" sx={{ color: '#3d6790', fontWeight: 700 }}>
                      Settings
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#163047', mt: 0.5, mb: 1.2 }}>
                      Frontend configuration overview
                    </Typography>
                    <Stack spacing={1.5}>
                      {[
                        'Authentication, reset tokens, and admin users are stored in browser storage for this frontend-only build.',
                        'Department and staff edits are also persisted locally on this device.',
                        'Reports and exports run fully in the browser using XLSX and PDF generation.',
                      ].map((item) => (
                        <Typography key={item} sx={{ color: '#526579', lineHeight: 1.75 }}>
                          {item}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>

      <DepartmentEditDialog
        open={Boolean(editingDepartment)}
        department={editingDepartment}
        onClose={() => setEditingDepartment(null)}
        onSave={handleSaveDepartment}
      />
      <StaffEditDialog
        open={Boolean(editingStaff)}
        record={editingStaff}
        mode={staffDialogMode}
        passportAsset={editingStaff ? passportOverrides[editingStaff.id] : null}
        onClose={() => setEditingStaff(null)}
        onSave={handleSaveStaff}
      />
      <PersonnelEditDialog
        open={Boolean(editingPersonnel)}
        record={editingPersonnel}
        onClose={() => setEditingPersonnel(null)}
        onSave={handleSavePersonnel}
      />
      <AdminUserDialog
        open={adminDialogOpen}
        user={editingAdminUser}
        onClose={() => {
          setAdminDialogOpen(false)
          setEditingAdminUser(null)
        }}
        onSave={handleSaveAdminUser}
      />
    </ThemeProvider>
  )
}
