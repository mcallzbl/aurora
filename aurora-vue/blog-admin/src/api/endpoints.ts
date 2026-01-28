export const api = {
  report: '/api/report',
  about: '/api/about',
  users: {
    login: '/api/users/login',
    logout: '/api/users/logout',
    avatar: '/api/users/avatar',
    info: '/api/users/info',
  },
  admin: {
    dashboard: '/api/admin',
    menu: {
      userMenus: '/api/admin/user/menus',
      list: '/api/admin/menus',
      hidden: '/api/admin/menus/isHidden',
      detail: (id: number | string) => `/api/admin/menus/${id}`,
    },
    category: {
      list: '/api/admin/categories',
      search: '/api/admin/categories/search',
    },
    tag: {
      list: '/api/admin/tags',
      search: '/api/admin/tags/search',
    },
    article: {
      list: '/api/admin/articles',
      detail: (id: number | string) => `/api/admin/articles/${id}`,
      images: '/api/admin/articles/images',
      import: '/api/admin/articles/import',
      export: '/api/admin/articles/export',
      delete: '/api/admin/articles/delete',
      topAndFeatured: '/api/admin/articles/topAndFeatured',
    },
    about: '/api/admin/about',
    comment: {
      list: '/api/admin/comments',
      review: '/api/admin/comments/review',
    },
    link: {
      list: '/api/admin/links',
    },
    role: {
      list: '/api/admin/roles',
      save: '/api/admin/role',
      resources: '/api/admin/role/resources',
      menus: '/api/admin/role/menus',
    },
    resource: {
      list: '/api/admin/resources',
      detail: (id: number | string) => `/api/admin/resources/${id}`,
    },
    user: {
      list: '/api/admin/users',
      roles: '/api/admin/users/role',
      disable: '/api/admin/users/disable',
      password: '/api/admin/users/password',
      online: '/api/admin/users/online',
      onlineDetail: (id: number | string) => `/api/admin/users/${id}/online`,
      area: '/api/admin/users/area',
    },
    website: {
      config: '/api/admin/website/config',
      images: '/api/admin/config/images',
    },
    exceptionLog: {
      list: '/api/admin/exception/logs',
    },
    job: {
      list: '/api/admin/jobs',
      groups: '/api/admin/jobs/jobGroups',
      status: '/api/admin/jobs/status',
      run: '/api/admin/jobs/run',
      detail: (id: number | string) => `/api/admin/jobs/${id}`,
    },
    talk: {
      list: '/api/admin/talks',
      images: '/api/admin/talks/images',
      detail: (id: number | string) => `/api/admin/talks/${id}`,
    },
  },
} as const
