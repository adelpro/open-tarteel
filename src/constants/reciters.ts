import { MagnetlinkSource, Reciter, Riwaya } from '@/types';
import { clientConfig } from '@/utils'; // Import clientConfig

export const RECITERS: Reciter[] = [
  {
    id: 1,
    name: 'سعد الغامدي',
    riwaya: Riwaya.Hafs,
    magnet: `magnet:?xt=urn:btih:5e0becf35d91ea4602f04db90d74621a172aa396&dn=Saad_Alghamdi&tr=${clientConfig.TRACKER_ONE_URL}&tr=${clientConfig.TRACKER_TWO_URL}`,
    complet: true,
    source: MagnetlinkSource.MP3QURAN,
  },
  {
    id: 2,
    name: 'أحمد العجمي',
    riwaya: Riwaya.Hafs,
    magnet: `magnet:?xt=urn:btih:f34936b46c18b3ff2a7eb42d1f2c30d4b8f02b03&dn=Ahmed_Alajmi&tr=${clientConfig.TRACKER_ONE_URL}&tr=${clientConfig.TRACKER_TWO_URL}`,
    complet: true,
    source: MagnetlinkSource.MP3QURAN,
  },
  {
    id: 3,
    name: 'عبد الباسط عبد الصمد',
    riwaya: Riwaya.Hafs,
    magnet:
      'magnet:?xt=urn:btih:331e7486de1a8c634f4e1e5c78906e015187a76d&dn=Abdulbasit_Abdulsamad_Mojawwad&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.MP3QURAN,
  },
  {
    id: 4,
    name: 'محمود خليل الحصري',
    riwaya: Riwaya.Warsh,
    magnet:
      'magnet:?xt=urn:btih:87c83e0b4432d70565e2dbc4e20988285778e189&dn=Mahmoud_Khalil_Al-Hussary_%28warsh%29&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.MP3QURAN,
  },
  {
    id: 5,
    name: 'عبد الرحمن السديس',
    riwaya: Riwaya.Hafs,
    magnet:
      'magnet:?xt=urn:btih:eb11251ff351a202a72f2959fae7e3a4183a6fb9&dn=AbdulRahman_Al-Sudais&tr=http://ibnradman.com/announce&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.ISLAMHOUSE,
  },
  {
    id: 6,
    name: 'ماهر المعيقلي',
    riwaya: Riwaya.Hafs,
    magnet:
      'magnet:?xt=urn:btih:465aa4a5cc2dafe86cd616f1dc9e94b1dce36496&dn=Maher_Al-Muaiqly&tr=https://torrent.islamhouse.com/announce&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.ISLAMHOUSE,
  },
  {
    id: 7,
    name: 'عبد الباسط عبد الصمد',
    riwaya: Riwaya.Warsh,
    magnet:
      'magnet:?xt=urn:btih:110eedff1111d5028bfb853dd13ca903cffd4d10&dn=Abdulbasit_Abdussamad_Warsh_an_Nafi&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.MP3QURAN,
  },
  {
    id: 9,
    name: 'أبو بكر الشاطري',
    riwaya: Riwaya.Warsh,
    magnet:
      'magnet:?xt=urn:btih:47db7a2155fef5797c046105aaa6eb16be47a7ed&dn=Shaik_Abu_Baker_Shatri&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.MP3QURAN,
  },
  {
    id: 11,
    name: 'خالد الجليل',
    riwaya: Riwaya.Hafs,
    magnet:
      'magnet:?xt=urn:btih:65495a38fa9b277fc7fde00d5df94ddd4f0b332b&dn=Khalid_Aljleel_Update2&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.MP3QURAN,
  },
  {
    id: 13,
    name: 'مشاري رشيد العفاسي',
    riwaya: Riwaya.Hafs,
    magnet:
      'magnet:?xt=urn:btih:823CE8332E2BD3D555B5C35FC12BAB50A6976481&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg&dn=%5BBitsearch.to%5D%20The%20Holy%20Quran%20MP3%20recited%20by%20Mishary%20Rashid%20Al%20Afasy',
    complet: true,
    source: MagnetlinkSource.UNKNOWN,
  },
  {
    id: 14,
    name: 'وديع اليمني',
    riwaya: Riwaya.Hafs,
    magnet:
      'magnet:?xt=urn:btih:a1aa760b189e998e79db10494aceeed65366de34&dn=Wadih_Al_Yamani&tr=http://bt1.archive.org:6969/announce&tr=http://bt2.archive.org:6969/announce&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.INTERNETARCHIVE,
  },
  {
    id: 15,
    name: 'ياسين الجزائري',
    riwaya: Riwaya.Warsh,
    magnet:
      'magnet:?xt=urn:btih:012101c66ee42d7c5905ab910e2b129335f4f30d&dn=Yassine_El_Jazairi_Warsh&tr=https://torrent.islamhouse.com/announce&tr=wss://tracker.btorrent.xyz&tr=wss://tracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.ISLAMHOUSE,
  },
  {
    id: 16,
    name: 'ياسر الدوسري',
    riwaya: Riwaya.Hafs,
    magnet:
      'magnet:?xt=urn:btih:f5fb5572e70163e72b1fb6add43da32da60dd97f&dn=Yasser_Aldosari&tr=https%3A%2F%2Ftorrent.mp3quran.net%2Fannounce.php&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.MP3QURAN,
  },
  {
    id: 17,
    name: 'هزاع البلوشي',
    riwaya: Riwaya.Hafs,
    magnet:
      'magnet:?xt=urn:btih:98e5196da5665c10eab1f7d951cd1fc840cd73b6&dn=Quran-Huzza-Al_Baloushi&tr=http%3A%2F%2Fbt1.archive.org%3A6969%2Fannounce&tr=http%3A%2F%2Fbt2.archive.org%3A6969%2Fannounce&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Farchive.org%2Fdownload%2F&ws=http%3A%2F%2Fia601208.us.archive.org%2F33%2Fitems%2F&ws=%2F33%2Fitems%2F',
    complet: true,
    source: MagnetlinkSource.INTERNETARCHIVE,
  },
  {
    id: 18,
    name: 'محمد سعيد المنشاوي',
    riwaya: Riwaya.Hafs,
    magnet:
      'magnet:?xt=urn:btih:fbf3bfbfbc5baad0d9d2395fb0f20294723b9930&dn=Mohammed_Siddiq_Al-Minshawi&tr=https%3A%2F%2Ftorrent.mp3quran.net%2Fannounce.php&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.MP3QURAN,
  },
  {
    id: 19,
    name: 'فارس عباد',
    riwaya: Riwaya.Hafs,
    magnet:
      'magnet:?xt=urn:btih:4d8cbf2a1b53bd2d18a8fa155684da30518cd99e&dn=Fares_Abbad&tr=http%3A%2F%2Ftorrent.mp3quran.net%2Fannounce.php&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.MP3QURAN,
  },
  {
    id: 20,
    name: 'محمد الكنتاوي',
    riwaya: Riwaya.Warsh,
    magnet:
      'magnet:?xt=urn:btih:bb7093b290ac61d10b5a6357087cd670bb6ba931&dn=Mohammed_El_Kantaoui_Warsh&tr=http%3A%2F%2Fibnradman.com%2Fannounce.php&tr=http%3A%2F%2Ftorrent.islamhouse.com%2Fannounce.php&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.ISLAMHOUSE,
  },
  {
    id: 21,
    name: 'محمود خليل الحصري',
    riwaya: Riwaya.Qalun,
    magnet:
      'magnet:?xt=urn:btih:c4ac5dece90004fb389a2fc378847dab54d9f1d3&dn=ar_Alhosari_Qalon&tr=https%3A%2F%2Ftorrent.islamhouse.com%2Fannounce.php&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.ISLAMHOUSE,
  },
  {
    id: 22,
    name: 'محمود خليل الحصري',
    riwaya: Riwaya.Hafs,
    magnet:
      'magnet:?xt=urn:btih:4dd0536b0d17d0f463ea221a211384d185511bec&dn=Mahmood_Khaleel_Al-Husaree&tr=https%3A%2F%2Ftorrent.islamhouse.com%2Fannounce.php&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss://tracker.quran.us.kg&tr=wss://trackerf.quran.us.kg',
    complet: true,
    source: MagnetlinkSource.ISLAMHOUSE,
  },

  {
    id: 24,
    name: 'test - file',
    riwaya: Riwaya.Hafs,
    magnet:
      'magnet:?xt=urn:btih:489a21c45f7eb13ad75b3b9bfa0132b1be035f62&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent',
    complet: false,
    source: MagnetlinkSource.UNKNOWN,
  },
];
