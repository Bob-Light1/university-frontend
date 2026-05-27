/**
 * @file PhoneInput.jsx
 * @description Saisie de téléphone avec sélecteur de code pays.
 * Pays par défaut : Cameroun (+237).
 * Produit une valeur E.164-like : "+237612345678" (sans espaces ni parenthèses).
 *
 * Intégration Formik :
 *   <PhoneInput
 *     name="phone"
 *     label="Téléphone"
 *     value={formik.values.phone}
 *     onChange={(v) => formik.setFieldValue('phone', v)}
 *     onBlur={formik.handleBlur}
 *     error={formik.touched.phone && Boolean(formik.errors.phone)}
 *     helperText={formik.touched.phone && formik.errors.phone}
 *     required
 *   />
 *
 * Le schéma Yup correspondant : yupPhone(true) depuis validationRules.js
 */

import { useState, useEffect } from 'react';
import {
  FormControl, Stack, Select, MenuItem, OutlinedInput,
  FormHelperText, Typography,
} from '@mui/material';

// ── Codes pays ─────────────────────────────────────────────────────────────────

const COUNTRY_CODES = [
  // ── Afrique centrale (défaut)
  { code: '+237', flag: '🇨🇲', name: 'Cameroun'          },
  { code: '+236', flag: '🇨🇫', name: 'Centrafrique'       },
  { code: '+235', flag: '🇹🇩', name: 'Tchad'             },
  { code: '+242', flag: '🇨🇬', name: 'Congo'             },
  { code: '+241', flag: '🇬🇦', name: 'Gabon'             },
  { code: '+240', flag: '🇬🇶', name: 'Guinée Éq.'        },
  // ── Afrique de l'Ouest
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire"      },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal'           },
  { code: '+223', flag: '🇲🇱', name: 'Mali'              },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso'       },
  { code: '+227', flag: '🇳🇪', name: 'Niger'             },
  { code: '+228', flag: '🇹🇬', name: 'Togo'              },
  { code: '+229', flag: '🇧🇯', name: 'Bénin'             },
  { code: '+224', flag: '🇬🇳', name: 'Guinée'            },
  { code: '+234', flag: '🇳🇬', name: 'Nigéria'           },
  { code: '+233', flag: '🇬🇭', name: 'Ghana'             },
  // ── Afrique de l'Est
  { code: '+254', flag: '🇰🇪', name: 'Kenya'             },
  { code: '+255', flag: '🇹🇿', name: 'Tanzanie'          },
  { code: '+256', flag: '🇺🇬', name: 'Ouganda'           },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda'            },
  { code: '+243', flag: '🇨🇩', name: 'R.D. Congo'         },
  // ── Afrique du Nord
  { code: '+212', flag: '🇲🇦', name: 'Maroc'             },
  { code: '+213', flag: '🇩🇿', name: 'Algérie'           },
  { code: '+216', flag: '🇹🇳', name: 'Tunisie'           },
  // ── Europe
  { code: '+33',  flag: '🇫🇷', name: 'France'            },
  { code: '+32',  flag: '🇧🇪', name: 'Belgique'          },
  { code: '+41',  flag: '🇨🇭', name: 'Suisse'            },
  { code: '+44',  flag: '🇬🇧', name: 'Royaume-Uni'        },
  { code: '+49',  flag: '🇩🇪', name: 'Allemagne'         },
  // ── Amérique
  { code: '+1',   flag: '🇺🇸', name: 'USA / Canada'       },
  { code: '+55',  flag: '🇧🇷', name: 'Brésil'            },
];

// Trier du plus long au plus court pour éviter les préfixes ambigus (+237 avant +2)
const SORTED_CODES = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);

const DEFAULT_CODE = '+237';

// ── Parsing ────────────────────────────────────────────────────────────────────

/**
 * Extrait le code pays et le numéro local depuis une valeur complète.
 * Normalise les espaces/tirets/parenthèses avant de tenter la correspondance.
 */
