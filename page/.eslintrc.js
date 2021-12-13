module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/essential', 'eslint:recommended', '@vue/prettier'],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    'no-console': 'off', // 打包时已经对这个进行去除
    'no-debugger': 'off', // 打包时已经对这个进行去除
    'prettier/prettier': [
      'error',
      {
        tabWidth: 2,
        singleQuote: true, // 使用单引号
        semi: false, // 使用分号
        endOfLine: 'auto', // 不检测代码结尾 https://stackoverflow.com/questions/53516594/why-do-i-keep-getting-delete-cr-prettier-prettier
      },
    ],
  },
}
