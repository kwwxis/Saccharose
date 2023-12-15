import React from 'react';
import { AchievementExcelConfigData } from '../../../../shared/types/genshin/achievement-types';
import { toParam } from '../../../routing/viewUtilities';
import Wikitext from '../../utility/Wikitext';
import { GenshinControl } from '../../../domain/genshin/genshinControl';
import { AchievementTriggerDesc } from './AchievementTriggerDesc';

export default function AchievementPage(props: {
  achievement: AchievementExcelConfigData,
  wikitext: string,
  ctrl: GenshinControl
}) {
  if (!props.achievement) {
    return (
      <section className="card">
        <h2>Achievement not found</h2>
        <div className="content">
          <div className="flexColumn alignStart">
            <a href="/achievements" role="button" className="secondary dispBlock spacer5-bottom">Back to all categories</a>
          </div>
        </div>
      </section>
    )
  }

  const {achievement, wikitext} = props;
  return (
    <section className="card">
      <h2 className="valign">
        <img className="framed-icon x42" src={`/images/genshin/${achievement.Goal.IconPath}.png`} loading="lazy" decoding="async" />
        <span className="spacer15-left">{ achievement.TitleText }</span>
        <span className="grow"></span>
        <span className="alignEnd flexColumn">
        <a href="/achievements" role="button" className="secondary small dispBlock spacer5-bottom">Back to all categories</a>
        <a href={`/achievements/${toParam(achievement.Goal.NameText)}`} role="button" className="secondary small dispBlock">Back to { achievement.Goal.NameText }</a>
      </span>
      </h2>
      <div className="content">
        <table className="article-table">
          <thead>
            <tr>
              <th colSpan={2}>Property Table</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="bold">ID</td>
              <td className="w70p">{ achievement.Id }</td>
            </tr>
            <tr>
              <td className="bold">Name</td>
              <td className="w70p">{ achievement.TitleText }</td>
            </tr>
            <tr>
              <td className="bold">Category</td>
              <td className="w70p">{ achievement.Goal.NameText }</td>
            </tr>
            <tr>
              <td className="bold">Description</td>
              <td className="w70p">
                <Wikitext id="achievement-desc" seamless value={ props.ctrl.normText(achievement.DescText, props.ctrl.outputLangCode) } />
              </td>
            </tr>
            <tr>
              <td className="bold">Order ID</td>
              <td className="w70p">{ achievement.OrderId }</td>
            </tr>
            <tr>
              <td className="bold">Primogem Count</td>
              <td className="w70p">{ achievement?.FinishReward?.RewardSummary?.PrimogemCount || 'n/a' }</td>
            </tr>
            <tr>
              <td className="bold">Is Hidden?</td>
              <td className="w70p">{ achievement.IsHidden ? 'Yes' : 'No' }</td>
            </tr>
            <tr>
              <td className="bold">Trigger Info</td>
              <td className="w70p">
                <AchievementTriggerDesc achievement={achievement} />
              </td>
            </tr>
          </tbody>
        </table>
        <div className="spacer10-top">
          <Wikitext value={ wikitext } />
        </div>
      </div>
    </section>
  )
}

