function normalizeSearchText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizePfNumberForSearch(value) {
  return normalizeSearchText(value).replace(/\//g, '')
}

export function matchesSearchQuery(query, values, pfNumber = '') {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return true
  }

  const searchableText = values
    .map((value) => normalizeSearchText(value))
    .filter(Boolean)
    .join(' ')

  if (searchableText.includes(normalizedQuery)) {
    return true
  }

  const normalizedPfQuery = normalizePfNumberForSearch(query)

  if (!normalizedPfQuery) {
    return false
  }

  return normalizePfNumberForSearch(pfNumber).includes(normalizedPfQuery)
}
