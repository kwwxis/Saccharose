import React from 'react';
import Icon from './utility/Icon';
import { getCurrentRequest } from '../middleware/request/tracer';
import { Request } from 'express';

export default function Page(props: {content?: string, content2?: string}) {
  const req: Request = getCurrentRequest();

  console.log('Request!', req.context.inputLangCode, req.context.outputLangCode);

  return (
    <div>
      <h1>Welcome to my app!</h1>
      <p>{props.content}</p>
      {props.content2 && <p>Content 2: {props.content2}</p>}
      <Icon name="info" size={32} />
    </div>
  )
}