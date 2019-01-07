// miniprogram/pages/likelist/likelist.js
const { request, $request } = require("../../lib/request");

Page({

  /**
   * 页面的初始数据
   */
  data: {
    likes: [],
    user: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var post_id = options.post_id;
    console.log(post_id)
    var userinfo = wx.getStorageSync("userinfo");
    $request(
      { url: `/post/${post_id}`}
    ).then(res => {
      console.log(res.data)
      this.setData({
        likes: res.data.gots,
        user: userinfo
      })
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})