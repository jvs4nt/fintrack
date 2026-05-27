import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Category } from '../types';

export interface CategoryPickerProps {
  type: 'income' | 'expense';
  value: string;
  onChange: (name: string) => void;
  categories: Category[];
  disabled?: boolean;
  id?: string;
}

function mergeOptionNames(categories: Category[], pendingNames: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...categories.map((c) => c.name), ...pendingNames]) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out.sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export default function CategoryPicker({
  value,
  onChange,
  categories,
  disabled = false,
  id = 'category-combobox',
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [pendingNames, setPendingNames] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const allOptions = useMemo(
    () => mergeOptionNames(categories, pendingNames),
    [categories, pendingNames]
  );

  const filterText = open ? draft : value;
  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((n) => n.toLowerCase().includes(q));
  }, [allOptions, filterText]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setDraft(value);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, value]);

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const key = trimmed.toLowerCase();
    const alreadyListed = allOptions.some((n) => n.toLowerCase() === key);
    if (!alreadyListed) {
      setPendingNames((prev) => [...prev, trimmed]);
    }
    onChange(trimmed);
    setDraft(trimmed);
    setOpen(true);
  }

  function selectOption(name: string) {
    onChange(name);
    setDraft(name);
    setOpen(false);
  }

  const inputValue = open ? draft : value;

  return (
    <div className="category-combobox" id={id} ref={rootRef}>
      <div className="category-combobox-row">
        <input
          className="form-input category-combobox-input"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Buscar ou nova categoria"
          value={inputValue}
          disabled={disabled}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setDraft(value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
            if (e.key === 'Escape') {
              setOpen(false);
              setDraft(value);
            }
          }}
        />
        <button
          type="button"
          className="category-combobox-add-btn"
          onClick={handleAdd}
          disabled={disabled}
          aria-label="Adicionar categoria à lista"
          title="Adicionar à lista"
        >
          +
        </button>
      </div>

      {open && (
        <div className="category-combobox-menu" role="listbox">
          {filtered.length === 0 ? (
            <div className="category-combobox-empty">
              {filterText.trim()
                ? 'Nenhuma correspondência — use + para adicionar'
                : 'Nenhuma categoria — digite e use +'}
            </div>
          ) : (
            filtered.map((name) => (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={value === name}
                className={`category-combobox-option ${value === name ? 'active' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption(name)}
              >
                {name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
