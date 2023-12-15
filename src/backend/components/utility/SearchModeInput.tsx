import React from 'react';
import { styles } from '../../util/reactUtil';
import { getTrace } from '../../middleware/request/tracer';
import Icon from './Icon';
import classNames from 'classnames';

export default function SearchModeInput(): React.JSX.Element {
  const { ctx } = getTrace();
  return (
    <div id="search-mode-input" className="posRel">
      <button id="search-mode-button"
              className="input-style valign"
              ui-action="dropdown: #search-mode-dropdown"
              style={styles(`cursor: pointer;border-top-left-radius:0;border-bottom-left-radius:0;border-left:0;`)}>
        <span>mode:&nbsp;</span>
        <strong className="code" style={styles(`width:17px;text-align:center`)}>{ ctx.cookie('search-mode', 'WI') }</strong>
        <Icon name="chevron-down" size={18} props={{style: 'opacity: 0.5; margin: 0 -5px 0 3px;'}} />
      </button>
      <div id="search-mode-dropdown" className="ui-dropdown hide">
        <div data-value="C"
             className={classNames('option', {
               selected: ctx.cookieTernary('search-mode').equals('C').get()
             })}
             ui-action="close-dropdowns">
          <strong className="code">C:&nbsp;</strong> Character match <small><em>(case-sensitive)</em></small>
        </div>
        <div data-value="CI"
             className={classNames('option', {
               selected: ctx.cookieTernary('search-mode').equals('CI').get()
             })}
             ui-action="close-dropdowns">
          <strong className="code">CI:</strong> Character match <small><em>(case-insensitive)</em></small>
        </div>

        <div className="option-sep"></div>

        <div data-value="W"
             className={classNames('option', {
               selected: ctx.cookieTernary('search-mode').equals('W').get()
             })}
             ui-action="close-dropdowns">
          <strong className="code">W:&nbsp;</strong> Word match <small><em>(case-sensitive)</em></small>
        </div>
        <div data-value="WI"
             className={classNames('option', {
               selected: ctx.cookieTernary('search-mode').equals('WI').get()
             })}
             ui-action="close-dropdowns">
          <strong className="code">WI:</strong> Word match <small><em>(case-insensitive)</em></small>
        </div>

        <div className="option-sep"></div>

        <div data-value="R"
             className={classNames('option', {
               selected: ctx.cookieTernary('search-mode').equals('R').get()
             })}
             ui-action="close-dropdowns">
          <strong className="code">R:&nbsp;</strong> Regex <small><em>(case-sensitive)</em></small>
        </div>
        <div data-value="RI"
             className={classNames('option', {
               selected: ctx.cookieTernary('search-mode').equals('RI').get()
             })}
             ui-action="close-dropdowns">
          <strong className="code">RI:</strong> Regex <small><em>(case-insensitive)</em></small>
        </div>
      </div>
    </div>
  );
}