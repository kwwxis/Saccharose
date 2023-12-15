import React from 'react';
import AceComponent, { AceProps } from './AceComponent';

export default function Wikitext(props: AceProps) {
  if (!props) props = {};
  props = Object.assign({}, props);
  props.extraClassNames = (props.extraClassNames ?? []).concat('wikitext');
  return (
    <AceComponent {...props}></AceComponent>
  )
}