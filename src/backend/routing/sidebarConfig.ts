import { SiteSidebar } from '../../shared/types/site/site-sidebar-types.ts';
import { SITE_TITLE } from '../loadenv.ts';

export const SIDEBAR_CONFIG: { [siteMode: string]: SiteSidebar } = {
  genshin: {
    id: 'genshinImpactMenu',
    header: {
      icon: '/images/site/logo/Sucrose.webp',
      name: 'Genshin Impact',
    },
    sections: [
      {
        id: 'basic-tools',
        name: 'Basic Tools',
        content: [
          {
            id: 'basic-tools-content',
            items: [
              { id: 'textmap-search', name: 'Textmap Search', link: '/genshin/textmap',  bodyClass: 'page--textmap' },
              { id: 'ol-generator', name: 'OL Generator', link: '/genshin/OL', bodyClass: 'page--OL' },
              { id: 'changelog', name: 'Changelog', link: '/genshin/changelog', bodyClass: 'page--changelog' },
            ]
          }
        ]
      },
      {
        id: 'generic-data-tools',
        name: 'Generic Data Tools',
        content: [
          {
            id: 'excel-data',
            name: 'Excel Data',
            items: [
              { id: 'excel-usages', name: 'Excel Usages', link: '/genshin/excel-usages', bodyClass: 'page--excel-usages' },
              { id: 'excel-viewer', name: 'Excel Viewer', link: '/genshin/excel-viewer', bodyClass: 'page--excel-viewer' },
            ]
          },
          {
            id: 'media-data',
            name: 'Media Data',
            items: [
              { id: 'media', name: 'Media', link: '/genshin/media', bodyClass: 'page--media' },
            ]
          },
          {
            id: 'wiki-data',
            name: 'Wiki Data',
            items: [
              { id: 'wiki-revs', name: 'Wiki Revisions', link: '/genshin/revs', bodyClass: 'page--revs' },
            ]
          }
        ]
      },
      {
        id: 'quests-and-dialogue',
        name: 'Quests &amp; Dialogue',
        content: [
          {
            id: 'dialogue-generators',
            name: 'Excel Data',
            items: [
              { id: 'quests', name: 'Quest Dialogue', link: '/genshin/quests', bodyClass: 'page--quests' },
              { id: 'branch-dialogue', name: 'Single Branch Dialogue', link: '/genshin/branch-dialogue', bodyClass: 'page--branch-dialogue' },
              { id: 'npc-dialogue', name: 'NPC Dialogue', link: '/genshin/npc-dialogue', bodyClass: 'page--npc-dialogue' },
              { id: 'reminders', name: 'Reminder Dialogue', link: '/genshin/reminders', bodyClass: 'page--reminders' },
              { id: 'vo-to-dialogue', name: 'VO File to Dialogue', link: '/genshin/vo-to-dialogue', bodyClass: 'page--vo-to-dialogue' },
            ]
          },
          {
            id: 'qd-lists',
            name: 'Lists',
            items: [
              { id: 'chapters', name: 'Chapters', link: '/genshin/chapters', bodyClass: 'page--chapters' },
              { id: 'all-reminders', name: 'All Reminder Dialogue', link: '/genshin/reminders/all', bodyClass: 'page--all-reminders' },
            ]
          }
        ]
      },
      {
        id: 'items-and-archive',
        name: 'Items &amp; Archive',
        content: [
          {
            id: 'items-group',
            name: 'Items',
            items: [
              { id: 'items', name: 'Items', link: '/genshin/items', bodyClass: 'page--items' },
              { id: 'weapons', name: 'Weapons', link: '/genshin/weapons', bodyClass: 'page--weapons' },
            ]
          },
          {
            id: 'general-archive',
            name: 'General Archive',
            items: [
              { id: 'achievements', name: 'Achievements', link: '/genshin/achievements', bodyClass: 'page--achievements', rightSideButton: { name: 'Search', link: '/genshin/achievements/search' } },
              { id: 'loading-tips', name: 'Loading Tips', link: '/genshin/loading-tips', bodyClass: 'page--loading-tips' },
              { id: 'tutorials', name: 'Tutorials', link: '/genshin/tutorials', bodyClass: 'page--tutorials', rightSideButton: { name: 'Search', link: '/genshin/tutorials/search' } },
              { id: 'viewpoints', name: 'Viewpoints', link: '/genshin/viewpoints', bodyClass: 'page--viewpoints' },
            ]
          },
          {
            id: 'living-beings',
            name: 'Living Beings',
            items: [
              { id: 'enemies', name: 'Enemies', link: '/genshin/enemies', bodyClass: 'page--enemies' },
              { id: 'wildlife', name: 'Wildlife', link: '/genshin/wildlife', bodyClass: 'page--wildlife' },
              { id: 'non-codex-enemies', name: 'Non-Codex', link: '/genshin/enemies/non-codex', bodyClass: 'page--non-codex-enemies' },
            ]
          },
          {
            id: 'readables',
            name: 'Readables',
            items: [
              { id: 'readables-search', name: 'Search Readables', link: '/genshin/readables/search', bodyClass: 'page--readables-search' },
              { id: 'readables-all', name: 'All Readables', link: '/genshin/readables', bodyClass: 'page--readables' },
            ]
          },
          {
            id: 'serenitea-pot',
            name: 'Serenitea Pot',
            items: [
              { id: 'furniture', name: 'Furnishings', link: '/genshin/furnishings', bodyClass: 'page--furniture' },
              { id: 'furniture-set', name: 'Furnishing Sets', link: '/genshin/furnishing-sets', bodyClass: 'page--furniture-set' },
            ]
          }
        ]
      },
      {
        id: 'character-info',
        name: 'Character Info',
        content: [
          {
            id: 'character-info-content',
            items: [
              { id: 'character-stories', name: 'Character Stories', link: '/genshin/character/stories', bodyClass: 'page--character-stories' },
              { id: 'serenitea-pot-dialogue', name: 'Serenitea Pot Dialogue', link: '/genshin/character/companion-dialogue', bodyClass: 'page--companion-dialogue' },
              { id: 'vo-tool', name: 'Character VO Tool', link: '/genshin/character/VO', bodyClass: 'page--vo-tool' },
            ]
          }
        ]
      },
      {
        id: 'tcg',
        name: 'Genius Invokation TCG',
        content: [
          {
            id: 'tcg-main-data',
            name: 'Main Data',
            items: [
              { id: 'tcg-cards', name: 'TCG Cards', link: '/genshin/TCG/cards', bodyClass: 'page--tcg-card' },
              { id: 'tcg-stages', name: 'TCG Stages', link: '/genshin/TCG/stages', bodyClass: 'page--tcg-stage', rightSideButton: {
                  name: 'Search',
                  link: '/genshin/TCG/stages/search'
                } },
            ]
          },
          {
            id: 'tcg-other-data',
            name: 'Other Data',
            items: [
              { id: 'tcg-rules', name: 'TCG Rules', link: '/genshin/TCG/rules', bodyClass: 'page--tcg-rules' },
              { id: 'tcg-tutorial-text', name: 'TCG Tutorial Text', link: '/genshin/TCG/tutorial-text', bodyClass: 'page--tcg-tutorial-text' },
            ]
          }
        ]
      },
    ]
  },
  hsr: {
    id: 'starRailMenu',
    header: {
      icon: '/images/site/logo/March_7th_Sticker_1.webp',
      name: 'Honkai Star Rail',
    },
    sections: [
      {
        id: 'basic-tools',
        name: 'Basic Tools',
        content: [
          {
            id: 'basic-tools-content',
            items: [
              { id: 'textmap-search', name: 'Textmap Search', link: '/hsr/textmap',  bodyClass: 'page--textmap' },
              { id: 'ol-generator', name: 'OL Generator', link: '/hsr/OL', bodyClass: 'page--OL' },
            ]
          }
        ]
      },
      {
        id: 'generic-data-tools',
        name: 'Generic Data Tools',
        content: [
          {
            id: 'excel-data',
            name: 'Excel Data',
            items: [
              { id: 'excel-usages', name: 'Excel Usages', link: '/hsr/excel-usages', bodyClass: 'page--excel-usages' },
              { id: 'excel-viewer', name: 'Excel Viewer', link: '/hsr/excel-viewer', bodyClass: 'page--excel-viewer' },
            ]
          },
          {
            id: 'media-data',
            name: 'Media Data',
            items: [
              { id: 'media', name: 'Media', link: '/hsr/media', bodyClass: 'page--media' },
            ]
          },
          {
            id: 'wiki-data',
            name: 'Wiki Data',
            items: [
              { id: 'wiki-revs', name: 'Wiki Revisions', link: '/hsr/revs', bodyClass: 'page--revs' },
            ]
          }
        ]
      },
      {
        id: 'misc-tools',
        name: 'Misc Tools',
        content: [
          {
            id: 'misc-tools-content',
            items: [
              { id: 'loading-tips', name: 'Loading Tips', link: '/hsr/loading-tips',  bodyClass: 'page--loading-tips' },
              { id: 'vo-tool', name: 'VO Tool', link: '/hsr/character/VO', bodyClass: 'page--vo-tool' },
            ]
          }
        ]
      }
    ]
  },
  zenless: {
    id: 'zenlessMenu',
    header: {
      icon: '/images/site/logo/Belle.webp',
      iconExtraStyle: 'border-radius:50%',
      name: 'Zenless Zone Zero',
    },
    sections: [
      {
        id: 'basic-tools',
        name: 'Basic Tools',
        content: [
          {
            id: 'basic-tools-content',
            items: [
              { id: 'textmap-search', name: 'Textmap Search', link: '/zenless/textmap',  bodyClass: 'page--textmap' },
              { id: 'ol-generator', name: 'OL Generator', link: '/zenless/OL', bodyClass: 'page--OL' },
              { id: 'dialogue-helper', name: 'Dialogue Helper', link: '/zenless/dialogue-helper', bodyClass: 'page--dialogue-helper' },
              { id: 'changelog', name: 'Changelog', link: '/zenless/changelog', bodyClass: 'page--changelog' },
            ]
          }
        ]
      },
      {
        id: 'generic-data-tools',
        name: 'Generic Data Tools',
        content: [
          {
            id: 'excel-data',
            name: 'Excel Data',
            items: [
              { id: 'excel-usages', name: 'Excel Usages', link: '/zenless/excel-usages', bodyClass: 'page--excel-usages' },
              { id: 'excel-viewer', name: 'Excel Viewer', link: '/zenless/excel-viewer', bodyClass: 'page--excel-viewer' },
            ]
          },
          // {
          //   id: 'media-data',
          //   name: 'Media Data',
          //   items: [
          //     { id: 'media', name: 'Media', link: '/zenless/media', bodyClass: 'page--media' },
          //   ]
          // },
          {
            id: 'wiki-data',
            name: 'Wiki Data',
            items: [
              { id: 'wiki-revs', name: 'Wiki Revisions', link: '/zenless/revs', bodyClass: 'page--revs' },
            ]
          }
        ]
      },
    ]
  },
  wuwa: {
    id: 'wuwaMenu',
    header: {
      icon: '/images/site/logo/Yangyang.webp',
      iconExtraStyle: 'border-radius:50%',
      name: 'Wuthering Waves',
    },
    sections: [
      {
        id: 'basic-tools',
        name: 'Basic Tools',
        content: [
          {
            id: 'basic-tools-content',
            items: [
              { id: 'textmap-search', name: 'Textmap Search', link: '/wuwa/textmap',  bodyClass: 'page--textmap' },
              { id: 'ol-generator', name: 'OL Generator', link: '/wuwa/OL', bodyClass: 'page--OL' }
            ]
          }
        ]
      },
      {
        id: 'generic-data-tools',
        name: 'Generic Data Tools',
        content: [
          {
            id: 'excel-data',
            name: 'Excel Data',
            items: [
              { id: 'excel-usages', name: 'Excel Usages', link: '/wuwa/excel-usages', bodyClass: 'page--excel-usages' },
              { id: 'excel-viewer', name: 'Excel Viewer', link: '/wuwa/excel-viewer', bodyClass: 'page--excel-viewer' },
            ]
          },
          {
            id: 'media-data',
            name: 'Media Data',
            items: [
              { id: 'media', name: 'Media', link: '/wuwa/media', bodyClass: 'page--media' },
            ]
          },
          {
            id: 'wiki-data',
            name: 'Wiki Data',
            items: [
              { id: 'wiki-revs', name: 'Wiki Revisions', link: '/wuwa/revs', bodyClass: 'page--revs' },
            ]
          }
        ]
      },
      {
        id: 'resonator-tools',
        name: 'Resonators',
        content: [
          {
            id: 'resonator-tools-content',
            items: [
              { id: 'resonator-vo', name: 'Resonator VO', link: '/wuwa/resonator/VO', bodyClass: 'page--vo-tool' },
            ]
          },
        ]
      },
    ]
  },
  unset: {
    id: 'unsetMenu',
    header: {
      name: SITE_TITLE,
    },
    sections: [
      {
        id: 'site-modes',
        name: 'Site Modes',
        content: [
          {
            id: 'site-modes-content',
            items: [
              { id: 'genshin-mode', name: 'Genshin Impact', link: '/genshin' },
              { id: 'hsr-mode', name: 'Honkai Star Rail', link: '/hsr' },
              { id: 'zenless-mode', name: 'Zenless Zone Zero', link: '/zenless' },
              { id: 'wuwa-mode', name: 'Wuthering Waves', link: '/wuwa' },
            ]
          }
        ]
      },
      {
        id: 'site-meta',
        name: 'Site Meta',
        content: [
          {
            id: 'site-meta-content',
            items: [
              { id: 'site-notices', name: 'Site Notices', link: '/notices', bodyClass: 'page--notices' },
              { id: 'user-settings', name: 'User Settings', link: '/settings', bodyClass: 'page--settings' },
              { id: 'terms', name: 'Terms of Service', link: '/terms', bodyClass: 'page--terms' },
              { id: 'privacy', name: 'Privacy Policy', link: '/privacy', bodyClass: 'page--privacy' },
              { id: 'contact', name: 'Contact', link: '/contact', bodyClass: 'page--contact' },
            ]
          }
        ]
      }
    ]
  }
};
