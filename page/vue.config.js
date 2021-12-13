module.exports = {
  //基本路径
  publicPath: './',
  devServer: {
    port: 28847,
    disableHostCheck: true,
  },
  chainWebpack: (config) => {
    // 保存时自动格式化代码
    config.module
      .rule('eslint')
      .use('eslint-loader')
      .loader('eslint-loader')
      .tap((options) => {
        options.fix = true
        return options
      })
  },
}
