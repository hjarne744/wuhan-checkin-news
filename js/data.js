/**
 * 可改数据（改这里即可，不必翻遍页面）
 * ------------------------------------------------
 * SELFIE_*  黄鹤楼自拍区：已有样本，正式发布前需核对原始问卷
 * PRO_*     代拍区三项为独立模拟占位变量，非正式问卷调查结果
 * SIM_POLL  巴公房子情境：模拟比例，仅用于交互原型，不能写成真实调查
 */
window.NEWS_DATA = {
  selfie: {
    duration: "3–5",
    samplePeople: 37,
    sampleShare: 74,
    sampleTotal: 50,
    waitTime: "等待时间数据待补充",
    source: "数据来源：此前整理的 50 份样本。正式发布前需要核对原始问卷。",
  },
  pro: {
    priceAccept: 72,
    satisfaction: 85,
    spendingShare: 38,
    note: "以上三项为模拟占位数据，仅用于交互原型展示，非正式问卷调查结果。",
  },
  simPoll: {
    wait: 46,
    pass: 32,
    talk: 22,
    note: "模拟数据，仅用于交互原型展示",
  },
  /* 把真实武汉地图放到这个路径即可自动替换占位 */
  mapImage: "assets/images/wuhan-map.jpg",
  places: {
    huanghelou: {
      name: "黄鹤楼红墙",
      lat: 30.5485,
      lng: 114.3048,
      photo: "assets/images/huanghelou-redwall.jpg",
    },
    bagong: {
      name: "巴公房子",
      lat: 30.585,
      lng: 114.2885,
      photo: "assets/images/bagong-house.jpg",
    },
  },
  /* 过江示意：红墙 → 武汉长江大桥 → 汉阳 → 江汉桥 → 巴公房子，不穿江面直线 */
  route: [
    [30.5485, 114.3048],
    [30.5472, 114.2968],
    [30.5498, 114.2875],
    [30.5575, 114.2818],
    [30.5668, 114.2835],
    [30.5738, 114.2865],
    [30.585, 114.2885],
  ],
};
