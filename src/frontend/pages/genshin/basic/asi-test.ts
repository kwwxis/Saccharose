import { pageMatch } from '../../../pageMatch';
import { validateRegExp } from '../../../../shared/util/stringUtil';
import { ASI } from '../../../util/asi/asi';
import { frag } from '../../../util/domutil';

const thing_regex = /^https?:\/\/((www\.)?reddit.com\/(r\/[A-Za-z0-9_\-]{1,21}\/)?comments\/[A-Za-z0-9]+(\/.*)?|redd\.it\/[A-Za-z0-9]+\/?)$|^((thing_)?t\d_)?[A-Za-z0-9]+$/i;
const username_regex = /^((\/|((https?:\/\/)?www.)?reddit.com\/)?(user|u)\/)?([A-Za-z0-9_\-]{1,20}|Trust and Safety|Anti-Evil Operations)\/?$/i;

let username_pass = function(value: string) {
  var lowerValue = value.toLowerCase();
  if (lowerValue === 'trust_and_safety' || lowerValue === 'trust and safety'
    || lowerValue === 'trust-and-safety') {
    return 'Trust and Safety';
  }
  if (lowerValue === 'anti-evil operations' || lowerValue === 'anti evil operations') {
    return 'Anti-Evil Operations';
  }
  let parts = value.split('/');
  let last_part = parts[parts.length - 1];
  if (last_part.length == 0) { // if there's a trailing slash
    last_part = parts[parts.length - 2];
  }
  return last_part;
};

