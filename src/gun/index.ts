import Gun from 'gun';

const gun = Gun({
  peers: ['https://gun-manhattan.herokuapp.com/gun'], // Gun team’s public relay
});

export default gun;
