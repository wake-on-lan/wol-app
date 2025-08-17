module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          'src': './src',
          'crypto': 'react-native-quick-crypto',
          'stream': 'readable-stream',
          'buffer': '@craftzdog/react-native-buffer',
        },
      },
    ],
  ],
};
