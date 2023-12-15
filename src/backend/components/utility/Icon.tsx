import React from 'react';
import { icon } from '../../routing/viewUtilities';
import parse from 'html-react-parser';
import { FeatherAttributes } from 'feather-icons';

export default function Icon(props: {name: string, size?: number, props?: Partial<FeatherAttributes>}): React.JSX.Element {
  return parse(icon(props.name, props.size, props.props)) as React.JSX.Element;
}