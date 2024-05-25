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

export function initiateMediaListPage(
  vueComponentName: string,
  mediaSearchEndpoint: SaccharoseApiEndpoint<ImageIndexSearchParams, ImageIndexSearchResult>,
  mediaCategoryEndpoint: SaccharoseApiEndpoint<{}, ImageCategoryMap>,
  siteModeHome: string,
  imagePathPrefix: string,
) {
  pageMatch(`vue/${vueComponentName}`, async () => {
    const loadingEl: HTMLElement = document.querySelector('#media-list-loading');
    const appEl: HTMLElement = document.querySelector('#media-list-app');
    appEl.innerHTML = '';
    appEl.append(frag(`
    <div id="media-catList">
    </div>
  `))

    const rootCatMap: ImageCategoryMap = await mediaCategoryEndpoint.get({});
    console.log({
      appEl,
      rootCatMap
    });

    const expandoHtml: string = templateIcon('chevron-down');
    const imageLoaders: {[mediaCatId: string]: Function} = {};

    async function loadImages(mediaCatId: string, loadZoneEl: HTMLElement, catPath: string, offset: number) {
      const result = await mediaSearchEndpoint.get({ catPath: catPath, catRestrict: true, offset });
      for (let entity of result.results) {
        loadZoneEl.append(frag1(`
        <div class="media-image">
          <div class="image-frame bordered">
            <div class="image-obj">
              <img src="${imagePathPrefix}${escapeHtml(entity.image_name)}.png" />
            </div>
            <a href="${siteModeHome}/media/details/${escapeHtml(entity.image_name)}" class="image-label" target="_blank">${escapeHtml(entity.image_name)}</a>
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

    function makeCategoryElements(catmap: ImageCategoryMap, parentEl: HTMLElement, parentPath: string, shouldPopulateFn: (myPath: string) => boolean) {
      if (!catmap || !parentEl) {
        return;
      }
      for (let [cat, subcats] of Object.entries(catmap)) {
        const myId: string = 'media-cat-' + uuidv4();
        const myPath: string = parentPath ? parentPath+'.'+cat : cat;
        const shouldPopulate: boolean = shouldPopulateFn && shouldPopulateFn(myPath);

        const el: HTMLElement = frag1(`
        <div id="${myId}" class="media-cat" data-cat-name="${escapeHtml(cat)}" data-cat-path="${escapeHtml(myPath)}" data-did-populate="${shouldPopulate ? 'true' : 'false'}">
          <div class="media-cat-header valign">
            <span class="expando spacer5-right ${shouldPopulate ? 'collapse-action expanded-state' : 'expand-action collapsed-state'}"
                  ui-action="expando: #${myId} > .media-cat-content">${expandoHtml}</span>
            <div class="media-cat-title">${escapeHtml(cat)}</div>
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

        el.querySelector(":scope > .media-cat-header .expando").addEventListener('click', (ev) => {
          if (!toBoolean(el.getAttribute('data-did-populate'))) {
            el.setAttribute('data-did-populate', 'true');
            makeCategoryElements(subcats, childrenEl, myPath, null);
          }
        });

        parentEl.append(el);

        if (isNotEmpty(subcats) && shouldPopulate) {
          makeCategoryElements(
            subcats,
            childrenEl,
            myPath,
            shouldPopulateFn,
          );
        }
      }
    }

    makeCategoryElements(rootCatMap, appEl.querySelector('#media-catList'), null,myPath => {
      return myPath === 'UI' || myPath === 'spriteoutput';
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
