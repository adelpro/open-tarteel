import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { Riwaya } from '@/constants';
import { getMessageConfig } from '@/helpers';
import { useRecitersData } from '@/hooks/reciters';
import { useRecitersFilter } from '@/hooks/reciters/use-reciters-filters';

import RiwayaFilterItem from './riwaya-filter-item';

type RiwayaOption = {
  value: Riwaya;
  msgConfig: ReturnType<typeof getMessageConfig>;
  label: string;
};
type RiwayaKey = keyof typeof Riwaya;
type RiwayaMessageId = `riwaya.${RiwayaKey}`;

export default function RiwayatFilter() {
  const { reciters } = useRecitersData();
  const { selectedRiwaya, setSelectedRiwaya } = useRecitersFilter();

  const { formatMessage, locale } = useIntl();

  const localizedSortedRiwayat: RiwayaOption[] = useMemo(() => {
    const riwayaKeys = Object.keys(Riwaya) as RiwayaKey[];

    return riwayaKeys
      .reduce<RiwayaOption[]>((accumulator, key) => {
        const value = Riwaya[key];
        if (!value) return accumulator;

        const messageId: RiwayaMessageId = `riwaya.${key}`;

        let messageConfig;
        let label;
        try {
          messageConfig = getMessageConfig(messageId);
          label = formatMessage(messageConfig);
        } catch (e) {
          console.warn(`Failed to get label for ${messageId}`, e);
          return accumulator;
        }

        if (!label) return accumulator;

        accumulator.push({ value, msgConfig: messageConfig, label });
        return accumulator;
      }, [])
      .sort((a, b) =>
        a.label.localeCompare(b.label, locale, { sensitivity: 'base' })
      );
  }, [locale, formatMessage]);

  const availableRiwayat = useMemo(() => {
    const reciterRiwayat = new Set(reciters.map((r) => r.moshaf.riwaya));

    return localizedSortedRiwayat.filter((riwaya) =>
      reciterRiwayat.has(riwaya.value)
    );
  }, [reciters, localizedSortedRiwayat]);

  const allReciters = getMessageConfig('allReciters').defaultMessage;

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-2">
      <RiwayaFilterItem
        onClick={() => setSelectedRiwaya(null)}
        active={!selectedRiwaya}
      >
        {allReciters}
      </RiwayaFilterItem>
      {availableRiwayat.map(({ value, label }) => {
        const active = selectedRiwaya === value;
        return (
          <RiwayaFilterItem
            key={value}
            onClick={(event) => {
              event.stopPropagation();
              setSelectedRiwaya(value);
            }}
            active={active}
          >
            {label}
          </RiwayaFilterItem>
        );
      })}
    </div>
  );
}
