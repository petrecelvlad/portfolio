
import { Trophy } from 'lucide-react';
import { Row } from '../../atoms/Row';
import { Text } from '../../atoms/Text';
import { AchievementSlotProps } from '../ports';

export function BentoAchievement({ achievement }: AchievementSlotProps) {
  const isEmpty = !achievement;
  return (
    <div className={`border-[length:var(--border-width-sm)] border-ink-base px-4 py-3 rounded-xl shadow-[var(--shadow-raised)] ${isEmpty ? 'bg-surface-base border-dashed opacity-40' : 'bg-[var(--role-achievement-accent)]'}`}>
      <Row gap="sm" align="center">
        <div className="flex-shrink-0 flex items-center justify-center">
          <Trophy size={20} className="text-ink-base" />
        </div>
        <Row gap="sm" align="baseline" wrap>
          <Text variant="mono" size="sm" className="text-xs font-black uppercase tracking-tighter text-ink-base">Achievement:</Text>
          <Text variant="body" size="sm" className="font-bold text-ink-base">
            {isEmpty ? '' : achievement}
          </Text>
        </Row>
      </Row>
    </div>
  );
}
