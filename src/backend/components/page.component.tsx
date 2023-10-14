import React from 'react';

export default function Page(props: {content?: string}) {
  return (
    <div>
      <h1>Welcome to my app!</h1>
      <p>{props.content}</p>
    </div>
  )
}