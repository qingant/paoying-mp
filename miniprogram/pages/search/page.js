// miniprogram/pages/search/page.js

const { request } = require("../../lib/request.js");

Page({
  /**
   * Page initial data
   */
  data: {
    hints: []
  },

  onSearch: function(e) {
    console.log("search", e.detail.value);
    const { latitude, longitude } = wx.getStorageSync("location");
    request({
      url: "/search",
      method: "GET",
      data: {
        keywords: e.detail.value,
        longitude,
        latitude
      },
      success: res => {
        console.log("search result", res.data);
        this.setData({
          hints: res.data
        });
        if (res.data && !res.data.length) {
          wx.showToast({
            title: "没搜到，换个关键词吧",
            icon: "none"
          });
        }
      }
    });
  },

  onTapHint: function(e) {
    const hintText = e.target.dataset.hint;
    if (hintText[0] === "#") {
      wx.setStorageSync("currentTag", hintText);
      wx.removeStorageSync("selectedLocation");
    } else {
      const filteredHints = this.data.hints.filter(
        hint => hint.name === hintText
      );
      let filteredHint;
      if (filteredHints && filteredHints.length) {
        filteredHint = filteredHints[0];
        wx.setStorageSync("selectedLocation", {
          name: filteredHint.name,
          latitude: filteredHint.geo[1],
          longitude: filteredHint.geo[0]
        });
        console.log("select hint", filteredHint);
      }
      wx.removeStorageSync("currentTag");
    }
    // wx.navigateTo({
    //   url: '../index/index',
    // })
    getApp().globalData.shouldReloadFeed = true;
    wx.navigateBack();
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function(options) {
    // var db = wx.cloud.database();
    // db.collection("locations")
    //   .get()
    //   .then(res => {
    //     this.setData({
    //       hints: res.data
    //     });
    //   });
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
  onHide: function() {},

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
  onShareAppMessage: function() {}
});
