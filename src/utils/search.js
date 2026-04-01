const wordSegmenter =
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'word' })
    : null

const searchEntryCache = new Map()

export function normalizeSearchText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeSearchText(value = '') {
  const normalizedValue = normalizeSearchText(value)

  if (!normalizedValue) {
    return []
  }

  if (!wordSegmenter) {
    return normalizedValue.split(' ')
  }

  return Array.from(wordSegmenter.segment(normalizedValue))
    .filter(({ isWordLike }) => isWordLike)
    .map(({ segment }) => segment)
}

function createCharacterBigrams(value = '') {
  const normalizedValue = normalizeSearchText(value)

  if (!normalizedValue) {
    return []
  }

  if (normalizedValue.length === 1) {
    return [normalizedValue]
  }

  const bigrams = []

  for (let index = 0; index < normalizedValue.length - 1; index += 1) {
    bigrams.push(normalizedValue.slice(index, index + 2))
  }

  return bigrams
}

function getDiceCoefficient(left, right) {
  const leftBigrams = createCharacterBigrams(left)
  const rightBigrams = createCharacterBigrams(right)

  if (!leftBigrams.length || !rightBigrams.length) {
    return 0
  }

  const rightCounts = rightBigrams.reduce((counts, bigram) => {
    counts.set(bigram, (counts.get(bigram) || 0) + 1)
    return counts
  }, new Map())

  let matches = 0

  leftBigrams.forEach((bigram) => {
    const remaining = rightCounts.get(bigram) || 0

    if (remaining > 0) {
      matches += 1
      rightCounts.set(bigram, remaining - 1)
    }
  })

  return (2 * matches) / (leftBigrams.length + rightBigrams.length)
}

function createTokenNgrams(tokens, size) {
  if (!tokens.length || tokens.length < size) {
    return []
  }

  const ngrams = []

  for (let index = 0; index <= tokens.length - size; index += 1) {
    ngrams.push(tokens.slice(index, index + size).join(' '))
  }

  return ngrams
}

function getOrderedTokenScore(queryTokens, valueTokens) {
  if (queryTokens.length < 2 || valueTokens.length < 2) {
    return 0
  }

  const queryBigrams = createTokenNgrams(queryTokens, 2)
  const valueBigrams = new Set(createTokenNgrams(valueTokens, 2))

  if (!queryBigrams.length) {
    return 0
  }

  const matches = queryBigrams.filter((bigram) => valueBigrams.has(bigram)).length

  return matches / queryBigrams.length
}

