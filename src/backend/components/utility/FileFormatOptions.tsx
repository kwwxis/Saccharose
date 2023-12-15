import React from 'react';
import { styles } from '../../util/reactUtil';
import Icon from './Icon';
import { getTrace } from '../../middleware/request/tracer';

export default function FileFormatOptions(props: {
  paramName: string,
  cookieName: string,
  fileFormatParams?: string,
  fileFormatDefault?: string
}) {
  const { req } = getTrace();
  const { paramName, cookieName, fileFormatParams, fileFormatDefault } = props;

  return (
    <fieldset className="file-format-options spacer10-right"
              data-param-name={paramName}
              data-cookie-name={cookieName}
              data-file-format-default={fileFormatDefault || ''}
              data-file-format-params={fileFormatParams || ''}
              data-lang-codes={Object.keys(req.context.languages).join(',')}>
      <legend><code>{paramName}</code> parameter</legend>
      <div className="field spacer5-horiz" style={styles(`padding-right:30px`)}>
        <label className="ui-radio dispBlock" style={styles(`padding-left:5px;font-size:13px;`)}>
          <input type="radio" name={cookieName} value="default"
                 checked={req.context.cookieTernary(cookieName).equals('default').or.isEmpty().get()} />
          <span>Use English wiki format</span>
        </label>
        <label className="ui-radio dispBlock" style={styles(`padding-left:5px;font-size:13px;`)}>
          <input type="radio" name={cookieName} value="remove"
                 checked={req.context.cookieTernary(cookieName).equals('remove').get()} />
          <span>Remove parameter</span>
        </label>
        <label className="ui-radio dispBlock" style={styles(`padding-left:5px;font-size:13px;`)}>
          <input type="radio" name={cookieName} value="custom"
                 checked={req.context.cookieTernary(cookieName).equals('custom').get()} />
          <span>Use custom format</span>
        </label>
        <div className="file-format-options-custom-format <%= cookieTernary(cookieName).equals('custom').then('', 'hide') %>"
             style={styles(`margin-left: 29px;`)}>
          <div className="posRel">
            <textarea name={cookieName + '.CustomFormat'}
                      placeholder="File format" className="code file-format-options-custom-format-input"
                      style={styles(`min-width:450px;min-height:100px;padding-right:25px`)}
                      value={req.context.cookie(cookieName + '.CustomFormat')}></textarea>
            <span ui-tippy="{content: 'Click to show options.',delay:[200, 100]}"
                  className="file-format-options-custom-format-help-button dispInlineBlock spacer5-left posAbs"
                  style={styles(`
                  height:16px;width:16px;font-size:0;opacity:0.5;right:5px;top:5px;margin:auto 0;cursor:pointer;`)}>
              <Icon name="info" size={16} />
            </span>
          </div>
        </div>
      </div>
    </fieldset>
  );
}