pageMatch('pages/genshin/basic/asi-test', () => {
  let asi = new ASI('#AdvancedSearchInput').init({
    placeholder: 'filter results',
    active_placeholder: 'press enter to search',
    disable_error_completion: true,
    events: {
      complete: function(event) {
        console.log('complete', event, this);
        //app.forms.logsview.on_complete(this);
      },
      enter: function(event) {
      },
      validate: function(event) {

      },
      textchange: function(event) {
        console.log('textchange', event, this);
        //app.forms.logsview.on_typing(this);
      },
      tokenchange: function(event) {
        console.log('tokenchange', event, this);
        // if (event.type == 'add_value' && event.subject.label == 'in') {
        //   update_mod_suggestions.call(null, this);
        // } else if (event.type == 'delete_token' && event.subject.label == 'in') {
        //   update_mod_suggestions.call(null, this);
        // } else if (event.type == 'set_from_parse') {
        //   update_mod_suggestions.call(null, this);
        // }
        //
        // var instance = this;
        //
        // if (event.type == 'create_token' && event.subject.label == 'mod') {
        //   if (empty(app.forms.logsview.asi_instance.tokens.get('in'))) {
        //     setTimeout(function() {
        //       if (instance.tokens.active.label != 'mod') {
        //         return;
        //       }
        //       instance.helper.add_text('Select some subreddit(s) using the <code>in</code> '+
        //         'option for more suggestions.')
        //     },5);
        //   }
        // }
      }
    },
    multiple_values: false,
    tokens: {
      'in': {
        type: 'text',
        placeholder: 'subreddit',
        suggestions: [
          'aww',
          'ZenlessZoneZero',
          'Pokemon',
          'AnimalsBeingJerks'
        ],
        validate: {
          limit_to_suggestions: 'must be a subreddit you mod',
        },
        multiple_values: true,
      },
      'after': {
        type: 'datetime',
        placeholder: 'date/time',
        use_type_placeholder: true,
        allow_duplicates: false,
      },
      'before': {
        type: 'datetime',
        placeholder: 'date/time',
        use_type_placeholder: true,
        allow_duplicates: false,
      },
      'during': {
        type: 'date',
        placeholder: 'date',
        use_type_placeholder: true,
        allow_duplicates: false,
      },
      'mod': {
        type: 'text',
        placeholder: 'moderator',
        search_label: 'username',
        suggestions: ['kwwxis'],
        desc_html: frag(`
          <span class="asi-helptitle">username - allowed formats</span>
          <div class="asi-desc">
            <ul>
              <li><span>Reddit link to the user's profile page</span></li>
              <li><code>/u/username</code><span> or </span><code>u/username</code></li>
              <li><code>username</code></li>
            </ul>
          </div>
        `),
        validate: {
          match: username_regex,
          error: 'invalid username',
        },
        valuepass: username_pass,
        multiple_values: true,
      },
      'action': {
        type: 'text',
        placeholder: 'mod action',
        suggestions: [
          'ban',
          'remove',
          'spam',
          'postflair'
        ],
        validate: {
          limit_to_suggestions: true,
        },
        multiple_values: true,
        allow_strings: false,
      },
      'reason': {
        type: 'text',
        placeholder: 'mod reason',
        modifiers: {
          'includes-word': {
          },
          'includes': {
          },
          'starts-with': {
          },
          'ends-with': {
          },
          'full-exact': {
          },
          'full-text': {
          },
          'regex': {
            search_label: 'regex',
            validate: {
              check: validateRegExp,
              error: 'invalid regex',
            }
          },
          'shorter-than': {
            type: 'number:whole',
            search_label: '# of characters',
            placeholder: 'number',
            desc_html: '<b>Shorter than</b> this number of characters.',
            disable_space_completion: false,
          },
          'longer-than': {
            type: 'number:whole',
            search_label: '# of characters',
            placeholder: 'number',
            desc_html: '<b>Longer than</b> this number of characters.',
            disable_space_completion: false,
          }
        },
        desc_html: '<code>includes</code> is the default behavior if no modifier is set.<br/> \
                            These modifiers have the same functionality as AutoModerator.',
        disable_space_completion: true,
        multiple_values: false,
      },
      'author': {
        type: 'text',
        placeholder: 'post/comment author',
        search_label: 'username',
        modifiers: {
          'includes': {},
          'starts-with': {},
          'ends-with': {},
          'exact': {
            desc_html: 'Perform a case-sensitive author search, whereas without any modifiers is case-insensitive.',
          },
          'regex': {
            search_label: 'regex',
            desc_html: 'Search for usernames matching a specific regex.',
            validate: {
              check: validateRegExp,
              error: 'invalid regex',
            }
          },
          'shorter-than': {
            type: 'number:whole',
            search_label: '# of characters',
            placeholder: 'number',
            desc_html: 'Search for usernames <b>shorter than</b> this number of characters.',
            disable_space_completion: false,
          },
          'longer-than': {
            type: 'number:whole',
            search_label: '# of characters',
            placeholder: 'number',
            desc_html: 'Search for usernames <b>longer than</b> this number of characters.',
            disable_space_completion: false,
          }
        },
        desc_html: frag(`
          <span class="asi-helptitle">username - allowed formats</span>
          <div class="asi-desc">
            <ul>
              <li><span>Reddit link to the user's profile page</span></li>
              <li><code>/u/username</code><span> or </span><code>u/username</code></li>
              <li><code>username</code></li>
            </ul>
          </div>
        `),
        validate: {
          match: username_regex,
          error: 'invalid username',
        },
        valuepass: username_pass,
        multiple_values: false,
      },
      'title': {
        type: 'text',
        placeholder: 'post title',
        search_label: 'post title',
        modifiers: {
          'includes': {},
          'starts-with': {
            desc_html: "Search posts whose title <b>starts with</b> the given text",
          },
          'ends-with': {
            desc_html: "Search posts whose title <b>ends with</b> the given text",
          },
          'exact': {
            desc_html: 'Perform a case-sensitive title search, whereas without any modifiers is case-insensitive.',
          },
          'regex': {
            search_label: 'regex',
            desc_html: 'Search for titles matching a specific regex.',
            validate: {
              check: validateRegExp,
              error: 'invalid regex',
            }
          },
          'shorter-than': {
            type: 'number:whole',
            search_label: '# of characters',
            placeholder: 'number',
            desc_html: 'Search for titles <b>shorter than</b> this number of characters.',
            disable_space_completion: false,
          },
          'longer-than': {
            type: 'number:whole',
            search_label: '# of characters',
            placeholder: 'number',
            desc_html: 'Search for titles <b>longer than</b> this number of characters.',
            disable_space_completion: false,
          }
        },
        disable_space_completion: true,
        desc_html: "Search whose title <b>contains</b> the given text",
        multiple_values: false,
      },
      'body': {
        type: 'text',
        placeholder: 'post/comment body',
        search_label: 'body text',
        modifiers: {
          'includes': {},
          'starts-with': {
            desc_html: "Search comments and posts whose body <b>starts with</b> the given text",
          },
          'ends-with': {
            desc_html: "Search comments and posts whose body <b>ends with</b> the given text",
          },
          'exact': {
            desc_html: 'Perform a case-sensitive body search, whereas without any modifiers is case-insensitive.',
          },
          'regex': {
            search_label: 'regex',
            desc_html: 'Search for bodies matching a specific regex.',
            validate: {
              check: validateRegExp,
              error: 'invalid regex',
            }
          },
          'shorter-than': {
            type: 'number:whole',
            search_label: '# of characters',
            placeholder: 'number',
            desc_html: 'Search for bodies <b>shorter than</b> this number of characters.',
            disable_space_completion: false,
          },
          'longer-than': {
            type: 'number:whole',
            search_label: '# of characters',
            placeholder: 'number',
            desc_html: 'Search for bodies <b>longer than</b> this number of characters.',
            disable_space_completion: false,
          }
        },
        disable_space_completion: true,
        desc_html: "Search comments and posts whose body <b>contains</b> the given text",
        multiple_values: false,
      },
    }
  });
  (<any> window).asi = asi;
});