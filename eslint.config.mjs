import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  nextjs: true,
  ignores: [
    'components/ui/',
  ],
})
