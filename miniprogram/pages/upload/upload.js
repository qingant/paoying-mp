// miniprogram/pages/upload/upload.js

const { request } = require("../../lib/request");
const qiniuUploader = require("../../lib/qiniuUploader");

function makeid() {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

Page({
  /**
   * Page initial data
   */
  data: {
    image: null,
    location: null,
    tags: ""
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function(options) {
    var self = this;

    this.setData({
      location: wx.getStorageSync("selectedLocation")
    });
    wx.getStorage({
      key: "tempPath",
      success: function(res) {
        self.setData({
          image: res.data
        });
      }
    });
  },

  onShow: function() {
    var self = this;
    wx.getStorage({
      key: "tempPath",
      success: function(res) {
        console.log("show", "get image", res);
        self.setData({
          image: res.data
        });
      }
    });
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function() {},

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function() {},

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function() {
    wx.removeStorageSync("tempPath");
  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function() {},

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function() {},

  /**
   * Called when page reach bottom
   */
  onReachBottom: function() {},

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function() {},


  onInput: function(e) {
    this.setData({
      tags: e.detail.value
    });
  },

  onUpload: function() {
    var filePath = wx.getStorageSync("tempPath");
    console.log('UPLOAD PATH', filePath)
    var cloudPath = makeid() + filePath.match(/\.[^.]+?$/)[0];
    var self = this;
    wx.showLoading();
    
    wx.uploadFile({
      url: "https://dejavu.duozhuayu.net/api-py/v1/upload",
      filePath,
      name: "image",
      success: function(res) {
        console.log("[上传文件] 成功：", res);
        wx.removeStorageSync("tempPath");
        getApp().globalData.shouldReloadFeed = true;
        wx.navigateBack({
          delta: 100
        })
        // wx.navigateTo({
        //   url: "../index/index"
        // });
        // var db = wx.cloud.database();
        // db.collection("images").add({
        //   data: {
        //     fileID: res.fileID,
        //     time: +new Date(),
        //     location: this.data.location,
        //     tags: this.data.tags
        //   },
        //   success: res => {
        //     console.log("success add", res);
        //   }
        // });
        let fileData;
        try {
          fileData = JSON.parse(res.data);
          console.log("upload", fileData);
        } catch (e) {
          throw e;
        }
        var userinfo = wx.getStorageSync("userinfo");
        var location = wx.getStorageSync("location");
        wx.request({
          url: "https://dejavu.duozhuayu.net/api-py/v1/post",
          method: "POST",
          header: {
            "x-token": userinfo.token
          },
          data: {
            image: fileData.file,
            description: self.data.tags,
            user_id: userinfo._id,
            place: self.data.location,
            geo: [location.longitude, location.latitude],
            photo_geo: fileData.geo_info,
            photo_time: fileData.geo_info.photo_time
          },
          success: res => {
            console.log("post success", res);
            wx.hideLoading();
          }
        });
      },
      complete: function() {
        wx.hideLoading();
      }
    });
    // wx.cloud.uploadFile({
    //   cloudPath,
    //   filePath,
    //   success: res => {

    //     // if (db) {
    //     //   db.collection("images").add({
    //     //     data: {
    //     //       fileID: res.fileID
    //     //     }
    //     //   });
    //     //   self.setData({
    //     //     photos: [{
    //     //       fileID: res.fileID,
    //     //     }].concat(self.data.photos)
    //     //   })
    //     //   wx.pageScrollTo({
    //     //     scrollTop: 0,
    //     //     duration: 300
    //     //   })
    //     // }
    //   },
    //   fail: e => {
    //     console.error("[上传文件] 失败：", e);
    //     wx.showToast({
    //       icon: "none",
    //       title: "上传失败"
    //     });
    //     wx.removeStorageSync("tempPath");
    //   },
    //   complete: () => {
    //     wx.hideLoading();
    //     wx.removeStorageSync("tempPath");
    //   }
    // });
  }
});
