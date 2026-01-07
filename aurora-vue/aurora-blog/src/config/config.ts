export default {
  qqLogin: {
    QQ_APP_ID: '101999415',
    QQ_REDIRECT_URI: 'https://www.devillusion.asia/oauth/login/qq'
  },
  routes: [
    {
      name: 'Home',
      path: '/',
      children: []
    },
    {
      name: 'Talks',
      path: '/talks',
      children: []
    },
    {
      name: 'About',
      path: '/about',
      children: []
    },
    {
      name: 'Archives',
      path: '/archives',
      children: []
    },
    {
      name: 'Tags',
      path: '/tags',
      children: []
    },
    {
      name: 'Message',
      path: '/message',
      children: []
    },
    {
      name: 'Friends',
      path: '/friends',
      children: []
    }
  ]
}
