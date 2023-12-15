import { AchievementExcelConfigData } from '../../../../shared/types/genshin/achievement-types';
import { styles } from '../../../util/reactUtil';
import React from 'react';

export function AchievementTriggerDesc(props: { achievement: AchievementExcelConfigData }) {
  const { achievement } = props;
  return (
    <>
      <div className="code" style={styles(`word-break:break-all;max-width:300px;font-size:0.8em`)}>{
        achievement?.TriggerConfig?.TriggerType?.startsWith('TRIGGER_')
          ? achievement?.TriggerConfig?.TriggerType?.slice('TRIGGER_'.length)
          : (achievement?.TriggerConfig?.TriggerType || 'n/a')
      }</div>

      {achievement?.TriggerConfig?.TriggerType === 'TRIGGER_OPEN_WORLD_CHEST'
        ? null
        : <div className="code"
               style={styles(`word-break:break-all;max-width:300px;font-size:0.8em`)}>{JSON.stringify(achievement?.TriggerConfig?.ParamList || 'n/a')}</div>
      }

      {achievement?.TriggerConfig?.TriggerQuests?.length && achievement.TriggerConfig.TriggerQuests.map(mq =>
        <a className="dispBlock" href="/quests/{ mainQuest.Id }">{mq.TitleText || `${mq.Id}: (No title)`}</a>,
      )}

      {achievement?.TriggerConfig?.CityNameText &&
        <div><b>City Name:</b> {achievement.TriggerConfig.CityNameText}</div>}
    </>
  );
}