# 构建阶段
FROM node:22-alpine as build-stage

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖 (包括devDependencies用于构建)
RUN npm ci --silent

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:stable-alpine as production-stage

# 复制构建后的文件到nginx目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 8080

# 启动nginx (以root身份运行，这是nginx在容器中的标准做法)
CMD ["nginx", "-g", "daemon off;"]