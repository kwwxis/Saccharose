import { create, Router } from '../../../util/router';
import BasicResources from './BasicResources';

export default function(router: Router): void {
  router.use('/zenless', BasicResources);
}