function getBestWindowSimilarity(queryTokens, valueTokens) {
  if (!queryTokens.length || !valueTokens.length) {
    return 0
  }

  const queryPhrase = queryTokens.join(' ')
  const candidateSizes = Array.from(
    new Set(
      [queryTokens.length - 1, queryTokens.length, queryTokens.length + 1]
        .filter((size) => size > 0)
        .map((size) => Math.min(size, valueTokens.length)),
    ),
  )

  let bestScore = getDiceCoefficient(queryPhrase, valueTokens.join(' '))

  candidateSizes.forEach((size) => {
    for (let index = 0; index <= valueTokens.length - size; index += 1) {
      const windowText = valueTokens.slice(index, index + size).join(' ')
      bestScore = Math.max(bestScore, getDiceCoefficient(queryPhrase, windowText))
    }
  })

  return bestScore
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function buildSearchEntry(value = '') {
  const raw = String(value ?? '').trim()

  if (!raw) {
    return null
  }

  if (searchEntryCache.has(raw)) {
    return searchEntryCache.get(raw)
  }

  const tokens = tokenizeSearchText(raw)
  const entry = {
    raw,
    normalized: normalizeSearchText(raw),
    tokens,
    tokenSet: new Set(tokens),
  }

  searchEntryCache.set(raw, entry)

  return entry
}

function normalizeSearchInputs(searchInputs) {
  if (Array.isArray(searchInputs)) {
    return searchInputs
      .filter(({ transcript }) => Boolean(String(transcript ?? '').trim()))
      .map((candidate, index) => ({
        transcript: String(candidate.transcript).trim(),
        confidence:
          typeof candidate.confidence === 'number' && candidate.confidence > 0
            ? candidate.confidence
            : Math.max(0.45, 1 - index * 0.15),
      }))
  }

  if (typeof searchInputs === 'string' && searchInputs.trim()) {
    return [{ transcript: searchInputs.trim(), confidence: 1 }]
  }

  return []
}

function scoreSearchEntry(entry, transcript, confidence = 1, alternativeIndex = 0) {
  const normalizedQuery = normalizeSearchText(transcript)
  const queryTokens = tokenizeSearchText(transcript)

  if (!normalizedQuery || !queryTokens.length) {
    return {
      queryTokens,
      score: 0,
    }
  }

  const uniqueQueryTokens = Array.from(new Set(queryTokens))
  const exactPhrase = entry.normalized.includes(normalizedQuery) ? 1 : 0
  const startsWithPhrase = entry.normalized.startsWith(normalizedQuery) ? 1 : 0
  const tokenMatches = uniqueQueryTokens.filter((token) => entry.tokenSet.has(token)).length
  const coverageScore = tokenMatches / uniqueQueryTokens.length
  const windowSimilarity = getBestWindowSimilarity(queryTokens, entry.tokens)
  const orderedTokenScore = getOrderedTokenScore(queryTokens, entry.tokens)

  if (!exactPhrase && coverageScore < 0.34 && windowSimilarity < 0.52) {
    return {
      queryTokens,
      score: 0,
    }
  }

  const confidenceWeight = clamp(
    typeof confidence === 'number' && confidence > 0
      ? confidence
      : 1 - alternativeIndex * 0.12,
    0.45,
    1,
  )

  const score =
    (
      coverageScore * 0.36 +
      windowSimilarity * 0.34 +
      orderedTokenScore * 0.18 +
      exactPhrase * 0.08 +
      startsWithPhrase * 0.04
    ) * confidenceWeight

  return {
    queryTokens,
    score,
  }
}

export function normalizePfNumberForSearch(value) {
  return normalizeSearchText(value).replace(/[^\p{L}\p{N}]/gu, '')
}

export function scoreSearchMatch(searchInputs, values, pfNumber = '') {
  const normalizedInputs = normalizeSearchInputs(searchInputs)

  if (!normalizedInputs.length) {
    return {
      score: 0,
      queryTokens: [],
      transcript: '',
    }
  }

  const searchableValues = values.filter(Boolean)
  const searchableEntries = searchableValues.map((value) => buildSearchEntry(value)).filter(Boolean)
  const combinedEntry = buildSearchEntry(searchableValues.join(' '))
  const normalizedPfNumber = normalizePfNumberForSearch(pfNumber)

  if (combinedEntry) {
    searchableEntries.push(combinedEntry)
  }

  if (!searchableEntries.length && !normalizedPfNumber) {
    return {
      score: 0,
      queryTokens: [],
      transcript: '',
    }
  }

  return normalizedInputs.reduce(
    (bestResult, candidate, candidateIndex) => {
      const bestEntryMatch = searchableEntries.reduce(
        (bestEntryResult, entry, entryIndex) => {
          const currentResult = scoreSearchEntry(
            entry,
            candidate.transcript,
            candidate.confidence,
            candidateIndex,
          )
          const entryWeight = combinedEntry && entryIndex === searchableEntries.length - 1 ? 0.94 : 1
          const weightedScore = currentResult.score * entryWeight

          if (weightedScore > bestEntryResult.score) {
            return {
              score: weightedScore,
              queryTokens: currentResult.queryTokens,
              transcript: candidate.transcript,
            }
          }

          return bestEntryResult
        },
        {
          score: 0,
          queryTokens: [],
          transcript: '',
        },
      )

      const normalizedPfQuery = normalizePfNumberForSearch(candidate.transcript)
      const pfMatchScore =
        normalizedPfQuery && normalizedPfNumber && normalizedPfNumber.includes(normalizedPfQuery)
          ? clamp(candidate.confidence, 0.45, 1)
          : 0

      const bestCandidateMatch =
        pfMatchScore > bestEntryMatch.score
          ? {
              score: pfMatchScore,
              queryTokens: normalizedPfQuery ? [normalizedPfQuery] : [],
              transcript: candidate.transcript,
            }
          : bestEntryMatch

      if (bestCandidateMatch.score > bestResult.score) {
        return bestCandidateMatch
      }

      return bestResult
    },
    {
      score: 0,
      queryTokens: [],
      transcript: '',
    },
  )
}

export function matchesSearchQuery(query, values, pfNumber = '') {
  const normalizedQuery = normalizeSearchInputs(query)

  if (!normalizedQuery.length) {
    return true
  }

  return scoreSearchMatch(normalizedQuery, values, pfNumber).score > 0
}
