/**
 * Generic option-picker bottom sheet (SPEC §11.2 dropdown behaviour). Reused by
 * the favourite-pro dropdown, the S13 sort control and the S9 switch-pro sheet.
 */
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '@/src/theme';
import { BottomSheet, SearchField, Text } from '@/src/components/ui';
import { cn } from '@/src/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

export interface SelectSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: SelectOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Custom row renderer (e.g. pro avatars). */
  renderOption?: (option: SelectOption, selected: boolean) => React.ReactNode;
  heightRatio?: number;
}

export function SelectSheet({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  searchable = false,
  searchPlaceholder,
  renderOption,
  heightRatio = 0.65,
}: SelectSheetProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={heightRatio}
      scrollable
    >
      <Text variant="h2" className="mb-3 text-[18px]">
        {title}
      </Text>
      {searchable ? (
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={searchPlaceholder}
          className="mb-3"
        />
      ) : null}
      {filtered.map((opt) => {
        const selected = opt.value === selectedValue;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              onSelect(opt.value);
              onClose();
            }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={cn(
              'mb-2 flex-row items-center justify-between rounded-card border p-3',
              selected ? 'border-primary bg-tip-bg' : 'border-border bg-white',
            )}
          >
            {renderOption ? (
              <View className="flex-1">{renderOption(opt, selected)}</View>
            ) : (
              <View className="flex-1">
                <Text variant="label" className="text-[14px]">
                  {opt.label}
                </Text>
                {opt.subtitle ? (
                  <Text variant="caption">{opt.subtitle}</Text>
                ) : null}
              </View>
            )}
            {selected ? <Check size={18} color={colors.primary} /> : null}
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}
