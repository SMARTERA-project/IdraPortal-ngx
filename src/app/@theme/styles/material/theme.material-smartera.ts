/**
 * SmartEra Theme - Green variant
 * Primary: #165040 (dark green)
 * Success: #C4DA8B (light green)
 * Info: #6CB7AF (teal)
 * Warning: #DFA500 (gold)
 * Background: #F7F5EC (warm cream)
 */

// Color palette - direct string values for type safety
const colors = {
  primary: '#165040',
  primaryLight: '#4a9a87',
  success: '#C4DA8B',
  successLight: '#d1e39f',
  info: '#6CB7AF',
  infoLight: '#8fc9c2',
  warning: '#DFA500',
  warningLight: '#efc64a',
  danger: '#d32f2f',
  dangerLight: '#e47373',

  bg: '#ffffff',
  bg2: '#F7F5EC',
  bg3: '#f0ede2',
  bg4: '#e5e2d6',

  border: '#ffffff',
  border2: '#F7F5EC',
  border3: '#f0ede2',
  border4: '#e5e2d6',
  border5: '#c5c2b6',

  fg: '#8f8c80',
  fgHeading: '#333128',
  fgText: '#333128',
  separator: '#f0ede2',
};

export const MATERIAL_SMARTERA_THEME = {
  name: 'material-smartera',
  base: 'default',
  variables: {
    temperature: {
      arcFill: [
        colors.primary,
        colors.primary,
        colors.primary,
        colors.primary,
        colors.primary,
      ],
      arcEmpty: colors.bg2,
      thumbBg: colors.bg2,
      thumbBorder: colors.primary,
    },

    solar: {
      gradientLeft: colors.primary,
      gradientRight: colors.primary,
      shadowColor: 'rgba(0, 0, 0, 0)',
      secondSeriesFill: colors.bg2,
      radius: ['80%', '90%'],
    },

    traffic: {
      tooltipBg: colors.bg,
      tooltipBorderColor: colors.border2,
      tooltipExtraCss: 'border-radius: 10px; padding: 4px 16px;',
      tooltipTextColor: colors.fgText,
      tooltipFontWeight: 'normal',

      yAxisSplitLine: colors.separator,

      lineBg: colors.border4,
      lineShadowBlur: '1',
      itemColor: colors.border4,
      itemBorderColor: colors.border4,
      itemEmphasisBorderColor: colors.primary,
      shadowLineDarkBg: 'rgba(0, 0, 0, 0)',
      shadowLineShadow: 'rgba(0, 0, 0, 0)',
      gradFrom: colors.bg2,
      gradTo: colors.bg2,
    },

    electricity: {
      tooltipBg: colors.bg,
      tooltipLineColor: colors.fgText,
      tooltipLineWidth: '0',
      tooltipBorderColor: colors.border2,
      tooltipExtraCss: 'border-radius: 10px; padding: 8px 24px;',
      tooltipTextColor: colors.fgText,
      tooltipFontWeight: 'normal',

      axisLineColor: colors.border3,
      xAxisTextColor: colors.fg,
      yAxisSplitLine: colors.separator,

      itemBorderColor: colors.primary,
      lineStyle: 'solid',
      lineWidth: '4',
      lineGradFrom: colors.primary,
      lineGradTo: colors.primary,
      lineShadow: 'rgba(0, 0, 0, 0)',

      areaGradFrom: colors.primary,
      areaGradTo: colors.bg2,
      shadowLineDarkBg: 'rgba(0, 0, 0, 0)',
    },

    bubbleMap: {
      titleColor: colors.fgText,
      areaColor: colors.bg4,
      areaHoverColor: colors.primary,
      areaBorderColor: colors.border5,
    },

    profitBarAnimationEchart: {
      textColor: colors.fgText,

      firstAnimationBarColor: colors.primary,
      secondAnimationBarColor: colors.success,

      splitLineStyleOpacity: '1',
      splitLineStyleWidth: '1',
      splitLineStyleColor: colors.separator,

      tooltipTextColor: colors.fgText,
      tooltipFontWeight: 'normal',
      tooltipFontSize: '16',
      tooltipBg: colors.bg,
      tooltipBorderColor: colors.border2,
      tooltipBorderWidth: '1',
      tooltipExtraCss: 'border-radius: 10px; padding: 4px 16px;',
    },

    trafficBarEchart: {
      gradientFrom: colors.warningLight,
      gradientTo: colors.warning,
      shadow: colors.warning,
      shadowBlur: '0',

      axisTextColor: colors.fgText,
      axisFontSize: '12',

      tooltipBg: colors.bg,
      tooltipBorderColor: colors.border2,
      tooltipExtraCss: 'border-radius: 10px; padding: 4px 16px;',
      tooltipTextColor: colors.fgText,
      tooltipFontWeight: 'normal',
    },

    countryOrders: {
      countryBorderColor: colors.border4,
      countryFillColor: colors.bg3,
      countryBorderWidth: '1',
      hoveredCountryBorderColor: colors.primary,
      hoveredCountryFillColor: colors.primaryLight,
      hoveredCountryBorderWidth: '1',

      chartAxisLineColor: colors.border4,
      chartAxisTextColor: colors.fg,
      chartAxisFontSize: '16',
      chartGradientTo: colors.primary,
      chartGradientFrom: colors.primaryLight,
      chartAxisSplitLine: colors.separator,
      chartShadowLineColor: colors.primary,

      chartLineBottomShadowColor: colors.primary,

      chartInnerLineColor: colors.bg2,
    },

    echarts: {
      bg: colors.bg,
      textColor: colors.fgText,
      axisLineColor: colors.fgText,
      splitLineColor: colors.separator,
      itemHoverShadowColor: 'rgba(0, 0, 0, 0.5)',
      tooltipBackgroundColor: colors.primary,
      areaOpacity: '0.7',
    },

    chartjs: {
      axisLineColor: colors.separator,
      textColor: colors.fgText,
    },

    orders: {
      tooltipBg: colors.bg,
      tooltipLineColor: 'rgba(0, 0, 0, 0)',
      tooltipLineWidth: '0',
      tooltipBorderColor: colors.border2,
      tooltipExtraCss: 'border-radius: 10px; padding: 8px 24px;',
      tooltipTextColor: colors.fgText,
      tooltipFontWeight: 'normal',
      tooltipFontSize: '20',

      axisLineColor: colors.border4,
      axisFontSize: '16',
      axisTextColor: colors.fg,
      yAxisSplitLine: colors.separator,

      itemBorderColor: colors.primary,
      lineStyle: 'solid',
      lineWidth: '4',

      // first line
      firstAreaGradFrom: colors.bg3,
      firstAreaGradTo: colors.bg3,
      firstShadowLineDarkBg: 'rgba(0, 0, 0, 0)',

      // second line
      secondLineGradFrom: colors.primary,
      secondLineGradTo: colors.primary,

      secondAreaGradFrom: 'rgba(22, 80, 64, 0.2)',
      secondAreaGradTo: 'rgba(22, 80, 64, 0)',
      secondShadowLineDarkBg: 'rgba(0, 0, 0, 0)',

      // third line
      thirdLineGradFrom: colors.success,
      thirdLineGradTo: colors.success,

      thirdAreaGradFrom: 'rgba(196, 218, 139, 0.2)',
      thirdAreaGradTo: 'rgba(196, 218, 139, 0)',
      thirdShadowLineDarkBg: 'rgba(0, 0, 0, 0)',
    },

    profit: {
      bg: colors.bg,
      textColor: colors.fgText,
      axisLineColor: colors.border4,
      splitLineColor: colors.separator,
      areaOpacity: '1',

      axisFontSize: '16',
      axisTextColor: colors.fg,

      // first bar
      firstLineGradFrom: colors.bg3,
      firstLineGradTo: colors.bg3,
      firstLineShadow: 'rgba(0, 0, 0, 0)',

      // second bar
      secondLineGradFrom: colors.primary,
      secondLineGradTo: colors.primary,
      secondLineShadow: 'rgba(0, 0, 0, 0)',

      // third bar
      thirdLineGradFrom: colors.success,
      thirdLineGradTo: colors.success,
      thirdLineShadow: 'rgba(0, 0, 0, 0)',
    },

    orderProfitLegend: {
      firstItem: colors.success,
      secondItem: colors.primary,
      thirdItem: colors.bg3,
    },

    visitors: {
      tooltipBg: colors.bg,
      tooltipLineColor: 'rgba(0, 0, 0, 0)',
      tooltipLineWidth: '0',
      tooltipBorderColor: colors.border2,
      tooltipExtraCss: 'border-radius: 10px; padding: 8px 24px;',
      tooltipTextColor: colors.fgText,
      tooltipFontWeight: 'normal',
      tooltipFontSize: '20',

      axisLineColor: colors.border4,
      axisFontSize: '16',
      axisTextColor: colors.fg,
      yAxisSplitLine: colors.separator,

      itemBorderColor: colors.primary,
      lineStyle: 'dotted',
      lineWidth: '6',
      lineGradFrom: '#ffffff',
      lineGradTo: '#ffffff',
      lineShadow: 'rgba(0, 0, 0, 0)',

      areaGradFrom: colors.primary,
      areaGradTo: colors.bg3,

      innerLineStyle: 'solid',
      innerLineWidth: '1',

      innerAreaGradFrom: colors.success,
      innerAreaGradTo: colors.bg2,
    },

    visitorsLegend: {
      firstIcon: colors.success,
      secondIcon: colors.primary,
    },

    visitorsPie: {
      firstPieGradientLeft: colors.success,
      firstPieGradientRight: colors.success,
      firstPieShadowColor: 'rgba(0, 0, 0, 0)',
      firstPieRadius: ['70%', '90%'],

      secondPieGradientLeft: colors.warning,
      secondPieGradientRight: colors.warning,
      secondPieShadowColor: 'rgba(0, 0, 0, 0)',
      secondPieRadius: ['60%', '95%'],
      shadowOffsetX: '0',
      shadowOffsetY: '0',
    },

    visitorsPieLegend: {
      firstSection: colors.success,
      secondSection: colors.warning,
    },

    earningPie: {
      radius: ['65%', '100%'],
      center: ['50%', '50%'],

      fontSize: '22',

      firstPieGradientLeft: colors.success,
      firstPieGradientRight: colors.success,
      firstPieShadowColor: 'rgba(0, 0, 0, 0)',

      secondPieGradientLeft: colors.primary,
      secondPieGradientRight: colors.primary,
      secondPieShadowColor: 'rgba(0, 0, 0, 0)',

      thirdPieGradientLeft: colors.warning,
      thirdPieGradientRight: colors.warning,
      thirdPieShadowColor: 'rgba(0, 0, 0, 0)',
    },

    earningLine: {
      gradFrom: colors.primary,
      gradTo: colors.primary,

      tooltipTextColor: colors.fgText,
      tooltipFontWeight: 'normal',
      tooltipFontSize: '16',
      tooltipBg: colors.bg,
      tooltipBorderColor: colors.border2,
      tooltipBorderWidth: '1',
      tooltipExtraCss: 'border-radius: 10px; padding: 4px 16px;',
    },
  },
};
