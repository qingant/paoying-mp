// miniprogram/pages/login/login.js
const loginUtils = require("../../lib/handleLogin.js");
Page({
  /**
   * Page initial data
   */
  data: {},

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function(options) {},

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
  onShareAppMessage: function() {},

  getUserInfo(e) {
    if (e.target.userInfo) {
      // 点击Button弹窗授权，如果授权了，执行login
      // 因为Login流程中有wx.getUserInfo，此时就可以获取到了
      console.log('login utils begin login')
      loginUtils.login(() => {
        // 登录成功后，返回
        console.log("navigate back");
        // wx.navigateTo({
        //   url: "../index/index"
        // });
        wx.navigateBack({
          delta: 100
        })
      });
    }
  }
});
