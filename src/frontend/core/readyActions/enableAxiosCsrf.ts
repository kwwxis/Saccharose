import axios from 'axios';

export default function() {
  const csrfElement: HTMLMetaElement = document.querySelector('meta[name="csrf-token"]');
  axios.defaults.headers.common['x-csrf-token'] = csrfElement.content;
  axios.defaults.validateStatus = (status: number) => {
    return status >= 200 && status < 400; // accept 2xx and 3xx as valid
  };
  csrfElement.remove();
}
