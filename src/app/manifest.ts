import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '9a008c3173fcca3c4def71adedd5bd3f',
    theme_color: '#000000',
    background_color: '#000000',
    display: 'standalone',
    scope: '/',
    start_url: '/',
    name: 'Open Quran',
    short_name: 'Open Quran',
    description: 'Quran streaming application',
    icons: [
      {
        src: 'images/192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'images/512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/desktop.png',
        sizes: '1919x917',
        type: 'image/png',
        // @ts-expect-error
        platform: 'wide',
        form_factor: 'wide',
        label: 'Open Quran - Desktop',
      },
      {
        src: '/screenshots/mobile.png',
        sizes: '1442x3202',
        type: 'image/png',
        // @ts-expect-error
        platform: 'narrow',
        form_factor: 'narrow',
        label: 'Open Quran - Mobile',
      },
    ],
    shortcuts: [
      {
        name: 'Contact us',

        url: '/contact',
        description: 'Contact us page',
        icons: [
          {
            src: 'shortcuts/contact.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'About us',
        url: '/about',
        description: 'About us page',
        icons: [
          {
            src: 'shortcuts/contact.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
    ],
  };
}
