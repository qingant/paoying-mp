// miniprogram/pages/post/post.js

const { request, $request } = require("../../lib/request");

Page({
  /**
   * Page initial data
   */
  data: {
    item: null,
    comments: [],
    inputText: ""
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function(options) {
    console.log(options);
    const { id } = options;
    $request({
      url: `/post/${id}`
    }).then(res => {
      // res.data.isLikedByMe = false;
      Object.assign(res.data, {
        url: this.route
      })
      this.setData({
        item: res.data
      });
      var userinfo = wx.getStorageSync("userinfo");
      console.log(userinfo)
      this.setData({
        user: userinfo
      })
      console.log("post", res.data);
    });
    $request({
      url: `/post/${id}/comments`
    }).then(res => {
      console.log("fetch photo comments", res.data);
      this.setData({
        comments: res.data
      });
    });
    console.log(this.route, 'Route');
  },


  deletePost: function (e) {
    let id_ = e.currentTarget.dataset.id;
    $request({
      url: `/post/${id_}`,
      method: 'DELETE'
    }).then(function (r) {
      getApp().globalData.shouldReloadFeed = true;
      wx.navigateBack({
        
      })
    })
    console.log(e.currentTarget.dataset.id);
  },

  onTapLike: function(e) {
    var postId = e.currentTarget.dataset.id;
    request({
      url: "/got",
      method: "POST",
      data: {
        post_id: postId
      },
      success: () => {
        let item = this.data.item;
        item.isLikedByMe = true;
        this.setData({
          item
        });
      }
    });
  },

  onComment: function(e) {
    console.log(e);
    var content = e.detail.value;
    var userinfo = wx.getStorageSync("userinfo");
    $request({
      method: "POST",
      url: "/comment",
      data: {
        post_id: e.currentTarget.dataset.id,
        content,
        user_id: userinfo._id
      }
    }).then(res => {
      let cid = res.data.comment_id;
      let comments = this.data.item.comments.concat([
        {
          comment_id: cid,
          content,
          user: userinfo
        }
      ]);
      Object.assign(this.data.item, { comments });
      this.setData({
        comments,
        item: this.data.item,
        inputText: ""
      });
      console.log("post comment success", res);
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
