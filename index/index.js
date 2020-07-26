const app = getApp()

Page({

  data: {
    originalUrl: "",
    compressUrl: "",
  },

  onLoad: function () {
    console.log(" ")
    console.log('mini-compress 是一个使用api方式，即可获取图片宽高、高宽比、图片后缀、以及压缩后的图片url的工具')
    console.log("https://github.com/yenche123/mini-compress")
    console.log(" ")
  },
  
  onTapChooseImage() {
    let _this = this
    wx.yx.chooseImage({
      count: 1,
      success(res) {
        console.log(res)
        let imgArray = res.imgArray || []
        let imgObj = imgArray[0] || {}
        _this.setData({originalUrl: imgObj.path, compressUrl: imgObj.url})
      }
    })
  },

})
