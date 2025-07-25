import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '9a008c3173fcca3c4def71adedd5bd3f',
    theme_color: '#000000',
    background_color: '#000000',
    display: 'standalone',
    scope: '/',
    start_url: '/',
    name: 'Open Tarteel',
    short_name: 'Open Tarteel',
    description: 'Quran streaming application',

    dir: 'auto',
    lang: 'auto',
    orientation: 'portrait',
    launch_handler: {
      client_mode: 'auto',
    },
    handle_links: [
      {
        url: 'https://tarteel.quran.us.kg',
        action: 'navigate',
      },
    ],
    categories: ['education', 'books', 'religion'],
    prefer_related_applications: false,
    related_applications: [],

    web_apps: [
      {
        web_app_identity: 'https://tarteel.quran.us.kg/',
      },
    ],
    scope_extensions: [{ origin: 'tarteel.quran.us.kg' }],

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
        label: 'Open Tarteel - Desktop',
      },
      {
        src: '/screenshots/mobile.png',
        sizes: '1442x3202',
        type: 'image/png',
        // @ts-expect-error
        platform: 'narrow',
        form_factor: 'narrow',
        label: 'Open Tarteel - Mobile',
      },
    ],

    shortcuts: [
      {
        name: 'Contact us',
        url: '/contact',
        description: 'Contact us page',
        icons: [
          {
            src: 'images/shortcuts/contact.png',
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
            src: 'images/shortcuts/about.png',
            sizes: '96x96',
            type: 'image/png',
          },
        ],
      },
    ],
  };
}
