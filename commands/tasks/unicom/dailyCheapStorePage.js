var crypto = require('crypto');
var moment = require('moment');

// 首页-签到有礼-免费抽-赢三星Galaxy Z(试试手气)
var transParams = (data) => {
  let params = new URLSearchParams();
  for (let item in data) {
    params.append(item, data['' + item + '']);
  }
  return params;
};
function w () {
  var e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : {}
    , t = [];
  return Object.keys(e).forEach((function (a) {
    t.push("".concat(a, "=").concat(encodeURIComponent(e[a])))
  }
  )),
    t.join("&")
}
var sign = (data) => {
  let str = 'integralofficial&'
  let params = []
  data.forEach((v, i) => {
    if (v) {
      params.push('arguments' + (i + 1) + v)
    }
  });
  return crypto.createHash('md5').update(str + params.join('&')).digest('hex')
}

function encryption (data, key) {
  var iv = "";
  var cipherEncoding = 'base64';
  var cipher = crypto.createCipheriv('aes-128-ecb', key, iv);
  cipher.setAutoPadding(true);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString(cipherEncoding);
}

var dailyCheapStorePage = {
  getGoodsList: async (axios, options) => {
    let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
    const useragent = `Mozilla/5.0 (Linux; Android 7.1.2; SM-G977N Build/LMY48Z; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/75.0.3770.143 Mobile Safari/537.36; unicom{version:android@8.0100,desmobile:${options.user}};devicetype{deviceBrand:samsung,deviceModel:SM-G977N};{yw_code:}    `
    let result = await axios.request({
      headers: {
        "user-agent": useragent,
        "referer": `https://wxapp.msmds.cn/`,
        "origin": "https://wxapp.msmds.cn"
      },
      url: `https://wxapp.msmds.cn/jplus/api/change/collect/chip/gift/v1/home/info`,
      method: 'POST',
      data: transParams({
        'channelId': 'LT_channel',
        'phone': phone,
        'token': options.ecs_token,
        'sourceCode': 'lt_cheapStore'
      })
    })
    return result.data.data
  },
  doTask: async (axios, options) => {
    const useragent = `Mozilla/5.0 (Linux; Android 7.1.2; SM-G977N Build/LMY48Z; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/75.0.3770.143 Mobile Safari/537.36; unicom{version:android@8.0100,desmobile:${options.user}};devicetype{deviceBrand:samsung,deviceModel:SM-G977N};{yw_code:}`
    let searchParams = {}
    let result = await axios.request({
      baseURL: 'https://m.client.10010.com/',
      headers: {
        "user-agent": useragent,
        "referer": `https://img.client.10010.com/`,
        "origin": "https://img.client.10010.com"
      },
      url: `https://m.client.10010.com/mobileService/openPlatform/openPlatLine.htm?to_url=https://wxapp.msmds.cn/h5/react_web/unicom/cheapStorePage?source=unicom&duanlianjieabc=tbkEG`,
      method: 'GET',
      transformResponse: (data, headers) => {
        if ('location' in headers) {
          let uu = new URL(headers.location)
          let pp = {}
          for (let p of uu.searchParams) {
            pp[p[0]] = p[1]
          }
          if ('ticket' in pp) {
            searchParams = pp
          }
        }
        return data
      }
    }).catch(err => console.log(err))
    let jar1 = result.config.jar

    let cookiesJson = jar1.toJSON()
    let ecs_token = cookiesJson.cookies.find(i => i.key == 'ecs_token')
    ecs_token = ecs_token.value
    if (!ecs_token) {
      throw new Error('ecs_token缺失')
    }

    let phone = encryption(options.user, 'gb6YCccUvth75Tm2')
    let playCounts = 0
    do {
      let res = await dailyCheapStorePage.getGoodsList(axios, {
        ...options,
        ecs_token,
        phone
      })


      playCounts = res.playCounts

      if ('times' in res) {
        let m = moment(new Date(res.times)).format('YYYY-MM-DD HH:mm:ss') + ' 后可再次尝试'
        throw new Error(m)
      }

      if (!playCounts) {
        console.log('没有游戏次数')
        break
      }

      let a = {
        'channelId': 'LT_channel',
        'code': '',
        "phone": phone,
        'token': ecs_token,
        'sourceCode': 'lt_cheapStore'
      }

      result = await axios.request({
        headers: {
          "user-agent": useragent,
          "referer": `https://wxapp.msmds.cn/h5/react_web/unicom/cheapStorePage?source=unicom&type=02&ticket=${searchParams.ticket}&version=android@8.0100&timestamp=20210107104745&desmobile=${options.user}&num=0&postage=${searchParams.postage}&duanlianjieabc=tbkEG&userNumber=${options.user}`,
          "origin": "https://wxapp.msmds.cn"
        },
        url: `https://wxapp.msmds.cn/jplus/api/change/collect/chip/gift/v1/play/luck/draw?` + w(a),
        method: 'POST'
      })

      if (result.data.code !== 200) {
        console.log('提交任务失败', result.data.msg)
      } else {
        let data = result.data.data
        let good = res.list.find(f => f.giftId === data.giftId)
        console.log('提交任务成功，获得', good.giftName, '商品碎片x' + data.fragmentCount, data.desc + data.playCounts)
        playCounts = data.playCounts
      }

      if (playCounts) {
        console.log('等待15秒再继续')
        await new Promise((resolve, reject) => setTimeout(resolve, 15 * 1000))
      } else {
        throw new Error('进入下一轮的尝试等待期')
      }

    } while (playCounts)
  }
}

module.exports = dailyCheapStorePage