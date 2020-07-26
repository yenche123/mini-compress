// 对外曝露的 wxml属性为 <mini-compress />
// Author: yenche123
// Date: 2020/07/26

Component({

  options: {
    pureDataPattern: /^_/
  },

  properties: {
    returnPath: {
      type: Boolean,
      value: true,   //将此值关闭 即可在返回字段imgArray里 不返回path字段
    },
  },

  data: {
    canvasW: 1080,
    canvasH: 1080,
    success: '',
    fail: '',
    imgWidth: 1080,
    num: 3,
    zd: {},
    _maxh2w: 8,
    _oldStamp: 0,
  },

  attached() {
    this.componentInit()
  },

  pageLifetimes: {
    show() {
      this.initImgHelper()
    }
  },

  methods: {
    initImgHelper() {
      let _this = this
      wx.yx = wx.yx || {}
      wx.yx.chooseImage = ({ count = 3, success = '', fail = '', imgWidth = 1080, maxh2w = 8}) => {
        _this.setData({ num: count, success, fail, imgWidth, _maxh2w: maxh2w })

        wx.chooseImage({
          count,
          sizeType: ['original'],
          sourceType: ['album'],
          success(res) {
            let tempFiles = res.tempFiles
            let newImgArray = _this._packageImgsLocally(tempFiles)
            _this.data._oldStamp = Date.now()
            _this._calH2W({
              newImgArray,
              success(res) {
                if (res.isCalOk) {
                  _this._compress(res.imgs)
                }
              },
            })
          },
        })
      }

    },

    componentInit() {
      let sys = wx.getSystemInfoSync() || {}
      let lag = sys.language || "zh-CN"
      if(lag === "zh_CN") lag = "zh-CN"
      else if(lag === "zh-HK" || lag === "zh_HK" || lag === "zh_TW") lag = "zh-TW"
      if(lag !== "zh-CN" && lag !== "zh-TW") lag = "en"

      let zdObj = {
        'zh-CN': {
          TXT_processing: '处理中',
          TXT_gotit: '了解',
          TXT_tip: '提示',
          TXT_maxh2w: "图片高宽比不得大于",
        },
        'zh-TW': {
          TXT_processing: '處理中',
          TXT_gotit: '了解',
          TXT_tip: '提示',
          TXT_maxh2w: "圖片高寬比不得大於",
        },
        'en': {
          TXT_processing: 'Processing',
          TXT_gotit: 'Got it',
          TXT_tip: 'Tip',
          TXT_maxh2w: "Ratio of height to width must not be greater than ",
        }
      }
      this.setData({ zd: zdObj[lag] })
    },

    _packageImgsLocally(tempFiles) {
      let _this = this
      let s = Date.now()
      let newImgArray = tempFiles.map((v, i) => {
        let format = ''
        let extensionArr = /\.([^.]*)$/.exec(v.path)
        if (extensionArr) {
          format = extensionArr[1].toLowerCase()
        }
        let a = {
          url: v.path,
          imgId: 'imgId_' + s + '_' + i,
          originalSize: v.size,
          format,
          dType: 'IMG',
        }
        if(_this.data.returnPath) a.path = v.path
        return a
      })
      return newImgArray
    },

    _calH2W({ newImgArray, success }) {
      let _this = this
      let hasCalNum = 0;
      const imgLen = newImgArray.length
      for (let i = 0; i < imgLen; i++) {
        wx.getImageInfo({
          src: newImgArray[i].url,
          success(res) {
            hasCalNum++
            for (let j = 0; j < imgLen; j++) {
              if (res.path === newImgArray[j].url) {
                newImgArray[j].orientation = res.orientation
                newImgArray[j].originalHeight = res.height
                newImgArray[j].originalWidth = res.width
                let tmpH2W = String(res.height / res.width)
                let p = tmpH2W.indexOf('.')
                if (p >= 0) { 
                  //避免小数点过长 只保留小数点后四位
                  let sLen = tmpH2W.length
                  let diff = sLen - p
                  if (diff > 5) {
                    tmpH2W = tmpH2W.substring(0, p + 5)
                  }
                }
                newImgArray[j].h2w = Number(tmpH2W)
                if (Number(tmpH2W) > _this.data._maxh2w) {
                  hasCalNum = 0
                  _this.showTipAbtRatio()
                }

                break
              }
            }
            if (hasCalNum === imgLen) {
              success({ imgs: newImgArray, isCalOk: true })
            }
          }
        })
      }

    },

    showTipAbtRatio() {
      let {zd, _maxh2w} = this.data
      let content = zd.TXT_maxh2w + _maxh2w
      wx.showModal({
        title: zd.TXT_tip,
        content,
        confirmText: zd.TXT_gotit,
        showCancel: false,
        confirmColor: "#29ae59",
      })
      let fail = this.data.fail
      fail && fail({errMsg: "比例过大"})
    },

    _compress(imgs) {
      let newimgs = []
      let _this = this
      let success = _this.data.success
      const ctx = wx.createCanvasContext('miniCompress', this)

      wx.showLoading({ title: _this.data.zd.TXT_processing, mask: true })

      var c = function () {
        if (imgs.length < 1) {
          //判断是否结束
          console.log(" ")
          console.log("--------")
          console.log("选完图片到压缩，共耗时: ", (Date.now() - _this.data._oldStamp))
          console.log("--------")
          console.log(" ")
          wx.hideLoading()
          success && success({ errMsg: 'ok', imgArray: newimgs})
          return
        }
        let imgObj = imgs[0]

        let formatB = imgObj.format !== 'png' && imgObj.format !== 'jpg'
        formatB = formatB && imgObj.format !== 'jpeg'
        if (formatB || imgObj.h2w >= 3 || imgObj.originalSize < 100 * 1024) {
          console.log("可能gif 或 大小低于100kb 就不压缩了")
          imgObj.width = imgObj.originalWidth
          imgObj.height = imgObj.originalHeight
          newimgs.push(imgObj)
          imgs.splice(0, 1)
          c()
          return
        }

        let w = _this.data.imgWidth
        if (imgObj.originalWidth <= _this.data.imgWidth) {
          w = imgObj.originalWidth
        }

        //开始画图
        let h = Math.round(w * imgObj.h2w)
        let quality = 0.8
        if (h > 1.4 * w && h <= 2*w) quality = 0.66
        else if (h > 2 * w && h<= 2.5*w) quality = 0.58
        else if(h > 2.5 * w) quality = 0.5

        _this.setData({ canvasW: w, canvasH: h }, () => {
          ctx.drawImage(imgObj.url, 0, 0, w, h)
          setTimeout(() => {
            ctx.draw(false, () => {
              wx.canvasToTempFilePath({
                canvasId: 'miniCompress',
                width: w,
                height: h,
                destWidth: w,
                destHeight: h,
                fileType: 'jpg',
                quality,
                success(res) {
                  imgObj.url = res.tempFilePath
                  imgObj.width = w
                  imgObj.height = h
                  imgObj.format = 'jpg'
                  setTimeout(() => {
                    newimgs.push(imgObj)
                    imgs.splice(0, 1)
                    c()
                  }, 90)
                }
              }, _this)
            })
          }, 200)
        })
      }
      c()
    },
  }
})
