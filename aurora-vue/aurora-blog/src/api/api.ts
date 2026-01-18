import axios from 'axios'

type ApiParams = Record<string, unknown>
type RequestPayload = ApiParams | URLSearchParams
type IdParam = string | number

export default {
  getTopAndFeaturedArticles: () => {
    return axios.get('/api/articles/topAndFeatured')
  },
  getArticles: (params: ApiParams) => {
    return axios.get('/api/articles/all', { params: params })
  },
  getArticlesByCategoryId: (params: ApiParams) => {
    return axios.get('/api/articles/categoryId', { params: params })
  },
  getArticeById: (articleId: IdParam) => {
    return axios.get('/api/articles/' + articleId)
  },
  getAllCategories: () => {
    return axios.get('/api/categories/all')
  },
  getAllTags: () => {
    return axios.get('/api/tags/all')
  },
  getTopTenTags: () => {
    return axios.get('/api/tags/topTen')
  },
  getArticlesByTagId: (params: ApiParams) => {
    return axios.get('/api/articles/tagId', { params: params })
  },
  getAllArchives: (params: ApiParams) => {
    return axios.get('/api/archives/all', { params: params })
  },
  login: (params: RequestPayload) => {
    return axios.post('/api/users/login', params)
  },
  saveComment: (params: ApiParams) => {
    return axios.post('/api/comments/save', params)
  },
  getComments: (params: ApiParams) => {
    return axios.get('/api/comments', { params: params })
  },
  getTopSixComments: () => {
    return axios.get('/api/comments/topSix')
  },
  getAbout: () => {
    return axios.get('/api/about')
  },
  getFriendLink: () => {
    return axios.get('/api/links')
  },
  submitUserInfo: (params: ApiParams) => {
    return axios.put('/api/users/info', params)
  },
  getUserInfoById: (id: IdParam) => {
    return axios.get('/api/users/info/' + id)
  },
  updateUserSubscribe: (params: ApiParams) => {
    return axios.put('/api/users/subscribe', params)
  },
  sendValidationCode: (username: string) => {
    return axios.get('/api/users/code', {
      params: {
        username: username
      }
    })
  },
  bindingEmail: (params: ApiParams) => {
    return axios.put('/api/users/email', params)
  },
  register: (params: ApiParams) => {
    return axios.post('/api/users/register', params)
  },
  searchArticles: (params: ApiParams) => {
    return axios.get('/api/articles/search', {
      params: params
    })
  },
  getAlbums: () => {
    return axios.get('/api/photos/albums')
  },
  getPhotosBuAlbumId: (albumId: IdParam, params: ApiParams) => {
    return axios.get('/api/albums/' + albumId + '/photos', {
      params: params
    })
  },
  getWebsiteConfig: () => {
    return axios.get('/api')
  },
  qqLogin: (params: ApiParams) => {
    return axios.post('/api/users/oauth/qq', params)
  },
  report: () => {
    axios.post('/api/report')
  },
  getTalks: (params: ApiParams) => {
    return axios.get('/api/talks', {
      params: params
    })
  },
  getTalkById: (id: IdParam) => {
    return axios.get('/api/talks/' + id)
  },
  logout: () => {
    return axios.post('/api/users/logout')
  },
  getRepliesByCommentId: (commentId: IdParam) => {
    return axios.get(`/api/comments/${commentId}/replies`)
  },
  updatePassword: (params: ApiParams) => {
    return axios.put('/api/users/password', params)
  },
  accessArticle: (params: ApiParams) => {
    return axios.post('/api/articles/access', params)
  }
}
