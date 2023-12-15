import React from 'react';
import AceComponent, { AceProps } from './AceComponent';

export default function JsonText(props: AceProps) {
  if (!props) props = {};
  props = Object.assign({}, props);
  props.extraClassNames = (props.extraClassNames ?? []).concat('json');
  return (
    <AceComponent {...props}></AceComponent>
  )
}