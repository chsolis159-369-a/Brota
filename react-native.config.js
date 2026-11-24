/**
 * npm instala react-native-reanimated y react-native-worklets como dependencias pares de expo-router
 * (react-native-drawer-layout) y expo-modules-core, aunque la app no los use. Se excluyen del
 * autolinking para no compilar su código nativo (D-22). Si algún día se usa Drawer o reanimated,
 * hay que quitar esta exclusión y resolver el límite de rutas de Windows.
 */
module.exports = {
  dependencies: {
    'react-native-reanimated': { platforms: { android: null, ios: null } },
    'react-native-worklets': { platforms: { android: null, ios: null } },
  },
};
