import React from 'react';
import classNames from 'classnames';
import { CommonLineId, stringifyCommonLineIds } from '../../../shared/types/common-types';
import { Marker } from '../../../shared/util/highlightMarker';

export type AceProps = {
  id?: string,

  gutters?: boolean,
  seamless?: boolean,
  inTemplate?: boolean,

  markers?: Marker[],
  lineIds?: CommonLineId[],

  mode?: string,
  extraClassNames?: classNames.ArgumentArray,

  value?: string,
};

export default function AceComponent(props: AceProps) {
  return (
    <textarea id={props.id} readOnly
              className={classNames('w100p', 'wikitext', 'autosize', {
                'seamless-input': props.seamless
              }, ... (props.extraClassNames || []))}
              spellCheck="false" translate="no"
              data-mode={props.mode}
              data-gutters={props.gutters ? 'true' : null}
              data-markers={props.markers ? Marker.joinedString(props.markers) : null}
              data-line-ids={props.lineIds ? stringifyCommonLineIds(props.lineIds) : null}
              data-in-template={props.inTemplate ? 'true' : null}
              value={ props.value }
    ></textarea>
  );
}