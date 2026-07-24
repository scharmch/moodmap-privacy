/**
 * Web stub for react-native-maps.
 * Metro resolves this file instead of the native package when bundling for web,
 * preventing "importing native-only module" errors.
 */

const React = require('react');
const { View } = require('react-native');

const noop = () => null;
const EmptyView = () => React.createElement(View, null);

// Default export: MapView stub
EmptyView.Animated = EmptyView;
module.exports = EmptyView;

// Named exports used across the codebase
module.exports.default = EmptyView;
module.exports.Marker = EmptyView;
module.exports.Callout = EmptyView;
module.exports.Circle = EmptyView;
module.exports.Overlay = EmptyView;
module.exports.Polygon = EmptyView;
module.exports.Polyline = EmptyView;
module.exports.Heatmap = EmptyView;
module.exports.GeoJSON = EmptyView;
module.exports.UrlTile = EmptyView;
module.exports.LocalTile = EmptyView;
module.exports.WMSTile = EmptyView;
module.exports.AnimatedRegion = function AnimatedRegion() {};
module.exports.MAP_TYPES = {};
module.exports.PROVIDER_DEFAULT = null;
module.exports.PROVIDER_GOOGLE = 'google';
