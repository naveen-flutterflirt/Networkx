'use client'
// Expansion Engine map (P2 gap fix). This is a simplified geographic
// scatter, not a traced coastline map — city dots are positioned by real
// lat/lng linearly projected onto the canvas (accurate relative
// positioning for India's bounding box), rather than an SVG India
// outline reproduced from memory, which risks being subtly wrong. Cities
// not in COORDS still show up in the data table below the map — they're
// never silently dropped just because this component doesn't know where
// to place a dot for them.

// Real, public coordinates for major Indian cities. Matching is
// case-insensitive against the `city` string returned by the backend.
export const INDIA_CITY_COORDS: Record<string, [number, number]> = {
  'mumbai':[19.076,72.878], 'delhi':[28.704,77.102], 'new delhi':[28.614,77.209],
  'bengaluru':[12.972,77.594], 'bangalore':[12.972,77.594], 'hyderabad':[17.385,78.487],
  'ahmedabad':[23.023,72.572], 'chennai':[13.083,80.271], 'kolkata':[22.573,88.364],
  'pune':[18.520,73.856], 'jaipur':[26.913,75.787], 'surat':[21.170,72.831],
  'lucknow':[26.847,80.947], 'kanpur':[26.449,80.332], 'nagpur':[21.146,79.089],
  'indore':[22.719,75.858], 'thane':[19.219,72.978], 'bhopal':[23.260,77.413],
  'visakhapatnam':[17.687,83.219], 'patna':[25.594,85.138], 'vadodara':[22.307,73.181],
  'ghaziabad':[28.665,77.437], 'ludhiana':[30.901,75.857], 'agra':[27.177,78.008],
  'nashik':[19.998,73.791], 'faridabad':[28.408,77.317], 'meerut':[28.985,77.706],
  'rajkot':[22.303,70.802], 'varanasi':[25.318,82.974], 'srinagar':[34.084,74.797],
  'amritsar':[31.634,74.872], 'coimbatore':[11.017,76.956], 'kochi':[9.931,76.267],
  'chandigarh':[30.734,76.779], 'gurugram':[28.459,77.026], 'gurgaon':[28.459,77.026],
  'noida':[28.535,77.391], 'guwahati':[26.144,91.736], 'bhubaneswar':[20.296,85.824],
  'dehradun':[30.317,78.032], 'ranchi':[23.344,85.310], 'raipur':[21.251,81.629],
  'jodhpur':[26.238,73.024], 'mysuru':[12.295,76.639], 'mysore':[12.295,76.639],
  'madurai':[9.925,78.120], 'vijayawada':[16.507,80.648], 'nagercoil':[8.178,77.434],
}

const BOUNDS = { minLat: 8, maxLat: 35, minLng: 68, maxLng: 96 }
const W = 340, H = 380

function project(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * W
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * H
  return { x, y }
}

interface CityRow {
  city: string; state?: string; member_count: number; prospect_count: number
  has_group: boolean; is_suggested_expansion: boolean; signal_strength: number
}

export default function ExpansionMap({ cities, onSelect }: { cities: CityRow[], onSelect?: (c: CityRow) => void }) {
  const maxSignal = Math.max(1, ...cities.map(c => c.signal_strength))
  const plotted = cities
    .map(c => ({ ...c, coord: INDIA_CITY_COORDS[c.city.trim().toLowerCase()] }))
    .filter(c => c.coord)

  return (
    <div style={{background:'var(--nx-panel2)', borderRadius:12, padding:16, display:'flex', justifyContent:'center'}}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{maxWidth:420}}>
        <rect x={0} y={0} width={W} height={H} rx={10} fill="rgba(255,255,255,.02)" stroke="var(--nx-line)" />
        {/* Faint lat/lng grid for spatial reference, since there's no coastline outline */}
        {[0.25,0.5,0.75].map(f => (
          <line key={'v'+f} x1={W*f} y1={0} x2={W*f} y2={H} stroke="rgba(255,255,255,.04)" />
        ))}
        {[0.25,0.5,0.75].map(f => (
          <line key={'h'+f} x1={0} y1={H*f} x2={W} y2={H*f} stroke="rgba(255,255,255,.04)" />
        ))}
        {plotted.map(c => {
          const { x, y } = project(c.coord![0], c.coord![1])
          const r = 4 + (c.signal_strength / maxSignal) * 12
          const color = c.is_suggested_expansion ? '#27d86d' : c.has_group ? 'var(--nx-orange)' : '#5b7a99'
          return (
            <g key={c.city} onClick={() => onSelect?.(c)} style={{cursor: onSelect ? 'pointer' : 'default'}}>
              {c.is_suggested_expansion && (
                <circle cx={x} cy={y} r={r+6} fill={color} opacity={0.18}>
                  <animate attributeName="r" values={`${r+4};${r+10};${r+4}`} dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={x} cy={y} r={r} fill={color} opacity={0.85} stroke="rgba(255,255,255,.3)" strokeWidth={1} />
              <text x={x} y={y - r - 4} textAnchor="middle" fontSize={9} fill="var(--nx-muted)">{c.city}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
