const NON_CITY_PARTS = new Set([
  'andaman and nicobar islands',
  'andhra pradesh',
  'arunachal pradesh',
  'assam',
  'bihar',
  'chandigarh',
  'chhattisgarh',
  'dadra and nagar haveli and daman and diu',
  'delhi',
  'goa',
  'gujarat',
  'haryana',
  'himachal pradesh',
  'india',
  'jammu and kashmir',
  'jharkhand',
  'karnataka',
  'kerala',
  'ladakh',
  'lakshadweep',
  'madhya pradesh',
  'maharashtra',
  'manipur',
  'meghalaya',
  'mizoram',
  'nagaland',
  'odisha',
  'puducherry',
  'punjab',
  'rajasthan',
  'sikkim',
  'tamil nadu',
  'telangana',
  'tripura',
  'uttar pradesh',
  'uttarakhand',
  'west bengal',
])

function normalizeAddressPart(part: string) {
  return part
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function isNonCityPart(part: string) {
  return NON_CITY_PARTS.has(part) || /^[0-9]{5,6}$/.test(part)
}

export function getCityFromAddress(address?: string | null) {
  const parts = (address ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index]

    if (!isNonCityPart(normalizeAddressPart(part))) {
      return part
    }
  }

  return ''
}

export function getSalonCity(salon: { city?: string | null; address?: string | null }) {
  const city = salon.city?.trim()
  return city || getCityFromAddress(salon.address)
}
