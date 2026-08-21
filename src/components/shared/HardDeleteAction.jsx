/**
 * @file HardDeleteAction.jsx
 * @description Row-level trigger for permanent deletion, shared by every entity table.
 *
 * Renders nothing unless the page passes an `onHardDelete` handler, which it only does when the
 * danger-zone catalogue (`useHardDelete`) says this operator may delete this entity type and, if
 * the registry demands it, the row is already archived. Keeping that decision in the page rather
 * than in the button means a table cannot accidentally expose the danger zone on a live record.
 *
 * The button only opens the confirmation dialog — the ticket, phrase, password and reason
 * controls all live in HardDeleteDialog and are re-verified by the backend.
 *
 * @param {Function|null} onHardDelete - Handler supplied by the page, or null.
 * @param {string}        [title]      - Tooltip label; defaults to the translated action.
 * @param {string}        [size]       - MUI IconButton size.
 */

import { IconButton, Tooltip } from '@mui/material';
import { DeleteForever } from '@mui/icons-material';

import { useAppTranslation } from '../../hooks/useAppTranslation';

const HardDeleteAction = ({ onHardDelete, title, size = 'small' }) => {
  const { t } = useAppTranslation('common');

  if (!onHardDelete) return null;

  const label = title || t('hardDelete.confirmButton');

  return (
    <Tooltip title={label}>
      <IconButton
        size={size}
        onClick={onHardDelete}
        sx={{ color: 'error.dark' }}
        aria-label={label}
      >
        <DeleteForever fontSize={size === 'small' ? 'small' : 'medium'} />
      </IconButton>
    </Tooltip>
  );
};

export default HardDeleteAction;
