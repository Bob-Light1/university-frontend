/**
 * Reusable MUI field wrappers used by TeacherForm & StudentForm.
 * Each component forwards all extra props to the underlying TextField.
 */
import React from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const FIELD_SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

// ─── Generic text field ──────────────────────────────────────────────────────

export const FormTextField = ({
  formik,
  name,
  label,
  icon: Icon,
  type = 'text',
  slotPropsExtra = {},
  ...rest
}) => (
  <TextField
    fullWidth
    id={name}
    name={name}
    label={label}
    type={type}
    value={formik.values[name]}
    onChange={formik.handleChange}
    onBlur={formik.handleBlur}
    error={formik.touched[name] && Boolean(formik.errors[name])}
    helperText={formik.touched[name] && formik.errors[name]}
    sx={FIELD_SX}
    slotProps={{
      input: {
        startAdornment: Icon && (
          <InputAdornment position="start">
            <Icon fontSize="small" color="action" />
          </InputAdornment>
        ),
        ...slotPropsExtra,
      },
    }}
    {...rest}
  />
);

// ─── Date field ──────────────────────────────────────────────────────────────

export const FormDateField = ({ formik, name, label, ...rest }) => (
  <TextField
    fullWidth
    id={name}
    name={name}
    label={label}
    type="date"
    {...formik.getFieldProps(name)}
    error={formik.touched[name] && Boolean(formik.errors[name])}
    helperText={formik.touched[name] && formik.errors[name]}
    sx={FIELD_SX}
    slotProps={{ inputLabel: { shrink: true } }}
    {...rest}
  />
);

// ─── Select field ────────────────────────────────────────────────────────────

export const FormSelectField = ({
  formik,
  name,
  label,
  icon: Icon,
  options = [],
  sx,
  ...formControlRest
}) => {
  const labelId  = `${name}-label`;
  const hasError = formik.touched[name] && Boolean(formik.errors[name]);
  const safeValue = options.some(opt => opt.value === formik.values[name]) 
    ? formik.values[name] 
    : '';

  return (
    <FormControl 
      fullWidth 
      error={hasError}
      size="medium" 
       sx={{ ...FIELD_SX, ...sx }}
      {...formControlRest}
    >
      <InputLabel id={labelId}>{label}</InputLabel>
      
      <Select
        labelId={labelId}
        id={name}                     
        name={name}
        value={safeValue}
        label={label}                     
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        startAdornment={Icon && (
          <InputAdornment position="start">
            <Icon fontSize="small" color="action" />
          </InputAdornment>
        )}
      >
        {options.length > 0 ? (
          options.map(({ value: optValue, label: optLabel }) => (
            <MenuItem key={optValue} value={optValue}>
              {optLabel}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled value="">
            <em>Loading...</em>
          </MenuItem>
        )}
      </Select>

      {hasError && (
        <FormHelperText>{formik.errors[name]}</FormHelperText>
      )}
    </FormControl>
  );
};

// ─── Password field ──────────────────────────────────────────────────────────

export const FormPasswordField = ({ formik, name = 'password', label = 'Password' }) => {
  const [show, setShow] = React.useState(false);
  return (
    <TextField
      fullWidth
      id={name}
      name={name}
      label={label}
      type={show ? 'text' : 'password'}
      value={formik.values[name]}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      sx={FIELD_SX}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton 
                onClick={() => setShow((s) => !s)} 
                edge="end"
                aria-label='toggle password visibility'
              >
                {show ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

// ─── Read-only campus field ──────────────────────────────────────────────────

export const CampusField = ({ campusName, icon: Icon }) => (
  <TextField
    fullWidth
    id='schoolCampus-display'
    label="Campus"
    value={campusName || ''}
    disabled
    sx={FIELD_SX}
    slotProps={{
      input: {
        readOnly: true,
        startAdornment: Icon && (
          <InputAdornment position="start">
            <Icon fontSize="small" color="action" />
          </InputAdornment>
        ),
      },
    }}
  />
);