export const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:turn.quran.us.kg:3478?transport=udp',
      use: 'adelpro',
      credential: 'adelpro1981',
      /*       username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD, */
    },
    {
      urls: 'turn:turn.quran.us.kg:3478?transport=tcp',
      use: 'adelpro',
      credential: 'adelpro1981',
      /*       username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD, */
    },
  ],
};
