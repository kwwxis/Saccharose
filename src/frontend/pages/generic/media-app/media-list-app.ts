import { pageMatch } from '../../../core/pageMatch.ts';
import { SaccharoseApiEndpoint } from '../../../core/endpoints.ts';
import {
  ImageCategoryMap,
  ImageIndexSearchParams,
  ImageIndexSearchResult,
} from '../../../../shared/types/image-index-types.ts';
import { frag, frag1, isElementPartiallyInViewport } from '../../../util/domutil.ts';
import { escapeHtml } from '../../../../shared/util/stringUtil.ts';
import { isNotEmpty, toBoolean } from '../../../../shared/util/genericUtil.ts';
import { templateIcon } from '../../../util/templateIcons.ts';
import { uuidv4 } from '../../../../shared/util/uuidv4.ts';
import './media-list.styles.scss';
import { GenshinVersions, GameVersions } from '../../../../shared/types/game-versions.ts';
import { getByteSizeLabel } from './media-app-util.ts';

export function initiateMediaListPage(
  vueComponentName: string,
  mediaSearchEndpoint: SaccharoseApiEndpoint<ImageIndexSearchParams, ImageIndexSearchResult>,
  mediaCategoryEndpoint: SaccharoseApiEndpoint<{}, ImageCategoryMap>,
  siteModeHome: string,
  imagePathPrefix: string,
  enableVersionFilter: boolean,
  versionFilterInfoTooltipExtra: string,
) {
  pageMatch(`vue/${vueComponentName}`, async () => {
    const loadingEl: HTMLElement = document.querySelector('#media-list-loading');
    const appEl: HTMLElement = document.querySelector('#media-list-app');
    appEl.innerHTML = '';
    appEl.append(frag(`
    <style id="media-filter-style-element"></style>
    <div id="media-catFilter" class="content${enableVersionFilter ? '' : ' hide'}">
      <div class="valign">
        <input id="firstVersionFilter" type="text" placeholder="Versions separated by comma or semicolon"
               style="max-width: 490px;width: 100%;"/>
        <span ui-tippy="{content: 'Only filters images to the version it was first added. Does not account for modifications. ${versionFilterInfoTooltipExtra}',delay:[200, 100]}"
              class="valign spacer10-left" style="opacity: 0.5; width: 19px;">
          ${document.getElementById('template-info-icon').innerHTML}
        </span>
         <span id="firstVersionFilterErrorText" class="dispInlineBlock spacer10-left color-red" style="font-size:15px"></span>
      </div>
     </div>
    <div id="media-catList">
    </div>
  `));

    if (enableVersionFilter) {
      const filterStyleElement: HTMLStyleElement = document.querySelector('#media-filter-style-element');
      const firstVersionFilter: HTMLInputElement = document.querySelector('#firstVersionFilter');
      const firstVersionFilterErrorText: HTMLInputElement = document.querySelector('#firstVersionFilterErrorText');

      firstVersionFilter.addEventListener('change', _e => {
        const filterText = firstVersionFilter.value;
        try {
          const filter: GameVersions = GenshinVersions.fromFilterString(filterText);
          firstVersionFilterErrorText.innerText = '';
          if (filter.isEmpty()) {
            filterStyleElement.innerText = '';
          } else {
            filterStyleElement.innerText = `.media-version-filter-target { display: none; }\n` +
              filter.list.map(v => `.first-version-${v.cssFriendlyNumber()} {display:block;}`).join('\n');
          }
        } catch (errorText) {
          firstVersionFilterErrorText.innerText = String(errorText);
        }
      });
    }

    const rootCatMap: ImageCategoryMap = await mediaCategoryEndpoint.send({});
    console.log({
      appEl,
      rootCatMap
    });

    const expandoHtml: string = templateIcon('chevron-down');
    const imageLoaders: {[mediaCatId: string]: Function} = {};

    async function loadImages(mediaCatId: string, loadZoneEl: HTMLElement, catPath: string, offset: number) {
      const result = await mediaSearchEndpoint.send({ catPath: catPath, catRestrict: true, offset });
      for (let entity of result.results) {
        const firstVersionCssClass = entity.first_version
            ? ' ' + `first-version-${entity.first_version.replace(/\./g, '-')}` : '';

        loadZoneEl.append(frag1(`
        <div class="media-image media-version-filter-target${firstVersionCssClass}">
          <div class="image-frame bordered">
            <div class="image-obj">
              <img src="${imagePathPrefix}${escapeHtml(entity.image_name)}.png" />
            </div>
            <a href="${siteModeHome}/media/details/${escapeHtml(entity.image_name)}" class="image-label" target="_blank">${escapeHtml(entity.image_name)}</a>
            <span class="image-sublabel">
              <span class="image-dsize">${entity.image_width} &times; ${entity.image_height}</span>
              <span class="image-bsize">${getByteSizeLabel(entity)}</span>
            </span>
            <span class="image-toprightlabel${entity.first_version ? '' : ' hide'}">${entity.first_version}</span>
          </div>
        </div>
      `));
      }

      if (result.hasMore) {
        const loadMoreEl = frag1(`
        <div class="media-image-load-zone" data-media-cat-id="${mediaCatId}"></div>
      `);
        loadZoneEl.append(loadMoreEl);

        imageLoaders[mediaCatId] = () => {
          loadMoreEl.remove();
          loadImages(mediaCatId, loadZoneEl, catPath, result.nextOffset);
        }
      }
    }

    function makeCategoryElements(catmap: ImageCategoryMap,
                                  parentEl: HTMLElement,
                                  parentPath: string,
                                  shouldPopulateFn: (myPath: string) => boolean) {
      if (!catmap || !parentEl) {
        return;
      }
      for (let cat of Object.values(catmap.children)) {
        const myId: string = 'media-cat-' + uuidv4();
        const myPath: string = parentPath ? parentPath+'.'+cat.name : cat.name;
        const shouldPopulate: boolean = shouldPopulateFn && shouldPopulateFn(myPath);

        const el: HTMLElement = frag1(`
        <div id="${myId}" class="media-cat media-version-filter-target ${cat.newImageVersions.map(v =>
                `first-version-${v.replace(/\./g, '-')}`).join(' ')}"
             data-cat-name="${escapeHtml(cat.name)}"
             data-cat-path="${escapeHtml(myPath)}"
             data-did-populate="${shouldPopulate ? 'true' : 'false'}">
          <div class="media-cat-header valign">
            <span class="expando spacer5-right ${shouldPopulate ? 'collapse-action expanded-state' : 'expand-action collapsed-state'}"
                  ui-action="expando: #${myId} > .media-cat-content">${expandoHtml}</span>
            <div class="media-cat-title">${escapeHtml(cat.name)}</div>
          </div>
          <div class="media-cat-content ${shouldPopulate ? 'expanded' : 'collapsed hide'}">
            <div class="media-cat-children"></div>
            <div class="media-image-load-zone" data-media-cat-id="${myId}"></div>
          </div>
        </div>
        `);

        const childrenEl: HTMLElement = el.querySelector('.media-cat-children');
        const loadZoneEl: HTMLElement = el.querySelector('.media-image-load-zone');

        imageLoaders[myId] = () => loadImages(myId, loadZoneEl, myPath, 0);

        el.querySelector(":scope > .media-cat-header .expando").addEventListener('click', (_ev) => {
          if (!toBoolean(el.getAttribute('data-did-populate'))) {
            el.setAttribute('data-did-populate', 'true');
            makeCategoryElements(cat, childrenEl, myPath, null);
          }
        });

        parentEl.append(el);

        if (isNotEmpty(cat.children) && shouldPopulate) {
          makeCategoryElements(
            cat,
            childrenEl,
            myPath,
            shouldPopulateFn,
          );
        }
      }
    }

    makeCategoryElements(rootCatMap, appEl.querySelector('#media-catList'), null,myPath => {
      return myPath === 'UI' || myPath === 'spriteoutput' || myPath === 'UIResources';
    });
    loadingEl.remove();
    appEl.classList.remove('hide');

    function processImageLoading() {
      for (let loadZoneEl of Array.from(document.querySelectorAll<HTMLElement>('.media-image-load-zone:not(.loaded)'))) {
        if (loadZoneEl.closest('.hide')) {
          continue;
        }
        if (!isElementPartiallyInViewport(loadZoneEl)) {
          continue;
        }
        loadZoneEl.classList.add('loaded');

        console.log('Triggering image load for ' + loadZoneEl.getAttribute('data-media-cat-id'));

        const loader = imageLoaders[loadZoneEl.getAttribute('data-media-cat-id')];
        delete imageLoaders[loadZoneEl.getAttribute('data-media-cat-id')];
        if (loader) {
          loader();
        }
      }
    }

    window.addEventListener('scroll', () => processImageLoading());
    setInterval(() => processImageLoading(), 500);
  });
}
