// Social + audio sources (single source of truth)
export interface Social {
  key: string;
  label: string;
  handle: string;
  url: string;
  blurb: string;
}

export const social: Social[] = [
  { key: 'instagram', label: 'Instagram', handle: '@ayematies', url: 'https://www.instagram.com/ayematies/', blurb: 'The voyage, in frames' },
  { key: 'instabts', label: 'Instagram · BTS', handle: '@ayematies.bts', url: 'https://www.instagram.com/ayematies.bts/', blurb: 'Behind the scenes' },
  { key: 'youtube', label: 'YouTube', handle: '@AyeMaties', url: 'https://www.youtube.com/@AyeMaties', blurb: 'Films & soundtrack' },
  { key: 'tiktok', label: 'TikTok', handle: '@aye.maties', url: 'https://www.tiktok.com/@aye.maties', blurb: 'Moments from the sea' },
  { key: 'facebook', label: 'Facebook', handle: 'Aye Maties', url: 'https://www.facebook.com/profile.php?id=61576482268567', blurb: 'Join the crew' },
];

export const soundcloudUrl = 'https://soundcloud.com/ayematies';
export const contactEmail = 'AyeMaties@gmail.com';
