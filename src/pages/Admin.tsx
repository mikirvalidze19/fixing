/* /admin — one-click gateway for content editors.
 * Redirects to the Pages CMS editor for this repository (app.pagescms.org),
 * where staff log in with their GitHub accounts and manage products. */

import { useEffect } from 'react';

export const CMS_URL =
  'https://app.pagescms.org/mikirvalidze19/fixing/main';

export default function Admin() {
  useEffect(() => {
    window.location.replace(CMS_URL);
  }, []);
  return (
    <div style={{ margin: '4rem auto', maxWidth: 640, textAlign: 'center' }}>
      <h1>Opening the editor…</h1>
      <p>
        Taking you to the product editor. If nothing happens,{' '}
        <a href={CMS_URL}>open it here</a>.
      </p>
    </div>
  );
}
