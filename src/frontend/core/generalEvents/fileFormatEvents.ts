import { Listener } from '../../util/eventListen.ts';
import Cookies from 'js-cookie';
import { modalService } from '../../util/modalService.ts';
import { escapeHtml } from '../../../shared/util/stringUtil.ts';

export const FileFormatListeners: Listener[] = [
  {
    selector: '.file-format-options input[type="radio"]',
    event: 'input',
    multiple: true,
    handle: function(event, target: HTMLInputElement) {
      let parent = target.closest('.file-format-options');
      let name = target.name;
      let value = target.value;
      Cookies.set(name, value, { expires: 365 });
      if (value === 'custom') {
        parent.querySelector('.file-format-options-custom-format').classList.remove('hide');
      } else {
        parent.querySelector('.file-format-options-custom-format').classList.add('hide');
      }
    }
  },
  {
    selector: '.file-format-options-custom-format-input',
    event: 'input',
    multiple: true,
    handle: function(event, target: HTMLInputElement) {
      let name = target.name;
      let value = target.value;

      clearTimeout((<any> target)._timeout);

      (<any> target)._timeout = setTimeout(() => {
        Cookies.set(name, value, { expires: 365 });
      }, 50);
    }
  },
  {
    selector: '.file-format-options .file-format-options-custom-format-help-button',
    event: 'click',
    multiple: true,
    handle: function(event, target: HTMLInputElement) {
      const paramName = target.closest('.file-format-options').getAttribute('data-param-name');
      const fileFormatDefault = target.closest('.file-format-options').getAttribute('data-file-format-default');
      const params = target.closest('.file-format-options').getAttribute('data-file-format-params').split(',').map(x => x.trim());
      const langCodes = target.closest('.file-format-options').getAttribute('data-lang-codes').split(',').map(x => x.trim());

      modalService.modal(`<span>Custom Format Options for <code>${escapeHtml(paramName)}</code></span>`, `
        <p class="info-notice spacer5-top">
          <strong>English wiki default format for <code>${escapeHtml(paramName)}</code>:</strong><br />
          <textarea class="code autosize w100p" readonly style="background:transparent">${escapeHtml(fileFormatDefault)}</textarea>
        </p>
        <fieldset>
          <legend>Variable usage</legend>
          <div class="content">
            <p class="spacer10-bottom">Variables must be wrapped in single curly braces, for example:<br />
            <code>{NameText.EN} Map Location.png</code></p>
            
            <p class="spacer10-bottom">Alternatively, you can use the syntax:<br />
            <code>{{Var|NameText.EN}} Map Location.png</code></p>
            
            <p class="spacer10-bottom">If you want to specify a default value if a variable is empty, you can specify a second parameter to <code>{{Var}}</code>:<br />
            <code>{{Var|NameText.EN|default value}} Map Location.png</code></p>
            
            <p class="spacer10-bottom">The second parameter will be evaluted the same as the top-level format, so you can have nested conditionals and variables inside.
            Default values cannot be specified with the single curly brace format.</p>
          </div>
        </fieldset>
        <fieldset class="spacer5-top">
          <legend>Available variables:</legend>
          <div class="content spacer20-horiz">
            <ul style="columns:2;">${params.map(param => `<li><code>${escapeHtml(param)}</code></li>`).join('')}</ul>
          </div>
        </fieldset>
        <fieldset class="spacer5-top">
          <legend>Available language codes:</legend>
          <div class="content spacer20-horiz">
            <ul style="columns:5;">${langCodes.map(param => `<li><code>${escapeHtml(param)}</code></li>`).join('')}</ul>
          </div>
        </fieldset>
        <fieldset class="spacer5-top">
          <legend>Specify Specific Language</legend>
          <div class="content">
            <p>For in-game text variables, you can specify a specific language by appending it with <code>.{Langcode}</code>. For example,
            for a <code>NameText</code> param, you can use <code>NameText.JP</code>. Otherwise, without any specific language code, just <code>NameText</code>
            would use your selected <strong>Output Language</strong>.</p>
          </div>
        </fieldset>
        <fieldset class="spacer5-top">
          <legend>Conditionals</legend>
          <div class="content">
            <p>You can use conditionals in the format of:</p>
            
            <br />
            <code class="dispBlock">{{If|&lt;condition&gt;|&lt;then value&gt;|&lt;else value&gt;}}</code>
            <code class="dispBlock spacer20-left">condition = "&lt;left-param&gt; &lt;operator&gt; &lt;right-param&gt;"</code>
            <code class="dispBlock spacer20-left">operator = ":=" | "!=" | "&lt;=" | "&gt;=" | "&lt;" | "&gt;" | "*=" | "^=" | "$=" | "~"</code>
            <br />
            
            <li>The <code>left-param</code> and <code>right-param</code> are evaluated the same as the top-level format,
            so you can use variables inside of them and have nested conditionals.</li>
            
            <li>The <code>condition</code> follows different logic such that variables do not need to be wrapped in curly braces.</li>
            
            <li>Strings do not need to be wrapped in quotes, but you should put them in quotes to prevent them from
            being evaluated as variables or operators.</li>
            
            <li><code>:=</code> is equals whereas <code>!=</code> is not equals.</li>
            
            <li>String condition operators: <code>*=</code> is string includes,
            <code>^=</code> is string starts with, <code>"$="</code> is string ends with, and <code>~=</code> is regex
            (left param is test string, right param is regex).</li>
            
            <li><code>{{If|...}}</code> is case-insensitive. For case-sensitive operations, use <code>{{IfCase|...}}</code> instead.</li>
          </div>
        </fieldset>
      `, {
        modalClass: 'modal-lg',
        modalCssStyle: 'max-height:750px',
        contentClass: 'modal-inset'
      });
    }
  }
];
