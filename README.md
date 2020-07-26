# mini-compress

一个简单的微信小程序图片压缩和获取图片信息的工具

> 场景：wx.chooseImage 的回调无法得知图片的宽高，同时`sizeType`定义为`compressed`图片又会过于劣质，所以本项目封装了该图片选择接口，只要使用 wx.yx.chooseImage 即可返回含图片信息和较高质量但体机不大的图片。

实测一个一般规格3mb左右的图片会被压缩成150kb左右，且肉眼大致看不出差别。

整个组件代码包(含注释和空行)大小约 8kb 

<br/>

## 开箱即用

1. 选定文件位置，`git clone https://github.com/yenche123/mini-compress.git`

2. 打开微信开发者工具，选择`代码片段`，在新建代码片段的地方，选择上方clone下来的本地路径

<br/>

## 配置

1. 把根目录下的component文件夹里，把 mini-compress 文件夹放进自己的项目里(比如: /pages/to/mini-compress)

2. 在要使用到的page的json文件里，引入 如下配置

```json
{
    "usingComponents": {
        "mini-compress": "/pages/to/mini-compress/mini-compress"
    }
}
```

3. 在要使用到的page的wxml文件里的最低部，插入一行

```html
<mini-compress />
```

<br/>

## 使用方式

在需要的地方，触发 `wx.yx.chooseImage(Object options)`，其中

### options
| 属性 | 类型 | 默认值 | 必填 | 说明 |
| ---- | ---- | ---- | ---- | ---- |
| count | number | 3 | 否 | 最多可选的图片数量 |
| sourceType | Array.<string> | ['album', 'camera'] | 否 | 选择图片的来源 |
| imgWidth | number | 1080 | 否 | 压缩后图片的宽度 |
| maxh2w | function | 8 | 否 | 图片最大的高宽比 |
| success | function |     | 否 | 接口调用成功的回调函数 |
| fail | function |     | 否 | 接口调用失败的回调函数 |

提示1: imgWidth是表示当原图的宽度大于此值时，将图片宽高等比例的压缩到宽度等于此值时所使用的。

提示2: maxh2w用来控制图片的高宽比，有时业务上不希望用户上传过长的截图，如果有用户选择了大于此比例的图片就会提示图片过长，并且回调失败函数 


#### object.success 回调函数

```javascript
wx.yx.chooseImage({
    success(res) {
        console.log(res.imgArray)
        console.log(res.errMsg) //ok
    }
})
```

其中 res.imgArray 的结构示例如下
```json
[
    {
        "path": "http://tmp/touristappid.o6......dfg.jpg",      //未压缩后的图片url
        "url": "http://tmp/touristappid.06.......2ea.jpg",     //压缩后的图片url
        "imgId": "imgId_1595767113458_0",      //图片的唯一id，格式为“imgId_时间戳_图片的次序”
        "originalSize": 391755,   //图片占用空间的大小，单位bytes
        "format": "jpg",          //图片的后缀
        "dType": "IMG",           //默认返回IMG
        "orientation": "up",      //拍照时设备方向
        "originalHeight": 425,    //原始高度 单位px
        "originalWidth": 1000,    //原始宽度 单位px
        "height": 425,            //压缩后的图片高度 单位px
        "width": 1000,            //压缩后的图片宽度  单位px
        "h2w": 0.425,             //图片的高宽比
    }
]
```

<br/>

## 其他

实测发现，太长的长截图用`<canvas/>`压缩会发生闪退的情况，故只会压缩高宽比小于3的图片。也就是说，大于等于3以上的图片不会压缩，这时上方imgArray的结构里path和url会一致。

值得一提的是，一般手机截屏的图片大小都不会太大，同时我们有`maxh2w`参数限制用户的图片高宽比，所以也不用太担心用户上传过大图片的问题。

另外，`gif` 和 `小于100kb的图片` 也不会压缩。




