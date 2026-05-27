import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import type { Category } from '@/src/types';

export interface CategoryPickerProps {
  type: 'income' | 'expense';
  value: string;
  onChange: (name: string) => void;
  categories: Category[];
  disabled?: boolean;
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

export function CategoryPicker({
  value,
  onChange,
  categories,
  disabled = false,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [pendingNames, setPendingNames] = useState<string[]>([]);

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
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Buscar ou nova categoria"
          placeholderTextColor={Theme.textMuted}
          value={inputValue}
          editable={!disabled}
          onChangeText={(t) => {
            setDraft(t);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setDraft(value);
          }}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          style={[styles.addBtn, disabled && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={disabled}
          accessibilityLabel="Adicionar categoria à lista">
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      {open && (
        <View style={styles.menu}>
          <ScrollView
            style={styles.menuScroll}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled>
            {filtered.length === 0 ? (
              <Text style={styles.empty}>
                {filterText.trim()
                  ? 'Nenhuma correspondência — use + para adicionar'
                  : 'Nenhuma categoria — digite e use +'}
              </Text>
            ) : (
              filtered.map((name) => (
                <Pressable
                  key={name}
                  style={[styles.option, value === name && styles.optionActive]}
                  onPress={() => selectOption(name)}>
                  <Text style={[styles.optionText, value === name && styles.optionTextActive]}>
                    {name}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: Theme.spacingSm, zIndex: 10 },
  row: { flexDirection: 'row', gap: Theme.spacingSm, alignItems: 'stretch' },
  input: {
    flex: 1,
    fontFamily: FontFamily.ui,
    fontSize: 16,
    color: Theme.textPrimary,
    backgroundColor: Theme.bgTertiary,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radiusMd,
    padding: Theme.spacingMd,
    minWidth: 0,
  },
  addBtn: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.accentPrimary,
    borderRadius: Theme.radiusMd,
    backgroundColor: Theme.bgTertiary,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 22,
    color: Theme.accentPrimary,
    lineHeight: 24,
  },
  menu: {
    marginTop: Theme.spacingXs,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radiusMd,
    backgroundColor: Theme.bgSecondary,
    maxHeight: 200,
    overflow: 'hidden',
  },
  menuScroll: { maxHeight: 200 },
  option: {
    paddingVertical: Theme.spacingSm,
    paddingHorizontal: Theme.spacingMd,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  optionActive: { backgroundColor: Theme.bgTertiary },
  optionText: { fontFamily: FontFamily.ui, fontSize: 15, color: Theme.textPrimary },
  optionTextActive: { color: Theme.accentPrimary },
  empty: {
    fontFamily: FontFamily.ui,
    fontSize: 13,
    color: Theme.textSecondary,
    padding: Theme.spacingMd,
  },
});
