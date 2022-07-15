
waitForConstant('app', app => {
  function objectEquals(x, y) {
    if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
    // after this just checking type of one would be enough
    if (x.constructor !== y.constructor) { return false; }
    // if they are functions, they should exactly refer to same one (because of closures)
    if (x instanceof Function) { return x === y; }
    // if they are regexps, they should exactly refer to same one (it is hard to better equality check on current ES)
    if (x instanceof RegExp) { return x === y; }
    if (x === y || x.valueOf() === y.valueOf()) { return true; }
    if (Array.isArray(x) && x.length !== y.length) { return false; }

    // if they are dates, they must had equal valueOf
    if (x instanceof Date) { return false; }

    // if they are strictly equal, they both need to be object at least
    if (!(x instanceof Object)) { return false; }
    if (!(y instanceof Object)) { return false; }

    // recursive object equality check
    var p = Object.keys(x);
    return Object.keys(y).every(function (i) { return p.indexOf(i) !== -1; }) &&
        p.every(function (i) { return objectEquals(x[i], y[i]); });
  }

  const ctrl = {
    pack: {
      all: function(constraint = undefined) {
        let res = Array.from(document.querySelectorAll('.antispam-setting')).map(el => ctrl.pack.single(el));
        if (constraint && Array.isArray(constraint)) {
          res = res.filter(setting => constraint.includes(setting.id));
        }
        return res;
      },
      onlyDirty: function() {
        let res = Array.from(document.querySelectorAll('.antispam-setting')).map(el => {
          let payload = ctrl.pack.single(el);
          let initial = JSON.parse(el.getAttribute('data-initial-pack'));

          if (initial.server_id)
            delete initial.server_id;

          if (objectEquals(initial, payload)) {
            return null;
          }

          return payload;
        }).filter(x => !!x);

        return res;
      },
      /** @param {Element} settingEl an element with `antispam-setting` CSS class */
      single: function(settingEl, useInitialPack) {
        if (!settingEl.classList.contains('antispam-setting')) return null;
        if (useInitialPack) return JSON.parse(settingEl.getAttribute('data-initial-pack'));

        let data = JSON.parse(settingEl.getAttribute('data-meta'));

        data.rule_id = parseInt(settingEl.querySelector('[name="rule_id"]').value);

        if (settingEl.querySelector('[name="service_value"]')) {
          data.service_value = parseInt(settingEl.querySelector('[name="service_value"]').value);
          if (isNaN(data.service_value))
            data.service_value = null;
        } else {
          data.service_value = null;
        }

        function addMultiInputField(fieldName) {
          let fieldEl = settingEl.querySelector(`.MultiInput[data-name="${esc(fieldName + '[]')}"]`);
          if (fieldEl && fieldEl.multi_input) {
            data[fieldName] = fieldEl.multi_input.values.filter(v => typeof v === 'string' ? v.length : (typeof v !== 'undefined'));
          } else {
            data[fieldName] = null;
          }
          if (data[fieldName] && !data[fieldName].length) {
            data[fieldName] = null;
          }
        }

        addMultiInputField('service_match_text');
        addMultiInputField('service_match_ids');
        addMultiInputField('channel_ids');
        addMultiInputField('user_ids');

        return data;
      }
    },
    ui: {
      appendNewRule(serviceId, ruleHtml) {
        let container = document.querySelector('.antispam-service[data-service-id="'+serviceId+'"] .antispam-service-settings');
        let tmp = document.createElement('DIV');
        tmp.innerHTML = ruleHtml;

        let settingEl = tmp.children[0];
        container.append(settingEl);
        app.startListeners(ctrl.mainListeners, container);
        settingEl.querySelector(app.getFocusableSelector()).focus();
      },
      /**
       * @param {Element} settingEl
       */
      refresh: function(settingEl, useInitialPack=false) {
        if (!settingEl) {
          return;
        } else if (!settingEl.classList.contains('antispam-setting')) {
          settingEl.querySelectorAll('.antispam-setting').forEach(x => ctrl.ui.refresh(x));
          return;
        } else {
          const payload = ctrl.pack.single(settingEl, useInitialPack);
          const { summary, unusedFields, usedFields } = ctrl.ui.summarize(payload);
          const summaryContentEl = settingEl.querySelector('.antispam-summary-content');
          summaryContentEl.innerHTML = '';
          summaryContentEl.append(summary);

          let previousRuleId = parseInt(settingEl.getAttribute('data-rule-id'));

          settingEl.setAttribute('data-rule-id', payload.rule_id);
          settingEl.setAttribute('style', 'order:' + payload.rule_id);

          unusedFields.forEach(fieldName => {
            settingEl.classList.remove('used--' + fieldName);
            settingEl.classList.add('unused--' + fieldName);
          });
          usedFields.forEach(fieldName => {
            settingEl.classList.remove('unused--' + fieldName);
            settingEl.classList.add('used--' + fieldName);
          });

          if (previousRuleId != payload.rule_id) {
            settingEl.querySelector(app.getFocusableSelector()).focus();
          }
        }
      },
      strongWrap: function(text, cls=null) {
        const el = document.createElement('STRONG');
        el.innerHTML = text;
        if (cls && typeof cls === 'string') el.classList.add(cls);
        if (cls && Array.isArray(cls)) el.classList.add(... cls);
        return el;
      },
      joinList: function(label, list) {
        let html = '(none specified)';

        if (list) {
          html = '<ul class="antispam-summary-list">' + list.map(x => String(x).trim())
          .filter(x => x.length)
          .map(x => '<li>'+ esc(x) + '</li>').join('')
          + '</ul>';
        }

        let el = document.createElement('STRONG');
        el.classList.add('antispam-summary-list-label');
        el.innerHTML = label;
        el.setAttribute('ui-tippy-hover', `{
          content: '${html}',
          delay: [100,100],
          placement: 'bottom',
          flipBehavior: ['bottom', 'top'],
          maxWidth: 'none',
          theme: 'light-border',
        }`);

        el.addEventListener('mouseleave', event => app.hideTippy(el));
        return el;
      },
      /**
       * @param {Object} setting a packed setting, get from ctrl.pack.single() function
       */
      summarize: function(setting) {
        if (!setting) return null;

        let usedFields = ['service_match_ids', 'service_match_text', 'service_value', 'channel_ids', 'user_ids'];
        let unusedFields = [];

        let channels = this.joinList('these channels', setting.channel_ids);
        let specifics = '';
        let specificsCol = '';
        let constraint = '';

        let thing = '';
        switch (setting.service_id) {
          case 1: thing = this.strongWrap('Discord Invites');
            specifics = this.joinList('these servers', setting.service_match_ids);
            specificsCol = 'service_match_ids';
            unusedFields.push('service_match_text', 'service_value');
            break;
          default:
            throw new Error('Invalid argument to antispam summarizer', setting);
        }

        let BLOCK = this.strongWrap('Block', 'block-rule-label');
        let ALLOW = this.strongWrap('Allow', 'allow-rule-label');

        let summary = [];
        switch (setting.rule_id) {
          case 1: summary = [BLOCK, `all`, thing];
            constraint = 'everywhere';
            unusedFields.push('channel_ids', specificsCol, 'user_ids');
            break;
          case 2: summary = [ALLOW, `all`, thing];
            constraint = 'everywhere';
            unusedFields.push('channel_ids', specificsCol);
            break;
          case 3: summary = [BLOCK, `all`, thing, `only in`, channels];
            unusedFields.push(specificsCol);
            break;
          case 4: summary = [ALLOW, `all`, thing, `only in`, channels];
            unusedFields.push(specificsCol);
            break;

          case 5: summary = [ALLOW, `some`, thing, `for`, specifics, ` only in`, channels];
            break;
          case 6: summary = [BLOCK, `some`, thing, `for`, specifics, ` only in`, channels];
            break;
          case 7: summary = [ALLOW, `some`, thing, `for`, specifics];
            constraint = 'everywhere';
            unusedFields.push('channel_ids');
            break;
          case 8: summary = [BLOCK, `some`, thing, `for`, specifics];
            constraint = 'everywhere';
            unusedFields.push('channel_ids');
            break;
        }

        if (setting.user_ids) {
          summary.push('for', this.joinList('these users', setting.user_ids));
        } else {
          summary.push(constraint);
        }

        let fragment = document.createDocumentFragment();

        summary.forEach(part => fragment.append(part));

        return {
          summary: fragment,
          unusedFields,
          usedFields: usedFields.filter(f => !unusedFields.includes(f)),
        };
      }
    },
    modals: {
      openExportRulesModal: function() {
        app.dialog.open(`
          <h2 class="spacer-bottom">Export Wizard</h2>
          <p class="info-notice spacer-bottom">Choose rules to export. Leave unchanged to export all.</p>
          <ul class="checklist"></ul>
          <hr class="spacer-top">
          <div class="buttons spacer-top">
            <button class="primary download-button">Download</button>
            <p class="error-notice hide">Must select at least one rule to export.</p>
          </div>
        `, app.DIALOG_MODAL, {
          custom_class: 'antispam-export-dialog',
          blocking: true,
          callback() {
            const dialogEl = this;

            const myTree = new Tree(dialogEl.querySelector('.checklist'), {
              data: Array.from(document.querySelectorAll('.antispam-service')).map(service => {
                return {
                  checked: null,
                  customLabelClass: 'ui-checkbox',
                  text: service.getAttribute('data-service-name'),
                  children: Array.from(service.querySelectorAll('.antispam-setting')).map(setting => {
                    return {
                      value: 'rule-'+setting.getAttribute('data-setting-id'),
                      html: ctrl.ui.summarize(ctrl.pack.single(setting)).summary,
                      checked: true,
                      customLabelClass: 'ui-checkbox',
                      customSpanClass: 'antispam-summary-content',
                    };
                  }),
                }
              }),
              cbTogglerVisit(li, ul, toggler) {
                if (toggler.classList.contains('is--open')) {
                  toggler.innerHTML = document.getElementById('tmpl-chevron-down').innerHTML;
                  toggler.setAttribute('aria-label', 'collapse tree items');
                } else {
                  toggler.innerHTML = document.getElementById('tmpl-chevron-right').innerHTML;
                  toggler.setAttribute('aria-label', 'uncollapse tree items');
                }
              },
              cbChanged() {
                if (!this.values.length) {
                  dialogEl.querySelector('.download-button').disabled = true;
                  dialogEl.querySelector('.error-notice').classList.remove('hide');
                } else {
                  dialogEl.querySelector('.download-button').disabled = false;
                  dialogEl.querySelector('.error-notice').classList.add('hide');
                }
              },
            });

            app.startListeners([
              {
                el: '.download-button',
                ev: 'click',
                fn: function() {
                  const constraint = myTree.values.map(v => parseInt(v.split('-')[1]));

                  if (!constraint.length) {
                    return;
                  }

                  const exportObj = ctrl.pack.all(constraint);
                  const exportName = `s${app.context.serverId}_${app.context.serviceName}_rules.json`;
                  app.downloadObjectAsJson(exportObj, exportName, 2);
                  app.dialog.close();
                }
              }
            ], this);
          }
        });
      },
      openAddRuleModal: function(serviceId) {
        const serviceName = document.querySelector(`.antispam-service[data-service-id="${serviceId}"]`).getAttribute('data-service-name');
        app.dialog.open(`
          <h2 class="spacer-bottom">Add New Rule to ${serviceName} Service</h2>
          <div class="antispam-add-rule-form">
            <div class="loading"></div>
          </div>
          <div class="buttons spacer-top">
            <button class="primary antispam-submit-rule-button">Add</button>
            <p class="error-notice hide">Must select at least one rule to export.</p>
          </div>
        `, app.DIALOG_MODAL, {
          custom_class: 'antispam-add-rule-modal',
          blocking: true,
          callback() {
            const self = this;

            app.datapulls.getAntiSpamSettingTemplate(serviceId).then(html => {
              const headerHtml = `<div class="card content"><p class="info-notice">Change the Rule Type to get started.</p></div>`;
              self.querySelector('.antispam-add-rule-form').innerHTML = headerHtml + html;
              app.startListeners(ctrl.mainListeners, self);
              app.loadWidgets();
              ctrl.ui.refresh(self.querySelector('.antispam-add-rule-form .antispam-setting'));

              let button = self.querySelector('.antispam-submit-rule-button');

              button.addEventListener('click', function() {
                let settingEl = self.querySelector('.antispam-add-rule-form .antispam-setting');
                let payload = ctrl.pack.single(settingEl);
                console.log('payload:', payload);

                button.setAttribute('disabled', 'disabled');

                app.datapulls.createAntiSpamSetting(payload)
                  .then(id => {
                    return app.datapulls.getAntiSpamSettingAsHTML(id);
                  })
                  .then(html => {
                    if (html) {
                      ctrl.ui.appendNewRule(serviceId, html);
                    }
                    app.dialog.close();
                  })
                  .finally(() => {
                    button.removeAttribute('disabled');
                  });
              });
            });
          }
        });
      }
    },
    mainListeners: [
      {
        ev: 'ready',
        fn: function() {
          waitForConstant('MultiInput', MultiInput => {
            document.querySelectorAll('.antispam-setting').forEach(settingEl => {
              if (!settingEl.classList.contains('needs-init')) {
                return;
              } else {
                settingEl.classList.remove('needs-init');
              }

              settingEl.querySelectorAll('.multi-input').forEach(element => {
                new MultiInput(element, {
                  afterClassNames(classNames, lang) {
                    classNames.item_create.push('primary', 'primary--2');
                    lang.item_remove_text = '<span class="close small"></span>';
                  }
                }).on('item-removed', () => {
                  ctrl.ui.refresh(settingEl);
                }).on('item-created', () => {
                  ctrl.ui.refresh(settingEl);
                }).on('item-value-changed', () => {
                  ctrl.ui.refresh(settingEl);
                });
              });

              settingEl.querySelector('select[name=rule_id]').addEventListener('input', () => {
                ctrl.ui.refresh(settingEl);
              });

              settingEl.querySelector('input[name=service_value]').addEventListener('input', () => {
                ctrl.ui.refresh(settingEl);
              });

              settingEl.querySelector('.antispam-delete-setting-button').addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this setting?')) {
                  let id = settingEl.getAttribute('data-setting-id');
                  app.datapulls.deleteAntiSpamSetting(id)
                    .then(() => {
                      settingEl.remove();
                      app.toaster.success({content: 'Successfully deleted setting (id: '+id+')'});
                    });
                }
              });

              ctrl.ui.refresh(settingEl, true);
            });
          });
        }
      }
    ]
  };
  app.startListeners([
    {
      el: '.antispam-export-button',
      ev: 'click',
      fn: function(event, target) {
        ctrl.modals.openExportRulesModal();
      }
    },
    {
      el: '.antispam-add-rule-button',
      ev: 'click',
      fn: function(event, target) {
        ctrl.modals.openAddRuleModal(
          parseInt(target.closest('.antispam-service').getAttribute('data-service-id'))
        );
      }
    },
    {
      el: '.antispam-save-all-button',
      ev: 'click',
      fn: function(event, target) {
        let payloads = ctrl.pack.onlyDirty();
        console.log(payloads);

        if (!payloads.length) {
          app.toaster.info({content: 'No changes to save.'});
          return;
        }

        payloads.forEach(payload => {
          app.datapulls.updateAntiSpamSetting(payload.id, payload)
            .then(() => {
              app.toaster.success({content: 'Successfully saved setting (id: '+payload.id+')'});
              document.querySelector('.antispam-setting[data-setting-id="'+payload.id+'"]')
                .setAttribute('data-initial-pack', JSON.stringify(payload));
            });
        });
      }
    }
  ]);

  app.startListeners(ctrl.mainListeners);
});