const parsePhone = (fullValue) => {
  if (!fullValue) return { code: DEFAULT_CODE, local: '' };

  // Normaliser : supprimer espaces, parenthèses, tirets mais garder le +
  const norm = fullValue.replace(/[\s()\-]/g, '');

  for (const cc of SORTED_CODES) {
    if (norm.startsWith(cc.code)) {
      return { code: cc.code, local: norm.slice(cc.code.length) };
    }
  }

  // Aucun code pays reconnu → garder le code par défaut, traiter le reste comme local
  return { code: DEFAULT_CODE, local: norm.replace(/^\+?/, '') };
};

// ── Composant ──────────────────────────────────────────────────────────────────

/**
 * @param {string}   name        - Nom du champ Formik
 * @param {string}   label       - Label affiché au-dessus du champ
 * @param {string}   value       - Valeur complète : "+237612345678"
 * @param {function} onChange    - Appelée avec la nouvelle valeur complète (string)
 * @param {function} onBlur      - Handler Formik (handleBlur)
 * @param {boolean}  error       - Etat d'erreur
 * @param {string}   helperText  - Message d'erreur ou d'aide
 * @param {boolean}  required
 * @param {boolean}  disabled
 * @param {'small'|'medium'} size
 */
export default function PhoneInput({
  name,
  label,
  value = '',
  onChange,
  onBlur,
  error = false,
  helperText,
  required = false,
  disabled = false,
  size = 'small',
}) {
  const [countryCode, setCountryCode] = useState(DEFAULT_CODE);
  const [localNumber, setLocalNumber] = useState('');

  // Synchroniser l'état interne avec la valeur externe (reset de formulaire, chargement)
  useEffect(() => {
    const { code, local } = parsePhone(value);
    setCountryCode(code);
    setLocalNumber(local);
  }, [value]);

  const handleCodeChange = (newCode) => {
    setCountryCode(newCode);
    onChange?.(`${newCode}${localNumber}`);
  };

  const handleLocalChange = (raw) => {
    const digits = raw.replace(/\D/g, ''); // chiffres uniquement
    setLocalNumber(digits);
    onChange?.(`${countryCode}${digits}`);
  };

  const selectedEntry = COUNTRY_CODES.find((c) => c.code === countryCode);

  return (
    <FormControl error={error} fullWidth>
      {label && (
        <Typography
          component="label"
          htmlFor={`${name}-local`}
          variant="caption"
          sx={{
            mb: 0.5,
            fontWeight: 500,
            color: error ? 'error.main' : 'text.secondary',
            display: 'block',
          }}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </Typography>
      )}

      <Stack direction="row" spacing={1} alignItems="flex-start">
        {/* ── Sélecteur de code pays ── */}
        <Select
          value={countryCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          disabled={disabled}
          size={size}
          aria-label="Country code"
          displayEmpty
          renderValue={() =>
            selectedEntry ? `${selectedEntry.flag} ${selectedEntry.code}` : countryCode
          }
          sx={{
            width: 112,
            flexShrink: 0,
            borderRadius: 2,
            ...(error && {
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'error.main' },
            }),
          }}
          MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
        >
          {COUNTRY_CODES.map((cc) => (
            <MenuItem value={cc.code} key={`${cc.code}-${cc.name}`}>
              <Stack direction="row" spacing={1} alignItems="center">
                <span>{cc.flag}</span>
                <Typography variant="body2" sx={{ minWidth: 36, fontVariantNumeric: 'tabular-nums' }}>
                  {cc.code}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {cc.name}
                </Typography>
              </Stack>
            </MenuItem>
          ))}
        </Select>

        {/* ── Numéro local ── */}
        <OutlinedInput
          id={`${name}-local`}
          name={name}
          value={localNumber}
          onChange={(e) => handleLocalChange(e.target.value)}
          onBlur={onBlur}
          placeholder="612 345 678"
          disabled={disabled}
          size={size}
          error={error}
          inputProps={{ inputMode: 'numeric', 'aria-label': 'Phone number' }}
          sx={{ flex: 1, borderRadius: 2 }}
        />
      </Stack>

      {helperText && (
        <FormHelperText sx={{ mx: 0 }}>{helperText}</FormHelperText>
      )}
    </FormControl>
  );
}
