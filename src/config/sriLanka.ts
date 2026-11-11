/** Sri Lankan reference data used across the system. */

export const SL_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna',
  'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala',
  'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
] as const

/** Countries Sri Lankan importers commonly buy from, with the phone dial code. */
export const SOURCING_COUNTRIES: { name: string; dial: string }[] = [
  { name: 'China', dial: '+86' },
  { name: 'India', dial: '+91' },
  { name: 'Vietnam', dial: '+84' },
  { name: 'Thailand', dial: '+66' },
  { name: 'Malaysia', dial: '+60' },
  { name: 'Singapore', dial: '+65' },
  { name: 'Indonesia', dial: '+62' },
  { name: 'United Arab Emirates', dial: '+971' },
  { name: 'Pakistan', dial: '+92' },
  { name: 'Bangladesh', dial: '+880' },
  { name: 'Japan', dial: '+81' },
  { name: 'South Korea', dial: '+82' },
  { name: 'Turkey', dial: '+90' },
  { name: 'Italy', dial: '+39' },
  { name: 'United Kingdom', dial: '+44' },
  { name: 'United States', dial: '+1' },
]

export const SL_DIAL = '+94'
