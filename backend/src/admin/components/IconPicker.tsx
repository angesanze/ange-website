import { forwardRef, useMemo, useState } from 'react';
import { Field, Flex, Box, Button, Typography, TextInput } from '@strapi/design-system';
import { ICON_NAMES, resolveIcon, isEmoji } from '../icons';

/**
 * Admin custom-field input: a visual picker for the site's icons. Replaces typing
 * a raw name like "book-open" with a searchable grid of icons, plus emoji support.
 * Stores a plain string (the lucide kebab name or the emoji) — so the existing
 * string-based frontend resolver keeps working unchanged.
 */
interface InputProps {
  name: string;
  value?: string | null;
  onChange: (eventOrPath: string, value?: unknown) => void;
  error?: string;
  label?: string;
  hint?: React.ReactNode;
  labelAction?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}

const CELL = 40;

const IconPicker = forwardRef<HTMLButtonElement, InputProps>((props, ref) => {
  const { name, value, onChange, error, label, hint, labelAction, required, disabled } = props;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_NAMES;
    return ICON_NAMES.filter((n) => n.includes(q));
  }, [query]);

  const select = (next: string) => {
    onChange(name, next);
    setOpen(false);
    setQuery('');
  };
  const clear = () => onChange(name, '');

  const Current = resolveIcon(value);
  const currentEmoji = value && !Current && isEmoji(value) ? value : null;
  const term = query.trim();
  const termIsEmoji = !!term && isEmoji(term) && !resolveIcon(term);

  return (
    <Field.Root name={name} error={error} hint={hint} required={required}>
      <Field.Label action={labelAction}>{label}</Field.Label>

      <Flex gap={2} alignItems="center">
        <button
          type="button"
          ref={ref}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="true"
          aria-expanded={open}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 220,
            padding: '8px 12px',
            border: '1px solid #dcdce4',
            borderRadius: 4,
            background: disabled ? '#f6f6f9' : '#ffffff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              width: 22,
              height: 22,
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
            }}
          >
            {Current ? <Current size={20} /> : currentEmoji ? (
              <span style={{ fontSize: 18, lineHeight: 1 }}>{currentEmoji}</span>
            ) : null}
          </span>
          <Typography textColor={value ? 'neutral800' : 'neutral500'}>
            {value || 'Choose an icon or emoji'}
          </Typography>
        </button>

        {value ? (
          <Button variant="tertiary" onClick={clear} disabled={disabled}>
            Clear
          </Button>
        ) : null}
      </Flex>

      {open ? (
        <Box
          marginTop={1}
          padding={3}
          background="neutral0"
          hasRadius
          style={{ border: '1px solid #dcdce4' }}
        >
          <TextInput
            aria-label="Search icons"
            placeholder="Search icons, or paste an emoji…"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          />

          {termIsEmoji ? (
            <Box paddingTop={2}>
              <Button variant="secondary" fullWidth onClick={() => select(term)}>
                Use emoji “{term}”
              </Button>
            </Box>
          ) : null}

          <Box paddingTop={2} style={{ maxHeight: 280, overflowY: 'auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fill, minmax(${CELL}px, 1fr))`,
                gap: 6,
              }}
            >
              {filtered.map((iconName) => {
                const Cmp = resolveIcon(iconName)!;
                const selected = value === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    title={iconName}
                    onClick={() => select(iconName)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: CELL,
                      borderRadius: 4,
                      cursor: 'pointer',
                      border: selected ? '2px solid #4945ff' : '1px solid #eaeaef',
                      background: selected ? '#f0f0ff' : '#ffffff',
                    }}
                  >
                    <Cmp size={20} />
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 && !termIsEmoji ? (
              <Box paddingTop={2}>
                <Typography textColor="neutral500">
                  No icons match. Paste an emoji to use it instead.
                </Typography>
              </Box>
            ) : null}
          </Box>
        </Box>
      ) : null}

      <Field.Hint />
      <Field.Error />
    </Field.Root>
  );
});

export default IconPicker;
